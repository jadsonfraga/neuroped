/**
 * Catálogo central de capabilities por plano.
 *
 * Regra do produto: nenhuma feature é condicionada a plano espalhando
 * `if (plan === "pro")` pelo código. Toda decisão plano→capacidade passa por
 * aqui; o snapshot resolvido viaja em /api/billing/me e o cliente consome via
 * hook único. Hoje existe um único plano comercial (saas-professional) com
 * todas as capacidades habilitadas e limite dado pelos assentos contratados —
 * este módulo existe para que novos tiers alterem APENAS este catálogo.
 *
 * Fail-closed: plano desconhecido não herda capacidades de ninguém.
 */

export interface PlanCapabilities {
  canUseClinicalCore: boolean;
  canUseDocuments: boolean;
  canUseRemoteIntake: boolean;
  canUsePublicBooking: boolean;
  canUseAiDrafting: boolean;
  /** null = limite dado pelos assentos contratados na assinatura. */
  maxSeats: number | null;
  /** null = sem teto de pacientes no plano. */
  maxPatients: number | null;
}

const NO_CAPABILITIES: PlanCapabilities = Object.freeze({
  canUseClinicalCore: false,
  canUseDocuments: false,
  canUseRemoteIntake: false,
  canUsePublicBooking: false,
  canUseAiDrafting: false,
  maxSeats: 0,
  maxPatients: 0,
});

const PLAN_CAPABILITIES: Record<string, PlanCapabilities> = {
  "saas-professional": Object.freeze({
    canUseClinicalCore: true,
    canUseDocuments: true,
    canUseRemoteIntake: true,
    canUsePublicBooking: true,
    canUseAiDrafting: true,
    maxSeats: null,
    maxPatients: null,
  }),
};

export function planCapabilities(planId: string | null | undefined): PlanCapabilities {
  if (!planId) return NO_CAPABILITIES;
  return PLAN_CAPABILITIES[planId] ?? NO_CAPABILITIES;
}

export interface EffectiveEntitlements extends PlanCapabilities {
  planId: string | null;
  /** Assentos efetivamente contratados (assinatura), já limitado pelo plano. */
  seats: number | null;
  /** Entitlement de billing vigente (trial válido, ativo ou past_due em graça). */
  billingActive: boolean;
}

/**
 * Capacidades efetivas = catálogo do plano ∧ estado de billing. Sem billing
 * vigente, nenhuma capacidade permanece — a UI mostra o estado honesto de
 * assinatura, nunca uma feature que o servidor negará.
 */
export function resolveEffectiveEntitlements(input: {
  planId: string | null;
  subscriptionSeats: number | null;
  billingActive: boolean;
}): EffectiveEntitlements {
  const caps = input.billingActive ? planCapabilities(input.planId) : NO_CAPABILITIES;
  const seats =
    caps.maxSeats == null
      ? input.subscriptionSeats
      : Math.min(caps.maxSeats, input.subscriptionSeats ?? caps.maxSeats);
  return {
    ...caps,
    planId: input.planId,
    seats,
    billingActive: input.billingActive,
  };
}
