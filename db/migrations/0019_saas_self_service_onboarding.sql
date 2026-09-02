-- NeuroPed SaaS — self-service onboarding foundation.
-- Migration estritamente aditiva. Não altera nem remove dados clínicos existentes.
--
-- Objetivos:
-- 1. rate limiting persistente para criação pública de contas;
-- 2. configurações institucionais por clínica, nunca globais;
-- 3. defaults retrocompatíveis para clínicas existentes e futuras.

CREATE TABLE IF NOT EXISTS auth_registration_rate_limits (
  bucket_hash TEXT PRIMARY KEY,
  window_started_at DATETIME NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  blocked_until DATETIME,
  updated_at DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_registration_rate_limits_updated
  ON auth_registration_rate_limits(updated_at);

CREATE TABLE IF NOT EXISTS clinic_settings (
  clinic_id TEXT PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
  specialty TEXT,
  institutional_identity TEXT,
  professional_display_name TEXT,
  professional_registry TEXT,
  document_preferences_json TEXT NOT NULL DEFAULT '{}',
  brand_logo_key TEXT,
  brand_primary_color TEXT,
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(document_preferences_json) <= 12000),
  CHECK (brand_primary_color IS NULL OR length(brand_primary_color) <= 32)
);

INSERT OR IGNORE INTO clinic_settings (
  clinic_id,
  document_preferences_json,
  created_by_user_id,
  updated_by_user_id,
  created_at,
  updated_at
)
SELECT
  c.id,
  '{}',
  c.created_by_user_id,
  c.created_by_user_id,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM clinics c;

CREATE TRIGGER IF NOT EXISTS trg_clinic_create_settings
AFTER INSERT ON clinics
FOR EACH ROW
BEGIN
  INSERT OR IGNORE INTO clinic_settings (
    clinic_id,
    document_preferences_json,
    created_by_user_id,
    updated_by_user_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    '{}',
    NEW.created_by_user_id,
    NEW.created_by_user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
END;

CREATE INDEX IF NOT EXISTS idx_clinic_settings_updated
  ON clinic_settings(updated_at DESC);
