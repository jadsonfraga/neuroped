-- NeuroPed SaaS — Onboarding Checklist
--
-- Tracking de progresso de ativação da clínica
-- Etapas: clinic_profile, team_members, services, communication, integrations

CREATE TABLE IF NOT EXISTS onboarding_checklist (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL,
  step_id TEXT NOT NULL CHECK (
    step_id IN (
      'clinic_profile',
      'team_members',
      'services',
      'communication',
      'integrations'
    )
  ),
  step_label TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  completed_by TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_clinic_step
  ON onboarding_checklist(clinic_id, step_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_clinic
  ON onboarding_checklist(clinic_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_completed
  ON onboarding_checklist(completed);

-- Trigger para auto-insert de checklist quando clínica é criada
DROP TRIGGER IF EXISTS trg_clinic_create_onboarding;

CREATE TRIGGER trg_clinic_create_onboarding
AFTER INSERT ON clinics
FOR EACH ROW
BEGIN
  -- clinic_profile
  INSERT INTO onboarding_checklist
    (id, clinic_id, step_id, step_label, completed, created_at, updated_at)
  VALUES (
    'oc_' || lower(hex(randomblob(16))),
    NEW.id,
    'clinic_profile',
    'Perfil da Clínica',
    0,
    datetime('now'),
    datetime('now')
  );

  -- team_members
  INSERT INTO onboarding_checklist
    (id, clinic_id, step_id, step_label, completed, created_at, updated_at)
  VALUES (
    'oc_' || lower(hex(randomblob(16))),
    NEW.id,
    'team_members',
    'Membros da Equipe',
    0,
    datetime('now'),
    datetime('now')
  );

  -- services
  INSERT INTO onboarding_checklist
    (id, clinic_id, step_id, step_label, completed, created_at, updated_at)
  VALUES (
    'oc_' || lower(hex(randomblob(16))),
    NEW.id,
    'services',
    'Serviços Oferecidos',
    0,
    datetime('now'),
    datetime('now')
  );

  -- communication
  INSERT INTO onboarding_checklist
    (id, clinic_id, step_id, step_label, completed, created_at, updated_at)
  VALUES (
    'oc_' || lower(hex(randomblob(16))),
    NEW.id,
    'communication',
    'Configurar Comunicação',
    0,
    datetime('now'),
    datetime('now')
  );

  -- integrations
  INSERT INTO onboarding_checklist
    (id, clinic_id, step_id, step_label, completed, created_at, updated_at)
  VALUES (
    'oc_' || lower(hex(randomblob(16))),
    NEW.id,
    'integrations',
    'Integrações',
    0,
    datetime('now'),
    datetime('now')
  );
END;
