import { getContextUser } from "../../auth/_authorization";
import { isPlainObject, boundedText } from "../../_request";
import { isValidTimeZone } from "../../../../shared/operations";
import {
  getClinicMembership,
  membershipCanManage,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";
import {
  ensureSelfServiceSchema,
  getClinicSettings,
  parseClinicSettingsInput,
  upsertClinicSettings,
} from "../../tenant/_settings";

/**
 * GET/PATCH /api/tenants/:id — detalhe e configuração da clínica.
 *
 * GET: qualquer membro ativo (dados básicos + settings institucionais usados
 * no papel timbrado dos documentos).
 * PATCH: owner/clinic_admin — nome, razão social, timezone e settings.
 * O slug é imutável (é identidade pública de URLs).
 */
export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  const clinicId = boundedText(context.params.id, 80);
  if (!db) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!clinicId) return tenantError("Clínica inválida.", "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership) return tenantError("Acesso negado para esta clínica.", "TENANT_FORBIDDEN", 403);

  const clinic = await db
    .prepare(`SELECT id, slug, name, legal_name, timezone, status FROM clinics WHERE id = ? LIMIT 1`)
    .bind(clinicId)
    .first<{ id: string; slug: string; name: string; legal_name: string | null; timezone: string; status: string }>();
  if (!clinic) return tenantError("Clínica não encontrada.", "NOT_FOUND", 404);

  await ensureSelfServiceSchema(db);
  const settings = await getClinicSettings(db, clinicId);
  return tenantJson({
    id: clinic.id,
    slug: clinic.slug,
    name: clinic.name,
    legalName: clinic.legal_name,
    timezone: clinic.timezone,
    status: clinic.status,
    role: membership.role,
    canManage: membershipCanManage(membership),
    settings,
  });
};

export const onRequestPatch: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  const clinicId = boundedText(context.params.id, 80);
  if (!db) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!clinicId) return tenantError("Clínica inválida.", "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return tenantError("Somente gestores podem alterar a clínica.", "TENANT_FORBIDDEN", 403);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!isPlainObject(parsed)) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    body = parsed;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }

  const name = boundedText(body.name, 160);
  const legalName = boundedText(body.legalName, 200);
  const timezone = boundedText(body.timezone, 80);
  if (name && name.length < 2) return tenantError("Nome da clínica inválido.", "VALIDATION_ERROR", 400);
  if (timezone && !isValidTimeZone(timezone)) {
    return tenantError("Timezone IANA inválido.", "VALIDATION_ERROR", 400);
  }

  const now = new Date().toISOString();
  const statements = [];
  if (name || legalName || timezone) {
    statements.push(
      db
        .prepare(
          `UPDATE clinics
              SET name = COALESCE(NULLIF(?, ''), name),
                  legal_name = COALESCE(NULLIF(?, ''), legal_name),
                  timezone = COALESCE(NULLIF(?, ''), timezone),
                  updated_at = ?
            WHERE id = ? AND status = 'active'`,
        )
        .bind(name, legalName, timezone, now, clinicId),
    );
  }
  statements.push(
    prepareSaasAudit(db, {
      clinicId,
      actorUserId: user.id,
      action: "clinic_update",
      targetType: "clinic",
      targetId: clinicId,
      metadata: { fields: ["name", "legalName", "timezone", "settings"].filter((field) => field in body) },
    }),
  );

  await ensureSelfServiceSchema(db);
  if (isPlainObject(body.settings)) {
    await upsertClinicSettings(db, clinicId, user.id, parseClinicSettingsInput(body.settings));
  }
  try {
    await db.batch(statements);
  } catch (error) {
    console.error("[tenants/:id.PATCH] DB error", error);
    return tenantError("Não foi possível atualizar a clínica.", "DB_ERROR", 500);
  }

  const clinic = await db
    .prepare(`SELECT id, slug, name, legal_name, timezone, status FROM clinics WHERE id = ? LIMIT 1`)
    .bind(clinicId)
    .first<{ id: string; slug: string; name: string; legal_name: string | null; timezone: string; status: string }>();
  const settings = await getClinicSettings(db, clinicId);
  return tenantJson({
    id: clinic?.id ?? clinicId,
    slug: clinic?.slug ?? "",
    name: clinic?.name ?? name,
    legalName: clinic?.legal_name ?? null,
    timezone: clinic?.timezone ?? timezone,
    status: clinic?.status ?? "active",
    role: membership.role,
    canManage: true,
    settings,
  });
};
