-- 0033 — Aceite versionado dos Termos de Uso e da Política de Privacidade.
--
-- O cadastro self-service (/api/auth/signup) não registrava aceite de nenhum
-- documento. Esta tabela guarda, por conta, QUAL versão de QUAL documento foi
-- aceita, QUANDO e a impressão digital (SHA-256) do texto aceito
-- (shared/legal.ts). Uma linha por (conta, documento, versão): uma versão nova
-- gera um novo aceite sem apagar os anteriores.
--
--   document        'saas_terms' | 'privacy_policy'
--   version         identificador da versão (ex.: '2026-10-06-rascunho-1')
--   content_sha256  'sha256:' + SHA-256 hex do texto canônico daquela versão
--   source          de onde veio o aceite; hoje só 'signup' é gravado
--                   ('invite' e 'reacceptance' ficam reservados para não
--                   exigir reconstrução da tabela quando forem implementados)
--
-- Sem dado clínico nem IP. ON DELETE CASCADE acompanha a eliminação da conta;
-- guardar a prova de aceite além da conta é decisão jurídica (G6), não default.
--
-- O runtime cria a mesma tabela com IF NOT EXISTS (functions/api/auth/_legal.ts),
-- então o cadastro funciona mesmo antes desta migração rodar no D1.
--
-- Rollback: DROP TABLE IF EXISTS saas_legal_acceptances; (e reverter o código).

CREATE TABLE IF NOT EXISTS saas_legal_acceptances (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document TEXT NOT NULL CHECK (document IN ('saas_terms', 'privacy_policy')),
  version TEXT NOT NULL CHECK (length(version) BETWEEN 1 AND 80),
  content_sha256 TEXT NOT NULL CHECK (content_sha256 LIKE 'sha256:%' AND length(content_sha256) = 71),
  source TEXT NOT NULL CHECK (source IN ('signup', 'invite', 'reacceptance')),
  accepted_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, document, version)
);

CREATE INDEX IF NOT EXISTS idx_saas_legal_acceptances_user
  ON saas_legal_acceptances(user_id, document, accepted_at DESC);
