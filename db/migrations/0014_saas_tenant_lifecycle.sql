-- NeuroPed SaaS Phase 3 — ciclo de vida do tenant, retenção e trilha de exportação.
--
-- Princípios:
-- 1. solicitar encerramento NUNCA apaga dados: a clínica entra em modo suspenso/export-only;
-- 2. a retenção padrão é materializada no momento da solicitação (30 dias);
-- 3. legal_hold impede elegibilidade para purge; não existe purge automático nesta migration;
-- 4. exportações registram apenas metadados técnicos e digest, nunca conteúdo clínico;
-- 5. status 'closed' é terminal e só deve ser usado por procedimento administrativo auditado.

CREATE TABLE IF NOT EXISTS tenant_lifecycle (
  clinic_id TEXT PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'closure_requested', 'closed')),
  previous_clinic_status TEXT
    CHECK (previous_clinic_status IS NULL OR previous_clinic_status IN ('active', 'suspended', 'closed')),
  previous_billing_status TEXT
    CHECK (previous_billing_status IS NULL OR previous_billing_status IN (
      'pending', 'trial', 'active', 'past_due', 'suspended', 'canceled'
    )),
  reason_code TEXT
    CHECK (reason_code IS NULL OR reason_code IN ('customer_request', 'duplicate_tenant', 'migration', 'other')),
  requested_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  requested_at DATETIME,
  retention_until DATETIME,
  canceled_at DATETIME,
  finalized_at DATETIME,
  legal_hold INTEGER NOT NULL DEFAULT 0 CHECK (legal_hold IN (0, 1)),
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    status <> 'closure_requested'
    OR (requested_at IS NOT NULL AND retention_until IS NOT NULL AND reason_code IS NOT NULL)
  ),
  CHECK (status <> 'closed' OR finalized_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_tenant_lifecycle_status_retention
  ON tenant_lifecycle(status, retention_until);

INSERT OR IGNORE INTO tenant_lifecycle
  (clinic_id, status, finalized_at, updated_at)
SELECT
  c.id,
  CASE WHEN c.status = 'closed' THEN 'closed' ELSE 'active' END,
  CASE WHEN c.status = 'closed' THEN CURRENT_TIMESTAMP ELSE NULL END,
  CURRENT_TIMESTAMP
FROM clinics c;

CREATE TRIGGER IF NOT EXISTS trg_clinic_create_tenant_lifecycle
AFTER INSERT ON clinics
FOR EACH ROW
BEGIN
  INSERT OR IGNORE INTO tenant_lifecycle
    (clinic_id, status, finalized_at, updated_at)
  VALUES (
    NEW.id,
    CASE WHEN NEW.status = 'closed' THEN 'closed' ELSE 'active' END,
    CASE WHEN NEW.status = 'closed' THEN CURRENT_TIMESTAMP ELSE NULL END,
    CURRENT_TIMESTAMP
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_tenant_lifecycle_closed_terminal
BEFORE UPDATE OF status ON tenant_lifecycle
FOR EACH ROW
WHEN OLD.status = 'closed' AND NEW.status <> 'closed'
BEGIN
  SELECT RAISE(ABORT, 'TENANT_CLOSED_TERMINAL');
END;

CREATE TABLE IF NOT EXISTS tenant_export_events (
  id TEXT PRIMARY KEY,
  clinic_id TEXT REFERENCES clinics(id) ON DELETE SET NULL,
  requested_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  schema_version TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'json' CHECK (format = 'json'),
  patient_count INTEGER NOT NULL DEFAULT 0 CHECK (patient_count >= 0),
  event_count INTEGER NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  membership_count INTEGER NOT NULL DEFAULT 0 CHECK (membership_count >= 0),
  byte_length INTEGER NOT NULL CHECK (byte_length > 0),
  digest_sha256 TEXT NOT NULL CHECK (length(digest_sha256) = 64),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_export_events_clinic_time
  ON tenant_export_events(clinic_id, created_at DESC);


-- NeuroPed SaaS LIVE — domínios clínicos aditivos.
-- Este bloco é idempotente e é aplicado pelo workflow D1 já existente.
-- Não altera nem reutiliza tabelas *_demo; payloads sensíveis permanecem cifrados na aplicação.

CREATE TABLE IF NOT EXISTS live_assessments (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE RESTRICT,
  instrument_id TEXT NOT NULL,
  instrument_version TEXT NOT NULL,
  applied_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  applied_at DATETIME NOT NULL,
  provenance_source TEXT NOT NULL CHECK (provenance_source IN (
    'patient','family','school','therapist','clinician','instrument','laboratory',
    'imaging','eeg','genetics','document','device','system','other'
  )),
  payload_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL DEFAULT 'clinical-v1',
  supersedes_assessment_id TEXT REFERENCES live_assessments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','corrected','voided')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_assessments_clinic_patient_time
  ON live_assessments(clinic_id, patient_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_assessments_clinic_instrument
  ON live_assessments(clinic_id, instrument_id, instrument_version, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_assessments_supersedes
  ON live_assessments(supersedes_assessment_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_live_assessments_supersedes_once
  ON live_assessments(supersedes_assessment_id)
  WHERE supersedes_assessment_id IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS trg_live_assessments_patient_tenant_insert
BEFORE INSERT ON live_assessments
WHEN NOT EXISTS (
  SELECT 1 FROM live_patients p
   WHERE p.id = NEW.patient_id
     AND p.clinic_id = NEW.clinic_id
     AND p.status <> 'merged'
)
BEGIN
  SELECT RAISE(ABORT, 'LIVE_ASSESSMENT_PATIENT_TENANT_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_assessments_patient_tenant_update
BEFORE UPDATE OF clinic_id, patient_id ON live_assessments
WHEN NOT EXISTS (
  SELECT 1 FROM live_patients p
   WHERE p.id = NEW.patient_id
     AND p.clinic_id = NEW.clinic_id
     AND p.status <> 'merged'
)
BEGIN
  SELECT RAISE(ABORT, 'LIVE_ASSESSMENT_PATIENT_TENANT_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_assessments_supersession_tenant
BEFORE INSERT ON live_assessments
WHEN NEW.supersedes_assessment_id IS NOT NULL
 AND NOT EXISTS (
   SELECT 1 FROM live_assessments previous
    WHERE previous.id = NEW.supersedes_assessment_id
      AND previous.clinic_id = NEW.clinic_id
      AND previous.patient_id = NEW.patient_id
 )
BEGIN
  SELECT RAISE(ABORT, 'LIVE_ASSESSMENT_SUPERSESSION_TENANT_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_assessments_append_only
BEFORE UPDATE OF clinic_id, patient_id, instrument_id, instrument_version,
                 applied_by_user_id, applied_at, provenance_source,
                 payload_encrypted, encryption_version, supersedes_assessment_id
ON live_assessments
BEGIN
  SELECT RAISE(ABORT, 'LIVE_ASSESSMENT_IMMUTABLE');
END;

CREATE TABLE IF NOT EXISTS live_assessment_responses (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE RESTRICT,
  assessment_id TEXT NOT NULL REFERENCES live_assessments(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_position INTEGER NOT NULL CHECK (item_position >= 0),
  response_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL DEFAULT 'clinical-v1',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (assessment_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_live_assessment_responses_clinic_assessment
  ON live_assessment_responses(clinic_id, assessment_id, item_position);

CREATE TRIGGER IF NOT EXISTS trg_live_assessment_responses_append_only
BEFORE UPDATE OF clinic_id, patient_id, assessment_id, item_id, item_position,
                 response_encrypted, encryption_version
ON live_assessment_responses
BEGIN
  SELECT RAISE(ABORT, 'LIVE_ASSESSMENT_RESPONSE_IMMUTABLE');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_assessment_responses_tenant_insert
BEFORE INSERT ON live_assessment_responses
WHEN NOT EXISTS (
  SELECT 1 FROM live_assessments a
   WHERE a.id = NEW.assessment_id
     AND a.clinic_id = NEW.clinic_id
     AND a.patient_id = NEW.patient_id
)
BEGIN
  SELECT RAISE(ABORT, 'LIVE_ASSESSMENT_RESPONSE_TENANT_MISMATCH');
END;

CREATE TABLE IF NOT EXISTS live_documents (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE RESTRICT,
  author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'clinical_note','report','prescription','scale','school','other'
  )),
  origin TEXT NOT NULL CHECK (origin IN (
    'clinician','instrument','imported','family','school','system','other'
  )),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','superseded','voided')),
  family_visibility INTEGER NOT NULL DEFAULT 0 CHECK (family_visibility IN (0,1)),
  current_version INTEGER NOT NULL DEFAULT 1 CHECK (current_version > 0),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_documents_clinic_patient_time
  ON live_documents(clinic_id, patient_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_documents_clinic_status
  ON live_documents(clinic_id, status, updated_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_live_documents_patient_tenant_insert
BEFORE INSERT ON live_documents
WHEN NOT EXISTS (
  SELECT 1 FROM live_patients p
   WHERE p.id = NEW.patient_id
     AND p.clinic_id = NEW.clinic_id
     AND p.status <> 'merged'
)
BEGIN
  SELECT RAISE(ABORT, 'LIVE_DOCUMENT_PATIENT_TENANT_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_documents_patient_tenant_update
BEFORE UPDATE OF clinic_id, patient_id ON live_documents
WHEN NOT EXISTS (
  SELECT 1 FROM live_patients p
   WHERE p.id = NEW.patient_id
     AND p.clinic_id = NEW.clinic_id
     AND p.status <> 'merged'
)
BEGIN
  SELECT RAISE(ABORT, 'LIVE_DOCUMENT_PATIENT_TENANT_MISMATCH');
END;

CREATE TABLE IF NOT EXISTS live_document_versions (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  document_id TEXT NOT NULL REFERENCES live_documents(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE RESTRICT,
  author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL CHECK (version > 0),
  content_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL DEFAULT 'clinical-v1',
  origin TEXT NOT NULL CHECK (origin IN (
    'clinician','instrument','imported','family','school','system','other'
  )),
  issued_at DATETIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','superseded','voided')),
  family_visibility INTEGER NOT NULL DEFAULT 0 CHECK (family_visibility IN (0,1)),
  superseded_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (document_id, version)
);

CREATE INDEX IF NOT EXISTS idx_live_document_versions_clinic_document
  ON live_document_versions(clinic_id, document_id, version DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_live_document_versions_one_published
  ON live_document_versions(document_id)
  WHERE status = 'published';

CREATE TRIGGER IF NOT EXISTS trg_live_document_versions_tenant_insert
BEFORE INSERT ON live_document_versions
WHEN NOT EXISTS (
  SELECT 1 FROM live_documents d
   WHERE d.id = NEW.document_id
     AND d.clinic_id = NEW.clinic_id
     AND d.patient_id = NEW.patient_id
)
BEGIN
  SELECT RAISE(ABORT, 'LIVE_DOCUMENT_VERSION_TENANT_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_document_versions_append_only
BEFORE UPDATE OF clinic_id, document_id, patient_id, author_user_id, version,
                 content_encrypted, encryption_version, origin, issued_at
ON live_document_versions
BEGIN
  SELECT RAISE(ABORT, 'LIVE_DOCUMENT_VERSION_IMMUTABLE');
END;

CREATE TABLE IF NOT EXISTS live_retention_policies (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
  retention_days INTEGER NOT NULL CHECK (retention_days >= 0),
  auto_delete_enabled INTEGER NOT NULL DEFAULT 0 CHECK (auto_delete_enabled IN (0,1)),
  configured_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS live_export_requests (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  requested_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  patient_id TEXT REFERENCES live_patients(id) ON DELETE RESTRICT,
  scope TEXT NOT NULL CHECK (scope IN ('clinic','patient')),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested','approved','processing','completed','rejected'
  )),
  artifact_key TEXT,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_export_requests_clinic_status
  ON live_export_requests(clinic_id, status, requested_at DESC);

CREATE TABLE IF NOT EXISTS live_deletion_requests (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  requested_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  patient_id TEXT REFERENCES live_patients(id) ON DELETE RESTRICT,
  scope TEXT NOT NULL CHECK (scope IN ('clinic','patient')),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested','approved','processing','completed','rejected'
  )),
  reason_encrypted TEXT,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_deletion_requests_clinic_status
  ON live_deletion_requests(clinic_id, status, requested_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_live_export_patient_tenant_insert
BEFORE INSERT ON live_export_requests
WHEN NEW.patient_id IS NOT NULL
 AND NOT EXISTS (
   SELECT 1 FROM live_patients p
    WHERE p.id = NEW.patient_id AND p.clinic_id = NEW.clinic_id
 )
BEGIN
  SELECT RAISE(ABORT, 'LIVE_EXPORT_PATIENT_TENANT_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_deletion_patient_tenant_insert
BEFORE INSERT ON live_deletion_requests
WHEN NEW.patient_id IS NOT NULL
 AND NOT EXISTS (
   SELECT 1 FROM live_patients p
    WHERE p.id = NEW.patient_id AND p.clinic_id = NEW.clinic_id
 )
BEGIN
  SELECT RAISE(ABORT, 'LIVE_DELETION_PATIENT_TENANT_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_export_patient_tenant_update
BEFORE UPDATE OF clinic_id, patient_id ON live_export_requests
WHEN NEW.patient_id IS NOT NULL
 AND NOT EXISTS (
   SELECT 1 FROM live_patients p
    WHERE p.id = NEW.patient_id AND p.clinic_id = NEW.clinic_id
 )
BEGIN
  SELECT RAISE(ABORT, 'LIVE_EXPORT_PATIENT_TENANT_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_deletion_patient_tenant_update
BEFORE UPDATE OF clinic_id, patient_id ON live_deletion_requests
WHEN NEW.patient_id IS NOT NULL
 AND NOT EXISTS (
   SELECT 1 FROM live_patients p
    WHERE p.id = NEW.patient_id AND p.clinic_id = NEW.clinic_id
 )
BEGIN
  SELECT RAISE(ABORT, 'LIVE_DELETION_PATIENT_TENANT_MISMATCH');
END;
