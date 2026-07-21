-- ============================================================================
-- Migração 0001 — colunas de autenticação nominal na tabela `users`.
--
-- Produção: aplicada de forma idempotente apenas pelo workflow oficial.
-- Não executar manualmente contra D1 remoto.
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
