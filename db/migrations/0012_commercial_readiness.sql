-- NeuroPed — fundação comercial auditável.
--
-- O estado de cobrança é autoritativo no backend. Nenhuma flag do frontend
-- libera escrita clínica. Cancelamento/inadimplência preservam leitura e
-- exportação; somente novas escritas são bloqueadas pelo entitlement.

CREATE TABLE IF NOT EXISTS billing_accounts (
  clinic_id TEXT PRIMARY KEY REFERENCES clinics(id) ON DELETE RESTRICT,
  plan_code TEXT NOT NULL DEFAULT 'neuroped_pro_99'
    CHECK (plan_code = 'neuroped_pro_99'),
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing','active','past_due','canceled','suspended','incomplete')),
  seat_quantity INTEGER NOT NULL DEFAULT 1 CHECK (seat_quantity BETWEEN 1 AND 250),
  provider TEXT NOT NULL DEFAULT 'stripe' CHECK (provider = 'stripe'),
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  provider_checkout_session_id TEXT,
  checkout_attempt_id TEXT,
  checkout_seat_quantity INTEGER CHECK (
    checkout_seat_quantity IS NULL OR checkout_seat_quantity BETWEEN 1 AND 250
  ),
  checkout_locked_until DATETIME,
  trial_ends_at DATETIME,
  current_period_end DATETIME,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0 CHECK (cancel_at_period_end IN (0,1)),
  provider_event_created_at INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_billing_provider_customer
  ON billing_accounts(provider, provider_customer_id)
  WHERE provider_customer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_billing_provider_subscription
  ON billing_accounts(provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_billing_provider_checkout_session
  ON billing_accounts(provider, provider_checkout_session_id)
  WHERE provider_checkout_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_status_period
  ON billing_accounts(status, current_period_end);

CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider = 'stripe'),
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  clinic_id TEXT REFERENCES clinics(id) ON DELETE SET NULL,
  payload_sha256 TEXT NOT NULL,
  provider_created_at INTEGER NOT NULL,
  processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (provider, provider_event_id)
);
CREATE INDEX IF NOT EXISTS idx_billing_events_clinic_time
  ON billing_events(clinic_id, processed_at DESC);

