-- NeuroPed SaaS Phase 2 — billing, entitlements e onboarding de clinic/tenant.
--
-- Desenho (espelha a filosofia da Phase 1):
-- 1. billing é provider-agnostic na camada de domínio: as tabelas stores a
--    assinatura e o que o provedor de cobrança externaliza (ids, status,
--    eventos de webhook); a lógica de decisão vive no código compartilhado;
-- 2. nenhum dado do titular de pagamento (cartão, token de pagamento) é
--    armazenado aqui: apenas referências opacas do provedor;
-- 3. o entitlement sempre deriva da subscription — acesso pago é verificado
--    no backend; o frontend apenas reflete o estado;
-- 4. convites de onboarding têm token opaco, expiração e revogação;
-- 5. auditoria SaaS continua sem armazenar conteúdo clínico.

-- ──────────────────────────────────────────────────────────────────────────────
-- PLANOS: catálogo de planos (domínio, não hardcoded no provedor)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS billing_plans (
  id TEXT PRIMARY KEY,                              -- 'saas-professional'
  name TEXT NOT NULL,                               -- 'Plano Profissional'
  slug TEXT NOT NULL UNIQUE,                        -- 'professional'
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),   -- 9900 = R$ 99,00
  currency TEXT NOT NULL DEFAULT 'BRL',
  seat_price_cents INTEGER NOT NULL CHECK (seat_price_cents >= 0), -- 9900 = R$ 99/assento/mês
  trial_days INTEGER NOT NULL DEFAULT 14,
  max_seats INTEGER,                                -- NULL = ilimitado dentro do plano
  billing_cycle_days INTEGER NOT NULL DEFAULT 30,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO billing_plans
  (id, name, slug, price_cents, currency, seat_price_cents, trial_days, billing_cycle_days, is_active)
VALUES
  ('saas-professional', 'NeuroPed Professional', 'professional', 9900, 'BRL', 9900, 14, 30, 1);

CREATE INDEX IF NOT EXISTS idx_billing_plans_active ON billing_plans(is_active, created_at);

-- ──────────────────────────────────────────────────────────────────────────────
-- CUSTOMERS: conta de cobrança por clínica (1:1 com clinics)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS billing_customers (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
  /** Taxonomia controlada de provedor de cobrança aprovado, nunca texto livre. */
  provider TEXT NOT NULL CHECK (provider IN ('none', 'asaas', 'mercadopago', 'stripe', 'iugu', 'vindi')),
  /** ID do cliente no provedor externo (opaco). NULL enquanto sem provedor. */
  provider_customer_id TEXT,
  /** E-mail do responsável financeiro (para cobranças). */
  billing_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'trial', 'active', 'past_due', 'suspended', 'canceled')),
  /** Período de trial: termina quando trial_ends_at < now() e não foi convertido. */
  trial_ends_at DATETIME,
  /** Última falha de cobrança (para degradação graciosa). */
  last_failed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_customers_status ON billing_customers(status, created_at);
CREATE INDEX IF NOT EXISTS idx_billing_customers_trial ON billing_customers(trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────────────
-- SUBSCRIPTIONS: histórico imutável (uma ativa por customer, encadear cancelada)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES billing_plans(id) ON DELETE RESTRICT,
  /** Assentos contratados; se NULL usa o número de membros profissionais da clínica. */
  seats INTEGER,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'expired')),
  provider_subscription_id TEXT,                  -- referência opaca do provedor
  /** Ciclo atual: anchored_at é a âncora de cobrança (prorata deriva daqui). */
  anchored_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_starts_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_ends_at DATETIME,
  canceled_at DATETIME,
  cancel_reason TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_billing_subscriptions_active_customer
  ON billing_subscriptions(customer_id)
  WHERE status IN ('trial', 'active', 'past_due');

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_period
  ON billing_subscriptions(status, current_period_ends_at);

CREATE TABLE IF NOT EXISTS billing_invoice_events (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  /** ID opaco do evento/charge no provedor. */
  provider_event_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN (
    'charge_created', 'charge_paid', 'charge_failed', 'charge_refunded',
    'webhook_received', 'trial_started', 'trial_converted', 'subscription_canceled',
    'subscription_renewed', 'seats_changed'
  )),
  amount_cents INTEGER,
  status TEXT NOT NULL CHECK (status IN ('received', 'processing', 'done', 'ignored_duplicate')),
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_invoice_events_subscription
  ON billing_invoice_events(subscription_id, created_at DESC);

-- ──────────────────────────────────────────────────────────────────────────────
-- ENTITLEMENTS: snapshot derivado por usuário (revalidado no login/refresh e
-- após eventos de webhook). O backend consulta esta tabela; o frontend
-- apenas reflete via /api/auth/me e /api/billing/me.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS billing_entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  membership_role TEXT NOT NULL,
  plan_id TEXT,
  subscription_status TEXT,
  trial_active INTEGER NOT NULL DEFAULT 0 CHECK (trial_active IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  validated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, clinic_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_entitlements_user ON billing_entitlements(user_id, is_active);

-- ──────────────────────────────────────────────────────────────────────────────
-- ONBOARDING: convites para criar clínica / juntar-se a uma clínica
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clinic_invitations (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'clinic_admin', 'professional', 'assistant', 'financial')),
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at DATETIME NOT NULL,
  last_sent_at DATETIME,
  accepted_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clinic_invitations_email ON clinic_invitations(email, status);
CREATE INDEX IF NOT EXISTS idx_clinic_invitations_token ON clinic_invitations(token_hash)
  WHERE status = 'pending';

-- ──────────────────────────────────────────────────────────────────────────────
-- Auditoria SaaS: eventos de billing/onboarding (sem conteúdo clínico)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saas_audit_events (
  id TEXT PRIMARY KEY,
  clinic_id TEXT REFERENCES clinics(id) ON DELETE SET NULL,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  /** Taxonomia controlada — nunca PII em texto livre. */
  metadata_json TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saas_audit_events_clinic ON saas_audit_events(clinic_id, created_at DESC);
