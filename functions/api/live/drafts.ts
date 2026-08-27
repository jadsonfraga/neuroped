import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement } from "../billing/_guard";
import {
  getClinicMembership,
  membershipCanReadClinical,
  membershipCanWriteClinical,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../tenant/_core";
import {
  clinicalCryptoReady,
  currentClinicalEncryptionVersion,
  decryptClinicalJson,
  encryptClinicalJson,
} from "../tenant/_crypto";

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const STATUSES = new Set(["draft", "completed", "signed", "archived"]);
const MAX_PAYLOAD_BYTES = 250_000;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function config(env: TenantEnv): Response | null {
  return clinicalCryptoReady(env) ? null : tenantError("Keyring clínico não configurado.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
}
async function access(db: D1Database | undefined, env: TenantEnv, user: ReturnType<typeof getContextUser>, clinicId: string, write: boolean): Promise<Response | null> {
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const cfg = config(env); if (cfg) return cfg;
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || (write ? !membershipCanWriteClinical(membership) : !membershipCanReadClinical(membership))) return tenantError("Acesso clínico negado.", "TENANT_FORBIDDEN", 403);
  return requireBillingEntitlement(db, user.id, clinicId, "clinical");
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB; const user = getContextUser(context); const url = new URL(context.request.url);
  const clinicId = text(url.searchParams.get("clinicId"), 80); const patientId = text(url.searchParams.get("patientId"), 120); const draftKey = text(url.searchParams.get("draftKey"), 120);
  if (!OPAQUE_ID.test(clinicId) || !OPAQUE_ID.test(patientId) || !OPAQUE_ID.test(draftKey)) return tenantError("clinicId, patientId e draftKey inválidos.", "VALIDATION_ERROR", 400);
  const denial = await access(db, context.env, user, clinicId, false); if (denial) return denial;
  const row = await db!.prepare(
    `SELECT id, clinic_id, patient_id, owner_user_id, draft_key, status, payload_encrypted,
            encryption_version, version, created_at, updated_at
       FROM live_clinical_drafts WHERE clinic_id = ? AND patient_id = ? AND draft_key = ? LIMIT 1`,
  ).bind(clinicId, patientId, draftKey).first<any>();
  if (!row) return tenantJson({ data: null });
  return tenantJson({ data: {
    id: row.id, clinicId: row.clinic_id, patientId: row.patient_id, ownerUserId: row.owner_user_id,
    draftKey: row.draft_key, status: row.status, version: row.version,
    payload: await decryptClinicalJson<unknown>(context.env, clinicId, `clinical-draft:${row.id}`, row.payload_encrypted),
    encryptionVersion: row.encryption_version, createdAt: row.created_at, updatedAt: row.updated_at,
  }});
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  return saveDraft(context, false);
};

export const onRequestPatch: PagesFunction<TenantEnv> = async (context) => {
  return saveDraft(context, true);
};

async function saveDraft(context: Parameters<NonNullable<PagesFunction<TenantEnv>>>[0], updating: boolean): Promise<Response> {
  const db = context.env.DB; const user = getContextUser(context);
  let body: Record<string, unknown>;
  try { const parsed = await context.request.json(); if (!object(parsed)) return tenantError("JSON inválido.", "INVALID_JSON", 400); body = parsed; }
  catch { return tenantError("JSON inválido.", "INVALID_JSON", 400); }
  const clinicId = text(body.clinicId, 80); const patientId = text(body.patientId, 120); const draftKey = text(body.draftKey, 120); const status = text(body.status, 20) || "draft"; const payload = body.payload; const expectedVersion = body.expectedVersion;
  if (!OPAQUE_ID.test(clinicId) || !OPAQUE_ID.test(patientId) || !OPAQUE_ID.test(draftKey) || !STATUSES.has(status) || !object(payload)) return tenantError("Campos do rascunho inválidos.", "VALIDATION_ERROR", 400);
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)); if (payloadBytes.byteLength > MAX_PAYLOAD_BYTES) return tenantError("Rascunho excede 250 KB.", "PAYLOAD_TOO_LARGE", 413);
  if (updating && (!Number.isInteger(expectedVersion) || Number(expectedVersion) < 1)) return tenantError("expectedVersion é obrigatório.", "VALIDATION_ERROR", 400);
  const denial = await access(db, context.env, user, clinicId, true); if (denial) return denial;
  const idempotencyKey = text(body.idempotencyKey, 160) || null;
  const existing = await db!.prepare(`SELECT id, version, status, last_idempotency_key FROM live_clinical_drafts WHERE clinic_id = ? AND patient_id = ? AND draft_key = ? LIMIT 1`).bind(clinicId, patientId, draftKey).first<{ id: string; version: number; status: string; last_idempotency_key: string | null }>();
  if (existing && idempotencyKey && existing.last_idempotency_key === idempotencyKey) return tenantJson({ id: existing.id, clinicId, patientId, draftKey, status: existing.status, version: existing.version, idempotentReplay: true });
  if (updating && (!existing || existing.version !== Number(expectedVersion))) return tenantError("Rascunho foi alterado em outra aba ou dispositivo.", "DRAFT_VERSION_CONFLICT", 409);
  if (!updating && existing) return tenantError("Rascunho já existe; use PATCH com a versão atual.", "DRAFT_EXISTS", 409);
  const id = existing?.id ?? crypto.randomUUID(); const version = existing ? existing.version + 1 : 1; const now = new Date().toISOString(); const encrypted = await encryptClinicalJson(context.env, clinicId, `clinical-draft:${id}`, payload);
  const mutation = existing
    ? db!.prepare(`UPDATE live_clinical_drafts SET status = ?, payload_encrypted = ?, encryption_version = ?, version = ?, last_idempotency_key = ?, updated_at = ? WHERE id = ? AND clinic_id = ? AND patient_id = ? AND version = ?`).bind(status, encrypted, currentClinicalEncryptionVersion(context.env), version, idempotencyKey, now, id, clinicId, patientId, existing.version)
    : db!.prepare(`INSERT INTO live_clinical_drafts (id, clinic_id, patient_id, owner_user_id, draft_key, status, payload_encrypted, encryption_version, version, last_idempotency_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`).bind(id, clinicId, patientId, user!.id, draftKey, status, encrypted, currentClinicalEncryptionVersion(context.env), idempotencyKey, now, now);
  const results = await db!.batch([mutation, prepareSaasAudit(db!, { clinicId, actorUserId: user!.id, action: existing ? "live_clinical_draft_update" : "live_clinical_draft_create", targetType: "clinical_draft", targetId: id, metadata: { status, version } }, true)]);
  if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) return tenantError("Rascunho mudou durante o salvamento.", "DRAFT_VERSION_CONFLICT", 409);
  return tenantJson({ id, clinicId, patientId, draftKey, status, version, encryptionVersion: currentClinicalEncryptionVersion(context.env), savedAt: now }, existing ? 200 : 201);
}
