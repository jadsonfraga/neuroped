import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement, resolveBillingClinicId } from "../billing/_guard";
import { writeSaasAudit } from "../tenant/_core";

interface Env {
  DB?: D1Database;
  NEUROPED_E2E_EMAIL?: string;
}

/**
 * Reduz a rota a uma classe de superfície sem persistir identificadores,
 * query string ou qualquer conteúdo clínico no audit log.
 */
export function clinicalLiveReadAuditTarget(request: Request): string {
  const path = new URL(request.url).pathname
    .replace(/^\/api\/live\/?/i, "")
    .split("/")
    .filter(Boolean);
  const surface = (path[0] || "root")
    .replace(/[^a-z0-9_-]/gi, "_")
    .slice(0, 40)
    .toLowerCase();
  return `live_${surface}`;
}

/**
 * Audita apenas leituras que chegaram ao handler e retornaram sucesso.
 * Falhas de autenticação/autorização continuam sendo tratadas pelos guards
 * próprios e não são convertidas em eventos clínicos de leitura.
 */
export function shouldAuditClinicalLiveRead(request: Request, response: Response): boolean {
  return request.method.toUpperCase() === "GET" && response.status >= 200 && response.status < 400;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  if (!db) return context.next();
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

  const clinicId = await resolveBillingClinicId(db, user.id, context.request);
  if (!clinicId) {
    return new Response(JSON.stringify({
      error: "Contexto de clínica obrigatório para Clinical Core LIVE.",
      code: "BILLING_CLINIC_CONTEXT_REQUIRED",
    }), { status: 409, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }

  const denial = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (denial) return denial;

  const response = await context.next();
  if (shouldAuditClinicalLiveRead(context.request, response)) {
    const targetType = clinicalLiveReadAuditTarget(context.request);
    // A auditoria de leitura é deliberadamente best-effort e desacoplada da
    // disponibilidade clínica. `waitUntil` mantém a escrita viva após a
    // resposta, enquanto o catch impede que indisponibilidade do audit log
    // transforme uma leitura autorizada em falha assistencial.
    context.waitUntil(
      writeSaasAudit(db, {
        clinicId,
        actorUserId: user.id,
        action: "clinical.read",
        targetType,
        metadata: {
          method: "GET",
          status: response.status,
        },
      }).catch(() => undefined),
    );
  }

  return response;
};
