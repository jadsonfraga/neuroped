-- Rate limit operacional por tenant e ação. Não armazena IP, e-mail, PHI ou payload.
CREATE TABLE IF NOT EXISTS saas_rate_limit_buckets (
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  bucket_key TEXT NOT NULL CHECK (length(bucket_key) BETWEEN 3 AND 80),
  window_started_at TEXT NOT NULL,
  window_expires_at TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (clinic_id, bucket_key)
);

CREATE INDEX IF NOT EXISTS idx_saas_rate_limit_expiry
  ON saas_rate_limit_buckets(window_expires_at);

CREATE TRIGGER IF NOT EXISTS trg_saas_rate_limit_scope_immutable
BEFORE UPDATE OF clinic_id, bucket_key ON saas_rate_limit_buckets
WHEN NEW.clinic_id <> OLD.clinic_id OR NEW.bucket_key <> OLD.bucket_key
BEGIN
  SELECT RAISE(ABORT, 'SAAS_RATE_LIMIT_SCOPE_IMMUTABLE');
END;
