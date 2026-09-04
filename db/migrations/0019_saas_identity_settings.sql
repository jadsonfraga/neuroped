-- NeuroPed SaaS — identidade profissional e institucional por tenant.
--
-- Motivação: todos os emissores de documentos (laudos, receitas, prontuário)
-- carregavam identidade profissional hardcoded do fundador. Num SaaS
-- multiusuário, a identidade que assina um documento clínico é do usuário
-- autenticado, e o papel timbrado (endereço/contato/razão social) é da
-- clínica ativa. Nenhum backfill: contas existentes preenchem o próprio
-- perfil em Configurações — identidade profissional nunca é presumida.

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  credentials_line TEXT NOT NULL DEFAULT '',
  specialty TEXT NOT NULL DEFAULT '',
  document_email TEXT NOT NULL DEFAULT '',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinic_settings (
  clinic_id TEXT PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  address_line1 TEXT NOT NULL DEFAULT '',
  address_line2 TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  public_email TEXT NOT NULL DEFAULT '',
  company_line TEXT NOT NULL DEFAULT '',
  motto TEXT NOT NULL DEFAULT '',
  updated_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
