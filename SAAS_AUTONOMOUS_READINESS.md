# Autonomous SaaS — readiness

Baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Overall acceptance: **PARTIAL**. A customer-zero journey has **not** been proven by this PR.

## Reuse and actual increment
Retained the existing tenant/membership model, central `shared/permissions.ts`, Asaas provider abstraction, billing webhook, server entitlements, encrypted LIVE storage and lifecycle/export implementation.

Added `GET /api/tenants/:id/onboarding`, a single-statement authorized read over persisted timestamps. Every tenant subquery is bound to the authorized clinic, and permission roles come from the central backend catalog. No client completion flag, redirect or payment amount is accepted. Unknown/malformed data yields an error, not a fabricated zero. SQL orders timestamp instants, not mixed-format strings.

The existing settings Activity panel now consumes permissions served by `GET /api/tenants/:id`; it no longer derives its own authorization from a role name. `TenantOnboardingPanel` displays observed timestamps, visible zero progress, pending steps and the unverified external billing step. No database migration, new audit ledger, entitlement override or billing-provider replacement was introduced.

## Acceptance matrix
| Customer-zero item | Status | Evidence / boundary |
|---|---|---|
| 1. Signup | PARTIAL | Existing signup interface and auth implementation retained; brand-new account browser journey not executed here. |
| 2. Verification | PARTIAL | Persisted email_verified_at is displayed; email possession is not professional identity/credential validation. Delivery/token E2E not executed here. |
| 3. Clinic creation | PARTIAL | Existing clinic API retained; created_at observed, creation journey not re-proven. |
| 4. Onboarding | PARTIAL | New read model and UI integration implemented. Five actual pure-module tests passed locally; browser UI not executed here. Retained records are not an immutable completion ledger. |
| 5. Plan | PARTIAL | Recorded provider-checkout creation represents checkout intent, not paid subscription or automatic-trial plan selection. |
| 6. Membership | PARTIAL | Existing membership API retained; first retained membership includes owner, not necessarily a successfully invited teammate. |
| 7. Patient | PARTIAL | LIVE creation timestamp observed; persisted record is not proof of a human customer. |
| 8. Consultation | PARTIAL | LIVE encounter registration observed; not proof of completed clinical care. |
| 9. Document | PARTIAL | Saved draft counts as a saved document, explicitly labelled; it is not a professionally reviewed final document. |
| 10. Billing | BLOCKED_EXTERNAL | Provider-mode attestation, real checkout/payment/webhook/reconciliation/cancel/reactivation journey were not executed. Availability of production credentials was not established. The panel does not assert a payment. |
| 11. Audit | PARTIAL | Existing audit implementation retained. Seven actual SQLite tests prove isolation for this read model only, not every endpoint. |
| 12. Cancel/export | PARTIAL | Existing tenant lifecycle and export retained; provider cancellation and complete physical export/closure acceptance not newly verified. |

## Executed tests
`node --experimental-strip-types --test tests/unit/value-onboarding.test.mjs`: 5 passed, exit 0.
`python3 tests/integration/value-onboarding-sql.test.py`: 7 passed, exit 0, real SQLite execution of the production query using synthetic projections of the required schema.

The SQL test first reproduced a defect in the new query: mixed SQLite/ISO timestamp strings selected a later instant. Replacing lexical MIN with chronological ordering fixed it; the same test passed. Foreign/missing/injected tenant IDs, revoked memberships, non-permitted roles, suspended clinic and platform admin without membership all return no authorized row.

These tests are **not** `cliente-zero-e2e`, a full migration test, a D1 integration or production isolation proof. No such journey is claimed. The dedicated workflow executes typecheck, lint and these tests, but workflow creation alone does not mean CI passed.

## Limitations and release
A successful 10/10 completion, autonomous commercial onboarding, real MRR, churn, revenue, payment-method setup and provider cancellation remain unverified. Current progress deliberately cannot reach commercial-readiness verification. Historical data removed under retention/deletion is not reconstructed as an invented milestone. Progress is accessible under Settings → Activity, not yet a complete signup-to-first-value wizard.

Rollback: revert this PR; it has no migration or persisted mutation. Required CI and authenticated browser/E2E checks must pass before release. Keep this report PARTIAL until the complete customer-zero journey, including permitted external provider steps, is evidenced.
