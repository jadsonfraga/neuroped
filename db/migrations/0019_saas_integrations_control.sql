-- Control plane de integrações: guarda postura e referência externa, nunca o segredo.
CREATE TABLE IF NOT EXISTS saas_integration_connections (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  integration_id TEXT NOT NULL CHECK (integration_id IN ('email','webhooks','fhir','object-storage','observability')),
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','connected','paused','revoked')),
  scopes_json TEXT NOT NULL CHECK (length(scopes_json) <= 1200),
  credential_ref TEXT CHECK (credential_ref IS NULL OR length(credential_ref) BETWEEN 8 AND 255),
  endpoint_hash TEXT CHECK (endpoint_hash IS NULL OR length(endpoint_hash) = 64),
  last_verified_at DATETIME,
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (clinic_id, integration_id, environment)
);

CREATE INDEX IF NOT EXISTS idx_saas_integrations_clinic_status
  ON saas_integration_connections(clinic_id, status, integration_id);

CREATE TRIGGER IF NOT EXISTS trg_saas_integrations_scope_immutable
BEFORE UPDATE OF clinic_id, integration_id, environment ON saas_integration_connections
WHEN NEW.clinic_id <> OLD.clinic_id
  OR NEW.integration_id <> OLD.integration_id
  OR NEW.environment <> OLD.environment
BEGIN
  SELECT RAISE(ABORT, 'SAAS_INTEGRATION_SCOPE_IMMUTABLE');
END;

CREATE TRIGGER IF NOT EXISTS trg_saas_integrations_version
BEFORE UPDATE OF version ON saas_integration_connections
WHEN NEW.version <> OLD.version + 1
BEGIN
  SELECT RAISE(ABORT, 'SAAS_INTEGRATION_VERSION_CONFLICT');
END;
