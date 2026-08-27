-- NeuroPed SaaS Hub — hardening dos fluxos existentes e módulos de parceiros/comunicação.
-- O conteúdo clínico/PII permanece cifrado na aplicação; os IDs e metadados são tenant-scoped.

-- Evolução aditiva do lifecycle: o estado de reativação não pode reutilizar o
-- estado closed, que continua terminal por trigger.
DROP TRIGGER IF EXISTS trg_tenant_lifecycle_closed_terminal;
DROP TRIGGER IF EXISTS trg_clinic_create_tenant_lifecycle;
DROP TABLE IF EXISTS tenant_lifecycle_v2;
CREATE TABLE tenant_lifecycle_v2 (
  clinic_id TEXT PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','closure_requested','reactivation_requested','closed')),
  previous_clinic_status TEXT CHECK (previous_clinic_status IS NULL OR previous_clinic_status IN ('active','suspended','closed')),
  previous_billing_status TEXT CHECK (previous_billing_status IS NULL OR previous_billing_status IN ('pending','trial','active','past_due','suspended','canceled')),
  reason_code TEXT CHECK (reason_code IS NULL OR reason_code IN ('customer_request','duplicate_tenant','migration','other')),
  requested_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  requested_at DATETIME,
  retention_until DATETIME,
  canceled_at DATETIME,
  finalized_at DATETIME,
  legal_hold INTEGER NOT NULL DEFAULT 0 CHECK (legal_hold IN (0,1)),
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (status <> 'closure_requested' OR (requested_at IS NOT NULL AND retention_until IS NOT NULL AND reason_code IS NOT NULL)),
  CHECK (status <> 'reactivation_requested' OR requested_at IS NOT NULL),
  CHECK (status <> 'closed' OR finalized_at IS NOT NULL)
);
INSERT OR IGNORE INTO tenant_lifecycle_v2
  (clinic_id, status, previous_clinic_status, previous_billing_status, reason_code,
   requested_by_user_id, requested_at, retention_until, canceled_at, finalized_at,
   legal_hold, updated_at)
SELECT clinic_id, status, previous_clinic_status, previous_billing_status, reason_code,
       requested_by_user_id, requested_at, retention_until, canceled_at, finalized_at,
       legal_hold, updated_at
  FROM tenant_lifecycle;
DROP TABLE tenant_lifecycle;
ALTER TABLE tenant_lifecycle_v2 RENAME TO tenant_lifecycle;
CREATE INDEX IF NOT EXISTS idx_tenant_lifecycle_status_retention ON tenant_lifecycle(status, retention_until);
CREATE TRIGGER IF NOT EXISTS trg_clinic_create_tenant_lifecycle
AFTER INSERT ON clinics FOR EACH ROW BEGIN
  INSERT OR IGNORE INTO tenant_lifecycle (clinic_id, status, finalized_at, updated_at)
  VALUES (NEW.id, CASE WHEN NEW.status = 'closed' THEN 'closed' ELSE 'active' END,
          CASE WHEN NEW.status = 'closed' THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP);
END;
CREATE TRIGGER IF NOT EXISTS trg_tenant_lifecycle_closed_terminal
BEFORE UPDATE OF status ON tenant_lifecycle
FOR EACH ROW WHEN OLD.status = 'closed' AND NEW.status <> 'closed'
BEGIN SELECT RAISE(ABORT, 'TENANT_CLOSED_TERMINAL'); END;

CREATE TABLE IF NOT EXISTS onboarding_steps (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  label TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  required INTEGER NOT NULL DEFAULT 1 CHECK (required IN (0,1)),
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0,1)),
  completed_at DATETIME,
  completed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (clinic_id, step_key)
);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_clinic_position ON onboarding_steps(clinic_id, position);

