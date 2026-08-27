-- NeuroPed LIVE operational hardening — migration 0016
-- A migration é somente aditiva e não executa purge destrutivo.
-- Payloads clínicos permanecem cifrados na aplicação; object storage é privado.

CREATE TABLE IF NOT EXISTS live_pdf_archives (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE RESTRICT,
  document_id TEXT NOT NULL REFERENCES live_documents(id) ON DELETE RESTRICT,
  document_version_id TEXT NOT NULL REFERENCES live_document_versions(id) ON DELETE RESTRICT,
  document_type TEXT NOT NULL,
  author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at DATETIME NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
  object_key TEXT UNIQUE,
  byte_length INTEGER NOT NULL CHECK (byte_length > 0),
  content_type TEXT NOT NULL DEFAULT 'application/pdf' CHECK (content_type = 'application/pdf'),
  status TEXT NOT NULL DEFAULT 'archived' CHECK (status IN ('archived','redacted')),
  UNIQUE (document_version_id),
  UNIQUE (document_id, version)
);
CREATE INDEX IF NOT EXISTS idx_live_pdf_archives_clinic_patient_time
  ON live_pdf_archives(clinic_id, patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_pdf_archives_clinic_document
  ON live_pdf_archives(clinic_id, document_id, version DESC);

CREATE TRIGGER IF NOT EXISTS trg_live_pdf_archives_patient_tenant_insert
BEFORE INSERT ON live_pdf_archives
WHEN NOT EXISTS (
  SELECT 1 FROM live_documents d
   JOIN live_patients p ON p.id = d.patient_id
  WHERE d.id = NEW.document_id
    AND d.clinic_id = NEW.clinic_id
    AND d.patient_id = NEW.patient_id
    AND p.clinic_id = NEW.clinic_id
    AND p.status <> 'merged'
)
BEGIN
  SELECT RAISE(ABORT, 'LIVE_PDF_ARCHIVE_PATIENT_TENANT_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_pdf_archives_version_tenant_insert
BEFORE INSERT ON live_pdf_archives
WHEN NOT EXISTS (
  SELECT 1 FROM live_document_versions v
   WHERE v.id = NEW.document_version_id
     AND v.document_id = NEW.document_id
     AND v.clinic_id = NEW.clinic_id
     AND v.patient_id = NEW.patient_id
     AND v.version = NEW.version
)
BEGIN
  SELECT RAISE(ABORT, 'LIVE_PDF_ARCHIVE_VERSION_TENANT_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_pdf_archives_immutable
BEFORE UPDATE ON live_pdf_archives
WHEN NOT (
  OLD.status = 'archived'
  AND NEW.status = 'redacted'
  AND NEW.patient_id = OLD.patient_id
  AND NEW.object_key IS NULL
  AND NEW.sha256 = OLD.sha256
  AND NEW.version = OLD.version
  AND NEW.document_id = OLD.document_id
  AND NEW.document_version_id = OLD.document_version_id
  AND NEW.clinic_id = OLD.clinic_id
)
BEGIN
  SELECT RAISE(ABORT, 'LIVE_PDF_ARCHIVE_IMMUTABLE');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_pdf_archives_no_delete
BEFORE DELETE ON live_pdf_archives
WHEN OLD.status <> 'redacted'
BEGIN
  SELECT RAISE(ABORT, 'LIVE_PDF_ARCHIVE_DELETE_FORBIDDEN_USE_REDACTION');
END;

CREATE TABLE IF NOT EXISTS live_audit_chain (
  id TEXT PRIMARY KEY,
  clinic_id TEXT REFERENCES clinics(id) ON DELETE SET NULL,
  actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  result TEXT NOT NULL CHECK (result IN ('success','denied','failure','blocked')),
  metadata_json TEXT,
  event_at DATETIME NOT NULL,
  previous_hash TEXT NOT NULL CHECK (length(previous_hash) = 64),
  event_hash TEXT NOT NULL UNIQUE CHECK (length(event_hash) = 64)
);
CREATE INDEX IF NOT EXISTS idx_live_audit_chain_clinic_time
  ON live_audit_chain(clinic_id, event_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_live_audit_chain_action_time
  ON live_audit_chain(action, event_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_live_audit_chain_append_only_update
BEFORE UPDATE ON live_audit_chain
BEGIN
  SELECT RAISE(ABORT, 'LIVE_AUDIT_CHAIN_APPEND_ONLY');
END;
CREATE TRIGGER IF NOT EXISTS trg_live_audit_chain_append_only_delete
BEFORE DELETE ON live_audit_chain
BEGIN
  SELECT RAISE(ABORT, 'LIVE_AUDIT_CHAIN_APPEND_ONLY');
END;

CREATE TABLE IF NOT EXISTS live_clinical_drafts (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE RESTRICT,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  draft_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','completed','signed','archived')),
  payload_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  last_idempotency_key TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE (clinic_id, patient_id, draft_key)
);
CREATE INDEX IF NOT EXISTS idx_live_clinical_drafts_clinic_patient_updated
  ON live_clinical_drafts(clinic_id, patient_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS family_portal_invites (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE RESTRICT,
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  token_hash TEXT NOT NULL UNIQUE,
  permissions_json TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses BETWEEN 1 AND 20),
  uses INTEGER NOT NULL DEFAULT 0 CHECK (uses >= 0),
  revoked_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_family_portal_invites_clinic_patient
  ON family_portal_invites(clinic_id, patient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS live_previsit_submissions (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE RESTRICT,
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','submitted','expired','revoked','reviewed','incorporated')),
  payload_encrypted TEXT,
  encryption_version TEXT,
  source_label TEXT NOT NULL DEFAULT 'family' CHECK (source_label = 'family'),
  expires_at DATETIME NOT NULL,
  submitted_at DATETIME,
  reviewed_at DATETIME,
  incorporated_at DATETIME,
  incorporated_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_live_previsit_clinic_patient_status
  ON live_previsit_submissions(clinic_id, patient_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS live_epilepsy_safety_plans (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE RESTRICT,
  author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL CHECK (version > 0),
  payload_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL,
  delivered_at DATETIME,
  delivery_scope TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','superseded','archived')),
  created_at DATETIME NOT NULL,
  UNIQUE (patient_id, version)
);
CREATE INDEX IF NOT EXISTS idx_live_epilepsy_plans_clinic_patient
  ON live_epilepsy_safety_plans(clinic_id, patient_id, version DESC);

ALTER TABLE live_export_requests ADD COLUMN worker_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE live_export_requests ADD COLUMN worker_claimed_at DATETIME;
ALTER TABLE live_export_requests ADD COLUMN worker_lease_until DATETIME;
ALTER TABLE live_export_requests ADD COLUMN artifact_digest_sha256 TEXT;
ALTER TABLE live_export_requests ADD COLUMN artifact_byte_length INTEGER;
ALTER TABLE live_export_requests ADD COLUMN failure_code TEXT;
ALTER TABLE live_deletion_requests ADD COLUMN worker_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE live_deletion_requests ADD COLUMN worker_claimed_at DATETIME;
ALTER TABLE live_deletion_requests ADD COLUMN worker_lease_until DATETIME;
ALTER TABLE live_deletion_requests ADD COLUMN deleted_counts_json TEXT;
ALTER TABLE live_deletion_requests ADD COLUMN failure_code TEXT;

CREATE INDEX IF NOT EXISTS idx_live_export_worker_queue
  ON live_export_requests(status, worker_lease_until, requested_at);
CREATE INDEX IF NOT EXISTS idx_live_deletion_worker_queue
  ON live_deletion_requests(status, worker_lease_until, requested_at);

-- D1 não possui IF NOT EXISTS para ADD COLUMN. O workflow deve aplicar cada
-- ALTER de forma idempotente e validar pragma_table_info antes do deploy.


CREATE TABLE IF NOT EXISTS billing_reconciliation_runs (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider = 'asaas'),
  status TEXT NOT NULL CHECK (status IN ('running','completed','failed','review_required')),
  checked_count INTEGER NOT NULL DEFAULT 0,
  matched_count INTEGER NOT NULL DEFAULT 0,
  mismatch_count INTEGER NOT NULL DEFAULT 0,
  started_at DATETIME NOT NULL,
  finished_at DATETIME,
  failure_code TEXT
);

CREATE TABLE IF NOT EXISTS billing_reconciliation_items (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES billing_reconciliation_runs(id) ON DELETE CASCADE,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  subscription_id TEXT NOT NULL REFERENCES billing_subscriptions(id) ON DELETE RESTRICT,
  provider_subscription_id TEXT NOT NULL,
  internal_status TEXT NOT NULL,
  provider_status TEXT,
  result TEXT NOT NULL CHECK (result IN ('matched','mismatch','provider_unavailable','invalid_provider_response')),
  checked_at DATETIME NOT NULL,
  metadata_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_billing_reconciliation_items_clinic_time
  ON billing_reconciliation_items(clinic_id, checked_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_billing_reconciliation_items_append_only_update
BEFORE UPDATE ON billing_reconciliation_items
BEGIN
  SELECT RAISE(ABORT, 'BILLING_RECONCILIATION_APPEND_ONLY');
END;
CREATE TRIGGER IF NOT EXISTS trg_billing_reconciliation_items_append_only_delete
BEFORE DELETE ON billing_reconciliation_items
BEGIN
  SELECT RAISE(ABORT, 'BILLING_RECONCILIATION_APPEND_ONLY');
END;
