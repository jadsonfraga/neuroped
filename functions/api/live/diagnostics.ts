import { getContextUser } from "../auth/_authorization";
import { getClinicMembership, membershipCanReadClinical, tenantError, tenantJson } from "../tenant/_core";
import { clinicalCryptoReady } from "../tenant/_crypto";
import { operationalBucket, type OperationalEnv } from "./_operational";

const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
function text(value: unknown, max: number): string { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

export const onRequestGet: PagesFunction<OperationalEnv> = async (context) => {
  const db = context.env.DB; const user = getContextUser(context); const clinicId = text(new URL(context.request.url).searchParams.get("clinicId"), 80);
  if (!db) return tenantError("Banco LIVE não configurado.", "DB_REQUIRED", 503); if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401); if (!ID.test(clinicId)) return tenantError("Clínica inválida.", "VALIDATION_ERROR", 400); const membership = await getClinicMembership(db, clinicId, user); if (!membership || !membershipCanReadClinical(membership)) return tenantError("Acesso negado.", "TENANT_FORBIDDEN", 403);
  const [clinic, billing, tables, failures] = await Promise.all([
    db.prepare(`SELECT id, slug, status, updated_at FROM clinics WHERE id = ? LIMIT 1`).bind(clinicId).first<{ id: string; slug: string; status: string; updated_at: string }>(),
    db.prepare(`SELECT be.status, be.current_period_end, be.updated_at FROM billing_entitlements be WHERE be.clinic_id = ? ORDER BY be.updated_at DESC LIMIT 1`).bind(clinicId).first<{ status: string; current_period_end: string | null; updated_at: string }>(),
    db.prepare(`SELECT COUNT(*) AS total FROM sqlite_master WHERE type = 'table' AND name IN ('live_pdf_archives','live_audit_chain','live_clinical_drafts','family_portal_invites','live_previsit_submissions','live_epilepsy_safety_plans')`).first<{ total: number }>(),
    db.prepare(`SELECT action, result, event_at FROM live_audit_chain WHERE clinic_id = ? AND result IN ('failure','blocked','denied') ORDER BY event_at DESC LIMIT 8`).bind(clinicId).all<{ action: string; result: string; event_at: string }>(),
  ]);
  return tenantJson({ tenant: { id: clinic?.id ?? clinicId, slug: clinic?.slug ?? null, status: clinic?.status ?? "unknown", updatedAt: clinic?.updated_at ?? null, membershipRole: membership.role }, billing: { status: billing?.status ?? "not_configured", currentPeriodEnd: billing?.current_period_end ?? null, updatedAt: billing?.updated_at ?? null }, migrations: { operationalTablesPresent: Number(tables?.total ?? 0), required: 6 }, objectStorage: { configured: Boolean(operationalBucket(context.env)) }, clinicalCrypto: { configured: clinicalCryptoReady(context.env) }, failures: failures.results ?? [], checkedAt: new Date().toISOString() });
};
