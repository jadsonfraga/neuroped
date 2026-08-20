CREATE TABLE IF NOT EXISTS clinical_memory_notes_demo (
  id TEXT PRIMARY KEY,
  patient_id TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  source TEXT,
  tags TEXT,
  author_user_id TEXT,
  is_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(patient_id) REFERENCES patients_demo(id) ON DELETE CASCADE,
  FOREIGN KEY(author_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_clinical_memory_patient_updated
  ON clinical_memory_notes_demo(patient_id, updated_at DESC);
