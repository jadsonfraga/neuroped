-- Consentimentos LGPD por usuário, com histórico e idempotência de lote.
-- Idempotente e aditiva: não altera nem apaga dados existentes.
CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (
    consent_type IN (
      'termo_uso',
      'politica_privacidade',
      'tratamento_dados_saude'
    )
  ),
  consent_version TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  granted INTEGER NOT NULL CHECK (granted IN (0, 1)),
  accepted_at DATETIME NOT NULL,
  legal_basis TEXT NOT NULL,
  purpose TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, consent_type, consent_version, accepted_at)
);

CREATE INDEX IF NOT EXISTS idx_consents_user_accepted
  ON consents(user_id, accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_consents_user_type
  ON consents(user_id, consent_type, accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_consents_batch
  ON consents(batch_id);
