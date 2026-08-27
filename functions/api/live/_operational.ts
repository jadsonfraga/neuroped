import { decryptClinicalBytes, encryptClinicalBytes } from "../tenant/_crypto";
import { tenantError, type TenantEnv } from "../tenant/_core";

export interface OperationalEnv extends TenantEnv {
  CLINICAL_PDF_BUCKET?: R2Bucket;
  CLINICAL_ARTIFACT_BUCKET?: R2Bucket;
  WORKER_INTERNAL_SECRET?: string;
  BUILD_SHA?: string;
  FRONTEND_CANONICAL_URL?: string;
  BACKEND_CANONICAL_URL?: string;
  MIGRATION_EXPECTED?: string;
}

export function operationalBucket(env: OperationalEnv): R2Bucket | null {
  return env.CLINICAL_PDF_BUCKET ?? env.CLINICAL_ARTIFACT_BUCKET ?? null;
}

export function storageUnavailable(env: OperationalEnv): Response | null {
  return operationalBucket(env)
    ? null
    : tenantError("Object storage privado não configurado.", "OBJECT_STORAGE_NOT_CONFIGURED", 503);
}

export async function sha256Hex(value: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", value);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function opaqueObjectKey(prefix: string): string {
  return `${prefix}/${crypto.randomUUID()}.bin`;
}

export async function putEncryptedObject(
  env: OperationalEnv,
  clinicId: string,
  purpose: string,
  key: string,
  plain: Uint8Array,
  metadata: Record<string, string>,
): Promise<{ sha256: string; byteLength: number }> {
  const bucket = operationalBucket(env);
  if (!bucket) throw new Error("OBJECT_STORAGE_NOT_CONFIGURED");
  const encrypted = await encryptClinicalBytes(env, clinicId, purpose, plain);
  await bucket.put(key, encrypted, {
    httpMetadata: { contentType: "application/octet-stream", cacheControl: "private, no-store" },
    customMetadata: { ...metadata, encrypted: "clinical-v1" },
  });
  return { sha256: await sha256Hex(plain), byteLength: plain.byteLength };
}

export async function getDecryptedObject(
  env: OperationalEnv,
  clinicId: string,
  purpose: string,
  key: string,
): Promise<Uint8Array | null> {
  const bucket = operationalBucket(env);
  if (!bucket) throw new Error("OBJECT_STORAGE_NOT_CONFIGURED");
  const object = await bucket.get(key);
  if (!object) return null;
  return decryptClinicalBytes(env, clinicId, purpose, new Uint8Array(await object.arrayBuffer()));
}

export async function deleteObject(env: OperationalEnv, key: string): Promise<void> {
  const bucket = operationalBucket(env);
  if (!bucket) throw new Error("OBJECT_STORAGE_NOT_CONFIGURED");
  await bucket.delete(key);
}

export function safeMetadata(value: unknown): Record<string, string | number | boolean | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const forbidden = /(name|email|phone|address|cpf|rg|diagnos|medicat|prescri|symptom|payload|content|message|note|birth|school|guardian|patient)/i;
  const output: Record<string, string | number | boolean | null> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (forbidden.test(key)) continue;
    if (typeof raw === "string" && raw.length <= 160) output[key] = raw;
    else if (typeof raw === "number" && Number.isFinite(raw)) output[key] = raw;
    else if (typeof raw === "boolean" || raw === null) output[key] = raw;
  }
  return output;
}

export function safeOperationalError(error: unknown): string {
  const code = error instanceof Error ? error.message : "OPERATIONAL_FAILURE";
  return /^[A-Z0-9_:-]{3,80}$/.test(code) ? code : "OPERATIONAL_FAILURE";
}

export async function hashAuditEvent(input: {
  id: string;
  clinicId: string | null;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  result: string;
  metadataJson: string | null;
  eventAt: string;
  previousHash: string;
}): Promise<string> {
  const canonical = JSON.stringify(input);
  return sha256Hex(new TextEncoder().encode(canonical));
}

export const AUDIT_GENESIS_HASH = "0".repeat(64);

export async function appendAuditChain(
  db: D1Database,
  params: {
    clinicId: string | null;
    actorUserId: string;
    action: string;
    targetType: string;
    targetId?: string | null;
    result: "success" | "denied" | "failure" | "blocked";
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const id = crypto.randomUUID();
  const eventAt = new Date().toISOString();
  const previous = await db.prepare(
    `SELECT event_hash FROM live_audit_chain
      WHERE clinic_id IS ? ORDER BY event_at DESC, id DESC LIMIT 1`,
  ).bind(params.clinicId ?? null).first<{ event_hash: string }>();
  const previousHash = previous?.event_hash ?? AUDIT_GENESIS_HASH;
  const metadataJson = JSON.stringify(safeMetadata(params.metadata));
  const eventHash = await hashAuditEvent({
    id,
    clinicId: params.clinicId,
    actorUserId: params.actorUserId,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId ?? null,
    result: params.result,
    metadataJson,
    eventAt,
    previousHash,
  });
  await db.prepare(
    `INSERT INTO live_audit_chain
      (id, clinic_id, actor_user_id, action, target_type, target_id, result,
       metadata_json, event_at, previous_hash, event_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id,
    params.clinicId ?? null,
    params.actorUserId,
    params.action,
    params.targetType,
    params.targetId ?? null,
    params.result,
    metadataJson,
    eventAt,
    previousHash,
    eventHash,
  ).run();
}

export function workerAuthorized(request: Request, env: OperationalEnv): boolean {
  const expected = env.WORKER_INTERNAL_SECRET?.trim();
  const presented = request.headers.get("X-NeuroPed-Worker-Secret")?.trim();
  return Boolean(expected && expected.length >= 32 && presented && presented === expected);
}
