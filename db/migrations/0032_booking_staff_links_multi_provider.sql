-- 0032 — Uma recepção pode atender mais de um profissional (OPS-03).
--
-- `booking_staff_links` nasceu (0008) com `staff_user_id TEXT NOT NULL UNIQUE`:
-- uma secretária atendia no máximo UM profissional, o que é inviável numa
-- clínica com vários. A chave primária composta (provider_user_id,
-- staff_user_id) já existe; falta apenas remover a UNIQUE isolada. O SQLite
-- não remove restrição com ALTER, então a tabela é reconstruída.
--
-- Este arquivo SÓ relaxa o schema. Nenhum código passa a aceitar dois vínculos
-- por operador aqui: `resolveOperationsPrincipal` fica fail-closed quando um
-- operador tem mais de um vínculo ativo (nunca escolhe uma agenda por acaso) e
-- `linkOperationsOperator` continua recusando o segundo vínculo. A seleção do
-- profissional entra em PR posterior (issue #1064).
--
-- Sequência desenhada para convergir mesmo que a execução NÃO seja atômica e
-- mesmo que o bootstrap em runtime (`ensureOperationsHardeningSchema`, que faz
-- CREATE TABLE IF NOT EXISTS a cada requisição) recrie a tabela no meio:
--   1. renomeia a tabela atual para `booking_staff_links_legacy_0032`
--      (os dados continuam intactos, só mudam de nome);
--   2. derruba os índices, cujos nomes acompanharam a tabela renomeada e
--      bloqueariam a recriação com o mesmo nome;
--   3. cria a tabela nova com IF NOT EXISTS (se o bootstrap já a criou vazia
--      no intervalo, nada muda);
--   4. copia com INSERT OR IGNORE (só conflito de PK é ignorado; violação de FK
--      falha alto — o preflight do workflow já exige zero órfãos);
--   5. descarta a tabela legada;
--   6. recria os índices, incluindo `idx_booking_staff_staff_active`, que
--      substitui o índice implícito da UNIQUE removida nas consultas por
--      `staff_user_id`.
-- Reexecução é inofensiva: converge ao mesmo estado final.
--
-- A tabela não é pai de nenhuma chave estrangeira (só referencia `users`),
-- então renomear e descartar não afeta outras tabelas. Nada aqui lê ou grava
-- dado de titular: a tabela guarda apenas ids de usuário e datas.
--
-- Rollback: reverter o código basta enquanto nenhum operador tiver mais de um
-- vínculo ativo — a tabela relaxada é compatível com o código anterior. NÃO
-- reverta para antes do PR A depois que existir operador com dois vínculos
-- (o `LIMIT 1` antigo escolheria uma agenda arbitrária). Para voltar com
-- segurança, deixe no máximo um vínculo ativo por operador antes:
--   UPDATE booking_staff_links SET active = 0
--    WHERE active = 1 AND rowid NOT IN (
--      SELECT MIN(rowid) FROM booking_staff_links WHERE active = 1 GROUP BY staff_user_id);
-- Censo antes de qualquer endurecimento posterior (somente contagem):
--   SELECT COUNT(*) FROM booking_staff_links l
--    WHERE l.active = 1 AND NOT EXISTS (
--      SELECT 1 FROM clinic_memberships m
--       WHERE m.user_id = l.staff_user_id AND m.role = 'assistant' AND m.active = 1);

ALTER TABLE booking_staff_links RENAME TO booking_staff_links_legacy_0032;

DROP INDEX IF EXISTS idx_booking_staff_provider_active;
DROP INDEX IF EXISTS idx_booking_staff_staff_active;

CREATE TABLE IF NOT EXISTS booking_staff_links (
  provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  staff_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (provider_user_id, staff_user_id)
);

INSERT OR IGNORE INTO booking_staff_links
  (provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at)
SELECT provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at
  FROM booking_staff_links_legacy_0032;

DROP TABLE booking_staff_links_legacy_0032;

CREATE INDEX IF NOT EXISTS idx_booking_staff_provider_active
  ON booking_staff_links(provider_user_id, active, staff_user_id);

CREATE INDEX IF NOT EXISTS idx_booking_staff_staff_active
  ON booking_staff_links(staff_user_id, active, provider_user_id);
