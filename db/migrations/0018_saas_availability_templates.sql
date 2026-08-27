-- NeuroPed SaaS — Availability Templates
--
-- Templates reutilizáveis de disponibilidade para reduzir configuração manual
-- Rules são armazenadas como JSON: {"monday": [{"start": "08:00", "end": "12:00"}, ...], ...}

CREATE TABLE IF NOT EXISTS availability_templates (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT NOT NULL, -- JSON string
  is_active INTEGER NOT NULL DEFAULT 1,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_template_clinic_name
  ON availability_templates(clinic_id, name);

CREATE INDEX IF NOT EXISTS idx_template_clinic
  ON availability_templates(clinic_id);

CREATE INDEX IF NOT EXISTS idx_template_active
  ON availability_templates(is_active);

-- View para templates ativos
CREATE VIEW IF NOT EXISTS active_availability_templates AS
SELECT * FROM availability_templates
WHERE is_active = 1
ORDER BY updated_at DESC;
