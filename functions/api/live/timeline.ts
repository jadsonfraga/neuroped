import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement } from "../billing/_guard";
import { getClinicMembership, membershipCanReadClinical, tenantError, tenantJson, type TenantEnv } from "../tenant/_core";
import { clinicalCryptoReady } from "../tenant/_crypto";

const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
function text(value: unknown, max: number): string { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function positive(value: string | null, fallback: number, max: number): number { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? Math.min(n, max) : fallback; }

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB; const user = getContextUser(context); const url = new URL(context.request.url); const clinicId = text(url.searchParams.get("clinicId"), 80); const patientId = text(url.searchParams.get("patientId"), 120); const limit = positive(url.searchParams.get("limit"), 50, 200);
  if (!db) return tenantError("Banco LIVE não configurado.", "DB_REQUIRED", 503); if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401); if (!ID.test(clinicId) || !ID.test(patientId)) return tenantError("Identificadores inválidos.", "VALIDATION_ERROR", 400); if (!clinicalCryptoReady(context.env)) return tenantError("Keyring clínico não configurado.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503); const membership = await getClinicMembership(db, clinicId, user); if (!membership || !membershipCanReadClinical(membership)) return tenantError("Acesso negado.", "TENANT_FORBIDDEN", 403); const entitlement = await requireBillingEntitlement(db, user.id, clinicId, "clinical"); if (entitlement) return entitlement;
  const [events, assessments, documents, plans] = await Promise.all([
    db.prepare(`SELECT id, event_type, occurred_at, provenance_kind, provenance_source, status, created_at FROM live_clinical_events WHERE clinic_id = ? AND patient_id = ? ORDER BY occurred_at DESC LIMIT ?`).bind(clinicId, patientId, limit).all(),
    db.prepare(`SELECT id, instrument_id, instrument_version, applied_at, provenance_source, status, created_at FROM live_assessments WHERE clinic_id = ? AND patient_id = ? ORDER BY applied_at DESC LIMIT ?`).bind(clinicId, patientId, limit).all(),
    db.prepare(`SELECT id, document_type, origin, status, current_version, updated_at, created_at FROM live_documents WHERE clinic_id = ? AND patient_id = ? AND status <> 'voided' ORDER BY updated_at DESC LIMIT ?`).bind(clinicId, patientId, limit).all(),
    db.prepare(`SELECT id, version, status, delivered_at, created_at FROM live_epilepsy_safety_plans WHERE clinic_id = ? AND patient_id = ? ORDER BY created_at DESC LIMIT ?`).bind(clinicId, patientId, limit).all(),
  ]);
  const items = [
    ...(events.results ?? []).map((row: any) => ({ id: row.id, kind: "clinical_event", occurredAt: row.occurred_at, sourceId: row.id, provenance: row.provenance_kind === "reported" ? "informado" : row.provenance_kind === "observed" ? "observado" : row.provenance_kind === "measured" ? "calculado/medido" : "documentado", label: row.event_type, status: row.status, createdAt: row.created_at })),
    ...(assessments.results ?? []).map((row: any) => ({ id: row.id, kind: "assessment", occurredAt: row.applied_at, sourceId: row.id, provenance: row.provenance_source, label: `${row.instrument_id}@${row.instrument_version}`, status: row.status, createdAt: row.created_at })),
    ...(documents.results ?? []).map((row: any) => ({ id: row.id, kind: "document", occurredAt: row.updated_at, sourceId: row.id, provenance: row.origin, label: row.document_type, status: row.status, version: row.current_version, createdAt: row.created_at })),
    ...(plans.results ?? []).map((row: any) => ({ id: row.id, kind: "epilepsy_safety_plan", occurredAt: row.created_at, sourceId: row.id, provenance: "formalmente documentado", label: "Plano de segurança em epilepsia", status: row.status, version: row.version, deliveredAt: row.delivered_at, createdAt: row.created_at })),
  ].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)).slice(0, limit);
  return tenantJson({ data: items, page: { limit, hasMore: items.length === limit }, tenant: clinicId, patient: patientId });
};
