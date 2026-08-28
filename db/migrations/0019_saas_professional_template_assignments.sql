-- NeuroPed SaaS — Professional Template Assignments
--
-- Registro de quando um template de disponibilidade é aplicado a um profissional
-- Mantém histórico de quem aplicou e quando

CREATE TABLE IF NOT EXISTS professional_template_assignments (
  id TEXT PRIMARY KEY,
  professional_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  clinic_id TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  applied_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_prof_template_assignment
  ON professional_template_assignments(professional_id, template_id);

CREATE INDEX IF NOT EXISTS idx_prof_assignment_professional
  ON professional_template_assignments(professional_id);

CREATE INDEX IF NOT EXISTS idx_prof_assignment_template
  ON professional_template_assignments(template_id);

CREATE INDEX IF NOT EXISTS idx_prof_assignment_clinic
  ON professional_template_assignments(clinic_id);

-- View para mostrar último template aplicado a cada profissional
CREATE VIEW IF NOT EXISTS professional_current_templates AS
SELECT DISTINCT ON (professional_id)
  professional_id,
  template_id,
  clinic_id,
  applied_at,
  applied_by
FROM professional_template_assignments
ORDER BY professional_id, applied_at DESC;
