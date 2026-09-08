-- NeuroPed SaaS — catálogo comercial canônico.
--
-- Esta migração não substitui billing, auth, memberships nem Clinical Core.
-- Ela cria o contrato persistente do produto vendável: o que foi licenciado,
-- para qual unidade, com quais usuários e quais limites.
--
-- Fronteira do produto inicial:
-- * uma unidade por licença;
-- * até 10 usuários autorizados;
-- * cinco materiais educativo-operacionais;
-- * nenhum dado identificável de paciente deve ser enviado ao produto;
-- * sem ato médico, PANT, NeuroBoard, scoring psicométrico ou apoio à decisão.

CREATE TABLE IF NOT EXISTS commercial_offers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),
  term_days INTEGER NOT NULL CHECK (term_days >= 1),
  sale_mode TEXT NOT NULL CHECK (sale_mode IN ('invite_only','gated','public')),
  lifecycle_status TEXT NOT NULL DEFAULT 'active'
    CHECK (lifecycle_status IN ('draft','active','retired')),
  max_units INTEGER NOT NULL DEFAULT 1 CHECK (max_units >= 1),
  max_authorized_users INTEGER NOT NULL CHECK (max_authorized_users >= 1),
  max_licenses INTEGER CHECK (max_licenses IS NULL OR max_licenses >= 1),
  onboarding_minutes INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_minutes >= 0),
  support_minutes INTEGER NOT NULL DEFAULT 0 CHECK (support_minutes >= 0),
  accepts_patient_data INTEGER NOT NULL DEFAULT 0 CHECK (accepts_patient_data IN (0,1)),
  includes_medical_service INTEGER NOT NULL DEFAULT 0 CHECK (includes_medical_service IN (0,1)),
  includes_clinical_decision_support INTEGER NOT NULL DEFAULT 0
    CHECK (includes_clinical_decision_support IN (0,1)),
  includes_psychometric_scoring INTEGER NOT NULL DEFAULT 0
    CHECK (includes_psychometric_scoring IN (0,1)),
  includes_pant INTEGER NOT NULL DEFAULT 0 CHECK (includes_pant IN (0,1)),
  includes_neuroboard INTEGER NOT NULL DEFAULT 0 CHECK (includes_neuroboard IN (0,1)),
  allows_redistribution INTEGER NOT NULL DEFAULT 0 CHECK (allows_redistribution IN (0,1)),
  allows_white_label INTEGER NOT NULL DEFAULT 0 CHECK (allows_white_label IN (0,1)),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS commercial_offer_features (
  offer_id TEXT NOT NULL REFERENCES commercial_offers(id) ON DELETE CASCADE,
  feature_code TEXT NOT NULL CHECK (feature_code IN (
    'form.preconsultation',
    'form.change_log',
    'form.school_feedback',
    'form.approved_plan',
    'form.routine_log'
  )),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  PRIMARY KEY (offer_id, feature_code)
);

INSERT OR IGNORE INTO commercial_offers (
  id, code, name, price_cents, currency, term_days, sale_mode, lifecycle_status,
  max_units, max_authorized_users, max_licenses, onboarding_minutes, support_minutes,
  accepts_patient_data, includes_medical_service, includes_clinical_decision_support,
  includes_psychometric_scoring, includes_pant, includes_neuroboard,
  allows_redistribution, allows_white_label
) VALUES
  (
    'commercial-institutional-pilot-1-0',
    'institutional-pilot-1-0',
    'NeuroPed Institucional — Piloto 1.0',
    149000, 'BRL', 365, 'invite_only', 'active',
    1, 10, 3, 60, 120,
    0, 0, 0, 0, 0, 0, 0, 0
  ),
  (
    'commercial-institutional-annual-1-0',
    'institutional-annual-1-0',
    'NeuroPed Institucional — Anual 1.0',
    249000, 'BRL', 365, 'gated', 'active',
    1, 10, NULL, 60, 120,
    0, 0, 0, 0, 0, 0, 0, 0
  );

INSERT OR IGNORE INTO commercial_offer_features (offer_id, feature_code, enabled)
SELECT id, feature_code, 1
FROM commercial_offers
CROSS JOIN (
  SELECT 'form.preconsultation' AS feature_code
  UNION ALL SELECT 'form.change_log'
  UNION ALL SELECT 'form.school_feedback'
  UNION ALL SELECT 'form.approved_plan'
  UNION ALL SELECT 'form.routine_log'
)
WHERE code IN ('institutional-pilot-1-0','institutional-annual-1-0');

CREATE TABLE IF NOT EXISTS commercial_licenses (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  offer_id TEXT NOT NULL REFERENCES commercial_offers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','suspended','expired','canceled')),
  unit_label TEXT NOT NULL,
  contract_version TEXT NOT NULL,
  billing_reference TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  activated_at DATETIME,
  expires_at DATETIME,
  suspended_at DATETIME,
  canceled_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (status = 'active' AND activated_at IS NOT NULL AND expires_at IS NOT NULL)
    OR status <> 'active'
  )
);

-- Produto inicial: uma única licença viva por tenant/unidade.
CREATE UNIQUE INDEX IF NOT EXISTS ux_commercial_license_live_clinic
  ON commercial_licenses(clinic_id)
  WHERE status IN ('pending','active','suspended');
CREATE INDEX IF NOT EXISTS idx_commercial_licenses_offer_status
  ON commercial_licenses(offer_id, status, created_at);

CREATE TABLE IF NOT EXISTS commercial_license_acceptances (
  license_id TEXT PRIMARY KEY REFERENCES commercial_licenses(id) ON DELETE CASCADE,
  accepted_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  terms_version TEXT NOT NULL,
  no_patient_data_accepted INTEGER NOT NULL CHECK (no_patient_data_accepted = 1),
  no_medical_service_accepted INTEGER NOT NULL CHECK (no_medical_service_accepted = 1),
  no_redistribution_accepted INTEGER NOT NULL CHECK (no_redistribution_accepted = 1),
  accepted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS commercial_license_users (
  license_id TEXT NOT NULL REFERENCES commercial_licenses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  authorized_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  authorized_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME,
  PRIMARY KEY (license_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_commercial_license_users_active
  ON commercial_license_users(license_id, status, authorized_at);

CREATE TABLE IF NOT EXISTS commercial_usage_events (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  license_id TEXT NOT NULL REFERENCES commercial_licenses(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN (
    'material_open',
    'material_export',
    'onboarding_minutes',
    'support_minutes',
    'authorized_user_added',
    'authorized_user_revoked'
  )),
  feature_code TEXT CHECK (feature_code IS NULL OR feature_code IN (
    'form.preconsultation',
    'form.change_log',
    'form.school_feedback',
    'form.approved_plan',
    'form.routine_log'
  )),
  minutes INTEGER CHECK (minutes IS NULL OR minutes >= 0),
  -- Metadado operacional com allow-list validada na aplicação. Nunca PHI.
  metadata_json TEXT CHECK (metadata_json IS NULL OR length(metadata_json) <= 2048),
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_commercial_usage_license_time
  ON commercial_usage_events(license_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_commercial_usage_clinic_kind
  ON commercial_usage_events(clinic_id, kind, occurred_at DESC);
