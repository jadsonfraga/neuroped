-- NeuroPed -- Schema D1 (Cloudflare D1 / SQLite) -- versao "wrangler-safe"
-- ASCII puro, sem comentarios inline, sem triggers e sem FTS5, para evitar
-- problemas do splitter de statements do `wrangler d1 execute --file`.
--
-- ATENCAO: este arquivo RECONSTROI o schema (DROP + CREATE). E seguro no
-- provisionamento inicial (apenas dados demo, is_demo=1). NAO rode em producao
-- com dados reais -- nesse caso use migracoes aditivas.
--
-- Tabelas identicas as usadas pelas functions/api/*. Extras (triggers de
-- updated_at, FTS5 de memory_notes) ficam em db/schema.sql.

DROP TABLE IF EXISTS consultations_demo;
DROP TABLE IF EXISTS scale_results_demo;
DROP TABLE IF EXISTS documents_demo;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS memory_notes;
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS patients_demo;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
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
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE patients_demo (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
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
CREATE INDEX idx_patients_demo_name ON patients_demo(name);

CREATE TABLE consultations_demo (
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
CREATE INDEX idx_consultations_demo_patient ON consultations_demo(patient_id);
CREATE INDEX idx_consultations_demo_date ON consultations_demo(date);

CREATE TABLE scale_results_demo (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  patient_id TEXT NOT NULL,
  scale_id TEXT NOT NULL,
  scale_name TEXT NOT NULL,
  score REAL,
  interpretation TEXT,
  details TEXT,
  is_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_scale_results_patient ON scale_results_demo(patient_id);
CREATE INDEX idx_scale_results_scale_id ON scale_results_demo(scale_id);

CREATE TABLE documents_demo (
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
CREATE INDEX idx_documents_demo_patient ON documents_demo(patient_id);
CREATE INDEX idx_documents_demo_type ON documents_demo(type);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  user_id TEXT,
  ip TEXT,
  details TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

CREATE TABLE memory_notes (
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
CREATE INDEX idx_memory_notes_category ON memory_notes(category);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app.version', '2.0.0');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app.mode', 'demo');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app.lgpd.version', '1.0');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app.schema.version', '2026-05-08');
