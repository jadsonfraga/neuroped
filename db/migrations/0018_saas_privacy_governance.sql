-- Governança LGPD por tenant: control plane sem PHI e sem texto livre do titular.
CREATE TABLE IF NOT EXISTS saas_privacy_requests (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('access','correction','portability','deletion','restriction','objection')),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('account','patient','guardian','other')),
  subject_reference_hash TEXT NOT NULL CHECK (length(subject_reference_hash) = 64),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','verified','in_progress','completed','rejected','canceled')),
  due_at DATETIME,
  verified_at DATETIME,
  completed_at DATETIME,
  completed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  resolution_code TEXT CHECK (resolution_code IS NULL OR length(resolution_code) <= 80),
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saas_privacy_requests_clinic_status
  ON saas_privacy_requests(clinic_id, status, due_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saas_privacy_requests_subject
  ON saas_privacy_requests(clinic_id, subject_reference_hash, request_type, created_at DESC);

CREATE TABLE IF NOT EXISTS saas_retention_policies (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  data_class TEXT NOT NULL CHECK (data_class IN ('health','identity','operational','credentials','editorial')),
  retention_days INTEGER NOT NULL CHECK (retention_days BETWEEN 0 AND 36500),
  purge_mode TEXT NOT NULL CHECK (purge_mode IN ('archive','anonymize','delete')),
  legal_hold INTEGER NOT NULL DEFAULT 0 CHECK (legal_hold IN (0,1)),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0),
  updated_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (clinic_id, data_class)
);

CREATE INDEX IF NOT EXISTS idx_saas_retention_policies_clinic_enabled
  ON saas_retention_policies(clinic_id, enabled, data_class);

CREATE TRIGGER IF NOT EXISTS trg_saas_privacy_request_scope_immutable
BEFORE UPDATE OF clinic_id, request_type, subject_type, subject_reference_hash ON saas_privacy_requests
WHEN NEW.clinic_id <> OLD.clinic_id
  OR NEW.request_type <> OLD.request_type
  OR NEW.subject_type <> OLD.subject_type
  OR NEW.subject_reference_hash <> OLD.subject_reference_hash
BEGIN
  SELECT RAISE(ABORT, 'SAAS_PRIVACY_REQUEST_SCOPE_IMMUTABLE');
END;

CREATE TRIGGER IF NOT EXISTS trg_saas_retention_policy_version
BEFORE UPDATE OF version ON saas_retention_policies
WHEN NEW.version <> OLD.version + 1
BEGIN
  SELECT RAISE(ABORT, 'SAAS_RETENTION_POLICY_VERSION_CONFLICT');
END;

CREATE TRIGGER IF NOT EXISTS trg_saas_audit_log_append_only_update
BEFORE UPDATE ON saas_audit_log
BEGIN
  SELECT RAISE(ABORT, 'SAAS_AUDIT_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_saas_audit_log_append_only_delete
BEFORE DELETE ON saas_audit_log
BEGIN
  SELECT RAISE(ABORT, 'SAAS_AUDIT_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_saas_audit_log_metadata_bound
BEFORE INSERT ON saas_audit_log
WHEN length(COALESCE(NEW.metadata_json, '')) > 4000
BEGIN
  SELECT RAISE(ABORT, 'SAAS_AUDIT_METADATA_TOO_LARGE');
END;
