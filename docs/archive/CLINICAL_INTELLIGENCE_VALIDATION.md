# Clinical Intelligence — validation

Baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Overall acceptance: **PARTIAL**.

## Before
The canonical contract already existed in `shared/clinical-core.ts`, with LIVE encrypted events in `functions/api/live/events/index.ts`. `/api/clinical-core` is a separate demo-backed legacy surface; it was not repurposed or presented as production.

## Implemented
`shared/clinical-intelligence.ts` builds a deterministic source-preserving timeline, provenance/nature matrix, structurally comparable numeric outcome deltas, potential cross-source divergences, domain data gaps and documented safety alerts. It never declares a numeric delta to be clinical improvement. Raw documents/questionnaires remain identified as unextracted sources. Interpretation/decision records are not silently relabelled as observed facts. Drafts require professional review and cannot be emitted as final documents by this engine.

`GET /api/live/intelligence?clinicId=...&patientId=...` composes the existing LIVE event handler. It reuses membership, billing, patient ownership and decryption; parent LIVE middleware applies. No new clinical store, migration, AI provider, diagnostic threshold or prescribing logic was introduced. The returned source set is capped by the existing reader; at 500 records it is explicitly incomplete. The 90-day recency window is an administrative display default, not a medical monitoring recommendation.

## Evidence and boundaries
| Criterion | Status | Evidence / limitation |
|---|---|---|
| Provenance, timeline and scoped input | VERIFIED | Actual new engine executed locally against synthetic events; 11 unit/adversarial tests, exit 0. |
| Comparable arithmetic delta | VERIFIED | Stable goal/measure/unit/context, source category and recorder; two distinct instants. Clinical direction remains `not_inferred`; rater identity and clinical comparability require review. |
| Divergences and missing recent data | VERIFIED | Synthetic tests; gaps refer only to returned structured sources, never to clinical normality. |
| Structured review-only summary | VERIFIED | Pure engine tests; 2 consultations, school/family reports, instrument, exam, intervention and repeated outcomes. |
| Authenticated deployed route | PARTIAL | Handler written; remote D1/authenticated integration and deployed browser journey not executed in this session. |
| Professional review before every existing final-document path | PARTIAL | New engine is draft-only. Existing generic document publishing paths were not universally migrated to a durable review attestation. |
| Protocol registry, source extraction and complete clinical outcomes UI | PARTIAL | Existing modules retained; full requested integration is not delivered by this PR. |

RED: the new-feature test failed with the module absent (exit 1). GREEN: actual engine passed after implementation (exit 0). This is a new-feature RED/GREEN cycle, not a claimed reproduction of a production incident. No source reader was mocked to claim database or E2E proof.

CI workflow: `.github/workflows/value-clinical-intelligence.yml`. Workflow existence is not a successful CI run. Unit tests are not clinical validation or proof of clinical outcomes. No patients, real PHI or production secrets were used.

## Rollback and release
Revert this domain commit; no data migration or persisted clinical mutation is involved. Do not merge/deploy based only on local unit success. Full required CI, tenant integration, review-path contract, authenticated E2E and post-deploy SHA/health/smoke remain release requirements.
