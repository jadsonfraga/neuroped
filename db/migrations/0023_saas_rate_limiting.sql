-- NeuroPed SaaS — Rate Limiting State (Module 6)
--
-- Per-clinic API rate limiting with sliding window tracking
-- Prevents abuse while maintaining fair usage for all clinics

CREATE TABLE IF NOT EXISTS rate_limit_state (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  window_start TEXT NOT NULL,
  window_end TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  limit_per_window INTEGER NOT NULL DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK (
    status IN ('active', 'throttled', 'blocked')
  ),
  last_request_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rl_clinic_endpoint
  ON rate_limit_state(clinic_id, endpoint, window_start);

CREATE INDEX IF NOT EXISTS idx_rl_clinic
  ON rate_limit_state(clinic_id);

CREATE INDEX IF NOT EXISTS idx_rl_status
  ON rate_limit_state(status);

CREATE INDEX IF NOT EXISTS idx_rl_window
  ON rate_limit_state(window_start, window_end);

-- View: Current rate limit status per clinic/endpoint
CREATE VIEW IF NOT EXISTS current_rate_limits AS
SELECT
  clinic_id,
  endpoint,
  status,
  request_count,
  limit_per_window,
  CAST(request_count AS FLOAT) / limit_per_window * 100 AS usage_percent,
  last_request_at,
  window_start,
  window_end
FROM rate_limit_state
WHERE datetime(window_end) > datetime('now')
ORDER BY clinic_id, endpoint, window_start DESC;
