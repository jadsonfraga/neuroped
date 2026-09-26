# Operational LGPD matrix

Inspected baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Evidence date: 2026-09-26.

This is an engineering evidence matrix, not a legal opinion or a declaration of compliance. Appropriate retention, lawful basis, professional-record obligations and contractual responsibilities require review by the responsible organization.

| Requirement | Inspected implementation | Test/evidence in this operation | Limitation |
|---|---|---|---|
| Consent | Consent flow not individually inspected in this operation | NOT VERIFIED | Consent semantics, collection and revocation not newly tested. |
| Export | tenants/[id]/export.ts; LIVE governance workers | Existing sources retained | No complete real tenant export/download verified. |
| Correction | Existing clinical event supersession | New summary excludes corrected records from delta | Not every correction path audited or legally assessed. |
| Deletion | LIVE governance worker + completion guard schema | Health source inspects completion evidence triggers | Actual data deletion and artifact cleanup not executed. |
| Closure/retention | shared/tenantLifecycle.ts; tenant lifecycle endpoint | Code inspection only | Physical purge, provider cancellation and legal hold acceptance not newly proven. |
| Audit | saas_audit_log; new metadata-only Product Evidence read | Scoped aggregate SQL tests | Global completeness, immutability and delivery are not certified. |
| Minimization | Metadata-only Product Evidence; no clinical payload logging in new handlers | DTO tests reject fabricated evidence | Third-party telemetry and every existing log surface not audited. |
| Tenant isolation | Membership/permission/resource guards | New scoped synthetic SQL and clinical contracts | Full production Alfa × Beta exercise still pending. |

Never label an export complete merely because an endpoint returned 200 or a job exists. Preserve existing completion-evidence guards. A successful health schema probe explicitly remains different from export execution.
