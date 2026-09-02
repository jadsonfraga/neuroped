import { getContextUser } from "../../auth/_authorization";
import { boundedText, isPlainObject } from "../../_request";
import {
  getClinicMembership,
  membershipCanManage,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";

function clinicIdFrom(params: Record<string, string | string[]>): string {
  const raw = params.id;
  return String(Array.isArray(raw) ? raw[0] : (raw ?? "")).trim().slice(0, 80);
}

function contextParams(context: Parameters<PagesFunction<TenantEnv>>[0]): Record<string, string | string[]> {
  return context.params as Record<string, string | string[]>;
}

function validColor(value: string): boolean {
  return value === "" || /^#[0-9a-fA-F]{6}$/.test(value);
}

function sanitizeDocumentPreferences(value: unknown): Record<string, unknown> {
  if (!isPlainObject(value)) return {};
  const result: Record<string, unknown> = {};
  if (typeof value.showLogo === "boolean") result.showLogo = value.showLogo;
  if (typeof value.includeProfessionalRegistry === "boolean") {
    result.includeProfessionalRegistry = value.includeProfessionalRegistry;
  }
  if (typeof value.defaultFooter === "string") {
    result.defaultFooter = value.defaultFooter.trim().slice(0, 600);
  }
  if (value.defaultLanguage === "pt-BR") result.defaultLanguage = "pt-BR";
  return result;
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  const clinicId = clinicIdFrom(contextParams(context));
  if (!db) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!clinicId) return tenantError("Clínica inválida.", "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || membership.clinicStatus === "closed") {
    return tenantError("Acesso à clínica não autorizado.", "TENANT_FORBIDDEN", 403);
  }

  const row = await db
    .prepare(
      `SELECT c.id, c.name, c.legal_name, c.timezone, c.status,
              s.specialty, s.institutional_identity, s.professional_display_name,
              s.professional_registry, s.document_preferences_json,
              s.brand_logo_key, s.brand_primary_color, s.updated_at
         FROM clinics c
         LEFT JOIN clinic_settings s ON s.clinic_id = c.id
        WHERE c.id = ?
        LIMIT 1`,
    )
    .bind(clinicId)
    .first<Record<string, unknown>>();

  if (!row) return tenantError("Clínica não encontrada.", "TENANT_NOT_FOUND", 404);

  let documentPreferences: Record<string, unknown> = {};
  if (typeof row.document_preferences_json === "string") {
    try {
      const parsed = JSON.parse(row.document_preferences_json);
      if (isPlainObject(parsed)) documentPreferences = parsed;
    } catch {
      // Preferências inválidas não devem quebrar a leitura da organização.
    }
  }

  return tenantJson({
    data: {
      clinicId: row.id,
      name: row.name,
      legalName: row.legal_name,
      timezone: row.timezone,
      status: row.status,
      specialty: row.specialty ?? null,
      institutionalIdentity: row.institutional_identity ?? null,
      professionalDisplayName: row.professional_display_name ?? null,
      professionalRegistry: row.professional_registry ?? null,
      documentPreferences,
      brandLogoKey: row.brand_logo_key ?? null,
      brandPrimaryColor: row.brand_primary_color ?? null,
      updatedAt: row.updated_at ?? null,
    },
  });
};

export const onRequestPut: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  const clinicId = clinicIdFrom(contextParams(context));
  if (!db) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!clinicId) return tenantError("Clínica inválida.", "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return tenantError("Apenas gestores da clínica podem alterar estas configurações.", "TENANT_FORBIDDEN", 403);
  }

  let parsed: unknown;
  try {
    parsed = await context.request.json();
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  if (!isPlainObject(parsed)) {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }

  const specialty = boundedText(parsed.specialty, 120) || null;
  const institutionalIdentity = boundedText(parsed.institutionalIdentity, 240) || null;
  const professionalDisplayName = boundedText(parsed.professionalDisplayName, 160) || null;
  const professionalRegistry = boundedText(parsed.professionalRegistry, 80) || null;
  const brandPrimaryColor = boundedText(parsed.brandPrimaryColor, 32) || null;
  if (brandPrimaryColor && !validColor(brandPrimaryColor)) {
    return tenantError("Cor institucional inválida.", "VALIDATION_ERROR", 400);
  }
  const documentPreferences = sanitizeDocumentPreferences(parsed.documentPreferences);
  const preferencesJson = JSON.stringify(documentPreferences);
  const now = new Date().toISOString();

  try {
    const results = await db.batch([
      db
        .prepare(
          `INSERT INTO clinic_settings
            (clinic_id, specialty, institutional_identity, professional_display_name,
             professional_registry, document_preferences_json, brand_primary_color,
             created_by_user_id, updated_by_user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(clinic_id) DO UPDATE SET
             specialty = excluded.specialty,
             institutional_identity = excluded.institutional_identity,
             professional_display_name = excluded.professional_display_name,
             professional_registry = excluded.professional_registry,
             document_preferences_json = excluded.document_preferences_json,
             brand_primary_color = excluded.brand_primary_color,
             updated_by_user_id = excluded.updated_by_user_id,
             updated_at = excluded.updated_at`,
        )
        .bind(
          clinicId,
          specialty,
          institutionalIdentity,
          professionalDisplayName,
          professionalRegistry,
          preferencesJson,
          brandPrimaryColor,
          user.id,
          user.id,
          now,
          now,
        ),
      prepareSaasAudit(
        db,
        {
          clinicId,
          actorUserId: user.id,
          action: "clinic_settings_update",
          targetType: "clinic_settings",
          targetId: clinicId,
          metadata: {
            specialtyConfigured: Boolean(specialty),
            institutionalIdentityConfigured: Boolean(institutionalIdentity),
            professionalRegistryConfigured: Boolean(professionalRegistry),
            documentPreferencesConfigured: Object.keys(documentPreferences).length > 0,
          },
        },
        true,
      ),
    ]);

    if (
      Number(results[0]?.meta?.changes ?? 0) !== 1 ||
      Number(results[1]?.meta?.changes ?? 0) !== 1
    ) {
      return tenantError("Configurações mudaram durante a operação.", "SETTINGS_STALE", 409);
    }
  } catch (error) {
    console.error("[tenants.settings.PUT] DB error", error);
    return tenantError("Não foi possível salvar as configurações da clínica.", "DB_ERROR", 500);
  }

  return tenantJson({
    ok: true,
    clinicId,
    specialty,
    institutionalIdentity,
    professionalDisplayName,
    professionalRegistry,
    documentPreferences,
    brandPrimaryColor,
  });
};
