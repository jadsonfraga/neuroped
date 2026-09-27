# Deployment and release

Inspected baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Evidence date: 2026-09-26.

The repository already contains Cloudflare, Vercel and other deployment workflows. Their existence is not proof of a successful publication. No deployment was initiated by these three draft PRs during this operation, and no published SHA is claimed.

The three new scoped workflows exercise new contracts alongside typecheck and lint. The clinical workflow also runs the existing clinical regression suite. They do not, by their mere creation, become required branch-protection checks. Required-check administration and every production deployment path were not comprehensively changed or verified.

Release requires reconciliation with current main; preservation of existing functionality; successful typecheck, lint, unit, integration, tenant isolation, clinical contracts, critical E2E, migration compatibility, build and security guards. Do not waive a failing check or replace a real integration with a mock. High-risk changes require migration/rollback review.

After publication, capture the actual SHA from the serving application, check health/authentication/scoped critical paths and perform post-deploy smoke. Provider billing requires its own permitted real integration evidence. New clinical output remains review-only. Rollback is a code revert because these increments introduce no business-data schema migration. Product Evidence does add metadata-only administrative read-audit events.

Shared-file reconciliation: retain SaaS server-served permissions and onboarding plus trust's Product Evidence component in `TenantMetricsPanel.tsx`. CI on separate PRs is not a test of their combined result.
