-- 0040 — Diários LIVE: inclui o diário de crises epilépticas e o calendário de
-- cefaleia no CHECK de diary_id de live_diary_entries (0039).
-- O SQLite não altera CHECK existente: a tabela é reconstruída preservando
-- TODAS as linhas (inclusive status e cadeia de correção), com os mesmos
-- índices e gatilhos. Nenhum conteúdo é lido em claro: payload_encrypted é
-- copiado byte a byte.
--
-- Segurança da reconstrução:
-- * A tabela nova referencia a si mesma (live_diary_entries_new). Ela não
--   aponta para a antiga, então o DROP da antiga não dispara ON DELETE SET NULL
--   nas linhas copiadas. O RENAME reescreve a auto-referência para o nome final.
-- * defer_foreign_keys adia a checagem das FKs para o fim da transação, porque
--   a cópia não garante ordem entre registro e sucessor.
-- * Nenhuma outra tabela referencia live_diary_entries.
--
-- Rollback (manual, após backup): recriar a tabela com o CHECK da 0039 pelo mesmo
-- procedimento, depois de remover as linhas dos dois diários novos.

PRAGMA defer_foreign_keys = true;

CREATE TABLE live_diary_entries_new (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  diary_id TEXT NOT NULL CHECK (diary_id IN (
    'diario-sono','diario-alimentar','diario-aderencia','diario-desregulacao','diario-dieta-sensorial','diario-escola',
    'diario-epilepsia','calendario-cefaleia'
  )),
  entry_date TEXT NOT NULL CHECK (entry_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  reported_by TEXT NOT NULL CHECK (reported_by IN ('family','patient','school','therapist','clinician')),
  payload_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL,
  supersedes_entry_id TEXT REFERENCES live_diary_entries_new(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','corrected','voided')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO live_diary_entries_new
  (id, clinic_id, patient_id, author_user_id, diary_id, entry_date, reported_by,
   payload_encrypted, encryption_version, supersedes_entry_id, status, created_at)
SELECT id, clinic_id, patient_id, author_user_id, diary_id, entry_date, reported_by,
       payload_encrypted, encryption_version, supersedes_entry_id, status, created_at
  FROM live_diary_entries;

DROP TABLE live_diary_entries;
ALTER TABLE live_diary_entries_new RENAME TO live_diary_entries;

CREATE INDEX IF NOT EXISTS idx_live_diary_entries_patient
  ON live_diary_entries(clinic_id, patient_id, diary_id, entry_date DESC, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_live_diary_entries_one_successor
  ON live_diary_entries(supersedes_entry_id) WHERE supersedes_entry_id IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS trg_live_diary_entries_tenant_patient
BEFORE INSERT ON live_diary_entries
WHEN NOT EXISTS (SELECT 1 FROM live_patients p WHERE p.id = NEW.patient_id AND p.clinic_id = NEW.clinic_id)
BEGIN
  SELECT RAISE(ABORT, 'LIVE_DIARY_PATIENT_TENANT_MISMATCH');
END;

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

CREATE TRIGGER IF NOT EXISTS trg_live_diary_entries_core_immutable
BEFORE UPDATE OF id, clinic_id, patient_id, author_user_id, diary_id, entry_date, reported_by,
  payload_encrypted, encryption_version, created_at
ON live_diary_entries
BEGIN
  SELECT RAISE(ABORT, 'LIVE_DIARY_ENTRY_IMMUTABLE');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_diary_entries_status_flow
BEFORE UPDATE OF status ON live_diary_entries
WHEN OLD.status <> 'active' OR NEW.status NOT IN ('corrected','voided')
BEGIN
  SELECT RAISE(ABORT, 'LIVE_DIARY_STATUS_TRANSITION');
END;
