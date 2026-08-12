-- NeuroPed SaaS Phase 1 hardening — invariantes que não podem depender apenas da API.
--
-- 1. Cada evento clínico pode ser supersedido no máximo uma vez. Correções
--    concorrentes não podem criar duas linhas filhas para o mesmo evento.
-- 2. Uma clínica nunca pode perder seu último owner ativo por UPDATE/DELETE,
--    mesmo sob concorrência ou acesso direto ao banco.

CREATE UNIQUE INDEX IF NOT EXISTS ux_live_clinical_events_single_supersession
  ON live_clinical_events(supersedes_event_id)
  WHERE supersedes_event_id IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS trg_clinic_memberships_preserve_last_owner_update
BEFORE UPDATE OF role, active ON clinic_memberships
FOR EACH ROW
WHEN OLD.active = 1
  AND OLD.role = 'owner'
  AND (NEW.active != 1 OR NEW.role != 'owner')
  AND NOT EXISTS (
    SELECT 1
      FROM clinic_memberships other
     WHERE other.clinic_id = OLD.clinic_id
       AND other.user_id != OLD.user_id
       AND other.active = 1
       AND other.role = 'owner'
  )
BEGIN
  SELECT RAISE(ABORT, 'LAST_OWNER_PROTECTED');
END;

CREATE TRIGGER IF NOT EXISTS trg_clinic_memberships_preserve_last_owner_delete
BEFORE DELETE ON clinic_memberships
FOR EACH ROW
WHEN OLD.active = 1
  AND OLD.role = 'owner'
  AND NOT EXISTS (
    SELECT 1
      FROM clinic_memberships other
     WHERE other.clinic_id = OLD.clinic_id
       AND other.user_id != OLD.user_id
       AND other.active = 1
       AND other.role = 'owner'
  )
BEGIN
  SELECT RAISE(ABORT, 'LAST_OWNER_PROTECTED');
END;
