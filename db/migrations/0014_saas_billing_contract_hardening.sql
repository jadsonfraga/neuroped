-- NeuroPed SaaS — hardening de assentos de trial.
--
-- Contrato: o owner inicial ocupa o primeiro assento, mas uma clínica em trial
-- deve conseguir convidar ao menos um segundo membro para experimentar o fluxo
-- multiusuário. Trials existentes recebem capacidade para todos os membros
-- ativos atuais + 1 assento livre; novas clínicas nascem com 2 assentos.

UPDATE billing_subscriptions
   SET seats = MAX(
     COALESCE(seats, 0),
     2,
     COALESCE((
       SELECT COUNT(*) + 1
         FROM clinic_memberships cm
         JOIN billing_customers bc ON bc.clinic_id = cm.clinic_id
        WHERE bc.id = billing_subscriptions.customer_id
          AND cm.active = 1
     ), 2)
   ),
       updated_at = datetime('now')
 WHERE status = 'trial';

DROP TRIGGER IF EXISTS trg_clinic_create_billing_trial;

CREATE TRIGGER trg_clinic_create_billing_trial
AFTER INSERT ON clinics
FOR EACH ROW
BEGIN
  INSERT INTO billing_customers
    (id, clinic_id, provider, status, trial_ends_at, created_at, updated_at)
  VALUES (
    'bc_' || lower(hex(randomblob(16))),
    NEW.id,
    'asaas',
    'trial',
    datetime('now', '+14 days'),
    datetime('now'),
    datetime('now')
  );

  INSERT INTO billing_subscriptions
    (id, customer_id, plan_id, seats, status, anchored_at,
     current_period_starts_at, current_period_ends_at, created_at, updated_at)
  SELECT
    'bs_' || lower(hex(randomblob(16))),
    bc.id,
    'saas-professional',
    2,
    'trial',
    datetime('now'),
    datetime('now'),
    bc.trial_ends_at,
    datetime('now'),
    datetime('now')
  FROM billing_customers bc
  WHERE bc.clinic_id = NEW.id
  LIMIT 1;
END;
