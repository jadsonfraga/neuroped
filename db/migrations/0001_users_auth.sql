-- ============================================================================
-- Migração 0001 — colunas de autenticação nominal na tabela `users`.
--
-- Aplicar UMA vez no D1 já provisionado (sem recriar tabelas / sem perder dados):
--   npx wrangler d1 execute neuroped-db --remote --file=./db/migrations/0001_users_auth.sql --yes
--
-- Observação: SQLite/D1 não tem "ADD COLUMN IF NOT EXISTS". Se uma coluna já
-- existir, o comando falha nessa linha — é seguro ignorar ("duplicate column").
-- Para um D1 novo, use db/schema.d1.sql (já inclui estas colunas).
-- ============================================================================

ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME;
ALTER TABLE users ADD COLUMN last_login_at DATETIME;
