-- 0036 — Registro de uso de IA (Resolução CFM 2.454/2026, art. 4º, V) e regras de retenção por categoria (LGPD / Lei 13.787 art. 6º).
-- VERSIONADA, NÃO APLICADA em produção. Sem conteúdo clínico: só metadados estruturados.
-- Rollback (manual, após revisão):
--   DROP TRIGGER IF EXISTS trg_ai_use_records_core_immutable;
--   DROP TRIGGER IF EXISTS trg_ai_use_records_tenant_patient;
--   DROP TABLE IF EXISTS ai_use_records;
--   DROP TABLE IF EXISTS clinic_retention_rules;

CREATE TABLE IF NOT EXISTS ai_use_records (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  -- patient_id sem FK de propósito: após eliminação do titular (depois do prazo legal) o registro de IA
  -- permanece como evidência de accountability só com o id opaco (decisão jurídica pendente).
  patient_id TEXT,
  actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  tool TEXT NOT NULL CHECK (length(tool) BETWEEN 2 AND 80),
  purpose TEXT NOT NULL CHECK (purpose IN ('apoio_decisao_clinica','redacao_documento','resumo_informacoes','transcricao','comunicacao_administrativa','pesquisa_literatura')),
  data_sharing TEXT NOT NULL CHECK (data_sharing IN ('nenhum','pseudonimizado','identificado')),
  risk_level TEXT CHECK (risk_level IS NULL OR risk_level IN ('baixo','medio','alto')),
  human_reviewed INTEGER NOT NULL CHECK (human_reviewed IN (0,1)),
  used_at DATETIME NOT NULL,
  family_status TEXT NOT NULL DEFAULT 'nao_informada' CHECK (family_status IN ('nao_informada','informada','recusou')),
  family_status_at DATETIME,
  family_status_by_user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (patient_id IS NOT NULL OR data_sharing = 'nenhum')
);
CREATE INDEX IF NOT EXISTS idx_ai_use_clinic_time ON ai_use_records(clinic_id, used_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_use_patient ON ai_use_records(clinic_id, patient_id, used_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_ai_use_records_tenant_patient
BEFORE INSERT ON ai_use_records
WHEN NEW.patient_id IS NOT NULL
 AND NOT EXISTS (SELECT 1 FROM live_patients p WHERE p.id = NEW.patient_id AND p.clinic_id = NEW.clinic_id)
BEGIN
  SELECT RAISE(ABORT, 'AI_USE_PATIENT_TENANT_MISMATCH');
END;

-- O registro é prova: só a ciência da família pode mudar (e uma única vez).
CREATE TRIGGER IF NOT EXISTS trg_ai_use_records_core_immutable
BEFORE UPDATE OF clinic_id, patient_id, actor_user_id, tool, purpose, data_sharing, risk_level, human_reviewed, used_at, created_at
ON ai_use_records
BEGIN
  SELECT RAISE(ABORT, 'AI_USE_RECORD_IMMUTABLE');
END;

CREATE TRIGGER IF NOT EXISTS trg_ai_use_records_family_once
BEFORE UPDATE OF family_status ON ai_use_records
WHEN OLD.family_status <> 'nao_informada'
BEGIN
  SELECT RAISE(ABORT, 'AI_USE_FAMILY_STATUS_ALREADY_SET');
END;

CREATE TRIGGER IF NOT EXISTS trg_ai_use_records_no_delete
BEFORE DELETE ON ai_use_records
BEGIN
  SELECT RAISE(ABORT, 'AI_USE_RECORD_NO_DELETE');
END;

CREATE TABLE IF NOT EXISTS clinic_retention_rules (
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('clinical_record','ai_use_registry','audit_trail','family_portal_links')),
  retention_days INTEGER NOT NULL CHECK (retention_days BETWEEN 0 AND 36500),
  configured_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (clinic_id, category),
  -- Lei 13.787/2018, art. 6º: mínimo de 20 anos (7300 dias) para o prontuário.
  CHECK (category <> 'clinical_record' OR retention_days >= 7300)
);
