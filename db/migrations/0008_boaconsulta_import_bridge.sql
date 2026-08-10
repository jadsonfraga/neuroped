-- BoaConsulta Bridge — staging seguro e idempotente para importações externas.
--
-- Regras:
-- 1. Nenhum dado clínico bruto ou nome de arquivo é salvo em texto claro.
-- 2. O arquivo original é dividido em chunks e cifrado com AES-GCM antes de persistir no D1.
-- 3. Registros estruturados ficam cifrados individualmente com AES-GCM.
-- 4. A mesma exportação não pode ser importada duas vezes pelo mesmo proprietário.
-- 5. A promoção para o prontuário/Clinical Core é deliberadamente separada do staging.

CREATE TABLE IF NOT EXISTS external_import_batches (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_system TEXT NOT NULL CHECK (source_system IN ('boaconsulta')),
  source_filename_ciphertext TEXT NOT NULL,
  source_filename_iv TEXT NOT NULL,
  source_extension TEXT,
  source_mime_type TEXT NOT NULL,
  source_size_bytes INTEGER NOT NULL CHECK (source_size_bytes >= 0),
  source_sha256 TEXT NOT NULL,
  source_storage TEXT NOT NULL DEFAULT 'd1_chunks' CHECK (source_storage IN ('d1_chunks')),
  source_chunk_count INTEGER NOT NULL DEFAULT 0 CHECK (source_chunk_count >= 0),
  mapping_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'staged' CHECK (
    status IN ('staged', 'needs_review', 'ready', 'imported', 'failed')
  ),
  record_count INTEGER NOT NULL DEFAULT 0 CHECK (record_count >= 0),
  duplicate_count INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_count >= 0),
  warning_count INTEGER NOT NULL DEFAULT 0 CHECK (warning_count >= 0),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  UNIQUE (owner_user_id, source_system, source_sha256)
);

CREATE INDEX IF NOT EXISTS idx_external_import_batches_owner_created
  ON external_import_batches(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_import_batches_status
  ON external_import_batches(owner_user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS external_import_file_chunks (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES external_import_batches(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  plaintext_bytes INTEGER NOT NULL CHECK (plaintext_bytes > 0),
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  cipher_version INTEGER NOT NULL DEFAULT 1 CHECK (cipher_version = 1),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (batch_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_external_import_file_chunks_batch
  ON external_import_file_chunks(batch_id, chunk_index);

CREATE TABLE IF NOT EXISTS external_import_records (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES external_import_batches(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  record_type TEXT NOT NULL CHECK (
    record_type IN ('patient', 'encounter', 'document', 'unknown')
  ),
  source_record_hash TEXT NOT NULL,
  external_patient_key_hash TEXT,
  raw_ciphertext TEXT NOT NULL,
  raw_iv TEXT NOT NULL,
  normalized_ciphertext TEXT NOT NULL,
  normalized_iv TEXT NOT NULL,
  cipher_version INTEGER NOT NULL DEFAULT 1 CHECK (cipher_version = 1),
  status TEXT NOT NULL DEFAULT 'staged' CHECK (
    status IN ('staged', 'mapped', 'duplicate', 'needs_review', 'imported', 'failed')
  ),
  target_patient_id TEXT,
  target_event_ids TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (batch_id, source_record_hash)
);

CREATE INDEX IF NOT EXISTS idx_external_import_records_batch_ordinal
  ON external_import_records(batch_id, ordinal);
CREATE INDEX IF NOT EXISTS idx_external_import_records_patient_key
  ON external_import_records(external_patient_key_hash);
CREATE INDEX IF NOT EXISTS idx_external_import_records_status
  ON external_import_records(batch_id, status);
