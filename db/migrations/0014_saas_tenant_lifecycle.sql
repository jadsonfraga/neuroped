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
