-- 0037 — Premissa de tempo do Painel de resultados (item 8).
-- VERSIONADA, NÃO APLICADA em produção. Sem dado de paciente: só minutos por tipo de documento.
-- A estimativa "tempo economizado" = documentos emitidos × estes minutos. Sem linha = sem estimativa.
-- Rollback: DROP TABLE IF EXISTS clinic_metrics_assumptions;

CREATE TABLE IF NOT EXISTS clinic_metrics_assumptions (
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('report','clinical_note')),
  minutes_saved INTEGER NOT NULL CHECK (minutes_saved BETWEEN 0 AND 240),
  updated_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (clinic_id, doc_type)
);
