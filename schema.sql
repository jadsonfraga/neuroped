-- NeuroPed EDJ — Schema D1 / SQLite compatible
-- Mínimo de dados pessoais: somente códigos operacionais e respostas estruturadas (LGPD)

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_code TEXT,
  patient_code TEXT,
  instrument_id TEXT NOT NULL,
  instrument_title TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  raw_score INTEGER,
  total_items INTEGER,
  source_page TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_submissions_case   ON submissions (case_code);
CREATE INDEX IF NOT EXISTS idx_submissions_inst   ON submissions (instrument_id);
CREATE INDEX IF NOT EXISTS idx_submissions_when   ON submissions (created_at);

CREATE TABLE IF NOT EXISTS consultas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente TEXT,
  idade TEXT,
  queixa TEXT,
  responsavel TEXT,
  hpma TEXT,
  conduta TEXT,
  source_page TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT,
  tipo TEXT,
  titulo TEXT,
  texto TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS family_passes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  family_label TEXT,
  status TEXT DEFAULT 'active',
  usage_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
