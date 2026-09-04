-- NeuroPed SaaS — Encaminhamento remoto de escalas para a família responder
-- em casa (fora da clínica), pelo mesmo mecanismo do Remote Intake (0018).
--
-- Fronteira de confiança:
-- 1. família nunca recebe membership da clínica, login ou PIN;
-- 2. o bearer secret nunca é persistido, apenas blind index por clínica;
-- 3. respostas ficam cifradas; a família NUNCA vê pontuação/interpretação —
--    só o profissional, ao revisar dentro do prontuário;
-- 4. scale_id é restrito por CHECK a uma allowlist explícita (mesma allowlist
--    de shared/remoteScaleCatalog.ts) — nunca um id livre/arbitrário. Escalas
--    clínico-administradas ou de rastreio ativo de risco de suicídio nunca
--    entram nesta lista;
-- 5. submissão externa não gera conduta clínica automática — revisão humana.

CREATE TABLE IF NOT EXISTS live_scale_invitations (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE CASCADE,
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  respondent_kind TEXT NOT NULL CHECK (respondent_kind IN ('family','patient')),
  scale_id TEXT NOT NULL CHECK (scale_id IN ('mchat','q-chat-10','psc17','ari','gad7ped','smfq')),
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','revoked')),
  expires_at DATETIME NOT NULL,
  submitted_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (clinic_id, token_hash)
);
CREATE INDEX IF NOT EXISTS idx_live_scale_invitation_patient
  ON live_scale_invitations(clinic_id, patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_scale_invitation_status
  ON live_scale_invitations(clinic_id, status, expires_at);

CREATE TABLE IF NOT EXISTS live_scale_responses (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL UNIQUE REFERENCES live_scale_invitations(id) ON DELETE CASCADE,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE CASCADE,
  respondent_kind TEXT NOT NULL CHECK (respondent_kind IN ('family','patient')),
  scale_id TEXT NOT NULL CHECK (scale_id IN ('mchat','q-chat-10','psc17','ari','gad7ped','smfq')),
  answers_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL,
  consent_notice_version TEXT NOT NULL,
  consented_at DATETIME NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','reviewed')),
  reviewed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at DATETIME,
  submitted_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_live_scale_response_patient
  ON live_scale_responses(clinic_id, patient_id, review_status, submitted_at DESC);

-- A resposta precisa carregar exatamente o mesmo tenant/paciente/escala do convite.
CREATE TRIGGER IF NOT EXISTS trg_live_scale_response_matches_invitation
BEFORE INSERT ON live_scale_responses
WHEN NOT EXISTS (
  SELECT 1
    FROM live_scale_invitations invitation
   WHERE invitation.id = NEW.invitation_id
     AND invitation.clinic_id = NEW.clinic_id
     AND invitation.patient_id = NEW.patient_id
     AND invitation.respondent_kind = NEW.respondent_kind
     AND invitation.scale_id = NEW.scale_id
)
BEGIN
  SELECT RAISE(ABORT, 'SCALE_INVITATION_MISMATCH');
END;
