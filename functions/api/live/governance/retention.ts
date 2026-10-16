/**
 * Política de retenção por categoria, com piso legal do prontuário (Lei 13.787/2018, art. 6º: 20 anos).
 * GET: qualquer gestor vê regras efetivas, pisos e base legal. PUT: só gestor; abaixo do piso → 422.
 * Sem a migration 0036 aplicada, o GET devolve os padrões e o PUT responde 503.
 */
import { getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import {
  RETENTION_CATEGORIES,
  isRetentionCategory,
  validateRetentionDays,
  PENDING_LEGAL_DECISIONS,
  type RetentionCategory,
} from "../../../../shared/lgpd-compliance";
import { isMissingExportTable } from "../../tenant/_exportPayload";
import { getClinicMembership, membershipCanManage, prepareSaasAudit, tenantError, tenantJson, type TenantEnv } from "../../tenant/_core";

async function effectiveRules(db: D1Database, clinicId: string) {
  let stored: Array<{ category: string; retention_days: number; updated_at: string }> = [];
  let migrationApplied = true;
  try {
    const r = await db.prepare(`SELECT category, retention_days, updated_at FROM clinic_retention_rules WHERE clinic_id = ?`).bind(clinicId).all<{ category: string; retention_days: number; updated_at: string }>();
    stored = r.results ?? [];
  } catch (error) {
    if (!isMissingExportTable(error, "clinic_retention_rules")) throw error;
    migrationApplied = false;
  }
  const byCat = new Map(stored.map((s) => [s.category, s]));
  const rules = (Object.keys(RETENTION_CATEGORIES) as RetentionCategory[]).map((category) => {
    const meta = RETENTION_CATEGORIES[category];
    const s = byCat.get(category);
    return {
      category,
      label: meta.label,
      basis: meta.basis,
      legalFloorDays: meta.floorDays,
      defaultDays: meta.defaultDays,
      retentionDays: s ? Math.max(s.retention_days, meta.floorDays) : meta.defaultDays,
      configured: Boolean(s),
      updatedAt: s?.updated_at ?? null,
    };
  });
  return { rules, migrationApplied };
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const clinicId = (new URL(context.request.url).searchParams.get("clinicId") ?? "").trim().slice(0, 80);
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) return tenantError("Somente gestores consultam a política de retenção.", "TENANT_FORBIDDEN", 403);
  try {
    const { rules, migrationApplied } = await effectiveRules(db, clinicId);
    return tenantJson({ rules, migrationApplied, pendingLegalDecisions: PENDING_LEGAL_DECISIONS.filter((d) => d.id.startsWith("retencao") || d.id.startsWith("eliminacao")) });
  } catch (error) {
    console.error("[live.governance.retention.GET] DB error", error);
    return tenantError("Não foi possível ler a política de retenção.", "DB_ERROR", 500);
  }
};

export const onRequestPut: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  let body: Record<string, unknown>;
  try {
    const v = await context.request.json();
    if (!v || typeof v !== "object" || Array.isArray(v)) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    body = v as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  const clinicId = typeof body.clinicId === "string" ? body.clinicId.trim().slice(0, 80) : "";
  if (!clinicId || !isRetentionCategory(body.category)) return tenantError("clinicId e category válidos são obrigatórios.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) return tenantError("Somente gestores alteram a política de retenção.", "TENANT_FORBIDDEN", 403);
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "admin");
  if (billingError) return billingError;
  const check = validateRetentionDays(body.category, body.retentionDays);
  if (!check.ok) return tenantError(check.message, check.code, check.code === "BELOW_LEGAL_FLOOR" ? 422 : 400);
  const now = new Date().toISOString();
  try {
    const results = await db.batch([
      db
        .prepare(
          `INSERT INTO clinic_retention_rules (clinic_id, category, retention_days, configured_by_user_id, updated_at)
           SELECT ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM clinic_memberships WHERE clinic_id = ? AND user_id = ? AND active = 1 AND role IN ('owner','clinic_admin'))
           ON CONFLICT(clinic_id, category) DO UPDATE SET retention_days = excluded.retention_days,
             configured_by_user_id = excluded.configured_by_user_id, updated_at = excluded.updated_at`,
        )
        .bind(clinicId, body.category, check.days, user.id, now, clinicId, user.id),
      prepareSaasAudit(
        db,
        { clinicId, actorUserId: user.id, action: "retention_rule_upsert", targetType: "retention_rule", targetId: body.category, metadata: { category: body.category, retentionDays: check.days } },
        true,
      ),
    ]);
    if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) {
      return tenantError("A regra mudou durante a operação.", "RULE_STALE", 409);
    }
  } catch (error) {
    if (isMissingExportTable(error, "clinic_retention_rules")) {
      return tenantError("Regras de retenção indisponíveis até a migration 0036 ser aplicada.", "RETENTION_MIGRATION_PENDING", 503);
    }
    console.error("[live.governance.retention.PUT] DB error", error);
    return tenantError("Não foi possível salvar a regra.", "DB_ERROR", 500);
  }
  const { rules } = await effectiveRules(db, clinicId);
  return tenantJson({ rules });
};
