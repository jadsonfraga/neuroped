-- NeuroPed SaaS Phase 1 — tenant foundation + Clinical Core LIVE.
--
-- Segurança por desenho:
-- 1. dados clínicos LIVE nunca reutilizam as tabelas *_demo;
-- 2. toda linha clínica LIVE pertence obrigatoriamente a uma clínica;
-- 3. PII/PHI fica somente em payload cifrado pela aplicação;
-- 4. roles SaaS ficam em memberships, sem transformar o role global em bypass;
-- 5. auditoria SaaS não armazena conteúdo clínico.

CREATE TABLE IF NOT EXISTS clinics (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  legal_name TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Recife',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(status, created_at);

CREATE TABLE IF NOT EXISTS clinic_memberships (
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','clinic_admin','professional','assistant','financial')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (clinic_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_clinic_memberships_user_active
  ON clinic_memberships(user_id, active, clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_memberships_clinic_role
  ON clinic_memberships(clinic_id, active, role, user_id);

CREATE TABLE IF NOT EXISTS live_patients (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  primary_professional_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  external_reference_hash TEXT,
  patient_identity_hash TEXT,
  profile_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL DEFAULT 'clinical-v1',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','merged')),
  merged_into_patient_id TEXT REFERENCES live_patients(id) ON DELETE SET NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_live_patients_clinic_status
  ON live_patients(clinic_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_patients_clinic_professional
  ON live_patients(clinic_id, primary_professional_user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS ux_live_patients_external_reference
  ON live_patients(clinic_id, external_reference_hash)
  WHERE external_reference_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_patients_identity_hash
  ON live_patients(clinic_id, patient_identity_hash)
  WHERE patient_identity_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS live_clinical_events (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'encounter','problem','medication','observation','plan','outcome','safety','document','scale_result'
  )),
  occurred_at DATETIME NOT NULL,
  encounter_id TEXT,
  provenance_kind TEXT NOT NULL CHECK (provenance_kind IN (
    'reported','observed','measured','documented','inferred','decision','imported'
  )),
  provenance_source TEXT NOT NULL,
  payload_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL DEFAULT 'clinical-v1',
  source_record_hash TEXT,
  supersedes_event_id TEXT REFERENCES live_clinical_events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','corrected','voided')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_live_clinical_events_clinic_patient_time
  ON live_clinical_events(clinic_id, patient_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_clinical_events_clinic_type
  ON live_clinical_events(clinic_id, patient_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_clinical_events_encounter
  ON live_clinical_events(clinic_id, encounter_id);
CREATE INDEX IF NOT EXISTS idx_live_clinical_events_supersedes
  ON live_clinical_events(supersedes_event_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_live_clinical_events_source_record
  ON live_clinical_events(clinic_id, provenance_source, source_record_hash)
  WHERE source_record_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS saas_audit_log (
  id TEXT PRIMARY KEY,
  clinic_id TEXT REFERENCES clinics(id) ON DELETE SET NULL,
  actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata_json TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_saas_audit_clinic_time
  ON saas_audit_log(clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saas_audit_actor_time
  ON saas_audit_log(actor_user_id, created_at DESC);
