-- NeuroPed SaaS — recuperação de senha self-service (porte do PR #770).
-- Migration estritamente aditiva; nenhuma tabela clínica é tocada.
--
-- Invariantes de segurança (herdados do #770):
-- 1. o token de redefinição NUNCA é persistido em texto claro — apenas SHA-256;
-- 2. uso único (consumed_at) com claim rastreável (consumed_by_request_id);
-- 3. expiração curta imposta por julianday no consumo;
-- 4. rate limit persistente por bucket HMAC de IP (sobrevive a cold starts).

CREATE TABLE IF NOT EXISTS auth_password_reset_rate_limits (
  bucket_hash TEXT PRIMARY KEY,
  window_started_at DATETIME NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  blocked_until DATETIME,
  updated_at DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_password_reset_rate_limits_updated
  ON auth_password_reset_rate_limits(updated_at);

CREATE TABLE IF NOT EXISTS auth_password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME,
  consumed_by_request_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(token_hash) = 64)
);

CREATE INDEX IF NOT EXISTS idx_auth_password_reset_tokens_user_active
  ON auth_password_reset_tokens(user_id, consumed_at, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_password_reset_tokens_expiry
  ON auth_password_reset_tokens(expires_at, consumed_at);
