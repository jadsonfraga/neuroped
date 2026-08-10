-- NeuroPed Operational Suite v1
-- Agenda, autoagendamento, lista de espera, reputação e financeiro básico.
-- Dados de contato do booking são persistidos cifrados; campos públicos ficam separados.

CREATE TABLE IF NOT EXISTS booking_provider_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  location_label TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Recife',
  booking_enabled INTEGER NOT NULL DEFAULT 0 CHECK (booking_enabled IN (0,1)),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_services (
  id TEXT PRIMARY KEY,
  provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 10 AND 480),
  price_cents INTEGER CHECK (price_cents IS NULL OR price_cents BETWEEN 0 AND 100000000),
  modality TEXT NOT NULL DEFAULT 'in_person' CHECK (modality IN ('in_person','remote')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  public_visible INTEGER NOT NULL DEFAULT 1 CHECK (public_visible IN (0,1)),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_booking_services_provider
  ON booking_services(provider_user_id, active, public_visible);

CREATE TABLE IF NOT EXISTS booking_availability_rules (
  id TEXT PRIMARY KEY,
  provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_minute INTEGER NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute INTEGER NOT NULL CHECK (end_minute BETWEEN 1 AND 1440),
  slot_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_minutes BETWEEN 5 AND 240),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_minute > start_minute)
);
CREATE INDEX IF NOT EXISTS idx_booking_rules_provider_weekday
  ON booking_availability_rules(provider_user_id, weekday, active);

CREATE TABLE IF NOT EXISTS booking_blocks (
  id TEXT PRIMARY KEY,
  provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starts_at_local TEXT NOT NULL,
  ends_at_local TEXT NOT NULL,
  reason TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (ends_at_local > starts_at_local)
);
CREATE INDEX IF NOT EXISTS idx_booking_blocks_provider_time
  ON booking_blocks(provider_user_id, starts_at_local, ends_at_local);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES booking_services(id) ON DELETE RESTRICT,
  patient_id TEXT,
  starts_at_local TEXT NOT NULL,
  ends_at_local TEXT NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested','confirmed','checked_in','in_care','completed','cancelled','no_show'
  )),
  source TEXT NOT NULL DEFAULT 'public' CHECK (source IN ('public','professional','waitlist')),
  booking_token_hash TEXT NOT NULL UNIQUE,
  guardian_name_encrypted TEXT,
  guardian_email_encrypted TEXT,
  guardian_phone_encrypted TEXT,
  patient_name_encrypted TEXT,
  amount_cents INTEGER CHECK (amount_cents IS NULL OR amount_cents BETWEEN 0 AND 100000000),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','waived','refunded')),
  payment_method TEXT,
  checked_in_at DATETIME,
  completed_at DATETIME,
  cancelled_at DATETIME,
  cancel_reason TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (ends_at_local > starts_at_local)
);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_time
  ON appointments(provider_user_id, starts_at_local);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_status
  ON appointments(provider_user_id, status, starts_at_local);
CREATE UNIQUE INDEX IF NOT EXISTS ux_appointments_occupied_slot
  ON appointments(provider_user_id, starts_at_local)
  WHERE status IN ('requested','confirmed','checked_in','in_care');

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id TEXT PRIMARY KEY,
  provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES booking_services(id) ON DELETE CASCADE,
  preferred_date TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','offered','booked','closed')),
  access_token_hash TEXT NOT NULL UNIQUE,
  guardian_name_encrypted TEXT,
  guardian_email_encrypted TEXT,
  guardian_phone_encrypted TEXT,
  patient_name_encrypted TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_waitlist_provider_status
  ON waitlist_entries(provider_user_id, status, created_at);

CREATE TABLE IF NOT EXISTS appointment_reviews (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment_encrypted TEXT,
  approved INTEGER NOT NULL DEFAULT 0 CHECK (approved IN (0,1)),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reviews_provider_approved
  ON appointment_reviews(provider_user_id, approved, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_outbox (
  id TEXT PRIMARY KEY,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE CASCADE,
  provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'manual' CHECK (channel IN ('manual','email','whatsapp','sms')),
  template TEXT NOT NULL,
  recipient_encrypted TEXT,
  payload_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_provider' CHECK (status IN ('pending_provider','manual_sent','delivered','failed')),
  provider_message_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_provider_status
  ON notification_outbox(provider_user_id, status, created_at DESC);
