# Tenancy

Inspected baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Evidence date: 2026-09-26.

`getClinicMembership` requires an explicit active membership for clinic_id and user_id. The central permission catalog determines privileges; global role is not a clinic bypass. LIVE routes independently verify resource ownership. Request-provided tenant IDs select a scope, never grant access.

## New contracts actually tested
Onboarding: 7 SQLite tests cover foreign/missing/injected tenant IDs, empty authorized tenant, no global-admin bypass, membership revocation, clinic suspension, disallowed roles, timestamp ordering and voided record handling.
Product Evidence: 5 SQLite tests cover cross-tenant counts, foreign/missing/injected scope, status filtering, revoked/nonpermitted access and inactive users/clinics. These are real SQL executions against synthetic table projections.
Clinical Intelligence: scope contamination, including corrected events from another tenant/patient, fails before analysis. This pure-function contract is not an HTTP access-control test.

## Acceptance still pending
The full Alfa × Beta matrix across all list/search/filter/pagination/export/public-link/document/agenda/assessment mutations has not been executed in this operation. Timing and inferential leakage were not measured. Existing isolation CI success applies to that workflow's coverage, not automatically to all endpoints or production. One SQL snapshot prevents read-time authorization inconsistency for the new aggregate query; later membership changes still require reauthorization on the next request.
