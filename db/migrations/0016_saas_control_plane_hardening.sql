-- NeuroPed SaaS — control plane tenant-aware para as 20 áreas.
-- Esta migration não armazena PHI: somente estado de configuração operacional.
-- Mutações clínicas continuam nos domínios LIVE canônicos.

CREATE TABLE IF NOT EXISTS saas_module_settings (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL CHECK (module_id IN (
    'workspace','entitlements','onboarding','access','white-label',
    'observability','continuity','privacy','messaging','documents',
    'reminders','intake','network','school-family','tasks','analytics',
    'catalog','playbooks','interoperability','developer'
  )),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0),
  config_json TEXT CHECK (config_json IS NULL OR length(config_json) <= 8000),
  updated_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (clinic_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_saas_module_settings_clinic
  ON saas_module_settings(clinic_id, module_id);

CREATE TRIGGER IF NOT EXISTS trg_saas_module_settings_tenant_immutable
BEFORE UPDATE OF clinic_id, module_id ON saas_module_settings
WHEN NEW.clinic_id <> OLD.clinic_id OR NEW.module_id <> OLD.module_id
BEGIN
  SELECT RAISE(ABORT, 'SAAS_MODULE_SETTING_SCOPE_IMMUTABLE');
END;

CREATE TRIGGER IF NOT EXISTS trg_saas_module_settings_version_non_decreasing
BEFORE UPDATE OF version ON saas_module_settings
WHEN NEW.version <> OLD.version + 1
BEGIN
  SELECT RAISE(ABORT, 'SAAS_MODULE_SETTING_VERSION_CONFLICT');
END;

-- Blind search tokens: valores HMAC por clínica e campo, sem nome/telefone em claro.
CREATE TABLE IF NOT EXISTS live_patient_search_tokens (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE CASCADE,
  field TEXT NOT NULL CHECK (field IN ('name', 'guardian_name', 'external_reference')),
  token TEXT NOT NULL CHECK (length(token) = 64),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (clinic_id, patient_id, field, token)
);

CREATE INDEX IF NOT EXISTS idx_live_patient_search_tokens_lookup
  ON live_patient_search_tokens(clinic_id, field, token, patient_id);

CREATE TRIGGER IF NOT EXISTS trg_live_patient_search_tokens_tenant_insert
BEFORE INSERT ON live_patient_search_tokens
WHEN NOT EXISTS (
  SELECT 1 FROM live_patients p
   WHERE p.id = NEW.patient_id AND p.clinic_id = NEW.clinic_id
)
BEGIN
  SELECT RAISE(ABORT, 'LIVE_PATIENT_SEARCH_TOKEN_TENANT_MISMATCH');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_patient_search_tokens_tenant_update
BEFORE UPDATE OF clinic_id, patient_id ON live_patient_search_tokens
WHEN NEW.clinic_id <> OLD.clinic_id OR NEW.patient_id <> OLD.patient_id
BEGIN
  SELECT RAISE(ABORT, 'LIVE_PATIENT_SEARCH_TOKEN_SCOPE_IMMUTABLE');
END;

CREATE INDEX IF NOT EXISTS idx_live_patients_clinic_status_created_id
  ON live_patients(clinic_id, status, created_at DESC, id DESC);

-- Evidência técnica de backup/restore. O sistema registra a prova fornecida pelo
-- operador/provedor; não finge executar o backup dentro da API clínica.
CREATE TABLE IF NOT EXISTS saas_backup_evidence (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (length(provider) BETWEEN 2 AND 80),
  snapshot_digest_sha256 TEXT NOT NULL CHECK (length(snapshot_digest_sha256) = 64),
  status TEXT NOT NULL CHECK (status IN ('recorded', 'verified', 'failed')),
  rpo_minutes INTEGER NOT NULL CHECK (rpo_minutes BETWEEN 0 AND 10080),
  rto_minutes INTEGER NOT NULL CHECK (rto_minutes BETWEEN 0 AND 10080),
  restore_verified_at DATETIME,
  recorded_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (status <> 'verified' OR restore_verified_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_saas_backup_evidence_clinic_time
  ON saas_backup_evidence(clinic_id, created_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_saas_backup_evidence_tenant_immutable
BEFORE UPDATE OF clinic_id ON saas_backup_evidence
WHEN NEW.clinic_id <> OLD.clinic_id
BEGIN
  SELECT RAISE(ABORT, 'SAAS_BACKUP_EVIDENCE_SCOPE_IMMUTABLE');
END;
