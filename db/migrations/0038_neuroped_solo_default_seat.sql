-- NeuroPed Solo — novos trials começam com um profissional.
--
-- Esta migração troca somente o trigger para clínicas futuras. Assinaturas
-- existentes, inclusive tenants multiusuário, não são convertidas nem
-- reprecificadas.

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
    1,
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
