import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement, resolveBillingClinicId } from "../billing/_guard";
import { resolveOperationsContext } from "./_context";

interface Env {
  DB?: D1Database;
}

function jsonError(error: string, code: string, status: number, extra: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ error, code, ...extra }), {
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
  // derivação que o handler usa (`resolveOperationsContext`, fonte única).
  // Resolver pelo ator bloqueava toda secretária com 409 (AUTHZ-P1-04). Sem
  // vínculo ativo, ou com mais de um profissional e nenhuma escolha, fail-closed
  // aqui mesmo, antes do handler. O profissional escolhido (`?provider=`) é só um
  // alvo solicitado e é validado contra o vínculo persistido.
  let tenantUserId = user.id;
  let clinicId: string | null;
  if (user.role === "operator") {
    const resolved = await resolveOperationsContext(context.env.DB, user, context.request);
    if (!resolved.ok) {
      if (resolved.code === "CLINIC_CONTEXT_REQUIRED") {
        return jsonError(resolved.error, "BILLING_CLINIC_CONTEXT_REQUIRED", 409);
      }
      return jsonError(
        resolved.error,
        resolved.code,
        resolved.status,
        resolved.code === "PROVIDER_SELECTION_REQUIRED" ? { providers: resolved.providers } : {},
      );
    }
    tenantUserId = resolved.principal.providerUserId;
    clinicId = resolved.clinicId;
  } else {
    clinicId = await resolveBillingClinicId(context.env.DB, tenantUserId, context.request);
    if (!clinicId) {
      return jsonError("Contexto de clínica obrigatório para agenda.", "BILLING_CLINIC_CONTEXT_REQUIRED", 409);
    }
  }

  const denial = await requireBillingEntitlement(context.env.DB, tenantUserId, clinicId, "clinical");
  if (denial) return denial;
  return context.next();
};
