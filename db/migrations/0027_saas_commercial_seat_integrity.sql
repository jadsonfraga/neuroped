-- Forward-only: preserva 0026 e protege licenças já provisionadas.
-- O COUNT da API não é trava: requests concorrentes podem ler o mesmo valor.
-- Os triggers decidem dentro da escrita serializada do D1; um ABORT faz o
-- batch falhar e a API não confirma nem registra uma revogação inexistente.

CREATE TRIGGER IF NOT EXISTS trg_commercial_license_last_user_update
BEFORE UPDATE OF status ON commercial_license_users
WHEN OLD.status = 'active' AND NEW.status <> 'active'
  AND EXISTS (SELECT 1 FROM commercial_licenses WHERE id = OLD.license_id AND status = 'active')
  AND (SELECT COUNT(*) FROM commercial_license_users
       WHERE license_id = OLD.license_id AND status = 'active') <= 1
BEGIN
  SELECT RAISE(ABORT, 'COMMERCIAL_LAST_AUTHORIZED_USER');
END;

-- DELETE direto/cascata não pode contornar a proteção de UPDATE.
CREATE TRIGGER IF NOT EXISTS trg_commercial_license_last_user_delete
BEFORE DELETE ON commercial_license_users
WHEN OLD.status = 'active'
  AND EXISTS (SELECT 1 FROM commercial_licenses WHERE id = OLD.license_id AND status = 'active')
  AND (SELECT COUNT(*) FROM commercial_license_users
       WHERE license_id = OLD.license_id AND status = 'active') <= 1
BEGIN
  SELECT RAISE(ABORT, 'COMMERCIAL_LAST_AUTHORIZED_USER');
END;

-- Transferir a chave contornaria os triggers de membership e limite.
-- Trocas são revogação + concessão, sem reescrever a identidade histórica.
CREATE TRIGGER IF NOT EXISTS trg_commercial_license_user_identity_immutable
BEFORE UPDATE OF license_id, user_id ON commercial_license_users
WHEN NEW.license_id <> OLD.license_id OR NEW.user_id <> OLD.user_id
BEGIN
  SELECT RAISE(ABORT, 'COMMERCIAL_SEAT_IDENTITY_IMMUTABLE');
END;