CREATE TABLE IF NOT EXISTS clinic_invitations (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  email TEXT NOT NULL COLLATE NOCASE CHECK (length(email) BETWEEN 3 AND 254),
  role TEXT NOT NULL CHECK (role IN ('owner','clinic_admin','professional','assistant','financial')),
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  invited_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  expires_at DATETIME NOT NULL,
  accepted_at DATETIME,
  accepted_user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
  revoked_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (accepted_at IS NULL AND accepted_user_id IS NULL)
    OR (accepted_at IS NOT NULL AND accepted_user_id IS NOT NULL)
  ),
  CHECK (accepted_at IS NULL OR revoked_at IS NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_clinic_invitations_pending_email
  ON clinic_invitations(clinic_id, lower(email))
  WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clinic_invitations_clinic_pending
  ON clinic_invitations(clinic_id, accepted_at, revoked_at, expires_at);

CREATE TABLE IF NOT EXISTS commercial_trial_claims (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
  clinic_id TEXT NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE RESTRICT,
  claimed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- O limite não depende apenas do SELECT do handler: duas inclusões concorrentes
-- também são serializadas pelo próprio SQLite e a segunda falha fisicamente.
CREATE TRIGGER IF NOT EXISTS trg_clinic_memberships_billing_seat_insert
BEFORE INSERT ON clinic_memberships
WHEN NEW.active = 1
 AND EXISTS (SELECT 1 FROM billing_accounts b WHERE b.clinic_id = NEW.clinic_id)
 AND (
   (SELECT COUNT(*) FROM clinic_memberships m
     WHERE m.clinic_id = NEW.clinic_id AND m.active = 1)
   +
   (SELECT COUNT(*) FROM clinic_invitations i
     WHERE i.clinic_id = NEW.clinic_id
       AND i.accepted_at IS NULL AND i.revoked_at IS NULL
       AND datetime(i.expires_at) > datetime('now'))
 )
     >= (SELECT b.seat_quantity FROM billing_accounts b WHERE b.clinic_id = NEW.clinic_id)
BEGIN
  SELECT RAISE(ABORT, 'SEAT_LIMIT_REACHED');
END;

CREATE TRIGGER IF NOT EXISTS trg_clinic_memberships_billing_seat_reactivate
BEFORE UPDATE OF active ON clinic_memberships
WHEN OLD.active <> 1 AND NEW.active = 1
 AND EXISTS (SELECT 1 FROM billing_accounts b WHERE b.clinic_id = NEW.clinic_id)
 AND (
   (SELECT COUNT(*) FROM clinic_memberships m
     WHERE m.clinic_id = NEW.clinic_id AND m.active = 1)
   +
   (SELECT COUNT(*) FROM clinic_invitations i
     WHERE i.clinic_id = NEW.clinic_id
       AND i.accepted_at IS NULL AND i.revoked_at IS NULL
       AND datetime(i.expires_at) > datetime('now'))
 )
     >= (SELECT b.seat_quantity FROM billing_accounts b WHERE b.clinic_id = NEW.clinic_id)
BEGIN
  SELECT RAISE(ABORT, 'SEAT_LIMIT_REACHED');
END;

-- Convites pendentes reservam assento. Isso evita emitir mais links válidos do
-- que a contratação comporta; a trava de membership continua protegendo a
-- aceitação contra corrida, revogação ou expiração concorrente.
CREATE TRIGGER IF NOT EXISTS trg_clinic_invitations_billing_seat_insert
BEFORE INSERT ON clinic_invitations
WHEN EXISTS (SELECT 1 FROM billing_accounts b WHERE b.clinic_id = NEW.clinic_id)
 AND (
   (SELECT COUNT(*) FROM clinic_memberships m
     WHERE m.clinic_id = NEW.clinic_id AND m.active = 1)
   +
   (SELECT COUNT(*) FROM clinic_invitations i
     WHERE i.clinic_id = NEW.clinic_id
       AND i.accepted_at IS NULL AND i.revoked_at IS NULL
       AND datetime(i.expires_at) > datetime('now'))
 ) >= (SELECT b.seat_quantity FROM billing_accounts b WHERE b.clinic_id = NEW.clinic_id)
BEGIN
  SELECT RAISE(ABORT, 'SEAT_LIMIT_REACHED');
END;

-- Backfill idempotente para clínicas criadas antes desta migração. A quantidade
-- inicial nunca fica abaixo dos membros ativos já existentes.
INSERT OR IGNORE INTO billing_accounts
  (clinic_id, plan_code, status, seat_quantity, provider, trial_ends_at,
   cancel_at_period_end, created_at, updated_at)
SELECT c.id, 'neuroped_pro_99',
       CASE WHEN c.id = (
         SELECT MIN(first_clinic.id) FROM clinics first_clinic
          WHERE first_clinic.created_by_user_id = c.created_by_user_id
       ) THEN 'trialing' ELSE 'incomplete' END,
       MAX(1, (SELECT COUNT(*) FROM clinic_memberships m
                WHERE m.clinic_id = c.id AND m.active = 1)),
       'stripe',
       CASE WHEN c.id = (
         SELECT MIN(first_clinic.id) FROM clinics first_clinic
          WHERE first_clinic.created_by_user_id = c.created_by_user_id
       ) THEN datetime('now', '+14 days') ELSE NULL END,
       0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM clinics c;

INSERT OR IGNORE INTO commercial_trial_claims (user_id, clinic_id, claimed_at)
SELECT c.created_by_user_id, MIN(c.id), CURRENT_TIMESTAMP
  FROM clinics c
 GROUP BY c.created_by_user_id;
