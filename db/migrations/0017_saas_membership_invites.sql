-- Convites de membership: não armazenar e-mail nem token em claro.
CREATE TABLE IF NOT EXISTS saas_membership_invites (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  email_hash TEXT NOT NULL CHECK (length(email_hash) = 64),
  role TEXT NOT NULL CHECK (role IN ('clinic_admin','professional','assistant','financial')),
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  expires_at DATETIME NOT NULL,
  accepted_at DATETIME,
  revoked_at DATETIME,
  invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (accepted_at IS NULL OR revoked_at IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_saas_membership_invites_clinic_status
  ON saas_membership_invites(clinic_id, expires_at, accepted_at, revoked_at);
CREATE INDEX IF NOT EXISTS idx_saas_membership_invites_email
  ON saas_membership_invites(clinic_id, email_hash, role);

CREATE TRIGGER IF NOT EXISTS trg_saas_membership_invites_scope_immutable
BEFORE UPDATE OF clinic_id, email_hash, role, token_hash ON saas_membership_invites
WHEN NEW.clinic_id <> OLD.clinic_id
  OR NEW.email_hash <> OLD.email_hash
  OR NEW.role <> OLD.role
  OR NEW.token_hash <> OLD.token_hash
BEGIN
  SELECT RAISE(ABORT, 'SAAS_INVITE_SCOPE_IMMUTABLE');
END;
