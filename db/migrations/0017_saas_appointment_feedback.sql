-- NeuroPed SaaS — Appointment Feedback (NPS & Ratings)
--
-- Coleta de feedback pós-consulta: rating (1-5), NPS (0-10), comentários
-- Sentiment é calculado automaticamente baseado em NPS/rating

CREATE TABLE IF NOT EXISTS appointment_feedback (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL UNIQUE,
  clinic_id TEXT NOT NULL,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  nps_score INTEGER CHECK (nps_score IS NULL OR (nps_score >= 0 AND nps_score <= 10)),
  comment TEXT,
  sentiment TEXT CHECK (
    sentiment IS NULL OR sentiment IN ('positive', 'neutral', 'negative')
  ),
  sent_at TEXT,
  responded_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_feedback_appointment
  ON appointment_feedback(appointment_id);

CREATE INDEX IF NOT EXISTS idx_feedback_clinic
  ON appointment_feedback(clinic_id);

CREATE INDEX IF NOT EXISTS idx_feedback_clinic_date
  ON appointment_feedback(clinic_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_responded
  ON appointment_feedback(responded_at);

-- Nota: Sentiment é calculado em application-level logic baseado em NPS/rating
-- NPS: 9-10 = promoters (positive), 7-8 = passives (neutral), 0-6 = detractors (negative)
-- Rating: 4-5 = positive, 3 = neutral, 1-2 = negative
