import { getContextUser } from "../../auth/_authorization";
import { tenantError, tenantJson } from "../../tenant/_core";
import { ONBOARDING_PROGRESS_SQL } from "../../tenant/_onboardingProgress";
import { rolesWithPermission } from "../../../../shared/permissions";
import { buildOnboardingProgress } from "../../../../shared/onboarding-progress";

interface Env { DB?: D1Database; }
const permittedRoles = JSON.stringify(rolesWithPermission("organization.metrics.read"));

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = getContextUser(context);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const clinicId = context.params.id;
  if (typeof clinicId !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(clinicId)) return tenantError("Recurso indisponível.", "NOT_FOUND", 404);
  if (new URL(context.request.url).search) return tenantError("Filtros não suportados.", "INVALID_QUERY", 400);
  if (!context.env.DB) return tenantError("Progresso indisponível.", "ONBOARDING_UNAVAILABLE", 503);
  try {
    const row = await context.env.DB.prepare(ONBOARDING_PROGRESS_SQL).bind(clinicId, user.id, permittedRoles).first<Record<string, unknown>>();
    if (!row) return tenantError("Recurso indisponível.", "NOT_FOUND", 404);
    return tenantJson(buildOnboardingProgress(row));
  } catch {
    return tenantError("Progresso indisponível. Nenhuma etapa foi presumida.", "ONBOARDING_UNAVAILABLE", 503);
  }
};
