import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement } from "../billing/_guard";
import {
  getClinicMembership,
  membershipCanManage,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../tenant/_core";
import { loadSaasSchemaPosture } from "./_readiness";

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const requestId = cleanText(context.request.headers.get("x-request-id"), 96) || crypto.randomUUID();
  const url = new URL(context.request.url);
  const clinicId = cleanText(url.searchParams.get("clinicId"), 80);
  const rawLimit = Number(url.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 50) : 20;
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) return tenantError("Acesso administrativo negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "admin");
  if (billingError) return billingError;
  try {
    const schema = await loadSaasSchemaPosture(db);
    if (schema.missingTables.includes("saas_audit_log")) return tenantError("Trilha SaaS indisponível.", "AUDIT_SCHEMA_NOT_READY", 503);
    const rows = await db
      .prepare(`SELECT action, COUNT(*) AS count, MAX(created_at) AS last_at FROM saas_audit_log WHERE clinic_id = ? AND created_at >= datetime('now', '-24 hours') GROUP BY action ORDER BY count DESC LIMIT ?`)
      .bind(clinicId, limit)
      .all<{ action: string; count: number; last_at: string | null }>();
    const total = await db
      .prepare(`SELECT COUNT(*) AS count FROM saas_audit_log WHERE clinic_id = ? AND created_at >= datetime('now', '-24 hours')`)
      .bind(clinicId)
      .first<{ count: number }>();
    return tenantJson({
      requestId,
      clinicId,
      window: "24h",
      redacted: true,
      payloadsExposed: false,
      phiExposed: false,
      secretValuesExposed: false,
      totalEvents: Number(total?.count ?? 0),
      actions: (rows.results ?? []).map((row) => ({ action: row.action, count: Number(row.count), lastAt: row.last_at })),
      schemaReady: schema.ready,
      crossTenantScope: "enforced_by_membership_and_clinic_id",
    });
  } catch (error) {
    console.error("[saas.observability.GET] failed", { requestId, error });
    return tenantError("Não foi possível calcular observabilidade redigida.", "OBSERVABILITY_FAILED", 500);
  }
};
