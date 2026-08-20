/**
 * NeuroPed Billing Entitlement — verificação server-side de acesso pago.
 * O frontend apenas reflete; decisões são recalculadas com estado live.
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
  grace_ends_at?: string | null;
}

export interface EntitlementResult extends EntitlementSnapshot {
  isPastDue: boolean;
  isSuspended: boolean;
  deniedReason: string | null;
}

export type BillingScope = "clinical" | "finance" | "admin" | "export";

const SCOPE_TO_ROLES: Record<BillingScope, string[]> = {
  clinical: ["owner", "clinic_admin", "professional"],
  finance: ["owner", "clinic_admin", "financial"],
  admin: ["owner", "clinic_admin"],
  export: ["owner", "clinic_admin", "professional", "assistant", "financial"],
};

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

  if (!base.isActive) {
    return { ...base, isPastDue: false, isSuspended: false, deniedReason: "ENTITLEMENT_MEMBERSHIP_INACTIVE" };
  }

  const roleAllowed = (SCOPE_TO_ROLES[scope] ?? []).includes(row.membership_role);
  if (!roleAllowed) {
    return { ...base, isPastDue: false, isSuspended: false, deniedReason: "ENTITLEMENT_ROLE_NOT_ALLOWED" };
  }

  const sub = row.subscription_status;
  const cust = row.customer_status;
  const terminal = cust === "suspended" || cust === "canceled" || sub === "canceled" || sub === "expired";
  if (terminal) {
    if (scope === "export") {
      return { ...base, isPastDue: false, isSuspended: true, deniedReason: null };
    }
    return { ...base, isPastDue: false, isSuspended: true, deniedReason: "ENTITLEMENT_SUSPENDED" };
  }

  const isPastDue = sub === "past_due" || cust === "past_due";
  if (isPastDue && row.grace_ends_at) {
    const graceEnds = Date.parse(row.grace_ends_at);
    if (Number.isFinite(graceEnds) && graceEnds <= now.getTime()) {
      if (scope === "export") {
        return { ...base, isPastDue: true, isSuspended: true, deniedReason: null };
      }
      return { ...base, isPastDue: true, isSuspended: true, deniedReason: "ENTITLEMENT_SUSPENDED" };
    }
  }

  const isActiveOrTrial = sub === "active" || isPastDue || base.trialActive || cust === "active";
  if (!isActiveOrTrial) {
    return { ...base, isPastDue: false, isSuspended: false, deniedReason: "ENTITLEMENT_NO_SUBSCRIPTION" };
  }

  return {
    ...base,
    isPastDue,
    isSuspended: false,
    deniedReason: isPastDue ? "ENTITLEMENT_PAST_DUE" : null,
  };
}
