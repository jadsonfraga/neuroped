-- NeuroPed SaaS — Authorization Logs (Module 7)
--
-- Complete audit trail of access attempts (allowed and denied)
-- Critical for compliance, debugging, and security analysis

CREATE TABLE IF NOT EXISTS authorization_logs (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT,
  result TEXT NOT NULL CHECK (
    result IN ('allowed', 'denied')
  ),
  reason TEXT, -- e.g., "insufficient_role", "clinic_mismatch", "rate_limit_exceeded"
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_log_clinic
  ON authorization_logs(clinic_id);

CREATE INDEX IF NOT EXISTS idx_auth_log_user
  ON authorization_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_log_result
  ON authorization_logs(result);

CREATE INDEX IF NOT EXISTS idx_auth_log_date
  ON authorization_logs(created_at);

-- View: Failed access attempts (security monitoring)
CREATE VIEW IF NOT EXISTS failed_access_attempts AS
SELECT
  clinic_id,
  user_id,
  action,
  reason,
  COUNT(*) as attempt_count,
  MAX(created_at) as last_attempt,
  GROUP_CONCAT(DISTINCT ip_address) as ip_addresses
FROM authorization_logs
WHERE result = 'denied'
  AND datetime(created_at) > datetime('now', '-24 hours')
GROUP BY clinic_id, user_id, action, reason
HAVING COUNT(*) > 2
ORDER BY attempt_count DESC;

-- View: Usage summary per clinic (audit)
CREATE VIEW IF NOT EXISTS authorization_summary AS
SELECT
  clinic_id,
  user_id,
  COUNT(*) as total_actions,
  SUM(CASE WHEN result = 'allowed' THEN 1 ELSE 0 END) as allowed_count,
  SUM(CASE WHEN result = 'denied' THEN 1 ELSE 0 END) as denied_count,
  CAST(SUM(CASE WHEN result = 'denied' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as denial_rate_percent,
  MIN(created_at) as first_action,
  MAX(created_at) as last_action
FROM authorization_logs
WHERE datetime(created_at) > datetime('now', '-30 days')
GROUP BY clinic_id, user_id
ORDER BY clinic_id, total_actions DESC;
