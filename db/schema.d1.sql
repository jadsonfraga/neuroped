-- NeuroPed -- Schema D1 (Cloudflare D1 / SQLite) -- versao "wrangler-safe".
-- Idempotente e nao destrutivo: pode ser reaplicado sem apagar tabelas ou dados.
-- Alteracoes em tabelas existentes devem ser feitas por migracoes aditivas.
--
-- Tabelas identicas as usadas pelas functions/api/*. Extras (triggers de
-- updated_at, FTS5 de memory_notes) ficam em db/schema.sql.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  crm TEXT,
  specialty TEXT,
  pin_hash TEXT,
  -- Autenticação nominal (functions/api/auth, hash PBKDF2 via Web Crypto):
  password_hash TEXT,
  must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0, 1)),
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until DATETIME,
  last_login_at DATETIME,
  role TEXT NOT NULL DEFAULT 'professional' CHECK (role IN ('admin', 'professional', 'reader', 'operator')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS auth_refresh_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  parent_session_id TEXT REFERENCES auth_refresh_sessions(id) ON DELETE SET NULL,
  replaced_by_session_id TEXT REFERENCES auth_refresh_sessions(id) ON DELETE SET NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME,
  revoke_reason TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_user ON auth_refresh_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_family ON auth_refresh_sessions(family_id);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_expiry ON auth_refresh_sessions(expires_at);

CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (
    consent_type IN (
      'termo_uso',
      'politica_privacidade',
      'tratamento_dados_saude'
    )
  ),
  consent_version TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  granted INTEGER NOT NULL CHECK (granted IN (0, 1)),
  accepted_at DATETIME NOT NULL,
  legal_basis TEXT NOT NULL,
  purpose TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, consent_type, consent_version, accepted_at)
);
CREATE INDEX IF NOT EXISTS idx_consents_user_accepted ON consents(user_id, accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_consents_user_type ON consents(user_id, consent_type, accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_consents_batch ON consents(batch_id);

CREATE TABLE IF NOT EXISTS patients_demo (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  birth_date DATE,
  guardian_name TEXT,
  guardian_phone TEXT,
  diagnosis_code TEXT,
  notes TEXT,
  is_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_patients_demo_name ON patients_demo(name);

CREATE TABLE IF NOT EXISTS consultations_demo (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  patient_id TEXT NOT NULL REFERENCES patients_demo(id) ON DELETE CASCADE,
  date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  is_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_consultations_demo_patient ON consultations_demo(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_demo_date ON consultations_demo(date);

CREATE TABLE IF NOT EXISTS scale_results_demo (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  patient_id TEXT NOT NULL,
  scale_id TEXT NOT NULL,
  scale_name TEXT NOT NULL,
  score REAL,               -- coluna legada; novas gravações usam NULL
  interpretation TEXT,      -- coluna legada; novas gravações usam NULL
  details TEXT,             -- JSON com perguntas e respostas integrais
  is_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scale_results_patient ON scale_results_demo(patient_id);
CREATE INDEX IF NOT EXISTS idx_scale_results_scale_id ON scale_results_demo(scale_id);

CREATE TABLE IF NOT EXISTS documents_demo (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  patient_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('laudo', 'relatorio', 'encaminhamento', 'prescricao', 'atestado', 'orientacao')),
  title TEXT NOT NULL,
  content TEXT,
  is_family_visible INTEGER NOT NULL DEFAULT 0 CHECK (is_family_visible IN (0, 1)),
  is_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_documents_demo_patient ON documents_demo(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_demo_type ON documents_demo(type);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  user_id TEXT,
  ip TEXT,
  details TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS memory_notes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT,
  content TEXT NOT NULL,
  category TEXT,
  source TEXT,
  patient_id TEXT,
  tags TEXT,
  is_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_memory_notes_category ON memory_notes(category);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app.version', '2.0.0');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app.mode', 'demo');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app.lgpd.version', '1.0');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app.schema.version', '2026-05-08');

-- Memória persistente compartilhada da clínica e da secretaria (SaaS LIVE).
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
CREATE INDEX IF NOT EXISTS idx_live_clinic_memory_scope_time ON live_clinic_memory(clinic_id, scope, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_clinic_memory_patient_time ON live_clinic_memory(clinic_id, patient_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_clinic_memory_appointment_time ON live_clinic_memory(clinic_id, appointment_id, status, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_live_clinic_memory_request ON live_clinic_memory(clinic_id, author_user_id, client_request_id);

CREATE TABLE IF NOT EXISTS live_clinic_memory_terms (
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  memory_id TEXT NOT NULL REFERENCES live_clinic_memory(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  PRIMARY KEY (clinic_id, memory_id, token_hash)
);
CREATE INDEX IF NOT EXISTS idx_live_clinic_memory_terms_lookup ON live_clinic_memory_terms(clinic_id, token_hash, memory_id);

CREATE TABLE IF NOT EXISTS live_clinic_memory_audit (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  memory_id TEXT NOT NULL REFERENCES live_clinic_memory(id) ON DELETE CASCADE,
  actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('created','updated','archived','restored')),
  revision INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_live_clinic_memory_audit_memory ON live_clinic_memory_audit(clinic_id, memory_id, created_at DESC);
