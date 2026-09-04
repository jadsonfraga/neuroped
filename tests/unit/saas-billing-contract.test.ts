/**
 * saas-billing-contract.test.ts — contrato de domínio do billing SaaS.
 */
import assert from "node:assert/strict";
import {
  CANONICAL_PRICE_CENTS,
  CANONICAL_TRIAL_DAYS,
  PAST_DUE_GRACE_DAYS,
  isInvitationAcceptable,
  monthlyPriceCents,
  prorataCents,
  remainingTrialDays,
  transitionCustomerOnPaymentFailure,
  transitionCustomerOnPaymentSuccess,
  type BillingPlan,
} from "../../shared/billing";
import { evaluateEntitlement, type EntitlementResult } from "../../server/lib/billingEntitlement";
import {
  buildInvitationUrl,
  INVITATION_EXPIRY_MS,
  normalizeInvitationEmail,
  validateInvitationForAccept,
} from "../../functions/api/billing/_onboarding";

const PLAN: BillingPlan = {
  id: "saas-professional",
  name: "NeuroPed Professional",
  slug: "professional",
  priceCents: CANONICAL_PRICE_CENTS,
  currency: "BRL",
  seatPriceCents: CANONICAL_PRICE_CENTS,
  trialDays: CANONICAL_TRIAL_DAYS,
  maxSeats: null,
  billingCycleDays: 30,
};

assert.equal(monthlyPriceCents(PLAN, 1), 9900);
assert.equal(monthlyPriceCents(PLAN, 3), 29700);
assert.throws(() => monthlyPriceCents(PLAN, 0), /BILLING_INVALID_SEATS/);

{
  const from = new Date("2026-08-20T00:00:00Z");
  const to = new Date("2026-08-25T00:00:00Z");
  assert.equal(prorataCents(PLAN, 1, from, to), 1650);
}

{
  const now = new Date("2026-08-20T00:00:00Z");
  const recent = new Date(now.getTime() - 24 * 3600 * 1000);
  assert.equal(transitionCustomerOnPaymentFailure("active", recent, now), "past_due");
  assert.equal(transitionCustomerOnPaymentFailure("trial", recent, now), "past_due");

  const justFailed = new Date(now.getTime() - 3 * 24 * 3600 * 1000);
  assert.equal(transitionCustomerOnPaymentFailure("past_due", justFailed, now), null);
  const oldFailure = new Date(now.getTime() - (PAST_DUE_GRACE_DAYS + 1) * 24 * 3600 * 1000);
  assert.equal(transitionCustomerOnPaymentFailure("past_due", oldFailure, now), "suspended");

  assert.equal(transitionCustomerOnPaymentSuccess("past_due", true), "active");
  assert.equal(transitionCustomerOnPaymentSuccess("trial", true), "active");
  assert.equal(transitionCustomerOnPaymentSuccess("active", true), "active");
  assert.equal(transitionCustomerOnPaymentSuccess("canceled", true), "canceled");
}

{
  const future = new Date(Date.now() + INVITATION_EXPIRY_MS).toISOString();
  const past = new Date(Date.now() - 60_000).toISOString();

  assert.equal(isInvitationAcceptable({ status: "pending", expiresAt: future }).ok, true);
  assert.equal(isInvitationAcceptable({ status: "accepted", expiresAt: future }).ok, false);
  assert.equal(isInvitationAcceptable({ status: "revoked", expiresAt: future }).ok, false);
  assert.equal(isInvitationAcceptable({ status: "pending", expiresAt: past }).ok, false);

  assert.equal(normalizeInvitationEmail(" Dra.Jadson@Clinica.com.br "), "dra.jadson@clinica.com.br");
  assert.equal(normalizeInvitationEmail("invalido"), null);
  assert.equal(normalizeInvitationEmail("a".repeat(330) + "@x.com"), null);
  assert.deepEqual(validateInvitationForAccept({ status: "pending", expires_at: future }), { ok: true });
}

