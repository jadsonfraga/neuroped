import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement } from "../billing/_guard";
import {
  getClinicMembership,
  membershipCanManage,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../tenant/_core";
import {
  SAAS_MODULE_IDS,
  isSaasModuleId,
  type SaasModuleId,
} from "../../../shared/saas-modules";

interface SaasModuleRow {
  id: string;
  clinic_id: string;
  module_id: SaasModuleId;
  enabled: number;
  version: number;
  updated_at: string;
  updated_by_user_id: string | null;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseVersion(value: unknown): number | null {
  const version = Number(value);
  return Number.isInteger(version) && version >= 0 && version <= 2_000_000_000 ? version : null;
}

function getClinicId(request: Request, body?: Record<string, unknown>): string {
  return cleanText(
    body?.clinicId
      ?? new URL(request.url).searchParams.get("clinicId")
      ?? request.headers.get("x-tenant-id")
      ?? request.headers.get("x-clinic-id"),
    80,
  );
}

async function authorizeModuleAdmin(
  context: Parameters<PagesFunction<TenantEnv>>[0],
  clinicId: string,
) {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return { error: tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503) } as const;
  if (!user) return { error: tenantError("Não autenticado.", "UNAUTHENTICATED", 401) } as const;
  if (!clinicId) return { error: tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400) } as const;

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return { error: tenantError("Acesso administrativo negado para esta clínica.", "TENANT_FORBIDDEN", 403) } as const;
  }

  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "admin");
  if (billingError) return { error: billingError } as const;

  return { db, user, membership } as const;
}

function toApi(row: SaasModuleRow | undefined, moduleId: SaasModuleId) {
  return {
    moduleId,
    enabled: row ? Boolean(row.enabled) : false,
    version: row?.version ?? 0,
    updatedAt: row?.updated_at ?? null,
  };
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const clinicId = getClinicId(context.request);
  const authorized = await authorizeModuleAdmin(context, clinicId);
  if ("error" in authorized) return authorized.error;

  try {
    const result = await authorized.db
      .prepare(
        `SELECT id, clinic_id, module_id, enabled, version, updated_at, updated_by_user_id
           FROM saas_module_settings
          WHERE clinic_id = ?
          ORDER BY module_id`,
      )
      .bind(clinicId)
      .all<SaasModuleRow>();
    const rows = new Map((result.results ?? []).map((row) => [row.module_id, row]));
    return tenantJson({
      clinicId,
      data: SAAS_MODULE_IDS.map((moduleId) => toApi(rows.get(moduleId), moduleId)),
    });
  } catch (error) {
    console.error("[saas.modules.GET] control plane unavailable", error);
    return tenantError("Não foi possível carregar a configuração SaaS.", "SAAS_MODULES_LOAD_FAILED", 500);
  }
};

export const onRequestPatch: PagesFunction<TenantEnv> = async (context) => {
  const user = getContextUser(context);
  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }

  const clinicId = getClinicId(context.request, body);
  const authorized = await authorizeModuleAdmin(context, clinicId);
  if ("error" in authorized) return authorized.error;

  if (!user || !authorized.user || user.id !== authorized.user.id) {
    return tenantError("Sessão inválida.", "UNAUTHENTICATED", 401);
  }

  const moduleId = cleanText(body.moduleId, 40);
  if (!isSaasModuleId(moduleId)) {
    return tenantError("moduleId não pertence ao catálogo SaaS.", "MODULE_NOT_FOUND", 400);
  }
  if (typeof body.enabled !== "boolean") {
    return tenantError("enabled deve ser booleano.", "VALIDATION_ERROR", 400);
  }
  const expectedVersion = parseVersion(body.expectedVersion);
  if (expectedVersion === null) {
    return tenantError("expectedVersion é obrigatório para evitar sobrescrita concorrente.", "VERSION_REQUIRED", 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const nextVersion = expectedVersion + 1;
  try {
    const results = await authorized.db.batch([
      authorized.db
        .prepare(
          `INSERT INTO saas_module_settings
             (id, clinic_id, module_id, enabled, version, updated_by_user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(clinic_id, module_id) DO UPDATE SET
             enabled = excluded.enabled,
             version = saas_module_settings.version + 1,
             updated_by_user_id = excluded.updated_by_user_id,
             updated_at = excluded.updated_at
           WHERE saas_module_settings.version = ?`,
        )
        .bind(id, clinicId, moduleId, body.enabled ? 1 : 0, nextVersion, authorized.user.id, now, now, expectedVersion),
      prepareSaasAudit(
        authorized.db,
        {
          clinicId,
          actorUserId: authorized.user.id,
          action: "saas_module_setting_update",
          targetType: "saas_module",
          targetId: moduleId,
          metadata: { enabled: body.enabled, expectedVersion, nextVersion },
        },
        true,
      ),
    ]);

    if ((results[0]?.meta?.changes ?? 0) !== 1) {
      return tenantError("A configuração mudou durante a atualização. Recarregue a central.", "STALE_MODULE_SETTING", 409);
    }
    if ((results[1]?.meta?.changes ?? 0) !== 1) {
      return tenantError("A auditoria não pôde ser persistida; nenhuma alteração foi liberada.", "AUDIT_WRITE_FAILED", 500);
    }

    return tenantJson({
      clinicId,
      data: { moduleId, enabled: body.enabled, version: nextVersion, updatedAt: now },
    });
  } catch (error) {
    if (String(error).includes("SAAS_MODULE_SETTING_VERSION_CONFLICT")) {
      return tenantError("A configuração mudou durante a atualização. Recarregue a central.", "STALE_MODULE_SETTING", 409);
    }
    console.error("[saas.modules.PATCH] control plane write failed", error);
    return tenantError("Não foi possível salvar a configuração SaaS.", "SAAS_MODULES_WRITE_FAILED", 500);
  }
};
