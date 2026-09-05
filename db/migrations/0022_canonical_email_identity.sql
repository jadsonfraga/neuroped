-- 0022 — Identidade canônica de e-mail case-insensitive.
--
-- Problema: users.email é TEXT UNIQUE, e UNIQUE no SQLite usa colação binária.
-- "Medico@Dominio.com" e "medico@dominio.com" são duas linhas válidas para o
-- banco e uma única identidade para qualquer ser humano. A aplicação assumia o
-- invariante que o banco não garantia, e assumia de formas divergentes:
--   - login comparava email = ? (binário) — não enxergava a linha em caixa mista;
--   - redefinição de senha comparava lower(email) = ? LIMIT 1 — enxergava, e com
--     duas linhas equivalentes escolheria uma arbitrariamente.
--
-- Esta migração torna o invariante estrutural. Ela é FAIL-CLOSED por construção:
-- se existir qualquer colisão herdada, o UPDATE viola a UNIQUE binária e/ou o
-- CREATE UNIQUE INDEX falha, e a migração inteira não aplica. Nenhum registro é
-- fundido, escolhido ou descartado automaticamente — fundir identidades é
-- decisão humana, não de migração.
--
-- Preflight obrigatório ANTES desta migração (roda no workflow, falha o job):
--   SELECT lower(trim(email)) AS canonico, COUNT(*) AS linhas
--     FROM users WHERE email IS NOT NULL
--    GROUP BY canonico HAVING COUNT(*) > 1;
--   -- precisa retornar vazio.
--
-- Rollback: DROP INDEX IF EXISTS idx_users_email_canonical;
-- A canonicalização das linhas não é revertida — a caixa original não é
-- informação de identidade e o endereço continua entregável (RFC 5321: a parte
-- de domínio é case-insensitive, e nenhum provedor relevante trata a parte
-- local como sensível à caixa). Reverter apenas o índice devolve o
-- comportamento anterior sem perda de acesso de nenhuma conta.

-- 1) Canonicaliza as linhas que ainda não estão canônicas. Sem colisão, é um
--    no-op para bancos já normalizados pelos fluxos atuais de escrita.
UPDATE users
   SET email = lower(trim(email)),
       updated_at = CURRENT_TIMESTAMP
 WHERE email IS NOT NULL
   AND email <> lower(trim(email));

-- 2) Passa a garantir no banco o invariante que a aplicação assume. A partir
--    daqui, nenhuma escrita — inclusive wrangler d1 execute manual, import de
--    legado ou código futuro que esqueça de normalizar — consegue criar duas
--    identidades equivalentes.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_canonical
  ON users (lower(email))
  WHERE email IS NOT NULL;
