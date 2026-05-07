CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  case_code TEXT,
  patient_code TEXT,
  instrument_id TEXT NOT NULL,
  instrument_title TEXT,
  instrument_group TEXT,
  answers_json TEXT NOT NULL,
  raw_score INTEGER,
  total_items INTEGER,
  source_page TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_submissions_case_code
ON submissions(case_code);

CREATE INDEX IF NOT EXISTS idx_submissions_instrument_id
ON submissions(instrument_id);

CREATE INDEX IF NOT EXISTS idx_submissions_created_at
ON submissions(created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  metadata_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON audit_logs(created_at);
