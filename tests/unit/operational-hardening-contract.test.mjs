import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const migration = read("db/migrations/0016_clinical_operational_hardening.sql");
assert.match(migration, /live_pdf_archives/);
assert.match(migration, /trg_live_pdf_archives_immutable/);
assert.match(migration, /trg_live_pdf_archives_no_delete/);
assert.match(migration, /live_audit_chain/);
assert.match(migration, /trg_live_audit_chain_append_only_update/);
assert.match(migration, /live_clinical_drafts/);
assert.match(migration, /family_portal_invites/);
assert.match(migration, /live_previsit_submissions/);
assert.match(migration, /live_epilepsy_safety_plans/);

const pdf = read("functions/api/live/pdf-archives.ts");
assert.match(pdf, /clinicalCryptoReady/);
assert.match(pdf, /membershipCanReadClinical/);
assert.match(pdf, /membershipCanWriteClinical/);
assert.match(pdf, /clinic_id = \?/g);
assert.match(pdf, /download/);
assert.match(pdf, /sha256/);
assert.doesNotMatch(pdf, /localStorage|sessionStorage|indexedDB/);

const billing = read("functions/api/billing/reconcile.ts");
assert.match(billing, /workerAuthorized/);
assert.match(billing, /review_required/);
assert.match(billing, /entitlementChanged: false/);
assert.match(billing, /billing_reconciliation_items/);
assert.match(billing, /provider_unavailable/);

const worker = read("functions/api/live/worker.ts");
assert.match(worker, /workerAuthorized/);
assert.match(worker, /legal_hold/);
assert.match(worker, /RETENTION_NOT_EXPIRED/);
assert.match(worker, /CLINIC_PURGE_REQUIRES_SEPARATE_APPROVAL/);
assert.match(worker, /clinic_id = \?/g);
assert.match(worker, /live_export_worker_complete/);
assert.match(worker, /live_deletion_worker_complete/);

const family = read("functions/api/live/family-invites.ts") + read("functions/api/public/family-portal.ts");
assert.match(family, /crypto\.getRandomValues/);
assert.match(family, /SHA-256/);
assert.match(family, /max_uses/);
assert.match(family, /revoked_at/);
assert.match(family, /FAMILY_INVITE_REPLAY/);
const previsit = read("functions/api/public/previsit.ts");
assert.match(previsit, /informação fornecida pelo responsável/);
assert.match(previsit, /PREVISIT_LOCKED/);
assert.match(previsit, /expires_at/);

const timeline = read("functions/api/live/timeline.ts");
assert.match(timeline, /provenance/);
assert.match(timeline, /instrument_id/);
assert.match(timeline, /document_type/);
assert.match(timeline, /epilepsy_safety_plan/);

const panel = read("client/src/components/OperationalHealthPanel.tsx");
for (const field of ["buildSha", "frontendCanonical", "backendCanonical", "migrations", "objectStorage", "authentication"]) assert.match(panel, new RegExp(field));
assert.doesNotMatch(panel, /patientName|patientEmail|secret|password/);

console.log("operational hardening contract: PDF, tenant isolation, LGPD worker, tokens, previsit, timeline e panel aprovados");
