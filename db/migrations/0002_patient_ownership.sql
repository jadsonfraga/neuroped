-- Migração aditiva: ownership dos pacientes no backend Cloudflare D1.
-- Execute somente se `pragma_table_info('patients_demo')` ainda não listar
-- `owner_user_id`; o workflow de deploy faz essa verificação automaticamente.

ALTER TABLE patients_demo ADD COLUMN owner_user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_patients_demo_owner
  ON patients_demo(owner_user_id);
