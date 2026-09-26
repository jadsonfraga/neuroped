import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement, resolveBillingClinicId } from "../billing/_guard";

interface Env {
  DB?: D1Database;
}

/**
 * AUTHZ-P1-09 (ciclo 4, 2026-09-26 —
 * docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md): sem este guard, qualquer
 * conta recém-criada (todo signup nasce role "professional", sem clínica
 * nem billing) podia importar arquivos com PHI de terceiros pelo bridge do
 * BoaConsulta. Mesmo padrão já em produção em patients/_middleware.ts e
 * operations/_middleware.ts.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) return context.next();
  const user = getContextUser(context);
  if (!user) return context.next();

  const clinicId = await resolveBillingClinicId(context.env.DB, user.id, context.request);
  if (!clinicId) {
    return new Response(JSON.stringify({
      error: "Contexto de clínica obrigatório para importações clínicas.",
      code: "BILLING_CLINIC_CONTEXT_REQUIRED",
    }), { status: 409, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }

  const denial = await requireBillingEntitlement(context.env.DB, user.id, clinicId, "clinical");
  if (denial) return denial;
  return context.next();
};
