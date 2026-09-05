-- 0024 — Verificação de posse do e-mail no cadastro externo.
--
-- Problema: uma conta criada por /api/auth/signup nasce com papel global
-- 'professional' e pode criar uma clínica — sem nenhuma prova de que quem
-- cadastrou controla aquele endereço. Alguém podia registrar o e-mail de um
-- terceiro, tomar a identidade dentro da plataforma e ainda bloquear o
-- cadastro legítimo daquela pessoa.
--
-- Sobre o backfill (leia antes de julgar): as contas que já existem NÃO
-- verificaram nada. Deixá-las com email_verified_at NULL travaria todo mundo
-- que hoje usa o sistema; marcá-las como verificadas sem dizer por quê seria
-- inventar prova. Então a coluna email_verified_source registra a verdade:
-- 'grandfathered_pre_0024' diz explicitamente que aquela conta foi aceita por
-- anteceder este controle (provisionada por bootstrap administrativo ou
-- convite, não por cadastro aberto), e NÃO por ter provado posse do endereço.
-- Uma auditoria consegue separar as duas populações com um WHERE.
--
-- Rollback:
--   DROP TABLE IF EXISTS auth_email_verification_tokens;
--   DROP TABLE IF EXISTS auth_email_verification_rate_limits;
--   -- as colunas de users podem permanecer: são aditivas e ignoradas pelo
--   -- código anterior. Removê-las exigiria rebuild de tabela, o que não se
--   -- justifica para reverter um controle de segurança.

ALTER TABLE users ADD COLUMN email_verified_at DATETIME;

ALTER TABLE users ADD COLUMN email_verified_source TEXT
  CHECK (
    email_verified_source IS NULL
    OR email_verified_source IN ('self_service_token', 'grandfathered_pre_0024')
  );

-- Grandfathering explícito e rotulado (ver nota acima).
UPDATE users
   SET email_verified_at = COALESCE(created_at, CURRENT_TIMESTAMP),
       email_verified_source = 'grandfathered_pre_0024'
 WHERE email_verified_at IS NULL;

-- Token de verificação: só o SHA-256 é persistido, nunca o valor em claro.
CREATE TABLE IF NOT EXISTS auth_email_verification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  -- Endereço vigente quando o token foi emitido. Se o e-mail da conta mudar
  -- depois, o token não pode verificar o endereço novo — ele provou posse do
  -- antigo, não do atual.
  email_at_issue TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME,
  consumed_by_request_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verification_user
  ON auth_email_verification_tokens (user_id, consumed_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_expiry
  ON auth_email_verification_tokens (expires_at);

-- Balde de reenvio, persistente para sobreviver a cold start (mesmo desenho da
-- 0020: o limite não pode viver só na memória de um isolate).
CREATE TABLE IF NOT EXISTS auth_email_verification_rate_limits (
  bucket_hash TEXT PRIMARY KEY,
  window_started_at DATETIME NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  blocked_until DATETIME,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verification_rate_limits_updated
  ON auth_email_verification_rate_limits (updated_at);
