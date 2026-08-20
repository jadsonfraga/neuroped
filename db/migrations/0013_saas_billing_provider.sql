-- NeuroPed SaaS Phase 2 — integração Asaas e hardening de billing/onboarding.
-- Migration aditiva sobre 0012_saas_billing_onboarding.sql.

ALTER TABLE billing_customers ADD COLUMN canceled_at DATETIME;
ALTER TABLE billing_customers ADD COLUMN grace_ends_at DATETIME;
ALTER TABLE billing_customers ADD COLUMN last_provider_event_at DATETIME;
ALTER TABLE billing_customers ADD COLUMN provider_checkout_id TEXT;

ALTER TABLE billing_subscriptions ADD COLUMN last_provider_event_at DATETIME;
ALTER TABLE billing_subscriptions ADD COLUMN provider_checkout_id TEXT;

ALTER TABLE clinic_invitations ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE billing_invoice_events ADD COLUMN raw_status TEXT;
ALTER TABLE billing_invoice_events ADD COLUMN occurred_at DATETIME;
ALTER TABLE billing_invoice_events ADD COLUMN metadata_json TEXT;

CREATE TABLE IF NOT EXISTS billing_provider_checkouts (
  id TEXT PRIMARY KEY,
  billing_customer_id TEXT NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider = 'asaas'),
  provider_checkout_id TEXT NOT NULL UNIQUE,
  external_reference TEXT NOT NULL UNIQUE,
  seats INTEGER NOT NULL CHECK (seats > 0),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paid', 'canceled', 'expired')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_provider_checkouts_customer
  ON billing_provider_checkouts(billing_customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_invoice_events_provider_event
  ON billing_invoice_events(provider, provider_event_id);
CREATE INDEX IF NOT EXISTS idx_clinic_invitations_email_status
  ON clinic_invitations(clinic_id, email, status, expires_at);

-- Cancelamento é terminal para automação: webhook tardio não reativa customer
-- nem subscription cancelada. Nova assinatura exige fluxo explícito separado.
CREATE TRIGGER IF NOT EXISTS trg_billing_customer_cancel_terminal
BEFORE UPDATE OF status ON billing_customers
FOR EACH ROW
WHEN OLD.status = 'canceled' AND NEW.status <> 'canceled'
BEGIN
  SELECT RAISE(ABORT, 'BILLING_CANCELED_TERMINAL');
END;

CREATE TRIGGER IF NOT EXISTS trg_billing_subscription_cancel_terminal
BEFORE UPDATE OF status ON billing_subscriptions
FOR EACH ROW
WHEN OLD.status = 'canceled' AND NEW.status <> 'canceled'
BEGIN
  SELECT RAISE(ABORT, 'BILLING_SUBSCRIPTION_CANCELED_TERMINAL');
END;

-- Backfill: toda clínica existente sem customer entra em trial de 14 dias.
INSERT INTO billing_customers
  (id, clinic_id, provider, status, trial_ends_at, created_at, updated_at)
SELECT
  'bc_' || lower(hex(randomblob(16))),
  c.id,
  'asaas',
  'trial',
  datetime('now', '+14 days'),
  datetime('now'),
  datetime('now')
FROM clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM billing_customers bc WHERE bc.clinic_id = c.id
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
  COALESCE(bc.trial_ends_at, datetime('now', '+14 days')),
  datetime('now'),
  datetime('now')
FROM billing_customers bc
WHERE bc.status = 'trial'
  AND NOT EXISTS (
    SELECT 1 FROM billing_subscriptions bs WHERE bs.customer_id = bc.id
  );

-- Toda clínica criada após 0013 nasce com customer + subscription trial.
CREATE TRIGGER IF NOT EXISTS trg_clinic_create_billing_trial
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

-- Defesa em profundidade do limite de assentos. O owner inicial ocupa o assento 1.
CREATE TRIGGER IF NOT EXISTS trg_membership_insert_seat_limit
BEFORE INSERT ON clinic_memberships
FOR EACH ROW
WHEN NEW.active = 1
  AND EXISTS (SELECT 1 FROM billing_customers bc WHERE bc.clinic_id = NEW.clinic_id)
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

CREATE TRIGGER IF NOT EXISTS trg_membership_reactivate_seat_limit
BEFORE UPDATE OF active ON clinic_memberships
FOR EACH ROW
WHEN OLD.active = 0 AND NEW.active = 1
  AND EXISTS (SELECT 1 FROM billing_customers bc WHERE bc.clinic_id = NEW.clinic_id)
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

-- Reserva pública: leitura da página permanece pública, mas criação, remarcação
-- e lista de espera exigem customer em trial válido ou active.
CREATE TRIGGER IF NOT EXISTS trg_public_appointment_billing_guard
BEFORE INSERT ON appointments
FOR EACH ROW
WHEN NEW.source = 'public'
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
        FROM clinic_memberships cm
        JOIN billing_customers bc ON bc.clinic_id = cm.clinic_id
       WHERE cm.user_id = NEW.provider_user_id
         AND cm.active = 1
         AND bc.status IN ('trial', 'active')
         AND (bc.status <> 'trial' OR julianday(bc.trial_ends_at) > julianday('now'))
    )
    THEN RAISE(ABORT, 'BILLING_PUBLIC_BOOKING_DISABLED')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_public_appointment_reschedule_billing_guard
BEFORE UPDATE OF starts_at_local, ends_at_local ON appointments
FOR EACH ROW
WHEN OLD.source = 'public'
 AND (NEW.starts_at_local <> OLD.starts_at_local OR NEW.ends_at_local <> OLD.ends_at_local)
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
        FROM clinic_memberships cm
        JOIN billing_customers bc ON bc.clinic_id = cm.clinic_id
       WHERE cm.user_id = NEW.provider_user_id
         AND cm.active = 1
         AND bc.status IN ('trial', 'active')
         AND (bc.status <> 'trial' OR julianday(bc.trial_ends_at) > julianday('now'))
    )
    THEN RAISE(ABORT, 'BILLING_PUBLIC_BOOKING_DISABLED')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_public_waitlist_billing_guard
BEFORE INSERT ON waitlist_entries
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
        FROM clinic_memberships cm
        JOIN billing_customers bc ON bc.clinic_id = cm.clinic_id
       WHERE cm.user_id = NEW.provider_user_id
         AND cm.active = 1
         AND bc.status IN ('trial', 'active')
         AND (bc.status <> 'trial' OR julianday(bc.trial_ends_at) > julianday('now'))
    )
    THEN RAISE(ABORT, 'BILLING_PUBLIC_BOOKING_DISABLED')
  END;
END;
