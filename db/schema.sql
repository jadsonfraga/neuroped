-- ============================================================
-- NeuroPed — Schema D1 (Cloudflare D1 / SQLite)
-- ARQUIVO LEGADO DE REFERÊNCIA. Para provisionar/deployar, use
-- db/schema.d1.sql seguido das migrações aditivas em db/migrations/.
-- Branch: feat/auditoria-total-ui-backend-memoria
-- Criado: 2026-05-08
--
-- LGPD:
--  - Tabelas com sufixo _demo contêm exclusivamente dados fictícios (is_demo = 1)
--  - Nenhuma tabela deve receber dados reais de pacientes sem criptografia server-side
--  - Campos sensíveis (nome, guardian_phone) devem ser criptografados via patientCrypto.ts
--    antes de inserção em produção
--
-- USO:
--  wrangler d1 execute neuroped-db --local --file=db/schema.sql
--  wrangler d1 execute neuroped-db --file=db/schema.sql  (produção)
-- ============================================================

-- ============================================================
-- Usuários / Profissionais de saúde
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name         TEXT NOT NULL,
  email        TEXT UNIQUE,
  crm          TEXT,
  specialty    TEXT,
  pin_hash     TEXT,               -- SHA-256 hex do PIN local (somente se habilitado)
  password_hash TEXT,
  must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0, 1)),
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until DATETIME,
  last_login_at DATETIME,
  role         TEXT NOT NULL DEFAULT 'professional'
               CHECK (role IN ('admin', 'professional', 'reader', 'operator')),
  is_active    INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Sessões revogáveis: refresh tokens ficam apenas como SHA-256.
CREATE TABLE IF NOT EXISTS auth_refresh_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  parent_session_id TEXT REFERENCES auth_refresh_sessions(id) ON DELETE SET NULL,
  replaced_by_session_id TEXT REFERENCES auth_refresh_sessions(id) ON DELETE SET NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME,
  revoke_reason TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_user ON auth_refresh_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_family ON auth_refresh_sessions(family_id);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_expiry ON auth_refresh_sessions(expires_at);

-- ============================================================
-- Pacientes demo (dados fictícios — is_demo = 1 sempre)
-- ============================================================
CREATE TABLE IF NOT EXISTS patients_demo (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  owner_user_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,                  -- fictício em modo demo
  birth_date     DATE,
  guardian_name  TEXT,
  guardian_phone TEXT,
  diagnosis_code TEXT,                           -- CID-10/CID-11
  notes          TEXT,
  is_demo        INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_demo_name ON patients_demo(name);
CREATE INDEX IF NOT EXISTS idx_patients_demo_owner ON patients_demo(owner_user_id);

-- ============================================================
-- Consultas demo (SOAP — Subjetivo, Objetivo, Avaliação, Plano)
-- ============================================================
CREATE TABLE IF NOT EXISTS consultations_demo (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  patient_id  TEXT NOT NULL REFERENCES patients_demo(id) ON DELETE CASCADE,
  date        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subjective  TEXT,                -- S — Queixa/história do paciente
  objective   TEXT,                -- O — Exame físico, escalas aplicadas
  assessment  TEXT,                -- A — Impressão diagnóstica
  plan        TEXT,                -- P — Conduta e plano terapêutico
  is_demo     INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consultations_demo_patient ON consultations_demo(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_demo_date ON consultations_demo(date);

-- ============================================================
-- Resultados de escalas aplicadas
-- ============================================================
CREATE TABLE IF NOT EXISTS scale_results_demo (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  patient_id     TEXT NOT NULL,
  scale_id       TEXT NOT NULL,        -- ex: "mchat", "snap-iv", "scared"
  scale_name     TEXT NOT NULL,        -- ex: "M-CHAT-R/F", "SNAP-IV"
  score          REAL,                 -- coluna legada; novas gravações usam NULL
  interpretation TEXT,                 -- coluna legada; novas gravações usam NULL
  details        TEXT,                 -- JSON com perguntas e respostas integrais
  is_demo        INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  applied_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scale_results_patient ON scale_results_demo(patient_id);
CREATE INDEX IF NOT EXISTS idx_scale_results_scale_id ON scale_results_demo(scale_id);

-- ============================================================
-- Documentos clínicos (laudos, relatórios, encaminhamentos)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents_demo (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  patient_id        TEXT NOT NULL,
  type              TEXT NOT NULL       -- laudo | relatorio | encaminhamento | prescricao | atestado | orientacao
                    CHECK (type IN ('laudo', 'relatorio', 'encaminhamento', 'prescricao', 'atestado', 'orientacao')),
  title             TEXT NOT NULL,
  content           TEXT,               -- corpo do documento
  is_family_visible INTEGER NOT NULL DEFAULT 0 CHECK (is_family_visible IN (0, 1)),
  is_demo           INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_demo_patient ON documents_demo(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_demo_type ON documents_demo(type);

-- ============================================================
-- Log de auditoria
-- (Registra: quem, o quê, quando, de onde — sem conteúdo clínico)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  action      TEXT NOT NULL,        -- ex: "auth.login.success", "patients.list"
  resource    TEXT,                 -- ex: "patients", "scale_results"
  resource_id TEXT,                 -- ID do recurso acessado/criado
  user_id     TEXT,                 -- ID do usuário que executou a ação
  ip          TEXT,                 -- IP de origem (pode ser omitido por LGPD se necessário)
  details     TEXT,                 -- JSON com metadados adicionais (sem PII)
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================
-- Notas de memória clínica (busca semântica / textual)
-- ============================================================
CREATE TABLE IF NOT EXISTS memory_notes (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title       TEXT,
  content     TEXT NOT NULL,
  category    TEXT,                 -- ex: "diagnostico", "farmacologia", "escala"
  source      TEXT,                 -- ex: "prontuario", "manual", "escala_mchat"
  patient_id  TEXT,                 -- opcional: vínculo com paciente (demo)
  tags        TEXT,                 -- JSON array de tags para filtragem
  is_demo     INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memory_notes_category ON memory_notes(category);
CREATE VIRTUAL TABLE IF NOT EXISTS memory_notes_fts USING fts5(
  content,
  title,
  tags,
  content=memory_notes,
  content_rowid=rowid
);

-- ============================================================
-- Configurações do app (chave-valor)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Triggers de atualização automática de updated_at
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_patients_updated_at
  AFTER UPDATE ON patients_demo
  FOR EACH ROW BEGIN
    UPDATE patients_demo SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS trg_documents_updated_at
  AFTER UPDATE ON documents_demo
  FOR EACH ROW BEGIN
    UPDATE documents_demo SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS trg_memory_notes_updated_at
  AFTER UPDATE ON memory_notes
  FOR EACH ROW BEGIN
    UPDATE memory_notes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
  AFTER UPDATE ON users
  FOR EACH ROW BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- ============================================================
-- Configurações iniciais do app
-- ============================================================
INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('app.version', '2.0.0'),
  ('app.mode', 'demo'),
  ('app.lgpd.version', '1.0'),
  ('app.schema.version', '2026-05-08');
