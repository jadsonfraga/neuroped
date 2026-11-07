-- 0039 — Diários de acompanhamento no Clinical LIVE (sono, alimentar, aderência,
-- desregulação, dieta sensorial e escolar), por clínica e por paciente.
-- Aditiva: só cria tabela, índices e gatilhos novos com IF NOT EXISTS; não lê
-- nem altera dado existente. Conteúdo relatado fica cifrado por clínica
-- (payload_encrypted); colunas em claro são só metadados estruturados.
-- Registro observacional: não pontua, não interpreta, não é escala.
-- Correção por sucessão (append-only): a linha antiga vira 'corrected' e a nova
-- aponta para ela; anular marca 'voided'. O conteúdo nunca é reescrito.
-- Rollback (manual, após revisão e backup):
--   DROP TRIGGER IF EXISTS trg_live_diary_entries_status_flow;
--   DROP TRIGGER IF EXISTS trg_live_diary_entries_core_immutable;
--   DROP TRIGGER IF EXISTS trg_live_diary_entries_supersedes_tenant;
--   DROP TRIGGER IF EXISTS trg_live_diary_entries_tenant_patient;
--   DROP TABLE IF EXISTS live_diary_entries;

CREATE TABLE IF NOT EXISTS live_diary_entries (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  diary_id TEXT NOT NULL CHECK (diary_id IN (
    'diario-sono','diario-alimentar','diario-aderencia','diario-desregulacao','diario-dieta-sensorial','diario-escola'
  )),
  entry_date TEXT NOT NULL CHECK (entry_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  reported_by TEXT NOT NULL CHECK (reported_by IN ('family','patient','school','therapist','clinician')),
  payload_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL,
  supersedes_entry_id TEXT REFERENCES live_diary_entries(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','corrected','voided')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_diary_entries_patient
  ON live_diary_entries(clinic_id, patient_id, diary_id, entry_date DESC, created_at DESC);
-- No máximo um sucessor por registro: correções concorrentes não bifurcam.
CREATE UNIQUE INDEX IF NOT EXISTS idx_live_diary_entries_one_successor
  ON live_diary_entries(supersedes_entry_id) WHERE supersedes_entry_id IS NOT NULL;

-- Tenant no banco: paciente precisa pertencer à mesma clínica.
CREATE TRIGGER IF NOT EXISTS trg_live_diary_entries_tenant_patient
BEFORE INSERT ON live_diary_entries
WHEN NOT EXISTS (SELECT 1 FROM live_patients p WHERE p.id = NEW.patient_id AND p.clinic_id = NEW.clinic_id)
BEGIN
  SELECT RAISE(ABORT, 'LIVE_DIARY_PATIENT_TENANT_MISMATCH');
END;

-- Sucessão só dentro do mesmo paciente, clínica e diário.
CREATE TRIGGER IF NOT EXISTS trg_live_diary_entries_supersedes_tenant
BEFORE INSERT ON live_diary_entries
WHEN NEW.supersedes_entry_id IS NOT NULL
 AND NOT EXISTS (
   SELECT 1 FROM live_diary_entries o
    WHERE o.id = NEW.supersedes_entry_id
      AND o.clinic_id = NEW.clinic_id
      AND o.patient_id = NEW.patient_id
      AND o.diary_id = NEW.diary_id
 )
BEGIN
  SELECT RAISE(ABORT, 'LIVE_DIARY_SUPERSESSION_MISMATCH');
END;

-- Conteúdo e metadados são imutáveis; só o status muda.
CREATE TRIGGER IF NOT EXISTS trg_live_diary_entries_core_immutable
BEFORE UPDATE OF id, clinic_id, patient_id, author_user_id, diary_id, entry_date, reported_by,
  payload_encrypted, encryption_version, created_at
ON live_diary_entries
BEGIN
  SELECT RAISE(ABORT, 'LIVE_DIARY_ENTRY_IMMUTABLE');
END;

-- Status só sai de 'active' (para 'corrected' ou 'voided') e nunca volta.
CREATE TRIGGER IF NOT EXISTS trg_live_diary_entries_status_flow
BEFORE UPDATE OF status ON live_diary_entries
WHEN OLD.status <> 'active' OR NEW.status NOT IN ('corrected','voided')
BEGIN
  SELECT RAISE(ABORT, 'LIVE_DIARY_STATUS_TRANSITION');
END;
