-- NeuroPed Conecta — eventos longitudinais no backend D1 de demonstração.
-- A tabela referencia exclusivamente patients_demo e força is_demo = 1 para
-- impedir qualquer mistura acidental com dados reais.

CREATE TABLE IF NOT EXISTS conecta_events_demo (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients_demo(id) ON DELETE CASCADE,
  author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  occurred_at DATETIME NOT NULL,
  context TEXT,
  value INTEGER CHECK (value IS NULL OR (value BETWEEN 1 AND 5)),
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR (duration_minutes BETWEEN 0 AND 10080)),
  payload_json TEXT,
  is_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conecta_events_demo_patient_time
  ON conecta_events_demo(patient_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_conecta_events_demo_category
  ON conecta_events_demo(category);
