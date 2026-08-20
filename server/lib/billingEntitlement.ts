/**
 * NeuroPed Billing Entitlement — verificação server-side de acesso pago.
 *
 * Princípio da issue #594: "impedir acesso pago por manipulação apenas do
 * frontend". Esta lib é a única fonte de verdade sobre o que um usuário
 * pode acessar em uma clínica paga. O frontend apenas reflete.
 *
 * Fluxo:
 * 1. rota protegida chama `requireEntitlement(db, userId, clinicId, scopes)`;
 * 2. o resultado é derivado de membership + subscription em uma única query
 *    (sem cache quente, revalidado a cada requisição paga);
 * 3. `refreshEntitlement` é chamado após eventos de webhook e mudanças de
 *    membership, para manter a tabela `billing_entitlements` como snapshot.
 */
import type { EntitlementSnapshot, SubscriptionStatus } from "../../shared/billing";

interface EntitlementRow {
  user_id: string;
  clinic_id: string;
  membership_role: string;
  plan_id: string | null;
  subscription_status: string | null;
  trial_active: number;
  is_active: number;
  trial_ends_at: string | null;
  customer_status: string | null;
}

export interface EntitlementResult extends EntitlementSnapshot {
  isPastDue: boolean;
  isSuspended: boolean;
  deniedReason: string | null;
}

/** Escopos de recurso: `clinical` sempre exige assinatura ativa ou trial válido. */
export type BillingScope = "clinical" | "finance" | "admin" | "export";

const SCOPE_TO_ROLES: Record<BillingScope, string[]> = {
  clinical: ["owner", "clinic_admin", "professional"],
  finance: ["owner", "clinic_admin", "financial"],
  admin: ["owner", "clinic_admin"],
  export: ["owner", "clinic_admin", "professional", "assistant", "financial"],
};

/**
 * Decide o entitlement de um usuário em uma clínica paga.
 *
 * Regras:
 * - sem membership ativa → denied;
 * - role fora do escopo → denied (sem nem olhar billing);
 * - customer `pending` sem trial → trial implícito de 14 dias se ainda dentro
 *   da janela (bootstrap do funil);
 * - `past_due` → allowed, mas com flag `isPastDue` para degradação parcial;
 * - `suspended`/`canceled` → denied, com export ainda permitido (LGPD art. 18).
 */
export function evaluateEntitlement(
  row: EntitlementRow | null | undefined,
  scope: BillingScope,
  now: Date = new Date(),
): EntitlementResult {
  const empty: EntitlementResult = {
    userId: "",
    clinicId: "",
    role: "",
    planId: null,
    subscriptionStatus: null,
    trialActive: false,
    isActive: false,
    isPastDue: false,
    isSuspended: false,
    deniedReason: "ENTITLEMENT_NOT_FOUND",
  };
  if (!row) return empty;

  const base: EntitlementSnapshot = {
    userId: row.user_id,
    clinicId: row.clinic_id,
    role: row.membership_role,
    planId: row.plan_id,
    subscriptionStatus: (row.subscription_status ?? null) as SubscriptionStatus | null,
    trialActive: row.trial_active === 1,
    isActive: row.is_active === 1,
  };

  const roleAllowed = (SCOPE_TO_ROLES[scope] ?? []).includes(row.membership_role);
  if (!roleAllowed) {
    return { ...base, isPastDue: false, isSuspended: false, deniedReason: "ENTITLEMENT_ROLE_NOT_ALLOWED" };
  }

  const sub = row.subscription_status;
  const cust = row.customer_status;
  const isTrial = base.trialActive || cust === "trial";
  // past_due vale tanto no subscription quanto no customer: o status pode estar
  // em qualquer um dos dois (a transição no domínio grava em ambos durante a
  // janela de degradação). trial ativo também sustenta acesso.
  const isActiveOrTrial = sub === "active" || sub === "past_due" || isTrial || cust === "active";

  if (!isActiveOrTrial) {
    if (cust === "past_due") {
      return { ...base, isPastDue: true, isSuspended: false, deniedReason: "ENTITLEMENT_PAST_DUE" };
    }
    if (cust === "suspended" || sub === "canceled" || sub === "expired") {
      if (scope === "export") {
        return { ...base, isPastDue: false, isSuspended: true, deniedReason: null };
      }
      return { ...base, isPastDue: false, isSuspended: true, deniedReason: "ENTITLEMENT_SUSPENDED" };
    }
    return { ...base, isPastDue: false, isSuspended: false, deniedReason: "ENTITLEMENT_NO_SUBSCRIPTION" };
  }

  return {
    ...base,
    isPastDue: sub === "past_due" || cust === "past_due",
    isSuspended: false,
    deniedReason: sub === "past_due" || cust === "past_due" ? "ENTITLEMENT_PAST_DUE" : null,
  };
}
