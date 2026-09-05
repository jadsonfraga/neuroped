/**
 * Contrato do bootstrap de schema: base + migrações convergem.
 *
 * Nada no repositório verificava isto, e a suposição errada custou um ensaio
 * de DR reprovado: `db/schema.d1.sql` PARECE o schema consolidado, mas não é.
 * Ela é a BASE — já traz as colunas de auth/ownership que 0001 e 0002
 * adicionam, e NÃO traz nenhuma das tabelas criadas de 0009 em diante.
 *
 * Consequência prática de não ter este teste: qualquer provisionamento novo
 * (ambiente de ensaio, staging, réplica de incidente) escolhe um dos dois
 * caminhos e descobre no meio do caminho que nenhum funciona sozinho —
 * migrações do zero morrem em "no such table: users", e base+migrações morre
 * em "duplicate column name".
 *
 * O contrato fixa a política única e correta:
 *   base → cada migração inteira → tolerar SOMENTE "duplicate column name".
 *
 * E fixa QUAIS arquivos podem ser tolerados. Uma sobreposição nova precisa ser
 * declarada aqui de propósito, em vez de aparecer sozinha.
 *
 * Rodar: node tests/unit/schema-bootstrap-contract.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (relative) => readFileSync(join(repoRoot, relative), "utf8");

/**
 * Migrações cuja mudança o schema base já provê. Tolerar aqui NÃO é
 * "ignorar erro": é registrar que o base foi atualizado além delas.
 */
const SUPERADAS_PELO_BASE = ["0001_users_auth.sql", "0002_patient_ownership.sql"];

const db = new Database(":memory:");
// As migrações referenciam tabelas entre si; o bootstrap real do D1 não roda
// com enforcement de FK ligado durante a criação.
db.pragma("foreign_keys = OFF");

db.exec(read(join("db", "schema.d1.sql")));

const migracoes = readdirSync(join(repoRoot, "db", "migrations"))
  .filter((nome) => nome.endsWith(".sql"))
  .sort();

const puladas = [];
for (const nome of migracoes) {
  try {
    db.exec(read(join("db", "migrations", nome)));
  } catch (erro) {
    assert.match(
      erro.message,
      /duplicate column name/i,
      `migração ${nome} falhou por motivo que não é sobreposição com o schema base: ${erro.message}`,
    );
    puladas.push(nome);
  }
}

assert.deepEqual(
  puladas,
  SUPERADAS_PELO_BASE,
  "o conjunto de migrações superadas pelo schema base mudou — declare a sobreposição nova de propósito, ou atualize o base",
);

// O resultado precisa ser o schema ATUAL, não um schema qualquer que aplicou.
const colunasUsers = db
  .prepare("SELECT name FROM pragma_table_info('users')")
  .all()
  .map((linha) => linha.name);
for (const coluna of ["password_hash", "email_verified_at", "email_verified_source"]) {
  assert.ok(
    colunasUsers.includes(coluna),
    `users.${coluna} não existe após o bootstrap — base e migrações divergiram`,
  );
}

const tabelaExiste = (nome) =>
  Boolean(
    db
      .prepare("SELECT 1 AS x FROM sqlite_master WHERE type='table' AND name = ?")
      .get(nome),
  );
for (const tabela of [
  "billing_customers",
  "billing_subscriptions",
  "billing_provider_checkouts",
  "live_lgpd_worker_jobs",
  "public_submission_audit_log",
  "auth_email_verification_tokens",
  "auth_password_reset_tokens",
]) {
  assert.ok(tabelaExiste(tabela), `${tabela} não existe após o bootstrap`);
}

// O índice canônico de e-mail (0022) é invariante de identidade: se ele sumir
// do bootstrap, um ambiente novo nasce aceitando duas contas para o mesmo humano.
assert.ok(
  db
    .prepare(
      "SELECT 1 AS x FROM sqlite_master WHERE type='index' AND name='idx_users_email_canonical'",
    )
    .get(),
  "idx_users_email_canonical ausente — ambiente novo nasceria sem a unicidade case-insensitive",
);

db.close();

console.log(
  `✅ bootstrap de schema: base + ${migracoes.length} migrações convergem; ${puladas.length} superadas pelo base (${puladas.join(", ")}); schema atual completo.`,
);
