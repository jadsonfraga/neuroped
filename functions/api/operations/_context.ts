/**
 * _context.ts — de qual agenda (profissional + clínica) esta requisição opera.
 *
 * Fonte única usada pelo middleware (tenant e billing) e pelo handler, para que
 * os dois nunca discordem sobre o profissional selecionado. O Express (dev) chama
 * o handler sem o middleware, então a validação não pode viver só no middleware.
 *
 * Regras (issue #1064):
 *   - `provider` na query é um ALVO SOLICITADO, nunca autoridade. Só o papel
 *     `operator` seleciona; profissional e admin operam sempre a própria agenda.
 *     O corpo da requisição NUNCA define o profissional.
 *   - O alvo é validado contra o vínculo ativo persistido da recepção. Inexistente,
 *     sem vínculo, vínculo suspenso e profissional inativo respondem IGUAL
 *     (PROVIDER_NOT_AVAILABLE): nada revela a existência de um profissional.
 *   - Recepção com mais de um profissional e sem escolha: 409, nunca por acaso.
 *   - A clínica é a do PROFISSIONAL selecionado (`resolveBillingClinicId`); cada
 *     requisição opera exatamente um par (profissional, clínica).
 *   - Toda recepção precisa, a cada requisição, de membership `assistant` ativa:
 *     numa clínica em comum com o profissional (condição do próprio vínculo, em
 *     `_access.ts`) e na clínica EXATA da requisição (aqui).
 */
import type { PublicUser } from "../auth/_shared";
import { resolveBillingClinicId } from "../billing/_guard";
import {
  operatorHasActiveAssistantMembership,
  resolveOperationsAccess,
  type OperationsPrincipal,
  type OperationsProviderChoice,
} from "./_access";

export type OperationsContextFailure =
  | { code: "STAFF_LINK_REQUIRED"; status: 403; error: string }
  | { code: "FORBIDDEN"; status: 403; error: string }
  | { code: "PROVIDER_NOT_AVAILABLE"; status: 403; error: string }
  | { code: "PROVIDER_SELECTION_REQUIRED"; status: 409; error: string; providers: OperationsProviderChoice[] }
  /** Sem clínica resolvível: cada chamador mantém a resposta histórica. */
  | { code: "CLINIC_CONTEXT_REQUIRED"; status: 409; error: string };

export type OperationsContextResult =
  | {
      ok: true;
      principal: OperationsPrincipal;
      clinicId: string;
      availableProviders: OperationsProviderChoice[];
    }
  | ({ ok: false } & OperationsContextFailure);

const PROVIDER_PARAM = "provider";
const MAX_PROVIDER_ID_LENGTH = 100;

/** `?provider=<id>`; só a query, nunca o corpo. */
export function requestedProviderId(request: Request): string | null {
  try {
    const raw = new URL(request.url).searchParams.get(PROVIDER_PARAM);
    const value = raw?.trim().slice(0, MAX_PROVIDER_ID_LENGTH);
    return value || null;
  } catch {
    return null;
  }
}

export async function resolveOperationsContext(
  db: D1Database,
  user: PublicUser,
  request: Request,
): Promise<OperationsContextResult> {
  const access = await resolveOperationsAccess(db, user, requestedProviderId(request));

  if (access.kind === "none") {
    return user.role === "operator"
      ? { ok: false, code: "STAFF_LINK_REQUIRED", status: 403, error: "Recepção ainda não vinculada a um profissional." }
      : { ok: false, code: "FORBIDDEN", status: 403, error: "Acesso não autorizado." };
  }
  if (access.kind === "not_available") {
    return { ok: false, code: "PROVIDER_NOT_AVAILABLE", status: 403, error: "Profissional indisponível para esta recepção." };
  }
  if (access.kind === "selection_required") {
    return {
      ok: false,
      code: "PROVIDER_SELECTION_REQUIRED",
      status: 409,
      error: "Escolha de qual profissional você vai operar a agenda.",
      providers: access.providers,
    };
  }

  const clinicId = await resolveBillingClinicId(db, access.principal.providerUserId, request);
  if (!clinicId) {
    return { ok: false, code: "CLINIC_CONTEXT_REQUIRED", status: 409, error: "Contexto de clínica obrigatório para agenda." };
  }

  // Toda recepção, a cada requisição, na clínica EXATA (a do profissional). O
  // vínculo já exige uma clínica em comum; aqui se fecha o `X-Tenant-Id` forjado.
  if (access.principal.delegated && !(await operatorHasActiveAssistantMembership(db, user.id, clinicId))) {
    // Mesma resposta de "profissional indisponível": não distingue o motivo.
    return { ok: false, code: "PROVIDER_NOT_AVAILABLE", status: 403, error: "Profissional indisponível para esta recepção." };
  }

  return { ok: true, principal: access.principal, clinicId, availableProviders: access.availableProviders };
}
