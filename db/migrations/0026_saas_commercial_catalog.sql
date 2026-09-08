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

-- Toda licença nasce pendente. Ativação só existe por transição auditável.
CREATE TRIGGER IF NOT EXISTS trg_commercial_license_must_start_pending
BEFORE INSERT ON commercial_licenses
WHEN NEW.status <> 'pending'
BEGIN
  SELECT RAISE(ABORT, 'commercial license must start pending');
END;

-- Protege o teto da coorte também contra concorrência/rotas futuras.
CREATE TRIGGER IF NOT EXISTS trg_commercial_license_offer_cap
BEFORE INSERT ON commercial_licenses
WHEN (SELECT max_licenses FROM commercial_offers WHERE id = NEW.offer_id) IS NOT NULL
BEGIN
  SELECT CASE WHEN (
    SELECT COUNT(*)
      FROM commercial_licenses cl
     WHERE cl.offer_id = NEW.offer_id
       AND cl.status IN ('pending','active','suspended')
  ) >= (
    SELECT max_licenses FROM commercial_offers WHERE id = NEW.offer_id
  ) THEN RAISE(ABORT, 'commercial offer license cap reached') END;
END;

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

-- Assento comercial exige membership ativa da mesma clínica.
CREATE TRIGGER IF NOT EXISTS trg_commercial_license_user_membership_insert
BEFORE INSERT ON commercial_license_users
WHEN NEW.status = 'active'
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
      FROM commercial_licenses cl
      JOIN clinic_memberships cm
        ON cm.clinic_id = cl.clinic_id
       AND cm.user_id = NEW.user_id
       AND cm.active = 1
     WHERE cl.id = NEW.license_id
  ) THEN RAISE(ABORT, 'commercial user must be active clinic member') END;
END;

CREATE TRIGGER IF NOT EXISTS trg_commercial_license_user_membership_reactivate
BEFORE UPDATE OF status ON commercial_license_users
WHEN OLD.status <> 'active' AND NEW.status = 'active'
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
      FROM commercial_licenses cl
      JOIN clinic_memberships cm
        ON cm.clinic_id = cl.clinic_id
       AND cm.user_id = NEW.user_id
       AND cm.active = 1
     WHERE cl.id = NEW.license_id
  ) THEN RAISE(ABORT, 'commercial user must be active clinic member') END;
END;

-- Teto de usuários pertence ao offer e é imposto no banco, não só na API.
CREATE TRIGGER IF NOT EXISTS trg_commercial_license_user_cap_insert
BEFORE INSERT ON commercial_license_users
WHEN NEW.status = 'active'
BEGIN
  SELECT CASE WHEN (
    SELECT COUNT(*)
      FROM commercial_license_users clu
     WHERE clu.license_id = NEW.license_id AND clu.status = 'active'
  ) >= (
    SELECT co.max_authorized_users
      FROM commercial_licenses cl
      JOIN commercial_offers co ON co.id = cl.offer_id
     WHERE cl.id = NEW.license_id
  ) THEN RAISE(ABORT, 'commercial authorized user cap reached') END;
END;

CREATE TRIGGER IF NOT EXISTS trg_commercial_license_user_cap_reactivate
BEFORE UPDATE OF status ON commercial_license_users
WHEN OLD.status <> 'active' AND NEW.status = 'active'
BEGIN
  SELECT CASE WHEN (
    SELECT COUNT(*)
      FROM commercial_license_users clu
     WHERE clu.license_id = NEW.license_id AND clu.status = 'active'
  ) >= (
    SELECT co.max_authorized_users
      FROM commercial_licenses cl
      JOIN commercial_offers co ON co.id = cl.offer_id
     WHERE cl.id = NEW.license_id
  ) THEN RAISE(ABORT, 'commercial authorized user cap reached') END;
END;

-- Uma licença não fica ativa sem cobrança conciliada, aceite da versão exata
-- por gestor ativo da unidade e ao menos um usuário autorizado.
CREATE TRIGGER IF NOT EXISTS trg_commercial_license_activation_contract
BEFORE UPDATE OF status ON commercial_licenses
WHEN OLD.status <> 'active' AND NEW.status = 'active'
BEGIN
  SELECT CASE WHEN NEW.billing_reference IS NULL OR length(trim(NEW.billing_reference)) = 0
    THEN RAISE(ABORT, 'commercial billing reference required before activation') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
      FROM commercial_license_acceptances a
      JOIN clinic_memberships cm
        ON cm.clinic_id = NEW.clinic_id
       AND cm.user_id = a.accepted_by_user_id
       AND cm.active = 1
       AND cm.role IN ('owner','clinic_admin')
     WHERE a.license_id = NEW.id
       AND a.terms_version = NEW.contract_version
  ) THEN RAISE(ABORT, 'commercial manager acceptance required before activation') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
      FROM commercial_license_users u
     WHERE u.license_id = NEW.id AND u.status = 'active'
  ) THEN RAISE(ABORT, 'commercial authorized user required before activation') END;
END;

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

CREATE TRIGGER IF NOT EXISTS trg_commercial_usage_same_tenant
BEFORE INSERT ON commercial_usage_events
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM commercial_licenses cl
     WHERE cl.id = NEW.license_id AND cl.clinic_id = NEW.clinic_id
  ) THEN RAISE(ABORT, 'commercial usage license/clinic mismatch') END;
END;

CREATE TRIGGER IF NOT EXISTS trg_commercial_usage_licensed_feature
BEFORE INSERT ON commercial_usage_events
WHEN NEW.feature_code IS NOT NULL
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
      FROM commercial_licenses cl
      JOIN commercial_offer_features f
        ON f.offer_id = cl.offer_id
       AND f.feature_code = NEW.feature_code
       AND f.enabled = 1
     WHERE cl.id = NEW.license_id
  ) THEN RAISE(ABORT, 'commercial feature not licensed') END;
END;

-- Uso dos materiais exige ator autorizado na licença. Suporte/onboarding pode
-- ser registrado por operador da plataforma sem transformar suporte em acesso.
CREATE TRIGGER IF NOT EXISTS trg_commercial_material_usage_authorized_user
BEFORE INSERT ON commercial_usage_events
WHEN NEW.kind IN ('material_open','material_export')
BEGIN
  SELECT CASE WHEN NEW.actor_user_id IS NULL OR NOT EXISTS (
    SELECT 1
      FROM commercial_license_users u
      JOIN commercial_licenses cl ON cl.id = u.license_id
     WHERE u.license_id = NEW.license_id
       AND u.user_id = NEW.actor_user_id
       AND u.status = 'active'
       AND cl.clinic_id = NEW.clinic_id
       AND cl.status = 'active'
  ) THEN RAISE(ABORT, 'commercial material usage requires authorized active user') END;
END;
