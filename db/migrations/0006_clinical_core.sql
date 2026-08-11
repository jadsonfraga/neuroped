-- NeuroPed Clinical Core — ledger clínico longitudinal estruturado.
-- Produção Cloudflare continua restrita a dados fictícios: patient_id referencia
-- exclusivamente patients_demo e is_demo permanece fisicamente travado em 1.

CREATE TABLE IF NOT EXISTS clinical_events_demo (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients_demo(id) ON DELETE CASCADE,
  author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'encounter', 'problem', 'medication', 'observation', 'plan', 'outcome', 'safety'
  )),
  occurred_at DATETIME NOT NULL,
  encounter_id TEXT,
  provenance_kind TEXT NOT NULL CHECK (provenance_kind IN (
    'reported', 'observed', 'measured', 'documented', 'inferred', 'decision'
  )),
  provenance_source TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  supersedes_event_id TEXT REFERENCES clinical_events_demo(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'corrected', 'voided')),
  is_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clinical_events_demo_patient_time
  ON clinical_events_demo(patient_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_events_demo_type
  ON clinical_events_demo(patient_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_events_demo_encounter
  ON clinical_events_demo(encounter_id);
CREATE INDEX IF NOT EXISTS idx_clinical_events_demo_supersedes
  ON clinical_events_demo(supersedes_event_id);

CREATE TRIGGER IF NOT EXISTS trg_clinical_events_demo_active_supersession
BEFORE INSERT ON clinical_events_demo
WHEN NEW.supersedes_event_id IS NOT NULL
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM clinical_events_demo
     WHERE id = NEW.supersedes_event_id
       AND patient_id = NEW.patient_id
       AND is_demo = 1
       AND status = 'active'
  ) THEN RAISE(ABORT, 'STALE_SUPERSESSION') END;
END;
