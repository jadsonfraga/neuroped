/**
 * GET/PUT/DELETE /api/me/workspace?key=...
 *
 * Persistência segura por clínica e usuário para os itens do secureStorage.
 * Payloads são cifrados com o keyring clínico. Registros canônicos de pacientes
 * e clínicas continuam em seus endpoints tipados.
 */
import { getContextUser } from "../auth/_authorization";
import {
  clinicalLiveEnabled,
  getClinicMembership,
  membershipCanReadClinical,
  membershipCanWriteClinical,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../tenant/_core";
import { resolveBillingClinicId } from "../billing/_guard";
import {
  clinicalCryptoReady,
  currentClinicalEncryptionVersion,
  clinicalBlindIndex,
  decryptClinicalJson,
  encryptClinicalJson,
} from "../tenant/_crypto";

const TABLE = "account_workspace_items";
const MAX_PLAINTEXT_BYTES = 1_400_000;
const ITEM_KEY = /^[A-Za-z0-9][A-Za-z0-9:_./-]{0,159}$/;
const SENSITIVE_KEY = /(?:^|[:/._-])(access|refresh|password|passwd|token|secret|certificate|pfx|p12|private-key)(?:[:/._-]|$)/i;

interface WorkspaceRow {
  clinic_id: string;
  user_id: string;
  item_key_hash: string;
  payload_encrypted: string;
  encryption_version: string;
  expires_at: string | null;
  updated_at: string;
}

type WorkspaceContext = {
  env: TenantEnv;
  request: Request;
  data?: unknown;
};

type WorkspaceAccess =
  | {
      db: D1Database;
      user: NonNullable<ReturnType<typeof getContextUser>>;
      clinicId: string;
    }
  | { response: Response };

function validKey(value: unknown): value is string {
  return typeof value === "string" && ITEM_KEY.test(value) && !SENSITIVE_KEY.test(value);
}

function purpose(userId: string, itemKey: string): string {
  return `account-workspace:${userId}:${itemKey}`;
}

async function itemKeyHash(
  env: TenantEnv,
  clinicId: string,
  userId: string,
  itemKey: string,
): Promise<string> {
  return clinicalBlindIndex(
    env,
    clinicId,
    `account-workspace-key:${userId}`,
    itemKey,
  );
}

async function authorizeWorkspace(
  context: WorkspaceContext,
  write: boolean,
): Promise<WorkspaceAccess> {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return { response: tenantError("Banco não configurado.", "SAAS_DB_NOT_CONFIGURED", 503) };
  if (!user) return { response: tenantError("Não autenticado.", "UNAUTHENTICATED", 401) };
  if (!clinicalLiveEnabled(context.env)) {
    return { response: tenantError("Persistência autenticada indisponível.", "CLINICAL_LIVE_DISABLED", 503) };
  }

  let clinicId: string | null;
  try {
    clinicId = await resolveBillingClinicId(db, user.id, context.request);
  } catch {
    return { response: tenantError("Não foi possível validar a clínica ativa.", "TENANT_CONTEXT_ERROR", 500) };
  }
  if (!clinicId) {
    return { response: tenantError("Selecione uma clínica ativa para acessar o workspace.", "TENANT_CONTEXT_REQUIRED", 409) };
  }

  let membership: Awaited<ReturnType<typeof getClinicMembership>>;
  try {
    membership = await getClinicMembership(db, clinicId, user);
  } catch {
    return { response: tenantError("Não foi possível validar a associação à clínica.", "TENANT_MEMBERSHIP_ERROR", 500) };
  }
  if (!membership) {
    return { response: tenantError("Associação ativa à clínica necessária.", "TENANT_MEMBERSHIP_REQUIRED", 403) };
  }
  const permitted = write
    ? membershipCanWriteClinical(membership)
    : membershipCanReadClinical(membership);
  if (!permitted) {
    return { response: tenantError("Permissão clínica insuficiente para o workspace.", "TENANT_FORBIDDEN", 403) };
  }

  return { db, user, clinicId };
}

function cryptoConfigurationError(env: TenantEnv): Response | null {
  if (!clinicalCryptoReady(env)) {
    return tenantError("Keyring de dados não configurado.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  }
  return null;
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function parseExpiry(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return new Date(timestamp).toISOString();
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const access = await authorizeWorkspace(context, false);
  if ("response" in access) return access.response;
  const { db, user, clinicId } = access;

  const itemKey = new URL(context.request.url).searchParams.get("key");
  if (!validKey(itemKey)) return tenantError("Chave de workspace inválida.", "VALIDATION_ERROR", 400);
  const configError = cryptoConfigurationError(context.env);
  if (configError) return configError;

  let keyHash: string;
  try {
    keyHash = await itemKeyHash(context.env, clinicId, user.id, itemKey);
  } catch {
    return tenantError("Índice criptográfico indisponível.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  }

  let row: WorkspaceRow | null;
  try {
    row = await db.prepare(
      `SELECT clinic_id, user_id, item_key_hash, payload_encrypted, encryption_version, expires_at, updated_at
         FROM ${TABLE}
        WHERE clinic_id = ? AND user_id = ? AND item_key_hash = ?
        LIMIT 1`,
    ).bind(clinicId, user.id, keyHash).first<WorkspaceRow>();
  } catch {
    return tenantError("Não foi possível consultar o workspace.", "DB_ERROR", 500);
  }
  if (!row) return tenantError("Item não encontrado.", "WORKSPACE_ITEM_NOT_FOUND", 404);

  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) {
    try {
      await db.prepare(
        `DELETE FROM ${TABLE}
          WHERE clinic_id = ? AND user_id = ? AND item_key_hash = ? AND expires_at = ?`,
      ).bind(clinicId, user.id, keyHash, row.expires_at).run();
    } catch {
      return tenantError("Não foi possível limpar um item expirado.", "DB_ERROR", 500);
    }
    return tenantError("Item expirado.", "WORKSPACE_ITEM_NOT_FOUND", 404);
  }

  try {
    const data = await decryptClinicalJson<unknown>(
      context.env,
      clinicId,
      purpose(user.id, itemKey),
      row.payload_encrypted,
    );
    return tenantJson({ data, expiresAt: row.expires_at, updatedAt: row.updated_at });
  } catch {
    return tenantError("Item indisponível para decifragem.", "WORKSPACE_DECRYPT_FAILED", 500);
  }
};

export const onRequestPut: PagesFunction<TenantEnv> = async (context) => {
  const access = await authorizeWorkspace(context, true);
  if ("response" in access) return access.response;
  const { db, user, clinicId } = access;

  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  if (!validKey(body.key)) return tenantError("Chave de workspace inválida.", "VALIDATION_ERROR", 400);
  if (!Object.prototype.hasOwnProperty.call(body, "data")) {
    return tenantError("Campo data obrigatório.", "VALIDATION_ERROR", 400);
  }
  const expiresAt = Object.prototype.hasOwnProperty.call(body, "expiresAt")
    ? parseExpiry(body.expiresAt)
    : null;
  if (expiresAt === undefined) return tenantError("Expiração inválida.", "VALIDATION_ERROR", 400);

  let serialized: string;
  try {
    serialized = JSON.stringify(body.data);
  } catch {
    return tenantError("Conteúdo não serializável.", "VALIDATION_ERROR", 400);
  }
  if (typeof serialized !== "string") return tenantError("Conteúdo não serializável.", "VALIDATION_ERROR", 400);
  const plaintextBytes = new TextEncoder().encode(serialized).byteLength;
  if (plaintextBytes > MAX_PLAINTEXT_BYTES) {
    return tenantError("Item excede o limite de persistência.", "PAYLOAD_TOO_LARGE", 413);
  }
  const configError = cryptoConfigurationError(context.env);
  if (configError) return configError;

  const itemKey = body.key;
  try {
    const keyHash = await itemKeyHash(context.env, clinicId, user.id, itemKey);
    const encrypted = await encryptClinicalJson(
      context.env,
      clinicId,
      purpose(user.id, itemKey),
      body.data,
    );
    const version = currentClinicalEncryptionVersion(context.env);
    const savedAt = new Date().toISOString();
    const upsert = db.prepare(
      `INSERT INTO ${TABLE}
        (clinic_id, user_id, item_key_hash, payload_encrypted, encryption_version, expires_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(clinic_id, user_id, item_key_hash) DO UPDATE SET
         payload_encrypted = excluded.payload_encrypted,
         encryption_version = excluded.encryption_version,
         expires_at = excluded.expires_at,
         updated_at = excluded.updated_at`,
    ).bind(clinicId, user.id, keyHash, encrypted, version, expiresAt ?? null, savedAt);
    const audit = prepareSaasAudit(db, {
      clinicId,
      actorUserId: user.id,
      action: "account_workspace.write",
      targetType: "account_workspace_item",
      metadata: { plaintextBytes },
    });
    await db.batch([upsert, audit]);
    return tenantJson({ ok: true, updatedAt: savedAt });
  } catch {
    return tenantError("Não foi possível persistir o item.", "WORKSPACE_WRITE_FAILED", 500);
  }
};

export const onRequestDelete: PagesFunction<TenantEnv> = async (context) => {
  const access = await authorizeWorkspace(context, true);
  if ("response" in access) return access.response;
  const { db, user, clinicId } = access;

  const itemKey = new URL(context.request.url).searchParams.get("key");
  if (!validKey(itemKey)) return tenantError("Chave de workspace inválida.", "VALIDATION_ERROR", 400);
  const configError = cryptoConfigurationError(context.env);
  if (configError) return configError;

  try {
    const keyHash = await itemKeyHash(context.env, clinicId, user.id, itemKey);
    const deletion = db.prepare(
      `DELETE FROM ${TABLE} WHERE clinic_id = ? AND user_id = ? AND item_key_hash = ?`,
    ).bind(clinicId, user.id, keyHash);
    const audit = prepareSaasAudit(db, {
      clinicId,
      actorUserId: user.id,
      action: "account_workspace.delete",
      targetType: "account_workspace_item",
    }, true);
    await db.batch([deletion, audit]);
    return tenantJson({ ok: true });
  } catch {
    return tenantError("Não foi possível remover o item.", "WORKSPACE_DELETE_FAILED", 500);
  }
};
