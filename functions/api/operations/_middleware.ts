import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement, resolveBillingClinicId } from "../billing/_guard";
import { resolveOperationsPrincipal } from "./_access";

interface Env {
  DB?: D1Database;
}

function jsonError(error: string, code: string, status: number): Response {
  return new Response(JSON.stringify({ error, code }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) return context.next();
  const user = getContextUser(context);
  if (!user) return context.next();

  // A recepção (papel global `operator`) não tem membership clínica: opera a
  // agenda por delegação persistida em `booking_staff_links`. A fronteira de
  // tenant e de billing é, portanto, a do PROFISSIONAL responsável — a mesma
  // derivação que o handler usa em `preparePrincipal`. Resolver pelo ator
  // bloqueava toda secretária com 409 (AUTHZ-P1-04). Sem vínculo ativo,
  // fail-closed aqui mesmo, antes do handler.
  let tenantUserId = user.id;
  if (user.role === "operator") {
    const principal = await resolveOperationsPrincipal(context.env.DB, user);
    if (!principal) {
      return jsonError("Recepção ainda não vinculada a um profissional.", "STAFF_LINK_REQUIRED", 403);
    }
    tenantUserId = principal.providerUserId;
  }

  const clinicId = await resolveBillingClinicId(context.env.DB, tenantUserId, context.request);
  if (!clinicId) {
    return jsonError("Contexto de clínica obrigatório para agenda.", "BILLING_CLINIC_CONTEXT_REQUIRED", 409);
  }

  const denial = await requireBillingEntitlement(context.env.DB, tenantUserId, clinicId, "clinical");
  if (denial) return denial;
  return context.next();
};
