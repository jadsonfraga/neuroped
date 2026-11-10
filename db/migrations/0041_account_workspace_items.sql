-- 0041 — Persistência segura do workspace autenticado por conta.
-- Dados em repouso são cifrados no backend com o keyring clínico e pertencem
-- exclusivamente ao usuário autenticado. Registros expirados são removidos
-- sob demanda; valores sem expiração permanecem até remoção explícita/conta.
-- Não substitui os modelos clínicos canônicos, que continuam tenant/paciente-scoped.
-- Rollback manual, após backup: DROP TABLE IF EXISTS account_workspace_items;

CREATE TABLE IF NOT EXISTS account_workspace_items (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL CHECK (length(item_key) BETWEEN 1 AND 160),
  payload_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL,
  expires_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_account_workspace_items_expiry
  ON account_workspace_items(user_id, expires_at)
  WHERE expires_at IS NOT NULL;
