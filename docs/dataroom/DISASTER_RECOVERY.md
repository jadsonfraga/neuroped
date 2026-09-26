# Disaster recovery

Inspected baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Evidence date: 2026-09-26.

Operational recovery status in this delivery: **PARTIAL / NOT VERIFIED FOR PRODUCTION**.

Before a production-data drill, a responsible operator must authorize the source, destination, access restrictions, key handling, retention and destruction. Do not restore real health data into an ordinary development runner or publish row dumps as CI artifacts.

Controlled sequence: identify an authorized recovery point; preserve the trusted pre-incident manifest; provision an isolated protected destination; restore schema/data and required keys; verify schema, count, keyed checksum, FK/integrity and clinical decryption; run scoped read/authentication checks; measure recovery point loss and wall-clock restoration; record sanitized evidence and destroy the temporary copy according to policy.

The existing D1 rehearsal workflow requires typed `ENSAIAR`, validates temporary target names and rejects the production database target. These safeguards were not bypassed. That cloud workflow was not dispatched in this session. The new offline synthetic verifier supplements it; it does not replace D1 recovery.

Production RPO and RTO remain unknown. Lab milliseconds cannot be extrapolated to production volume, network transfer, key recovery or service restoration. Rollback of these three code increments is a code revert, not a substitute for database disaster recovery.
