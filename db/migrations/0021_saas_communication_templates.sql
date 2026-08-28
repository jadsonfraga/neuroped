-- NeuroPed SaaS — Communication Templates (Module 4)
--
-- Email, SMS, WhatsApp templates with variable substitution
-- Supports clinic-specific message customization

CREATE TABLE IF NOT EXISTS communication_templates (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (
    channel IN ('email', 'sms', 'whatsapp')
  ),
  subject TEXT, -- Email only
  body TEXT NOT NULL,
  variables TEXT, -- JSON array of variable names
  is_active INTEGER NOT NULL DEFAULT 1,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_template_clinic_channel
  ON communication_templates(clinic_id, channel, name);

CREATE INDEX IF NOT EXISTS idx_template_clinic
  ON communication_templates(clinic_id);

CREATE INDEX IF NOT EXISTS idx_template_active
  ON communication_templates(is_active);

-- View: Latest templates per clinic
CREATE VIEW IF NOT EXISTS latest_communication_templates AS
SELECT DISTINCT ON (clinic_id, channel)
  clinic_id,
  channel,
  name,
  is_active,
  updated_at
FROM communication_templates
WHERE is_active = 1
ORDER BY clinic_id, channel, updated_at DESC;
