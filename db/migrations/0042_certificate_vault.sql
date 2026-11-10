-- 0042 — Cofre do certificado A1 por conta.
-- O backend recebe somente o envelope cifrado no navegador. Não há coluna para
-- PFX em claro, senha, chave privada desbloqueada ou metadado do titular.
-- Rollback manual, após exportar os dados necessários: DROP TABLE IF EXISTS certificate_vault;

CREATE TABLE IF NOT EXISTS certificate_vault (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  format_version INTEGER NOT NULL CHECK (format_version = 1),
  kdf TEXT NOT NULL CHECK (kdf = 'PBKDF2-SHA256'),
  kdf_iterations INTEGER NOT NULL CHECK (kdf_iterations = 310000),
  salt_b64 TEXT NOT NULL CHECK (length(salt_b64) = 24),
  iv_b64 TEXT NOT NULL CHECK (length(iv_b64) = 16),
  ciphertext_b64 TEXT NOT NULL CHECK (length(ciphertext_b64) BETWEEN 24 AND 1700000),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
