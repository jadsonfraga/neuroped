CREATE TABLE IF NOT EXISTS saas_webhook_deliveries (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  integration_id TEXT NOT NULL CHECK (integration_id = 'webhooks'),
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  delivery_id TEXT NOT NULL CHECK (length(delivery_id) BETWEEN 16 AND 128),
  event_type TEXT NOT NULL CHECK (length(event_type) BETWEEN 3 AND 120),
  payload_digest_sha256 TEXT NOT NULL CHECK (length(payload_digest_sha256) = 64),
  signature TEXT NOT NULL CHECK (length(signature) BETWEEN 32 AND 256),
  status TEXT NOT NULL CHECK (status IN ('queued', 'delivered', 'failed', 'replayed')),
  response_code INTEGER,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 100),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_attempt_at DATETIME,
  UNIQUE (clinic_id, integration_id, delivery_id)
);

CREATE INDEX IF NOT EXISTS idx_saas_webhook_deliveries_clinic_time
  ON saas_webhook_deliveries(clinic_id, created_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_saas_webhook_deliveries_scope_immutable
BEFORE UPDATE OF clinic_id, integration_id, environment, delivery_id ON saas_webhook_deliveries
WHEN NEW.clinic_id <> OLD.clinic_id OR NEW.integration_id <> OLD.integration_id OR NEW.environment <> OLD.environment OR NEW.delivery_id <> OLD.delivery_id
BEGIN
  SELECT RAISE(ABORT, 'SAAS_WEBHOOK_SCOPE_IMMUTABLE');
END;

CREATE TRIGGER IF NOT EXISTS trg_saas_webhook_deliveries_append_only_delete
BEFORE DELETE ON saas_webhook_deliveries
BEGIN
  SELECT RAISE(ABORT, 'SAAS_WEBHOOK_APPEND_ONLY');
END;
