-- NeuroPed — LGPD operational worker foundation
--
-- Esta migration é deliberadamente aditiva e NÃO executa exportação nem eliminação.
-- Ela cria o ledger de claim/lease/evidência necessário para um executor físico
-- futuro operar de modo idempotente e para o D1 rejeitar falsos `completed`.

CREATE TABLE IF NOT EXISTS live_lgpd_worker_jobs (
  id TEXT PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('export','delete')),
  request_id TEXT NOT NULL,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','processing','completed','failed','blocked')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  claimed_at DATETIME,
  lease_until DATETIME,
  worker_run_id TEXT,
  artifact_key TEXT,
  artifact_digest_sha256 TEXT
    CHECK (artifact_digest_sha256 IS NULL OR length(artifact_digest_sha256) = 64),
  artifact_byte_length INTEGER
    CHECK (artifact_byte_length IS NULL OR artifact_byte_length >= 0),
  deleted_counts_json TEXT,
  failure_code TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (request_type, request_id)
);

CREATE INDEX IF NOT EXISTS idx_live_lgpd_worker_claim
  ON live_lgpd_worker_jobs(status, lease_until, created_at);
CREATE INDEX IF NOT EXISTS idx_live_lgpd_worker_clinic
  ON live_lgpd_worker_jobs(clinic_id, request_type, status, updated_at DESC);

-- O ledger só pode apontar para uma request real do mesmo tenant.
CREATE TRIGGER IF NOT EXISTS trg_lgpd_worker_export_request_tenant_insert
BEFORE INSERT ON live_lgpd_worker_jobs
WHEN NEW.request_type = 'export'
 AND NOT EXISTS (
   SELECT 1 FROM live_export_requests r
    WHERE r.id = NEW.request_id AND r.clinic_id = NEW.clinic_id
 )
BEGIN
  SELECT RAISE(ABORT, 'LGPD_WORKER_EXPORT_REQUEST_TENANT_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_lgpd_worker_delete_request_tenant_insert
BEFORE INSERT ON live_lgpd_worker_jobs
WHEN NEW.request_type = 'delete'
 AND NOT EXISTS (
   SELECT 1 FROM live_deletion_requests r
    WHERE r.id = NEW.request_id AND r.clinic_id = NEW.clinic_id
 )
BEGIN
  SELECT RAISE(ABORT, 'LGPD_WORKER_DELETE_REQUEST_TENANT_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_lgpd_worker_request_binding_immutable
BEFORE UPDATE OF request_type, request_id, clinic_id ON live_lgpd_worker_jobs
BEGIN
  SELECT RAISE(ABORT, 'LGPD_WORKER_REQUEST_BINDING_IMMUTABLE');
END;

-- Conclusão de export exige prova material mínima.
CREATE TRIGGER IF NOT EXISTS trg_lgpd_worker_export_completed_evidence
BEFORE UPDATE OF status ON live_lgpd_worker_jobs
WHEN NEW.request_type = 'export'
 AND NEW.status = 'completed'
 AND (
   NEW.artifact_key IS NULL OR length(trim(NEW.artifact_key)) = 0
   OR NEW.artifact_digest_sha256 IS NULL
   OR length(NEW.artifact_digest_sha256) <> 64
   OR NEW.artifact_byte_length IS NULL
   OR NEW.artifact_byte_length <= 0
 )
BEGIN
  SELECT RAISE(ABORT, 'LGPD_EXPORT_COMPLETION_EVIDENCE_REQUIRED');
END;

-- Conclusão de eliminação exige pelo menos a prova metadata-only das contagens.
CREATE TRIGGER IF NOT EXISTS trg_lgpd_worker_delete_completed_evidence
BEFORE UPDATE OF status ON live_lgpd_worker_jobs
WHEN NEW.request_type = 'delete'
 AND NEW.status = 'completed'
 AND (
   NEW.deleted_counts_json IS NULL
   OR length(trim(NEW.deleted_counts_json)) = 0
   OR json_valid(NEW.deleted_counts_json) = 0
 )
BEGIN
  SELECT RAISE(ABORT, 'LGPD_DELETE_COMPLETION_EVIDENCE_REQUIRED');
END;

-- Mesmo que algum handler futuro contorne o middleware HTTP, o banco não aceita
-- request `completed` sem um job do mesmo tenant já concluído com evidência.
CREATE TRIGGER IF NOT EXISTS trg_live_export_completed_requires_worker
BEFORE UPDATE OF status ON live_export_requests
WHEN NEW.status = 'completed'
 AND OLD.status <> 'completed'
 AND NOT EXISTS (
   SELECT 1 FROM live_lgpd_worker_jobs j
    WHERE j.request_type = 'export'
      AND j.request_id = NEW.id
      AND j.clinic_id = NEW.clinic_id
      AND j.status = 'completed'
      AND j.artifact_key IS NOT NULL
      AND j.artifact_digest_sha256 IS NOT NULL
      AND length(j.artifact_digest_sha256) = 64
      AND j.artifact_byte_length > 0
 )
BEGIN
  SELECT RAISE(ABORT, 'LGPD_EXPORT_PHYSICAL_PROOF_REQUIRED');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_delete_completed_requires_worker
BEFORE UPDATE OF status ON live_deletion_requests
WHEN NEW.status = 'completed'
 AND OLD.status <> 'completed'
 AND NOT EXISTS (
   SELECT 1 FROM live_lgpd_worker_jobs j
    WHERE j.request_type = 'delete'
      AND j.request_id = NEW.id
      AND j.clinic_id = NEW.clinic_id
      AND j.status = 'completed'
      AND j.deleted_counts_json IS NOT NULL
      AND json_valid(j.deleted_counts_json) = 1
 )
BEGIN
  SELECT RAISE(ABORT, 'LGPD_DELETE_PHYSICAL_PROOF_REQUIRED');
END;
