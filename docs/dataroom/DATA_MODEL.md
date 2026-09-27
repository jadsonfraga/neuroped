# Data model

Inspected baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Evidence date: 2026-09-26.

| Area | Inspected relations | Scope |
|---|---|---|
| Identity | users, clinic_memberships, clinics | User identity is global; membership binds user to clinic. |
| Clinical LIVE | live_patients, live_clinical_events | clinic_id; events also patient_id; encrypted payloads. |
| Documents | live_documents, live_document_versions | clinic_id + patient/document ownership; encrypted content versions. |
| Instruments | live_assessments and response rows | Versioned instrument references; response ownership must follow parent. |
| Billing | billing_customers, billing_subscriptions, billing_provider_checkouts, billing_invoice_events | Parent/customer relationship must resolve a clinic. Status is not proof of real paid revenue. |
| Governance | tenant_lifecycle, live_export_requests, live_lgpd_worker_jobs | Retention, legal hold and completion evidence are separate concepts. |
| Audit | saas_audit_log plus pre-existing ledgers | Tenant metadata only; no new parallel event ledger added. |

This inventory records inspected paths, not every persistent entity or every foreign key. The operation adds read models, not parallel patient storage. New SQL tests execute actual statements on synthetic schema projections, not the full production migration chain. Schema version, migration ordering, field nullability and ownership of all legacy tables remain release-audit requirements.

Correction and supersession are distinct from deletion. The clinical intelligence view excludes corrected/voided/future events from comparisons, but preserves original events in its returned timeline. Missing history must not be reconstructed or called normal.
