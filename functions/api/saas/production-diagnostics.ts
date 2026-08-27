import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement } from "../billing/_guard";
import {
  clinicalLiveEnabled,
  getClinicMembership,
  membershipCanManage,
  operationalCryptoReady,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../tenant/_core";
import { clinicalCryptoReady } from "../tenant/_crypto";
import { loadSaasSchemaPosture } from "./_readiness";

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function baseUrlPosture(env: TenantEnv): { configured: boolean; https: boolean; environment: string } {
  const environment = env.ENVIRONMENT?.trim().toLowerCase() || "unknown";
  const raw = env.APP_BASE_URL?.trim() ?? "";
  if (!raw) return { configured: false, https: false, environment };
  try {
    const url = new URL(raw);
    return { configured: true, https: url.protocol === "https:", environment };
  } catch {
    return { configured: false, https: false, environment };
  }
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  const clinicId = cleanText(new URL(context.request.url).searchParams.get("clinicId"), 80);
  if (!db) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) return tenantError("Acesso administrativo negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "admin");
  if (billingError) return billingError;

  try {
    const schema = await loadSaasSchemaPosture(db);
    const baseUrl = baseUrlPosture(context.env);
    const clinicalKeyring = clinicalCryptoReady(context.env);
    const operationalKeyring = operationalCryptoReady(context.env);
    return tenantJson({
      clinicId,
      failClosed: true,
      environment: baseUrl.environment,
      schema,
      secrets: {
        clinicalKeyringReady: clinicalKeyring,
        operationalKeyReady: operationalKeyring,
        valuesExposed: false,
      },
      appBaseUrl: {
        configured: baseUrl.configured,
        https: baseUrl.https,
        valueExposed: false,
      },
      entitlement: { valid: true, scope: "admin" },
      clinicalLive: { enabled: clinicalLiveEnabled(context.env), canBeEnabledOnlyAfterSchemaAndKeys: true },
      correctiveActions: [
        ...(schema.missingTables.length ? ["Aplicar as migrations SaaS pendentes no ambiente alvo."] : []),
        ...(schema.missingTriggers.length ? ["Recriar os triggers de isolamento/append-only ausentes."] : []),
        ...(!clinicalKeyring ? ["Configurar o keyring clínico separado no secret manager."] : []),
        ...(!operationalKeyring ? ["Configurar OPERATIONAL_DATA_KEY separado no secret manager."] : []),
        ...(!baseUrl.configured || (baseUrl.environment === "production" && !baseUrl.https) ? ["Configurar APP_BASE_URL HTTPS no ambiente correto."] : []),
      ],
    });
  } catch (error) {
    console.error("[saas.production-diagnostics.GET] failed", error);
    return tenantError("Não foi possível calcular o diagnóstico de produção.", "PRODUCTION_DIAGNOSTICS_FAILED", 500);
  }
};
