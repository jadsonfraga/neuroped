-- NeuroPed SaaS — memória compartilhada de clínica/secretaria.
-- Conteúdo e metadados sensíveis ficam cifrados; tokens de busca são HMAC cegos.
-- Não usar esta tabela para substituir eventos clínicos longitudinais do paciente.

CREATE TABLE IF NOT EXISTS live_clinic_memory (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('clinic','patient','appointment')),
  kind TEXT NOT NULL CHECK (kind IN ('operational','clinical')),
  patient_id TEXT REFERENCES live_patients(id) ON DELETE CASCADE,
  appointment_id TEXT,
  author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL DEFAULT 'clinical-v1',
  client_request_id TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((scope = 'clinic' AND patient_id IS NULL AND appointment_id IS NULL)
      OR (scope = 'patient' AND patient_id IS NOT NULL)
      OR (scope = 'appointment' AND appointment_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_live_clinic_memory_scope_time
  ON live_clinic_memory(clinic_id, scope, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_clinic_memory_patient_time
  ON live_clinic_memory(clinic_id, patient_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_clinic_memory_appointment_time
  ON live_clinic_memory(clinic_id, appointment_id, status, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_live_clinic_memory_request
  ON live_clinic_memory(clinic_id, author_user_id, client_request_id);

CREATE TABLE IF NOT EXISTS live_clinic_memory_terms (
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  memory_id TEXT NOT NULL REFERENCES live_clinic_memory(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  PRIMARY KEY (clinic_id, memory_id, token_hash)
);

CREATE INDEX IF NOT EXISTS idx_live_clinic_memory_terms_lookup
  ON live_clinic_memory_terms(clinic_id, token_hash, memory_id);

CREATE TABLE IF NOT EXISTS live_clinic_memory_audit (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  memory_id TEXT NOT NULL REFERENCES live_clinic_memory(id) ON DELETE CASCADE,
  actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('created','updated','archived','restored')),
  revision INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_clinic_memory_audit_memory
  ON live_clinic_memory_audit(clinic_id, memory_id, created_at DESC);
