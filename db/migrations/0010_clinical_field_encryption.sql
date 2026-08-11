-- NeuroPed — criptografia clínica em repouso, fase aditiva.
-- A aplicação cifra os payloads com AES-256-GCM; esta migração cria somente
-- metadados não sensíveis e o índice cego HMAC. Nenhum dado é apagado aqui.

CREATE TABLE IF NOT EXISTS clinical_search_tokens (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_scope TEXT NOT NULL,
  key_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entity_type, entity_id, field_scope, key_id, token_hash)
);

CREATE INDEX IF NOT EXISTS idx_clinical_search_lookup
  ON clinical_search_tokens(entity_type, field_scope, key_id, token_hash, entity_id);

CREATE INDEX IF NOT EXISTS idx_clinical_search_entity
  ON clinical_search_tokens(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS clinical_crypto_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO clinical_crypto_state (key, value, updated_at)
VALUES ('schema_version', '1', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;

-- FTS5 replica conteúdo clínico em texto aberto. A busca passa a usar
-- clinical_search_tokens e descriptografia em memória autorizada.
DROP TRIGGER IF EXISTS memory_notes_ai;
DROP TRIGGER IF EXISTS memory_notes_ad;
DROP TRIGGER IF EXISTS memory_notes_au;
DROP TABLE IF EXISTS memory_notes_fts;
