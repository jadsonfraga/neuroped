# Backup and restore

Inspected baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Evidence date: 2026-09-26.

## Actual new verifier
`scripts/value_restore_verifier.py` computes a consistent SQLite manifest with schema definitions, user/application versions, per-table counts and type-aware keyed row checksums. Verification rejects same-count content corruption, schema drift, missing rows and foreign-key violations. Reports do not contain row values or the HMAC key. A trusted pre-incident manifest and the same securely held verification key are prerequisites; self-generated post-incident baselines are not recovery evidence.

The executable accepts no input paths and creates only its own synthetic fixture in a private temporary directory. It performs a real SQLite backup, an isolated restore, integrity/schema/count/checksum/read checks and measures lab RPO/RTO. Nine unit/integration-mechanism tests executed successfully locally. The fixture has two schema-projection tables and three synthetic rows, not the real NeuroPed schema or volume.

## What it does NOT prove
No production backup was copied, no native D1 Time Travel was exercised, no clinical key recovery/decryption was verified. The report explicitly sets productionRecoveryVerified=false and production RPO/RTO=null. The dashboard does not convert this lab result into a valid production backup.

The pre-existing `.github/workflows/dr-mechanism-rehearsal.yml` provides a separate authorized isolated D1 mechanism rehearsal. Its presence is not a completed run. Real recovery also needs backups/retention, key custody, access controls and a trusted off-system evidence store. The new helper does not implement these operational controls.
