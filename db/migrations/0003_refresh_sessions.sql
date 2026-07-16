-- Sessões JWT revogáveis e rotação de refresh token.
-- Idempotente e aditiva: não altera nem apaga dados clínicos existentes.
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

CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_user
  ON auth_refresh_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_family
  ON auth_refresh_sessions(family_id);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_expiry
  ON auth_refresh_sessions(expires_at);
