import type { TenantEnv } from "../../tenant/_core";
import { encryptClinicalJson } from "../../tenant/_crypto";
import type { LgpdExportEvidence, LgpdWorkerClaim } from "./_worker-core";

export const LGPD_EXPORT_SCHEMA_VERSION = "neuroped-lgpd-export-v1";

export interface PrivateArtifactStore {
  put(key: string, value: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
}

export type LgpdScope = "patient" | "clinic";

export interface LgpdExportArtifact {
  schemaVersion: typeof LGPD_EXPORT_SCHEMA_VERSION;
  clinicId: string;
  scope: LgpdScope;
  generatedAt: string;
  data: unknown;
}

export interface DeletionPolicySnapshot {
  scope: LgpdScope;
  clinicStatus: "active" | "suspended" | "closed";
  lifecycleStatus: "active" | "closure_requested" | "closed";
  legalHold: boolean;
  /** Preencher apenas quando uma janela de retenção for materialmente aplicável. */
  retentionUntil: string | null;
  now: string;
}

export type DeletionBlockCode =
  | "LEGAL_HOLD"
  | "ACTIVE_TENANT"
  | "RETENTION_NOT_MATERIALIZED"
  | "RETENTION_PENDING";

export interface DeletionEligibility {
  allowed: boolean;
  code: DeletionBlockCode | null;
}

export interface ExecuteEncryptedExportParams {
  env: TenantEnv;
  claim: LgpdWorkerClaim;
  scope: LgpdScope;
  data: unknown;
  store: PrivateArtifactStore;
  generatedAt?: Date | string;
  complete: (evidence: LgpdExportEvidence) => Promise<boolean>;
  fail: (failureCode: string) => Promise<unknown>;
}

function normalizedIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("LGPD_WORKER_INVALID_TIME");
  return date.toISOString();
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

async function sha256Hex(value: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", value);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function artifactKey(): string {
  return `lgpd/v1/${crypto.randomUUID()}.enc`;
}

function exportPurpose(claim: LgpdWorkerClaim): string {
  return `lgpd-export:${claim.requestId}`;
}

async function bestEffortDelete(store: PrivateArtifactStore, key: string): Promise<void> {
  try {
    await store.delete(key);
  } catch {
    // Órfão eventual deve ser resolvido por lifecycle do storage; nunca mascarar
    // a falha primária nem registrar conteúdo clínico em log.
  }
}

/**
 * Avalia apenas barreiras determinísticas anteriores ao purge. Esta função não
 * executa DELETE e pode ser reutilizada por dry-run/teste e pelo executor futuro.
 */
export function evaluateDeletionEligibility(snapshot: DeletionPolicySnapshot): DeletionEligibility {
  if (snapshot.legalHold) return { allowed: false, code: "LEGAL_HOLD" };

  if (snapshot.scope === "clinic") {
    if (snapshot.clinicStatus === "active" || snapshot.lifecycleStatus === "active") {
      return { allowed: false, code: "ACTIVE_TENANT" };
    }
    if (!snapshot.retentionUntil) {
      return { allowed: false, code: "RETENTION_NOT_MATERIALIZED" };
    }
  }

  if (snapshot.retentionUntil) {
    const now = new Date(snapshot.now).getTime();
    const retentionUntil = new Date(snapshot.retentionUntil).getTime();
    if (!Number.isFinite(now) || !Number.isFinite(retentionUntil)) {
      return { allowed: false, code: "RETENTION_PENDING" };
    }
    if (now < retentionUntil) return { allowed: false, code: "RETENTION_PENDING" };
  }

  return { allowed: true, code: null };
}

/**
 * Produz um artefato cifrado usando exatamente o keyring Clinical LIVE já
 * canônico. O storage recebe apenas ciphertext. A request só pode ser concluída
 * depois de readback byte-a-byte + SHA-256 do objeto efetivamente armazenado.
 *
 * Não há implementação R2 aqui: o adapter real só será conectado depois de o
 * recurso privado existir e a credencial de CI possuir permissão mínima.
 */
export async function executeEncryptedExport(
  params: ExecuteEncryptedExportParams,
): Promise<LgpdExportEvidence | null> {
  if (params.claim.requestType !== "export") {
    await params.fail("REQUEST_TYPE_MISMATCH");
    return null;
  }

  const generatedAt = normalizedIso(params.generatedAt ?? new Date());
  const payload: LgpdExportArtifact = {
    schemaVersion: LGPD_EXPORT_SCHEMA_VERSION,
    clinicId: params.claim.clinicId,
    scope: params.scope,
    generatedAt,
    data: params.data,
  };
  const key = artifactKey();
  let uploaded = false;

  try {
    let encrypted: string;
    try {
      encrypted = await encryptClinicalJson(
        params.env,
        params.claim.clinicId,
        exportPurpose(params.claim),
        payload,
      );
    } catch {
      await params.fail("EXPORT_ENCRYPT_FAILED");
      return null;
    }

    const ciphertext = new TextEncoder().encode(encrypted);
    try {
      await params.store.put(key, ciphertext);
      uploaded = true;
    } catch {
      await params.fail("EXPORT_STORE_PUT_FAILED");
      return null;
    }

    let stored: Uint8Array | null;
    try {
      stored = await params.store.get(key);
    } catch {
      await bestEffortDelete(params.store, key);
      await params.fail("EXPORT_STORE_READBACK_FAILED");
      return null;
    }
    if (!stored || !bytesEqual(ciphertext, stored)) {
      await bestEffortDelete(params.store, key);
      await params.fail("EXPORT_STORE_INTEGRITY_FAILED");
      return null;
    }

    const evidence: LgpdExportEvidence = {
      artifactKey: key,
      digestSha256: await sha256Hex(stored),
      byteLength: stored.byteLength,
    };

    let completed = false;
    try {
      completed = await params.complete(evidence);
    } catch {
      completed = false;
    }
    if (!completed) {
      await bestEffortDelete(params.store, key);
      await params.fail("EXPORT_COMPLETION_FAILED");
      return null;
    }

    return evidence;
  } catch {
    if (uploaded) await bestEffortDelete(params.store, key);
    await params.fail("EXPORT_EXECUTOR_FAILED");
    return null;
  }
}
