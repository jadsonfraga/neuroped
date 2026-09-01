import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement, resolveBillingClinicId } from "../billing/_guard";

interface Env {
  DB?: D1Database;
  NEUROPED_E2E_EMAIL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) return context.next();
  const user = getContextUser(context);
  if (!user) return context.next();

  // Defesa em profundidade contra corrida de rollout: a identidade técnica E2E
  // nunca participa do Clinical Core LIVE, mesmo que uma membership residual
  // apareça entre a checagem do middleware global e a resolução do handler.
  const reservedE2EEmail = context.env.NEUROPED_E2E_EMAIL?.trim().toLowerCase();
  if (reservedE2EEmail && user.email.trim().toLowerCase() === reservedE2EEmail) {
    return new Response(JSON.stringify({
      error: "Identidade técnica reservada não pode acessar dados clínicos LIVE.",
      code: "RESERVED_TECHNICAL_IDENTITY",
    }), { status: 403, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }

  const clinicId = await resolveBillingClinicId(context.env.DB, user.id, context.request);
  if (!clinicId) {
    return new Response(JSON.stringify({
      error: "Contexto de clínica obrigatório para Clinical Core LIVE.",
      code: "BILLING_CLINIC_CONTEXT_REQUIRED",
    }), { status: 409, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }

  const denial = await requireBillingEntitlement(context.env.DB, user.id, clinicId, "clinical");
  if (denial) return denial;
  return context.next();
};
