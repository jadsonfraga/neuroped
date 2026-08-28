-- NeuroPed SaaS — Institutions (Module 5)
--
-- B2B multi-clinic management (parent organizations)
-- Supports clinic hierarchies and role-based access

CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT,
  cnpj TEXT UNIQUE,
  country TEXT NOT NULL DEFAULT 'BR',
  city TEXT,
  state TEXT,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  admin_user_id TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  clinic_count INTEGER NOT NULL DEFAULT 0,
  metadata TEXT, -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_institution_cnpj
  ON institutions(cnpj);

CREATE INDEX IF NOT EXISTS idx_institution_admin
  ON institutions(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_institution_active
  ON institutions(is_active);

-- Clinic → Institution relationship (one-to-many)
CREATE TABLE IF NOT EXISTS institution_clinic_assignments (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  clinic_id TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'primary' CHECK (
    role IN ('primary', 'secondary', 'satellite')
  ),
  assigned_at TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ica_institution
  ON institution_clinic_assignments(institution_id);

CREATE INDEX IF NOT EXISTS idx_ica_clinic
  ON institution_clinic_assignments(clinic_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ica_institution_clinic
  ON institution_clinic_assignments(institution_id, clinic_id);

-- Institution → User roles (many-to-many)
CREATE TABLE IF NOT EXISTS institution_users (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (
    role IN ('admin', 'manager', 'operator', 'viewer')
  ),
  granted_at TEXT NOT NULL,
  granted_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inst_user_role
  ON institution_users(institution_id, user_id);

CREATE INDEX IF NOT EXISTS idx_inst_user_institution
  ON institution_users(institution_id);

CREATE INDEX IF NOT EXISTS idx_inst_user_role_type
  ON institution_users(role);
