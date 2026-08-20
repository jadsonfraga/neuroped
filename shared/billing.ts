/**
 * NeuroPed Billing — domínio provider-agnostic (SaaS Phase 2).
 *
 * Regras centrais: plano canônico R$ 99/assento/mês, trial de 14 dias,
 * entitlement decidido no backend e carência de 7 dias para past_due.
 */

export const billingProviders = [
  "none",
  "asaas",
  "mercadopago",
  "stripe",
  "iugu",
  "vindi",
] as const;
export type BillingProvider = (typeof billingProviders)[number];

export const customerStatuses = [
  "pending",
  "trial",
  "active",
  "past_due",
  "suspended",
  "canceled",
] as const;
export type CustomerStatus = (typeof customerStatuses)[number];

export const subscriptionStatuses = [
  "trial",
  "active",
  "past_due",
  "canceled",
  "expired",
] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export const invoiceEventKinds = [
  "charge_created",
  "charge_paid",
  "charge_failed",
  "charge_refunded",
  "webhook_received",
  "trial_started",
  "trial_converted",
  "subscription_canceled",
  "subscription_renewed",
  "seats_changed",
] as const;
export type InvoiceEventKind = (typeof invoiceEventKinds)[number];

export const invitationStatuses = ["pending", "accepted", "revoked", "expired"] as const;
export type InvitationStatus = (typeof invitationStatuses)[number];

export interface BillingPlan {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  currency: string;
  seatPriceCents: number;
  trialDays: number;
  maxSeats: number | null;
  billingCycleDays: number;
}

export const CANONICAL_PLAN_ID = "saas-professional";
export const CANONICAL_PRICE_CENTS = 9900;
export const CANONICAL_TRIAL_DAYS = 14;
export const PAST_DUE_GRACE_DAYS = 7;
export const POST_CANCEL_RETENTION_DAYS = 30;

export function monthlyPriceCents(plan: BillingPlan, seats: number): number {
  if (seats < 1) throw new Error("BILLING_INVALID_SEATS");
  return plan.seatPriceCents * seats;
}

export function prorataCents(
  plan: BillingPlan,
  seats: number,
  from: Date,
  to: Date,
  cycleDays: number = 30,
): number {
  const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000));
  const daily = monthlyPriceCents(plan, seats) / cycleDays;
  return Math.ceil(daily * days);
}

export function transitionCustomerOnPaymentFailure(
  current: CustomerStatus,
  lastFailedAt: Date,
  now: Date,
): CustomerStatus | null {
  if (current !== "trial" && current !== "active" && current !== "past_due") return null;
  if (current === "past_due") {
    const graceEnds = new Date(lastFailedAt.getTime() + PAST_DUE_GRACE_DAYS * 86400000);
    return now >= graceEnds ? "suspended" : null;
  }
  return "past_due";
}

export function transitionCustomerOnPaymentSuccess(
  current: CustomerStatus,
  _hadTrial: boolean,
): CustomerStatus {
  if (current === "past_due" || current === "trial" || current === "pending") {
    return "active";
  }
  return current;
}

export function isInvitationAcceptable(invitation: {
  status: InvitationStatus;
  expiresAt: string;
}, now: Date = new Date()): { ok: boolean; reason?: string } {
  if (invitation.status === "accepted") return { ok: false, reason: "INVITATION_ALREADY_ACCEPTED" };
  if (invitation.status === "revoked") return { ok: false, reason: "INVITATION_REVOKED" };
  if (invitation.status === "expired") return { ok: false, reason: "INVITATION_EXPIRED" };
  if (new Date(invitation.expiresAt) <= now) return { ok: false, reason: "INVITATION_EXPIRED" };
  if (invitation.status !== "pending") return { ok: false, reason: "INVITATION_UNACCEPTABLE" };
  return { ok: true };
}

export function remainingTrialDays(trialEndsAt: string | null, now: Date = new Date()): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - now.getTime();
  return diff > 0 ? Math.ceil(diff / 86400000) : 0;
}

export interface EntitlementSnapshot {
  userId: string;
  clinicId: string;
  role: string;
  planId: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  trialActive: boolean;
  isActive: boolean;
}
