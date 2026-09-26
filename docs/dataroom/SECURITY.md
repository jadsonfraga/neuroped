# Security

Inspected baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Evidence date: 2026-09-26.

## Observed controls
LIVE reads combine authentication, explicit clinic membership, clinical permission, active clinic/billing checks and patient ownership. Encryption helpers are in `functions/api/tenant/_crypto.ts`. A platform administrator is not implicitly a member of another tenant. Reserved E2E identities are blocked from LIVE clinical data.

The new onboarding and Product Evidence SQL each authorize and scope the snapshot in one statement. Bound tenant/user parameters and central permission roles are used. Missing and unauthorized tenants produce the same no-row result. Aggregate responses contain no patient names or raw clinical content.

## Reproduced hardening
`planCapabilities` previously looked up a normal JavaScript object without checking own properties. Prototype names returned inherited values rather than the deny-all capability object; an array could coerce to a known key at runtime. Tests reproduced this baseline contract defect. The fix rejects non-string or non-own keys. This is not evidence of a demonstrated production exploit.

## Remaining risks
No claim of complete penetration testing, production tenant isolation, key escrow verification, incident-free operation or regulatory certification. Legacy/demo and alternate runtime surfaces need a complete census. The existing LIVE events exception path contains a lookup by `supersedes_event_id` without an explicit tenant predicate; preceding checks limit the path, but defense-in-depth review remains. New Product Evidence read-auditing is fail-closed; older LIVE read-auditing is best-effort. No secret or clinical row was retrieved for this operation.
