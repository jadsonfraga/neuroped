# RBAC

Inspected baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Evidence date: 2026-09-26.

Source of truth: `shared/permissions.ts`. The inspected catalog includes organization management/lifecycle/export/metrics, team management, billing, finance, clinical read/write and audit permissions. `rolesWithPermission` supplies the fixed allowlist to new SQL queries. Unknown roles/permissions fail closed.

The existing settings sections already consume backend `permissions`. The SaaS increment removes the metrics panel's local role-derived authorization and obtains permissions from `GET /api/tenants/:id`. The server still independently authorizes the protected aggregate endpoint; hiding a panel is never the security boundary.

Product Evidence is restricted to the current clinic and `organization.metrics.read`. This is not an operator-wide multi-clinic dashboard. A future platform-wide view requires a separately designed operator permission and privacy boundary, not removal of clinic predicates.

Role/display labels may remain in presentation code; access decisions must use effective permissions. Not every handler/frontend was audited for scattered role comparisons. The specific prototype-key fix in `shared/entitlements.ts` concerns plan capabilities, which complement rather than replace permission and membership checks.
