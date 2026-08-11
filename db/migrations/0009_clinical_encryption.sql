-- NeuroPed — migração 0009: criptografia de campo clínica D1.
--
-- ALTER TABLE de colunas secure_payload_encrypted é aplicado pelo migrador
-- idempotente scripts/migrate-d1-clinical-encryption.mts, pois SQLite/D1 não
-- oferece ADD COLUMN IF NOT EXISTS de forma portável.

CREATE TABLE IF NOT EXISTS clinical_search_tokens (
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  patient_id TEXT,
  owner_user_id TEXT,
  token_hash TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (resource_type, resource_id, token_hash)
);

CREATE INDEX IF NOT EXISTS idx_clinical_search_tokens_lookup
  ON clinical_search_tokens(resource_type, token_hash, owner_user_id, resource_id);
CREATE INDEX IF NOT EXISTS idx_clinical_search_tokens_patient
  ON clinical_search_tokens(patient_id, resource_type);

CREATE TABLE IF NOT EXISTS clinical_encryption_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  envelope_version TEXT NOT NULL,
  key_id TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('dual_read', 'migrating', 'strict')),
  backup_sha256 TEXT,
  started_at DATETIME NOT NULL,
  migrated_at DATETIME,
  verified_at DATETIME,
  rollback_verified_at DATETIME,
  last_error TEXT
);
