CREATE TABLE IF NOT EXISTS saas_incident_events (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  component TEXT NOT NULL CHECK (component IN ('auth', 'tenant', 'keyring', 'migration', 'backup', 'integration', 'privacy', 'frontend')),
  code TEXT NOT NULL CHECK (length(code) BETWEEN 3 AND 80),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'acknowledged', 'resolved')),
  correlation_id TEXT NOT NULL CHECK (length(correlation_id) BETWEEN 8 AND 96),
  metadata_json TEXT NOT NULL CHECK (length(metadata_json) <= 2000),
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saas_incident_events_clinic_time
  ON saas_incident_events(clinic_id, created_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_saas_incident_events_scope_immutable
BEFORE UPDATE OF clinic_id, component, code, correlation_id ON saas_incident_events
WHEN NEW.clinic_id <> OLD.clinic_id OR NEW.component <> OLD.component OR NEW.code <> OLD.code OR NEW.correlation_id <> OLD.correlation_id
BEGIN
  SELECT RAISE(ABORT, 'SAAS_INCIDENT_SCOPE_IMMUTABLE');
END;

CREATE TRIGGER IF NOT EXISTS trg_saas_incident_events_append_only_delete
BEFORE DELETE ON saas_incident_events
BEGIN
  SELECT RAISE(ABORT, 'SAAS_INCIDENT_APPEND_ONLY');
END;
