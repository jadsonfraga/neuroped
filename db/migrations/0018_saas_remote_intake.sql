-- NeuroPed SaaS — Remote Intake v1.
--
-- Fronteira de confiança:
-- 1. família/escola/terapeuta não recebem membership da clínica;
-- 2. o bearer secret nunca é persistido, apenas blind index por clínica;
-- 3. respostas, identidade do respondente e vínculo informado ficam cifrados;
-- 4. submissão externa não vira achado clínico automaticamente;
-- 5. somente revisão profissional explícita promove a submissão para o Clinical Core.

CREATE TABLE IF NOT EXISTS live_intake_invitations (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE CASCADE,
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  respondent_kind TEXT NOT NULL CHECK (respondent_kind IN ('family','school','therapist','patient')),
  form_kind TEXT NOT NULL CHECK (form_kind IN ('pre_consulta','pre_retorno','school_report')),
  form_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','revoked')),
  expires_at DATETIME NOT NULL,
  submitted_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (clinic_id, token_hash)
);
CREATE INDEX IF NOT EXISTS idx_live_intake_invitation_patient
  ON live_intake_invitations(clinic_id, patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_intake_invitation_status
  ON live_intake_invitations(clinic_id, status, expires_at);

CREATE TABLE IF NOT EXISTS live_intake_submissions (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL UNIQUE REFERENCES live_intake_invitations(id) ON DELETE CASCADE,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE CASCADE,
  respondent_kind TEXT NOT NULL CHECK (respondent_kind IN ('family','school','therapist','patient')),
  form_kind TEXT NOT NULL CHECK (form_kind IN ('pre_consulta','pre_retorno','school_report')),
  form_id TEXT NOT NULL,
  payload_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL,
  consent_notice_version TEXT NOT NULL,
  consented_at DATETIME NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','accepted','rejected')),
  reviewed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at DATETIME,
  clinical_event_id TEXT,
  submitted_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_live_intake_submission_patient
  ON live_intake_submissions(clinic_id, patient_id, review_status, submitted_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_live_intake_submission_event
  ON live_intake_submissions(clinical_event_id)
  WHERE clinical_event_id IS NOT NULL;

-- A submissão precisa carregar exatamente o mesmo tenant/paciente/taxonomias do convite.
CREATE TRIGGER IF NOT EXISTS trg_live_intake_submission_matches_invitation
BEFORE INSERT ON live_intake_submissions
WHEN NOT EXISTS (
  SELECT 1
    FROM live_intake_invitations invitation
   WHERE invitation.id = NEW.invitation_id
     AND invitation.clinic_id = NEW.clinic_id
     AND invitation.patient_id = NEW.patient_id
     AND invitation.respondent_kind = NEW.respondent_kind
     AND invitation.form_kind = NEW.form_kind
     AND invitation.form_id = NEW.form_id
)
BEGIN
  SELECT RAISE(ABORT, 'INTAKE_INVITATION_MISMATCH');
END;
