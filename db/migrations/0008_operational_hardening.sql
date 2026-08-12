CREATE TABLE IF NOT EXISTS booking_staff_links (
  provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  staff_user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (provider_user_id, staff_user_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_staff_provider_active
  ON booking_staff_links(provider_user_id, active, staff_user_id);

CREATE TABLE IF NOT EXISTS operations_audit_log (
  id TEXT PRIMARY KEY,
  provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata_json TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_operations_audit_provider_time
  ON operations_audit_log(provider_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_operations_audit_actor_time
  ON operations_audit_log(actor_user_id, created_at DESC);

-- Bloqueios/férias e consultas ocupantes são mutuamente exclusivos.
-- Triggers cobrem inclusive corrida entre requisições que passe por validações de UI/API.
CREATE TRIGGER IF NOT EXISTS trg_appointments_respect_blocks_insert
BEFORE INSERT ON appointments
WHEN NEW.status IN ('requested','confirmed','checked_in','in_care')
 AND EXISTS (
   SELECT 1
     FROM booking_blocks b
    WHERE b.provider_user_id = NEW.provider_user_id
      AND b.starts_at_local < NEW.ends_at_local
      AND b.ends_at_local > NEW.starts_at_local
 )
BEGIN
  SELECT RAISE(ABORT, 'SCHEDULE_CONFLICT');
END;

CREATE TRIGGER IF NOT EXISTS trg_appointments_respect_blocks_update
BEFORE UPDATE OF provider_user_id, starts_at_local, ends_at_local, status ON appointments
WHEN NEW.status IN ('requested','confirmed','checked_in','in_care')
 AND EXISTS (
   SELECT 1
     FROM booking_blocks b
    WHERE b.provider_user_id = NEW.provider_user_id
      AND b.starts_at_local < NEW.ends_at_local
      AND b.ends_at_local > NEW.starts_at_local
 )
BEGIN
  SELECT RAISE(ABORT, 'SCHEDULE_CONFLICT');
END;

CREATE TRIGGER IF NOT EXISTS trg_blocks_respect_appointments_insert
BEFORE INSERT ON booking_blocks
WHEN EXISTS (
   SELECT 1
     FROM appointments a
    WHERE a.provider_user_id = NEW.provider_user_id
      AND a.status IN ('requested','confirmed','checked_in','in_care')
      AND a.starts_at_local < NEW.ends_at_local
      AND a.ends_at_local > NEW.starts_at_local
 )
BEGIN
  SELECT RAISE(ABORT, 'SCHEDULE_CONFLICT');
END;

CREATE TRIGGER IF NOT EXISTS trg_blocks_respect_appointments_update
BEFORE UPDATE OF provider_user_id, starts_at_local, ends_at_local ON booking_blocks
WHEN EXISTS (
   SELECT 1
     FROM appointments a
    WHERE a.provider_user_id = NEW.provider_user_id
      AND a.status IN ('requested','confirmed','checked_in','in_care')
      AND a.starts_at_local < NEW.ends_at_local
      AND a.ends_at_local > NEW.starts_at_local
 )
BEGIN
  SELECT RAISE(ABORT, 'SCHEDULE_CONFLICT');
END;