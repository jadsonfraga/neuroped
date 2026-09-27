import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement, resolveBillingClinicId } from "../billing/_guard";

interface Env {
  DB?: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) return context.next();
  const user = getContextUser(context);
  if (!user) return context.next();

  const clinicId = await resolveBillingClinicId(context.env.DB, user.id, context.request);
  if (!clinicId) {
    return new Response(JSON.stringify({
      error: "Contexto de clínica obrigatório para agenda.",
      code: "BILLING_CLINIC_CONTEXT_REQUIRED",
    }), { status: 409, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }

  // S10 / AUTHZ-P1-04: a agenda é o escopo "operations" (owner, clinic_admin,
  // professional e assistant) — a secretária opera sem herdar escrita clínica.
  const denial = await requireBillingEntitlement(context.env.DB, user.id, clinicId, "operations");
  if (denial) return denial;
  return context.next();
};
