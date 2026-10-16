-- 0035 — Marca própria da clínica (logo, cores, cabeçalho e rodapé dos documentos).
--
-- VERSIONADA, NÃO APLICADA EM PRODUÇÃO. Rollback: DROP TABLE IF EXISTS clinic_branding;
-- Migração aditiva: não altera nenhuma tabela existente. Sem dado clínico:
-- só identidade visual da clínica (por isso o logo fica em claro).
-- Uma linha por clínica (PK = clinic_id): a marca de uma clínica nunca é lida
-- por outra porque toda leitura/escrita filtra por clinic_id após checar membership.

CREATE TABLE IF NOT EXISTS clinic_branding (
  clinic_id TEXT PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
  primary_color TEXT CHECK (primary_color IS NULL OR (length(primary_color) = 7 AND primary_color LIKE '#%')),
  accent_color TEXT CHECK (accent_color IS NULL OR (length(accent_color) = 7 AND accent_color LIKE '#%')),
  header_text TEXT NOT NULL DEFAULT '' CHECK (length(header_text) <= 160),
  footer_text TEXT NOT NULL DEFAULT '' CHECK (length(footer_text) <= 400),
  logo_data_uri TEXT CHECK (logo_data_uri IS NULL OR length(logo_data_uri) <= 210000),
  updated_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
