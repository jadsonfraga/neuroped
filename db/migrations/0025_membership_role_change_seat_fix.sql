-- 0025 — Mudar o papel de um membro deixa de consumir assento.
--
-- Problema, encontrado executando a jornada Cliente Zero ponta a ponta:
-- uma clínica com os assentos cheios NÃO conseguia alterar o papel de nenhum
-- membro. Promover alguém que já é da equipe devolvia SEAT_LIMIT_REACHED.
--
-- Causa: `POST /api/tenants/:id/members` faz upsert
-- (`INSERT … ON CONFLICT(clinic_id, user_id) DO UPDATE`). O SQLite dispara o
-- trigger BEFORE INSERT ANTES de detectar o conflito, então a promoção de um
-- membro existente era contada como se fosse um assento novo. Com 2 de 2
-- assentos ocupados — o estado NORMAL de uma clínica — qualquer mudança de
-- papel ficava impossível.
--
-- Isso não era um limite mal calibrado: era o teto de assentos bloqueando uma
-- operação que não consome assento nenhum.
--
-- Correção: o trigger de INSERT passa a ignorar a linha que já existe para
-- (clinic_id, user_id). Nenhum caminho fica sem verificação:
--
--   • linha não existe                → trigger de INSERT verifica, como hoje;
--   • linha existe e está inativa     → o upsert faz active 0→1 e o trigger
--                                       trg_membership_reactivate_seat_limit
--                                       (BEFORE UPDATE OF active) verifica;
--   • linha existe e já está ativa    → só o papel muda; nenhum assento novo é
--                                       consumido, e a operação passa a ser
--                                       permitida — que é o comportamento
--                                       correto.
--
-- O limite continua íntegro: a única coisa que deixa de ser barrada é a
-- operação que nunca deveria ter sido barrada.
--
-- Rollback: recriar o trigger sem a condição NOT EXISTS adicionada aqui
-- (volta a bloquear mudança de papel em clínica com assentos cheios).

DROP TRIGGER IF EXISTS trg_membership_insert_seat_limit;

CREATE TRIGGER IF NOT EXISTS trg_membership_insert_seat_limit
BEFORE INSERT ON clinic_memberships
FOR EACH ROW
WHEN NEW.active = 1
  AND EXISTS (SELECT 1 FROM billing_customers bc WHERE bc.clinic_id = NEW.clinic_id)
  -- Upsert sobre membership existente não é assento novo. A transição
  -- inativo → ativo continua coberta pelo trigger de UPDATE.
  AND NOT EXISTS (
    SELECT 1 FROM clinic_memberships cm
     WHERE cm.clinic_id = NEW.clinic_id AND cm.user_id = NEW.user_id
  )
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM billing_customers bc
       WHERE bc.clinic_id = NEW.clinic_id
         AND bc.status IN ('trial', 'active')
         AND (bc.status <> 'trial' OR julianday(bc.trial_ends_at) > julianday('now'))
    )
    THEN RAISE(ABORT, 'BILLING_ENTITLEMENT_DENIED')
  END;

  SELECT CASE
    WHEN (
      SELECT COUNT(*) FROM clinic_memberships cm
       WHERE cm.clinic_id = NEW.clinic_id AND cm.active = 1
    ) >= COALESCE((
      SELECT bs.seats
        FROM billing_subscriptions bs
        JOIN billing_customers bc ON bc.id = bs.customer_id
       WHERE bc.clinic_id = NEW.clinic_id
         AND bs.status IN ('trial', 'active', 'past_due')
       ORDER BY bs.updated_at DESC
       LIMIT 1
    ), 0)
    THEN RAISE(ABORT, 'SEAT_LIMIT_REACHED')
  END;
END;