CREATE TABLE IF NOT EXISTS tenant_webhook_events (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'queued' CHECK (delivery_status IN ('queued','processing','delivered','failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at DATETIME,
  delivered_at DATETIME,
  last_error TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tenant_webhook_events_delivery ON tenant_webhook_events(delivery_status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_tenant_webhook_events_clinic ON tenant_webhook_events(clinic_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tenant_reactivation_requests (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  requested_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed')),
  resolved_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  resolved_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tenant_reactivation_clinic_status ON tenant_reactivation_requests(clinic_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS availability_templates (
  id TEXT PRIMARY KEY,
  provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Recife',
  rules_json TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_availability_templates_provider_active ON availability_templates(provider_user_id, active, updated_at DESC);

CREATE TABLE IF NOT EXISTS partner_directory (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  partner_type TEXT NOT NULL DEFAULT 'other' CHECK (partner_type IN ('school','therapist','psychologist','psychiatrist','hospital','laboratory','social_service','other')),
  contact_name_encrypted TEXT,
  email_encrypted TEXT,
  phone_encrypted TEXT,
  specialty TEXT,
  notes_encrypted TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_partner_directory_clinic_status ON partner_directory(clinic_id, status, name);

CREATE TABLE IF NOT EXISTS partner_referrals (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL REFERENCES partner_directory(id) ON DELETE RESTRICT,
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  patient_reference_encrypted TEXT,
  patient_name_encrypted TEXT,
  guardian_contact_encrypted TEXT,
  notes_encrypted TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','received','accepted','completed','declined','cancelled')),
  referred_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_clinic_status ON partner_referrals(clinic_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_partner_time ON partner_referrals(partner_id, created_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_partner_referral_same_clinic_insert
BEFORE INSERT ON partner_referrals
WHEN NOT EXISTS (SELECT 1 FROM partner_directory p WHERE p.id = NEW.partner_id AND p.clinic_id = NEW.clinic_id)
BEGIN SELECT RAISE(ABORT, 'PARTNER_REFERRAL_TENANT_MISMATCH'); END;
CREATE TRIGGER IF NOT EXISTS trg_partner_referral_same_clinic_update
BEFORE UPDATE OF clinic_id, partner_id ON partner_referrals
WHEN NOT EXISTS (SELECT 1 FROM partner_directory p WHERE p.id = NEW.partner_id AND p.clinic_id = NEW.clinic_id)
BEGIN SELECT RAISE(ABORT, 'PARTNER_REFERRAL_TENANT_MISMATCH'); END;

CREATE TABLE IF NOT EXISTS communication_templates (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  channels_json TEXT NOT NULL,
  subject_template TEXT,
  body_template TEXT NOT NULL,
  is_system INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0,1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (clinic_id, template_key)
);
CREATE INDEX IF NOT EXISTS idx_communication_templates_clinic_active ON communication_templates(clinic_id, active, updated_at DESC);

CREATE TABLE IF NOT EXISTS communication_campaigns (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES communication_templates(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  audience_filter_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','queued','sending','completed','cancelled')),
  scheduled_for DATETIME,
  sent_at DATETIME,
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_communication_campaigns_clinic_status ON communication_campaigns(clinic_id, status, created_at DESC);
CREATE TRIGGER IF NOT EXISTS trg_communication_campaign_same_clinic_insert
BEFORE INSERT ON communication_campaigns
WHEN NOT EXISTS (SELECT 1 FROM communication_templates t WHERE t.id = NEW.template_id AND t.clinic_id = NEW.clinic_id)
BEGIN SELECT RAISE(ABORT, 'COMMUNICATION_TEMPLATE_TENANT_MISMATCH'); END;

CREATE TABLE IF NOT EXISTS communication_deliveries (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES communication_campaigns(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES communication_templates(id) ON DELETE SET NULL,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  survey_id TEXT REFERENCES feedback_surveys(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp','sms','manual')),
  recipient_encrypted TEXT NOT NULL,
  subject_encrypted TEXT,
  body_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sending','sent','delivered','failed','cancelled')),
  provider_message_id TEXT,
  last_error TEXT,
  sent_at DATETIME,
  delivered_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_communication_deliveries_clinic_status ON communication_deliveries(clinic_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_deliveries_campaign ON communication_deliveries(campaign_id, created_at DESC);
CREATE TRIGGER IF NOT EXISTS trg_communication_delivery_campaign_same_clinic
BEFORE INSERT ON communication_deliveries
WHEN NEW.campaign_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM communication_campaigns c WHERE c.id = NEW.campaign_id AND c.clinic_id = NEW.clinic_id)
BEGIN SELECT RAISE(ABORT, 'COMMUNICATION_CAMPAIGN_TENANT_MISMATCH'); END;

CREATE TABLE IF NOT EXISTS feedback_surveys (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  appointment_id TEXT UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
  provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  survey_type TEXT NOT NULL DEFAULT 'nps' CHECK (survey_type = 'nps'),
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','answered','expired','revoked')),
  score INTEGER CHECK (score BETWEEN 0 AND 10),
  comment_encrypted TEXT,
  expires_at DATETIME NOT NULL,
  answered_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_feedback_surveys_clinic_status ON feedback_surveys(clinic_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_surveys_provider_time ON feedback_surveys(provider_user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS feedback_survey_events (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL REFERENCES feedback_surveys(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created','answered','expired','revoked')),
  metadata_json TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_feedback_survey_events_survey_time ON feedback_survey_events(survey_id, created_at DESC);