{
  const token = "token_teste";
  // Formato hash: é a rota que o SPA de fato serve (/#/invite), e o token no
  // fragment não chega a servidores/logs intermediários.
  assert.equal(
    buildInvitationUrl("https://superneuroped.vercel.app", token),
    "https://superneuroped.vercel.app/#/invite?token=token_teste",
  );
  assert.equal(
    buildInvitationUrl("https://example.com/app/", token),
    "https://example.com/app#/invite?token=token_teste",
  );
  for (const base of [
    undefined,
    "",
    "http://superneuroped.vercel.app",
    "https://user:pass@superneuroped.vercel.app",
    "https://superneuroped.vercel.app?next=x",
    "javascript:alert(1)",
  ]) {
    assert.equal(buildInvitationUrl(base, token), null);
  }
  assert.equal(buildInvitationUrl("https://superneuroped.vercel.app", ""), null);
}

const baseRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  user_id: "u1",
  clinic_id: "c1",
  membership_role: "professional",
  plan_id: "saas-professional",
  subscription_status: "active",
  trial_active: 0,
  is_active: 1,
  trial_ends_at: null,
  customer_status: "active",
  grace_ends_at: null,
  ...overrides,
});

{
  const r = evaluateEntitlement(baseRow(), "clinical") as EntitlementResult;
  assert.equal(r.deniedReason, null);
  assert.equal(r.isActive, true);
}
{
  const r = evaluateEntitlement(baseRow({ membership_role: "assistant" }), "clinical");
  assert.equal(r.deniedReason, "ENTITLEMENT_ROLE_NOT_ALLOWED");
}
{
  const now = new Date("2026-08-20T00:00:00Z");
  const r = evaluateEntitlement(
    baseRow({
      customer_status: "past_due",
      subscription_status: "past_due",
      grace_ends_at: "2026-08-24T00:00:00Z",
    }),
    "clinical",
    now,
  );
  assert.equal(r.isPastDue, true);
  assert.equal(r.isSuspended, false);
  assert.equal(r.deniedReason, "ENTITLEMENT_PAST_DUE");
}
{
  const r = evaluateEntitlement(
    baseRow({ customer_status: "past_due", subscription_status: "past_due", grace_ends_at: null }),
    "clinical",
  );
  assert.equal(r.deniedReason, "ENTITLEMENT_SUSPENDED");
  assert.equal(r.isSuspended, true);
}
{
  const suspendedWithActiveSubscription = baseRow({
    customer_status: "suspended",
    subscription_status: "active",
  });
  assert.equal(
    evaluateEntitlement(suspendedWithActiveSubscription, "clinical").deniedReason,
    "ENTITLEMENT_SUSPENDED",
  );
  assert.equal(evaluateEntitlement(suspendedWithActiveSubscription, "export").deniedReason, null);
}
{
  const canceled = baseRow({ customer_status: "canceled", subscription_status: "active" });
  assert.equal(evaluateEntitlement(canceled, "clinical").deniedReason, "ENTITLEMENT_SUSPENDED");
}
{
  const now = new Date("2026-08-20T00:00:00Z");
  const validTrial = baseRow({
    subscription_status: "trial",
    trial_active: 1,
    customer_status: "trial",
    trial_ends_at: "2026-08-21T00:00:00Z",
  });
  const r = evaluateEntitlement(validTrial, "clinical", now);
  assert.equal(r.deniedReason, null);
  assert.equal(r.trialActive, true);
}
{
  const now = new Date("2026-08-20T00:00:00Z");
  const expiredTrial = baseRow({
    subscription_status: "trial",
    trial_active: 1,
    customer_status: "trial",
    trial_ends_at: "2026-08-19T00:00:00Z",
  });
  const r = evaluateEntitlement(expiredTrial, "clinical", now);
  assert.equal(r.deniedReason, "ENTITLEMENT_NO_SUBSCRIPTION");
  assert.equal(r.trialActive, false);
}
{
  assert.equal(evaluateEntitlement(null, "clinical").deniedReason, "ENTITLEMENT_NOT_FOUND");
  assert.equal(evaluateEntitlement(undefined, "finance").deniedReason, "ENTITLEMENT_NOT_FOUND");
}
{
  const ends = new Date(Date.now() + 5.5 * 86400000).toISOString();
  assert.equal(remainingTrialDays(ends), 6);
  assert.equal(remainingTrialDays(null), 0);
}

console.log("saas-billing-contract: domínio, suspensão e expiração de trial aprovados ✔");