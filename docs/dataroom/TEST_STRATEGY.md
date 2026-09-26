# Test strategy

Inspected baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Evidence date: 2026-09-26.

## New locally executed cases
| Suite | Cases | Scope |
|---|---:|---|
| value-clinical-intelligence.test.mjs | 11 | Actual pure engine, synthetic provenance/delta/safety/adversarial inputs. |
| value-onboarding.test.mjs | 5 | Actual persisted-fact DTO and parser. |
| value-onboarding-sql.test.py | 7 | Actual SQL against synthetic schema projections. |
| value-product-evidence.test.mjs | 6 | Actual truthfulness/scope/health DTO contracts. |
| value-product-evidence-sql.test.py | 5 | Actual SQL against synthetic schema projections. |
| value-restore.test.py | 9 | Actual local SQLite backup/manifest/restore/corruption checks. |
| value-entitlement-prototype.test.mjs | 3 | Actual baseline catalog regression and fix. |

Total: 46 local cases, not 46 E2E scenarios. The restore executable additionally emitted sanitized synthetic evidence. RED/GREEN logs preserve both the newly introduced timestamp-query defect and the pre-existing inherited-plan-key defect. Missing-module RED tests for new features are labelled as such, not production incident reproductions.

## Remote evidence
Clinical contract run 36277849886 at clinical commit 3201e5a completed successfully: npm ci, check, lint, new tests and existing clinical regression suite. SaaS contract run 36278299458 at d7a6e58b completed successfully. Broader CI has independent status; consult current run records.

## Missing acceptance
No newly completed customer-zero browser journey, authenticated new-endpoint D1 test, all-route adversarial matrix, full migration recovery drill, provider payment/cancel test, universal final-document review attestation, or post-deploy smoke. UI code is not a screenshot/browser interaction proof. Do not turn skipped or pending jobs into success.
