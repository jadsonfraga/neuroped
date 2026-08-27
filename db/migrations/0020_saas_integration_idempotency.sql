-- Idempotência de mutações de integração: resposta operacional sem segredos ou PHI.
CREATE TABLE IF NOT EXISTS saas_integration_idempotency (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL CHECK (length(idempotency_key) BETWEEN 16 AND 128),
  request_hash TEXT NOT NULL CHECK (length(request_hash) = 64),
  response_json TEXT NOT NULL CHECK (length(response_json) <= 8000),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (clinic_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_saas_integration_idempotency_created
  ON saas_integration_idempotency(clinic_id, created_at);

CREATE TRIGGER IF NOT EXISTS trg_saas_integration_idempotency_scope_immutable
BEFORE UPDATE OF clinic_id, idempotency_key, request_hash, response_json ON saas_integration_idempotency
WHEN NEW.clinic_id <> OLD.clinic_id
  OR NEW.idempotency_key <> OLD.idempotency_key
  OR NEW.request_hash <> OLD.request_hash
  OR NEW.response_json <> OLD.response_json
BEGIN
  SELECT RAISE(ABORT, 'SAAS_IDEMPOTENCY_IMMUTABLE');
END;

CREATE TRIGGER IF NOT EXISTS trg_saas_integration_idempotency_append_only
BEFORE DELETE ON saas_integration_idempotency
BEGIN
  SELECT RAISE(ABORT, 'SAAS_IDEMPOTENCY_APPEND_ONLY');
END;
