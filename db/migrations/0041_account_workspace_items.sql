-- 0041 — Persistência segura do workspace autenticado por clínica e conta.
-- Dados em repouso são cifrados no backend com o keyring clínico e pertencem
-- exclusivamente ao usuário autenticado dentro da clínica ativa. A chave de
-- namespace é blind-indexed (HMAC); não é armazenada em claro. Registros expirados são removidos
-- sob demanda; valores sem expiração permanecem até remoção explícita/conta.
-- Não substitui os modelos clínicos canônicos, que continuam tenant/paciente-scoped.
-- Membership ativa é exigida também no banco durante qualquer gravação
-- (INSERT e UPDATE). `version` é um token opaco trocado a cada gravação: a API
-- só atualiza quando o cliente apresenta a versão que leu (concorrência
-- otimista), o que impede que uma aba ou aparelho apague a gravação de outro.
CREATE TABLE IF NOT EXISTS account_workspace_items (
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_key_hash TEXT NOT NULL CHECK (length(item_key_hash) = 64),
  payload_encrypted TEXT NOT NULL,
  encryption_version TEXT NOT NULL,
  version TEXT NOT NULL CHECK (length(version) BETWEEN 16 AND 64),
  expires_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (clinic_id, user_id, item_key_hash)
);

CREATE INDEX IF NOT EXISTS idx_account_workspace_items_expiry
  ON account_workspace_items(clinic_id, user_id, expires_at)
  WHERE expires_at IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS trg_account_workspace_active_membership
BEFORE INSERT ON account_workspace_items
WHEN NOT EXISTS (
  SELECT 1 FROM clinic_memberships m
   WHERE m.clinic_id = NEW.clinic_id AND m.user_id = NEW.user_id AND m.active = 1
)
BEGIN
  SELECT RAISE(ABORT, 'ACCOUNT_WORKSPACE_MEMBERSHIP_REQUIRED');
END;

CREATE TRIGGER IF NOT EXISTS trg_account_workspace_active_membership_update
BEFORE UPDATE ON account_workspace_items
WHEN NOT EXISTS (
  SELECT 1 FROM clinic_memberships m
   WHERE m.clinic_id = NEW.clinic_id AND m.user_id = NEW.user_id AND m.active = 1
)
BEGIN
  SELECT RAISE(ABORT, 'ACCOUNT_WORKSPACE_MEMBERSHIP_REQUIRED');
END;

-- Rollback manual, após backup:
-- DROP TRIGGER IF EXISTS trg_account_workspace_active_membership_update;
-- DROP TRIGGER IF EXISTS trg_account_workspace_active_membership;
-- DROP TABLE IF EXISTS account_workspace_items;
