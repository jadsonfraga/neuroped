/**
 * 0013_saas_billing_provider.sql
 * Camada provider-specific (Asaas), checkouts pendentes e hardening do onboarding.
 * Não armazena payload clínico nem segredos do provider.
 */

ALTER TABLE billing_customers ADD COLUMN canceled_at TEXT;
ALTER TABLE billing_customers ADD COLUMN last_provider_event_at TEXT;
ALTER TABLE billing_customers ADD COLUMN provider_checkout_id TEXT;

ALTER TABLE billing_subscriptions ADD COLUMN last_provider_event_at TEXT;
ALTER TABLE billing_subscriptions ADD COLUMN provider_checkout_id TEXT;

ALTER TABLE clinic_invitations ADD COLUMN last_sent_at TEXT;
ALTER TABLE clinic_invitations ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS billing_provider_checkouts (
  id TEXT PRIMARY KEY,
  billing_customer_id TEXT NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('asaas')),
  provider_checkout_id TEXT NOT NULL UNIQUE,
  external_reference TEXT NOT NULL UNIQUE,
  seats INTEGER NOT NULL CHECK (seats > 0),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paid', 'canceled', 'expired')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_billing_provider_checkouts_customer
  ON billing_provider_checkouts(billing_customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_invoice_events_provider_invoice
  ON billing_invoice_events(provider, provider_invoice_id);

CREATE INDEX IF NOT EXISTS idx_clinic_invitations_email_state
  ON clinic_invitations(clinic_id, email, accepted_at, revoked_at, expires_at);

/* Um cancelamento é terminal para reativação automática por webhook tardio.
 * Reativação exige ação explícita via novo checkout/assinatura.
 */
CREATE TRIGGER IF NOT EXISTS trg_billing_customer_cancel_terminal
BEFORE UPDATE OF status ON billing_customers
FOR EACH ROW
WHEN OLD.status = 'canceled' AND NEW.status <> 'canceled'
BEGIN
  SELECT RAISE(ABORT, 'BILLING_CANCELED_TERMINAL');
END;

/* Bootstrap de trial para clínicas existentes. */
INSERT INTO billing_customers
  (id, clinic_id, plan_id, provider, status, created_at, updated_at)
SELECT
  'bc_' || lower(hex(randomblob(16))),
  c.id,
  p.id,
  'asaas',
  'trial',
  datetime('now'),
  datetime('now')
FROM clinics c
JOIN billing_plans p ON p.code = 'neuroped-seat-monthly-brl' AND p.active = 1
WHERE NOT EXISTS (
  SELECT 1 FROM billing_customers bc WHERE bc.clinic_id = c.id
);

INSERT INTO billing_subscriptions
  (id, billing_customer_id, status, seats, current_period_start, current_period_end, created_at, updated_at)
SELECT
  'bs_' || lower(hex(randomblob(16))),
  bc.id,
  'trialing',
  1,
  datetime('now'),
  datetime('now', '+14 days'),
  datetime('now'),
  datetime('now')
FROM billing_customers bc
WHERE bc.status = 'trial'
  AND NOT EXISTS (
    SELECT 1 FROM billing_subscriptions bs WHERE bs.billing_customer_id = bc.id
  );

/* Toda nova clínica nasce com 14 dias de trial e 1 assento (o owner). */
CREATE TRIGGER IF NOT EXISTS trg_clinic_create_billing_trial
AFTER INSERT ON clinics
FOR EACH ROW
BEGIN
  INSERT INTO billing_customers
    (id, clinic_id, plan_id, provider, status, created_at, updated_at)
  SELECT
    'bc_' || lower(hex(randomblob(16))),
    NEW.id,
    p.id,
    'asaas',
    'trial',
    datetime('now'),
    datetime('now')
  FROM billing_plans p
  WHERE p.code = 'neuroped-seat-monthly-brl' AND p.active = 1
  LIMIT 1;

  INSERT INTO billing_subscriptions
    (id, billing_customer_id, status, seats, current_period_start, current_period_end, created_at, updated_at)
  SELECT
    'bs_' || lower(hex(randomblob(16))),
    bc.id,
    'trialing',
    1,
    datetime('now'),
    datetime('now', '+14 days'),
    datetime('now'),
    datetime('now')
  FROM billing_customers bc
  WHERE bc.clinic_id = NEW.id
  LIMIT 1;
END;

/* Defesa em profundidade do limite de assentos e do entitlement administrativo. */
CREATE TRIGGER IF NOT EXISTS trg_membership_insert_seat_limit
BEFORE INSERT ON clinic_memberships
FOR EACH ROW
WHEN NEW.active = 1
  AND EXISTS (SELECT 1 FROM billing_customers bc WHERE bc.clinic_id = NEW.clinic_id)
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM billing_customers bc
      WHERE bc.clinic_id = NEW.clinic_id AND bc.status IN ('trial','active')
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
      JOIN billing_customers bc ON bc.id = bs.billing_customer_id
      WHERE bc.clinic_id = NEW.clinic_id
        AND bs.status IN ('trialing','active','past_due','paused')
      ORDER BY bs.updated_at DESC LIMIT 1
    ), 0)
    THEN RAISE(ABORT, 'SEAT_LIMIT_REACHED')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_membership_reactivate_seat_limit
BEFORE UPDATE OF active ON clinic_memberships
FOR EACH ROW
WHEN OLD.active = 0 AND NEW.active = 1
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM billing_customers bc
      WHERE bc.clinic_id = NEW.clinic_id AND bc.status IN ('trial','active')
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
      JOIN billing_customers bc ON bc.id = bs.billing_customer_id
      WHERE bc.clinic_id = NEW.clinic_id
        AND bs.status IN ('trialing','active','past_due','paused')
      ORDER BY bs.updated_at DESC LIMIT 1
    ), 0)
    THEN RAISE(ABORT, 'SEAT_LIMIT_REACHED')
  END;
END;

/* Reserva pública: leitura do perfil pode permanecer pública, mas nenhuma nova
 * reserva/lista de espera/remarcação é aceita sem trial/assinatura ativa.
 */
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
         AND bc.status IN ('trial','active')
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
         AND bc.status IN ('trial','active')
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
         AND bc.status IN ('trial','active')
    )
    THEN RAISE(ABORT, 'BILLING_PUBLIC_BOOKING_DISABLED')
  END;
END;
