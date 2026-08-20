/**
 * saas-billing-contract.test.ts — contrato de domínio do billing SaaS.
 *
 * Cobre as regras da issue #594 sem tocar infraestrutura:
 * - preço canônico de R$99/assento/mês;
 * - prorata;
 * - transições de status em falha/sucesso de pagamento;
 * - validação de convites (aceito/revogado/expirado);
 * - avaliação de entitlement por escopo.
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

// ── preço canônico ──────────────────────────────────────────────────────────
assert.equal(monthlyPriceCents(PLAN, 1), 9900, "cobra R$99/assento/mês");
assert.equal(monthlyPriceCents(PLAN, 3), 29700, "3 assentos = R$297/mês");
assert.throws(() => monthlyPriceCents(PLAN, 0), /BILLING_INVALID_SEATS/, "0 assentos é inválido");

{
  const from = new Date("2026-08-20T00:00:00Z");
  const to = new Date("2026-08-25T00:00:00Z");
  // 5 dias de 30 → 9900/30 = 330/dia → 1650 (arredondado para cima)
  assert.equal(prorataCents(PLAN, 1, from, to), 1650, "prorata arredonda para cima");
}

// ── transições do customer ──────────────────────────────────────────────────
{
  const now = new Date("2026-08-20T00:00:00Z");
  const recent = new Date(now.getTime() - 24 * 3600 * 1000);
  assert.equal(transitionCustomerOnPaymentFailure("active", recent, now), "past_due", "active → past_due");
  assert.equal(transitionCustomerOnPaymentFailure("trial", recent, now), "past_due", "trial → past_due");

  const justFailed = new Date(now.getTime() - 3 * 24 * 3600 * 1000);
  assert.equal(transitionCustomerOnPaymentFailure("past_due", justFailed, now), null, "dentro da carência não suspende");
  const oldFailure = new Date(now.getTime() - (PAST_DUE_GRACE_DAYS + 1) * 24 * 3600 * 1000);
  assert.equal(transitionCustomerOnPaymentFailure("past_due", oldFailure, now), "suspended", "após 7 dias → suspended");

  assert.equal(transitionCustomerOnPaymentSuccess("past_due", true), "active", "pagamento restaura active");
  assert.equal(transitionCustomerOnPaymentSuccess("trial", true), "active", "trial pago vira active");
  assert.equal(transitionCustomerOnPaymentSuccess("active", true), "active", "active permanece");
}

// ── convites ────────────────────────────────────────────────────────────────
{
  const future = new Date(Date.now() + INVITATION_EXPIRY_MS).toISOString();
  const past = new Date(Date.now() - 60_000).toISOString();

  assert.equal(isInvitationAcceptable({ status: "pending", expiresAt: future }).ok, true, "pendente futuro é aceitável");
  assert.equal(isInvitationAcceptable({ status: "accepted", expiresAt: future }).ok, false, "aceito é rejeitado");
  assert.equal(isInvitationAcceptable({ status: "revoked", expiresAt: future }).ok, false, "revogado é rejeitado");
  assert.equal(isInvitationAcceptable({ status: "pending", expiresAt: past }).ok, false, "expirado é rejeitado");

  assert.equal(normalizeInvitationEmail(" Dra.Jadson@Clinica.com.br "), "dra.jadson@clinica.com.br", "normaliza e-mail");
  assert.equal(normalizeInvitationEmail("invalido"), null, "e-mail inválido retorna null");
  assert.equal(normalizeInvitationEmail("a".repeat(330) + "@x.com"), null, "e-mail longo retorna null");
  assert.deepEqual(validateInvitationForAccept({ status: "pending", expires_at: future }), { ok: true }, "validação do convite");
}

// ── entitlement por escopo ──────────────────────────────────────────────────
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
  ...overrides,
});

{
  const r = evaluateEntitlement(baseRow(), "clinical") as EntitlementResult;
  assert.equal(r.deniedReason, null, "profissional ativo aprovado no escopo clínico");
  assert.equal(r.isActive, true, "entitlement ativo");
}
{
  const r = evaluateEntitlement(baseRow({ membership_role: "assistant" }), "clinical");
  assert.equal(r.deniedReason, "ENTITLEMENT_ROLE_NOT_ALLOWED", "assistant não tem acesso clínico");
}
{
  const r = evaluateEntitlement(
    baseRow({ customer_status: "past_due", subscription_status: "past_due" }),
    "clinical",
  ) as EntitlementResult;
  assert.equal(r.isPastDue, true, "past_due é sinalizado");
  assert.equal(r.deniedReason, "ENTITLEMENT_PAST_DUE", "motivo da degradação");
}
{
  const suspended = baseRow({ customer_status: "suspended", subscription_status: "canceled" });
  assert.equal(evaluateEntitlement(suspended, "clinical").deniedReason, "ENTITLEMENT_SUSPENDED", "suspended bloqueia clínico");
  assert.equal(evaluateEntitlement(suspended, "export").deniedReason, null, "export continua permitido (LGPD art. 18)");
}
{
  const r = evaluateEntitlement(baseRow({ trial_active: 1, customer_status: "trial" }), "clinical") as EntitlementResult;
  assert.equal(r.deniedReason, null, "trial implícito conta como ativo");
  assert.equal(r.trialActive, true, "flag de trial");
}
{
  assert.equal(evaluateEntitlement(null, "clinical").deniedReason, "ENTITLEMENT_NOT_FOUND", "linha nula negada");
  assert.equal(evaluateEntitlement(undefined, "finance").deniedReason, "ENTITLEMENT_NOT_FOUND", "indefinido negado");
}
{
  const ends = new Date(Date.now() + 5.5 * 86400000).toISOString();
  assert.equal(remainingTrialDays(ends), 6, "dias de trial restantes");
  assert.equal(remainingTrialDays(null), 0, "sem trial retorna 0");
}

console.log("saas-billing-contract: todas as 24 asserções passaram ✔");
