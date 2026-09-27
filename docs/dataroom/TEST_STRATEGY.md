# Test strategy and evidence scope

Evidence date: 2026-09-26. The initial baseline was `0b4f74fb49214d00944fc2a366d3b4454363601a`. Consult root `VALUE_TRANSFORMATION_REPORT.md` for current branch reconciliation and release blockers.

## Historical local execution — not a current reconciled suite

| Initial suite | Cases | Scope |
|---|---:|---|
| Clinical intelligence | 11 | Actual pure module, synthetic provenance/delta/safety/adversarial inputs. |
| Initial onboarding DTO | 5 | Actual pure module/parser; later retired by canonical consolidation. |
| Initial onboarding SQL | 7 | Real SQLite over synthetic schema projections; later retired. |
| Product Evidence | 6 | Actual truthfulness/scope/health DTO. |
| Product Evidence SQL | 5 | Real SQLite over synthetic schema projections. |
| Restore verifier | 9 | Actual backup, restore, manifest and corruption rejection. |
| Entitlement prototype regression | 3 | Reproduced baseline key-lookup defect and actual fix. |

The historical total is 46. It is not 46 browser E2Es or 46 currently maintained tests: the 12 initial SaaS cases were replaced during consolidation. The archive marks those logs historical. Source differences and environment boundaries must accompany every reported count.

## Canonical SaaS and actual CI

The concurrent canonical implementation uses `saas-onboarding-progress.test.ts`, `onboarding-progress-ui.test.tsx`, `tenant-management-authorization.test.ts` and `cliente-zero-journey.test.ts`. Full schema/migrations and actual handlers are used by database tests; Asaas/Resend HTTP boundaries in the synthetic journey are mocked.

On `8109bee`, job `108509834430` completed self-service, owner-race, 15 tenant-management tests, chronological onboarding, three UI contracts and the partial acceptance journey. It subsequently failed customer-zero at the export completion assertion (actual true, expected false). The run therefore FAILED; earlier green steps do not make the full journey green.

The old owner source contract required a removed helper name and obsolete message copy. Commit `45d1f61` replaces those with central-permission and final SQL owner predicates, retaining the behavioral race suite. The LIVE isolation gate `36280253367` passed. LGPD atomicity `36280253289` and membership-seat `36280253377` still failed in that snapshot.

## Clinical and trust evidence

Clinical run `36277849886` passed at `3201e5a`; clinical run `36279546329` passed after reconciliation at `dd70f44`. Trust run `36279316186` passed at `33e9884`, including typecheck, lint, domain/SQL/restore tests and the synthetic restore executable. Later commits require their own CI; they do not inherit those run results.

RED/GREEN records distinguish new-feature missing-module tests from reproduced defects. Actual defects reproduced include inherited plan keys and mixed timestamp ordering. No failed test is deleted or changed merely to manufacture a release.

## Missing release acceptance

Combined authenticated browser journey, external production provider confirmation, complete current export/purge safety reconciliation, all-route adversarial coverage, full-schema native D1/key recovery, universal document-review attestation, serving SHA and post-deploy smoke remain unproven. Unrun/skipped/queued work is not VERIFIED.
