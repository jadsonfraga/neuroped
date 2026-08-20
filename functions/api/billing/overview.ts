import { getContextUser } from "../auth/_authorization";
import {
  getClinicMembership,
  membershipCanAccessFinance,
  tenantError,
  tenantJson,
} from "../tenant/_core";
import {
  getCommercialEntitlement,
  publicBillingAccount,
  type BillingEnv,
} from "./_core";

function cleanClinicId(value: string | null): string {
  return (value ?? "").trim().slice(0, 80);
}

export const onRequestGet: PagesFunction<BillingEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco comercial não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  const clinicId = cleanClinicId(new URL(context.request.url).searchParams.get("clinicId"));
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanAccessFinance(membership)) {
    return tenantError("Acesso financeiro negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  }

  const result = await getCommercialEntitlement(db, clinicId);
  return tenantJson(publicBillingAccount(result, context.env));
};
