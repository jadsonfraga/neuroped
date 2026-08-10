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
