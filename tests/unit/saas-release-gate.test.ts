import assert from "node:assert/strict";
import { evaluateReleaseGate, REQUIRED_REVIEWS } from "../../scripts/ops/saas-release-gate";
const now = new Date("2026-10-25T15:00:00.000Z");
const origin = "https://neuroped.pages.dev";
const health = {
  status: "ok", timestamp: "2026-10-25T14:55:00.000Z",
  readiness: { coreReady: true, clinicalCryptoConfigured: true, lgpdSchemaReady: true,
    blockers: [], lgpdExport: { configured: true, storageBindingPresent: true } },
};
const smoke = {
  kind: "cliente-zero-published-smoke", schemaVersion: 1, target: origin,
  verdict: "VERIFIED", exitCode: 0, finishedAt: "2026-10-25T14:30:00.000Z",
  billingEvidence: { status: "SERVER_CONFIRMED", environment: "production" },
  clinicToFirstDocumentMs: 600000,
  onboarding: { completed: 10, total: 10 },
  steps: [
    "api_health", "signup_gate", "billing_webhook_gate", "owner_login",
    "clinic", "email_verified", "plan", "billing", "membership", "first_member", "patient",
    "consultation", "document", "audit", "export", "onboarding_server", "closure",
  ].map(id => ({ id, status: "VERIFIED" })),
};
const reviews = { schemaVersion: 1, target: origin, checkpoints:
  Object.fromEntries(REQUIRED_REVIEWS.map(key => [key, {
    reviewer: "Profissional responsável", reviewedAt: "2026-10-25T14:00:00.000Z",
    artifactSha256: "a".repeat(64),
  }])) };
const check = (partial: Record<string, unknown> = {}) =>
  evaluateReleaseGate({ health, smoke, reviews, origin, now, ...partial });
assert.equal(check().verdict, "READY_FOR_HUMAN_DECISION");
assert.equal(check().permitsAutomaticLaunch, false);
assert.equal(check({ health: {}, smoke: {}, reviews: {} }).verdict, "NO_GO");
const cryptoMissing = check({ health: { ...health,
  readiness: { ...health.readiness, clinicalCryptoConfigured: false } } });
assert.ok(cryptoMissing.blockers.includes("PUBLISHED_CLINICAL_HEALTH_NOT_READY"));
const fakeCheckout = check({ smoke: { ...smoke,
  billingEvidence: { status: "AWAITING_PROVIDER_EVENT", environment: "production" } } });
assert.ok(fakeCheckout.blockers.includes("PUBLISHED_CLIENT_ZERO_UNPROVEN"));
assert.equal(check({ smoke: { ...smoke,
  billingEvidence: { status: "SERVER_CONFIRMED", environment: "sandbox" } } }).verdict, "NO_GO");
const missingDoc = check({ smoke: { ...smoke,
  steps: smoke.steps.filter(s => s.id !== "document") } });
assert.equal(missingDoc.verdict, "NO_GO");
const unapproved = check({ reviews: { ...reviews, checkpoints: { ...reviews.checkpoints,
  regulatory_clinical_classification: { reviewer: "X", artifactSha256: "invalid" } } } });
assert.ok(unapproved.blockers.includes("REVIEW_MISSING_REGULATORY_CLINICAL_CLASSIFICATION"));
assert.equal(check({ health: { ...health, timestamp: "2026-10-23T00:00:00Z" } }).verdict, "NO_GO");
assert.deepEqual(check({ origin: "http://inseguro.local" }).blockers, ["INVALID_ORIGIN"]);
console.log("✅ Gate SaaS: health clínico + cliente-zero + pagamento real + revisão humana; fail-closed.");
