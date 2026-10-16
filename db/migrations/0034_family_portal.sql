-- 0034 — Portal da família: link seguro com orientações, lembretes, questionários
-- e documentos liberados pelo médico.
--
-- VERSIONADA, NÃO APLICADA EM PRODUÇÃO. Aplicar só após revisão do médico/responsável.
--
-- Modelo de confiança (mesmo padrão do intake remoto, 0018):
--  1. a família não recebe membership; o link é a credencial;
--  2. o segredo NUNCA é persistido: só o blind index por clínica (token_hash);
--  3. todo conteúdo exibido à família (orientações, lembretes, snapshot dos
--     documentos liberados, tokens de questionário) fica cifrado em
--     content_encrypted — a linha em claro só tem metadados de acesso;
--  4. acesso limitado: expires_at + max_views, consumidos de forma atômica;
--  5. consentimento LGPD registrado (versão + instante) a cada primeira abertura;
--  6. trilha de auditoria própria, só com metadados (sem nome, sem conteúdo,
--     sem token) — o ator aqui é a família, não um usuário (mesma razão da 0023).
--
-- Rollback: DROP TABLE IF EXISTS family_portal_audit_log; DROP TABLE IF EXISTS family_portal_shares;
-- Migração aditiva: não altera nenhuma tabela existente.

CREATE TABLE IF NOT EXISTS family_portal_shares (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES live_patients(id) ON DELETE CASCADE,
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  expires_at DATETIME NOT NULL,
  max_views INTEGER NOT NULL CHECK (max_views BETWEEN 1 AND 10),
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  content_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL,
  consent_version TEXT,
  first_consented_at DATETIME,
  last_viewed_at DATETIME,
  revoked_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (clinic_id, token_hash),
  CHECK (view_count <= max_views)
);
CREATE INDEX IF NOT EXISTS idx_family_portal_share_patient
  ON family_portal_shares(clinic_id, patient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS family_portal_audit_log (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  share_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('opened','consent_accepted','content_viewed','denied_expired','denied_exhausted','denied_revoked','denied_invalid_consent')),
  consent_version TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_family_portal_audit_share
  ON family_portal_audit_log(clinic_id, share_id, created_at DESC);
