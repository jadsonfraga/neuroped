/**
 * Premissa de tempo economizado (por tipo de documento). Só gestor (organization.manage).
 * Migration 0037 (não aplicada): sem a tabela, 503 METRICS_MIGRATION_PENDING.
 */
import { getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import { isAssumptionDocType, validateMinutes } from "../../../../shared/outcomes";
import { isMissingExportTable } from "../../tenant/_exportPayload";
import { getClinicMembership, membershipHas, prepareSaasAudit, tenantError, tenantJson, type TenantEnv } from "../../tenant/_core";
import { readAssumptions } from "./_read";

export const onRequestPut: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const body = await context.request
    .json()
    .then((v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null))
    .catch(() => null);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  const clinicId = typeof body.clinicId === "string" ? body.clinicId.trim().slice(0, 80) : "";
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  if (!isAssumptionDocType(body.docType)) return tenantError("docType deve ser report ou clinical_note.", "VALIDATION_ERROR", 400);
  const minutes = validateMinutes(body.minutes);
  if (!minutes.ok) return tenantError(minutes.message, "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipHas(membership, "organization.manage")) {
    return tenantError("Só o gestor da clínica edita a premissa.", "TENANT_FORBIDDEN", 403);
  }
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingError) return billingError;
  try {
    const results = await db.batch([
      db
        .prepare(
          `INSERT INTO clinic_metrics_assumptions (clinic_id, doc_type, minutes_saved, updated_by_user_id, updated_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(clinic_id, doc_type) DO UPDATE SET minutes_saved = excluded.minutes_saved, updated_by_user_id = excluded.updated_by_user_id, updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(clinicId, body.docType, minutes.minutes, user.id),
      prepareSaasAudit(db, { clinicId, actorUserId: user.id, action: "metrics_assumption_upsert", targetType: "clinic_metrics_assumption", targetId: body.docType, metadata: { docType: body.docType, minutes: minutes.minutes } }, true),
    ]);
    if (Number(results[0]?.meta?.changes ?? 0) < 1) return tenantError("A premissa não foi persistida.", "DB_ERROR", 500);
  } catch (error) {
    if (isMissingExportTable(error, "clinic_metrics_assumptions")) {
      return tenantError("Premissa indisponível até a migration 0037 ser aplicada.", "METRICS_MIGRATION_PENDING", 503);
    }
    console.error("[live.outcomes.assumptions.PUT] DB error", error);
    return tenantError("Não foi possível salvar a premissa.", "DB_ERROR", 500);
  }
  return tenantJson({ data: await readAssumptions(db, clinicId) });
};
