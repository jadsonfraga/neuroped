import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement } from "../billing/_guard";
import { getClinicMembership, membershipCanReadClinical, membershipCanWriteClinical, prepareSaasAudit, tenantError, tenantJson, type TenantEnv } from "../tenant/_core";
import { clinicalCryptoReady, currentClinicalEncryptionVersion, decryptClinicalJson, encryptClinicalJson } from "../tenant/_crypto";

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
function text(value: unknown, max: number): string { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function obj(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
async function access(db: D1Database | undefined, env: TenantEnv, user: ReturnType<typeof getContextUser>, clinicId: string, write: boolean): Promise<Response | null> {
  if (!db) return tenantError("Banco LIVE não configurado.", "DB_REQUIRED", 503); if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401); if (!clinicalCryptoReady(env)) return tenantError("Keyring clínico não configurado.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503); const membership = await getClinicMembership(db, clinicId, user); if (!membership || (write ? !membershipCanWriteClinical(membership) : !membershipCanReadClinical(membership))) return tenantError("Acesso negado.", "TENANT_FORBIDDEN", 403); return requireBillingEntitlement(db, user.id, clinicId, "clinical");
}
function validatePlan(payload: Record<string, unknown>): string | null {
  for (const key of ["seizureType", "usualDuration", "emergencyCriteria", "responsibleContact", "medicalObservations"]) if (!text(payload[key], 5000)) return key;
  if (payload.rescueMedication !== null && payload.rescueMedication !== undefined) {
    if (!obj(payload.rescueMedication) || !text(payload.rescueMedication.name, 200) || !text(payload.rescueMedication.dose, 200)) return "rescueMedication.name+dose";
  }
  return null;
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB; const user = getContextUser(context); const url = new URL(context.request.url); const clinicId = text(url.searchParams.get("clinicId"), 80); const patientId = text(url.searchParams.get("patientId"), 120); if (!OPAQUE_ID.test(clinicId) || !OPAQUE_ID.test(patientId)) return tenantError("Identificadores inválidos.", "VALIDATION_ERROR", 400); const denial = await access(db, context.env, user, clinicId, false); if (denial) return denial;
  const rows = await db!.prepare(`SELECT id, author_user_id, version, payload_encrypted, encryption_version, delivered_at, delivery_scope, status, created_at FROM live_epilepsy_safety_plans WHERE clinic_id = ? AND patient_id = ? ORDER BY version DESC LIMIT 50`).bind(clinicId, patientId).all<any>();
  return tenantJson({ data: await Promise.all((rows.results ?? []).map(async (row) => ({ id: row.id, clinicId, patientId, authorUserId: row.author_user_id, version: row.version, payload: await decryptClinicalJson<unknown>(context.env, clinicId, `epilepsy-plan:${row.id}`, row.payload_encrypted), encryptionVersion: row.encryption_version, deliveredAt: row.delivered_at, deliveryScope: row.delivery_scope, status: row.status, createdAt: row.created_at }))) });
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB; const user = getContextUser(context); let body: Record<string, unknown>; try { const parsed = await context.request.json(); if (!obj(parsed)) return tenantError("JSON inválido.", "INVALID_JSON", 400); body = parsed; } catch { return tenantError("JSON inválido.", "INVALID_JSON", 400); }
  const clinicId = text(body.clinicId, 80); const patientId = text(body.patientId, 120); const payload = body.payload; if (!OPAQUE_ID.test(clinicId) || !OPAQUE_ID.test(patientId) || !obj(payload)) return tenantError("clinicId, patientId e payload são obrigatórios.", "VALIDATION_ERROR", 400); const invalid = validatePlan(payload); if (invalid) return tenantError(`Campo obrigatório ausente: ${invalid}.`, "VALIDATION_ERROR", 400); const denial = await access(db, context.env, user, clinicId, true); if (denial) return denial;
  const patient = await db!.prepare(`SELECT id FROM live_patients WHERE id = ? AND clinic_id = ? AND status <> 'merged' LIMIT 1`).bind(patientId, clinicId).first<{ id: string }>(); if (!patient) return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  const previous = await db!.prepare(`SELECT COALESCE(MAX(version), 0) AS version FROM live_epilepsy_safety_plans WHERE clinic_id = ? AND patient_id = ?`).bind(clinicId, patientId).first<{ version: number }>(); const version = Number(previous?.version ?? 0) + 1; const id = crypto.randomUUID(); const encrypted = await encryptClinicalJson(context.env, clinicId, `epilepsy-plan:${id}`, payload); const now = new Date().toISOString(); const deliveryScope = text(body.deliveryScope, 80) || null;
  const results = await db!.batch([db!.prepare(`UPDATE live_epilepsy_safety_plans SET status = 'superseded' WHERE clinic_id = ? AND patient_id = ? AND status = 'active'`).bind(clinicId, patientId), db!.prepare(`INSERT INTO live_epilepsy_safety_plans (id, clinic_id, patient_id, author_user_id, version, payload_encrypted, encryption_version, delivered_at, delivery_scope, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`).bind(id, clinicId, patientId, user!.id, version, encrypted, currentClinicalEncryptionVersion(context.env), body.deliveredAt ? text(body.deliveredAt, 64) : null, deliveryScope, now), prepareSaasAudit(db!, { clinicId, actorUserId: user!.id, action: "live_epilepsy_plan_create", targetType: "epilepsy_safety_plan", targetId: id, metadata: { version, delivered: Boolean(body.deliveredAt) } }, true)]);
  if (Number(results[1]?.meta?.changes ?? 0) !== 1 || Number(results[2]?.meta?.changes ?? 0) !== 1) return tenantError("Plano mudou durante a gravação.", "PLAN_STALE", 409); return tenantJson({ id, clinicId, patientId, version, status: "active", authoredBy: user!.id, createdAt: now, explicitRescueMedication: Boolean(obj(payload.rescueMedication)) }, 201);
};
