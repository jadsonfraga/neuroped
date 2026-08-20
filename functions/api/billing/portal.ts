import { getContextUser } from "../auth/_authorization";
import {
  getClinicMembership,
  membershipCanManage,
  tenantError,
  tenantJson,
  writeSaasAudit,
} from "../tenant/_core";
import { getBillingAccount, type BillingEnv } from "./_core";
import { canonicalAppUrl, stripePost } from "./_stripe";

export const onRequestPost: PagesFunction<BillingEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco comercial não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  const clinicId = typeof body.clinicId === "string" ? body.clinicId.trim().slice(0, 80) : "";
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return tenantError("Apenas gestores podem administrar a assinatura.", "TENANT_FORBIDDEN", 403);
  }
  const account = await getBillingAccount(db, clinicId);
  if (!account?.provider_customer_id || !context.env.STRIPE_SECRET_KEY?.trim()) {
    return tenantError("Portal de cobrança ainda indisponível.", "BILLING_PORTAL_UNAVAILABLE", 503);
  }
  try {
    const session = await stripePost<{ url?: string }>(
      context.env,
      "/billing_portal/sessions",
      new URLSearchParams({
        customer: account.provider_customer_id,
        return_url: `${canonicalAppUrl(context.env)}/#/plano-equipe`,
        locale: "pt-BR",
      }),
    );
    if (!session.url) throw new Error("STRIPE_PORTAL_INVALID_RESPONSE");
    await writeSaasAudit(db, {
      clinicId,
      actorUserId: user.id,
      action: "billing_portal_created",
      targetType: "billing_account",
      targetId: clinicId,
    });
    return tenantJson({ url: session.url }, 201);
  } catch (error) {
    console.error("[billing.portal] provider error", error instanceof Error ? error.message : error);
    return tenantError("Não foi possível abrir o portal de cobrança.", "BILLING_PROVIDER_UNAVAILABLE", 502);
  }
};
