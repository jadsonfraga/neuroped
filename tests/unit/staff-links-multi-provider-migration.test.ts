/**
 * staff-links-multi-provider-migration.test.ts — OPS-03, issue #1064, PR A.
 *
 * A migração 0032 relaxa `booking_staff_links` (remove a UNIQUE isolada de
 * `staff_user_id`) para que uma recepção possa atender mais de um profissional,
 * e `resolveOperationsPrincipal` passa a falhar fechado quando um operador tem
 * mais de um vínculo ativo. Este PR NÃO aceita dois vínculos pela API: só abre
 * o schema com segurança.
 *
 * Roda sobre o schema real (db/schema.d1.sql + migrações), com enforcement de
 * chave estrangeira LIGADO ao aplicar a 0032 (o D1 de produção enforça FK), sem
 * mocks de SQL. Dados 100% sintéticos.
 *
 *   1. antes: a UNIQUE existe e recusa o segundo vínculo do mesmo operador;
 *   2. depois: vínculos preservados byte a byte, UNIQUE fora, PK e FK valendo,
 *      índices na tabela nova, tabela legada ausente, segundo vínculo aceito;
 *   3. reexecução converge ao mesmo estado;
 *   4. interrupção no meio com o bootstrap em runtime recriando a tabela;
 *   5. bootstrap já ter criado o índice novo na tabela antiga antes da 0032;
 *   6. principal: um vínculo ativo resolve; dois = fail-closed; sem vínculo
 *      ativo e profissional inativo continuam negados.
 *
 * Rodar: node --import tsx tests/unit/staff-links-multi-provider-migration.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import {
  ensureOperationsHardeningSchema,
  resolveOperationsPrincipal,
} from "../../functions/api/operations/_access";

type Row = Record<string, unknown>;
const MIGRATION = "0032_booking_staff_links_multi_provider.sql";
const migrationSql = readFileSync(`db/migrations/${MIGRATION}`, "utf8");

function makeDb(database: DatabaseSync): D1Database {
  const prepare = (sql: string) => {
    const make = (args: unknown[]) => ({
      async first<T>() {
        return (database.prepare(sql).get(...(args as never[])) as T | undefined) ?? null;
      },
      async run() {
        const info = database.prepare(sql).run(...(args as never[]));
        return { meta: { changes: Number(info.changes) } };
      },
      async all<T>() {
        return { results: database.prepare(sql).all(...(args as never[])) as T[] };
      },
    });
    return { bind: (...args: unknown[]) => make(args), ...make([]) };
  };
  return {
    prepare,
    async batch(statements: Array<{ run(): Promise<unknown> }>) {
      database.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        database.exec("COMMIT");
        return results;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as D1Database;
}

/** Banco no estado de produção ANTES da 0032: base + 0001..0031. */
function legacyDatabase(): DatabaseSync {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = OFF;");
  database.exec(readFileSync("db/schema.d1.sql", "utf8"));
  for (const nome of readdirSync("db/migrations").filter((f) => f.endsWith(".sql") && f < MIGRATION).sort()) {
    try {
      database.exec(readFileSync(`db/migrations/${nome}`, "utf8"));
    } catch (erro) {
      assert.match(String(erro), /duplicate column name/i, `migração ${nome}: ${String(erro)}`);
    }
  }
  database.exec("PRAGMA foreign_keys = ON;");
  return database;
}

const NOW = "2026-09-30T12:00:00.000Z";
function seed(database: DatabaseSync) {
  const user = database.prepare(
    `INSERT INTO users (id,name,email,role,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?)`,
  );
  user.run("prof-a", "Profissional A", "prof-a@example.test", "professional", 1, NOW, NOW);
  user.run("prof-b", "Profissional B", "prof-b@example.test", "professional", 1, NOW, NOW);
  user.run("prof-off", "Profissional Inativo", "prof-off@example.test", "professional", 0, NOW, NOW);
  user.run("sec-a", "Recepção A", "sec-a@example.test", "operator", 1, NOW, NOW);
  user.run("sec-b", "Recepção B", "sec-b@example.test", "operator", 1, NOW, NOW);
  user.run("sec-c", "Recepção C", "sec-c@example.test", "operator", 1, NOW, NOW);
  const link = database.prepare(
    `INSERT INTO booking_staff_links (provider_user_id,staff_user_id,active,created_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?)`,
  );
  link.run("prof-a", "sec-a", 1, "prof-a", "2026-09-01T08:00:00.000Z", "2026-09-02T09:00:00.000Z");
  link.run("prof-a", "sec-b", 0, "prof-a", "2026-09-03T08:00:00.000Z", "2026-09-04T09:00:00.000Z");
  link.run("prof-off", "sec-c", 1, "prof-off", "2026-09-05T08:00:00.000Z", "2026-09-06T09:00:00.000Z");
}

const links = (database: DatabaseSync) =>
  database
    .prepare(
      `SELECT provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at
         FROM booking_staff_links ORDER BY provider_user_id, staff_user_id`,
    )
    .all()
    .map((row) => ({ ...row }));

const hasUniqueOnStaff = (database: DatabaseSync): number =>
  Number(
    (
      database
        .prepare(
          `SELECT COUNT(*) AS n FROM pragma_index_list('booking_staff_links') il
            WHERE il."unique" = 1 AND il.origin = 'u'
              AND (SELECT COUNT(*) FROM pragma_index_info(il.name)) = 1
              AND (SELECT ii.name FROM pragma_index_info(il.name) ii) = 'staff_user_id'`,
        )
        .get() as Row
    ).n,
  );

const tableDdl = (database: DatabaseSync): string =>
  String((database.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='booking_staff_links'`).get() as Row)?.sql ?? "");
const tableExists = (database: DatabaseSync, name: string): boolean =>
  Boolean(database.prepare(`SELECT 1 AS x FROM sqlite_master WHERE type='table' AND name = ?`).get(name));
const indexColumns = (database: DatabaseSync, name: string): string[] =>
  database.prepare(`SELECT name FROM pragma_index_info('${name}') ORDER BY seqno`).all().map((row) => String(row.name));
const indexTable = (database: DatabaseSync, name: string): string | null =>
  ((database.prepare(`SELECT tbl_name FROM sqlite_master WHERE type='index' AND name = ?`).get(name) as Row | undefined)?.tbl_name as string) ?? null;

/** Divide o arquivo em comandos (os comentários não carregam ';' úteis). */
const statements = (sql: string): string[] =>
  sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

// ── 1. ANTES: a UNIQUE existe e recusa o segundo vínculo ──────────────────
const before = legacyDatabase();
seed(before);
assert.equal(hasUniqueOnStaff(before), 1, "pré-condição: schema de produção tem UNIQUE em staff_user_id");
assert.match(tableDdl(before), /staff_user_id\s+TEXT\s+NOT NULL\s+UNIQUE/);
assert.throws(
  () =>
    before
      .prepare(`INSERT INTO booking_staff_links (provider_user_id,staff_user_id,active,created_by_user_id) VALUES ('prof-b','sec-a',1,'prof-b')`)
      .run(),
  /UNIQUE/i,
  "antes da 0032 o mesmo operador não aceita um segundo profissional",
);
const rowsBefore = links(before);
assert.equal(rowsBefore.length, 3);

// ── 2. DEPOIS: vínculos preservados e schema relaxado ─────────────────────
before.exec("PRAGMA foreign_keys = ON;");
before.exec(migrationSql);
assert.deepEqual(links(before), rowsBefore, "todos os vínculos preservados byte a byte (ativo, inativo, autoria, datas)");
assert.equal(hasUniqueOnStaff(before), 0, "UNIQUE isolada de staff_user_id removida");
assert.doesNotMatch(tableDdl(before), /staff_user_id\s+TEXT\s+NOT NULL\s+UNIQUE/);
assert.match(tableDdl(before), /PRIMARY KEY \(provider_user_id, staff_user_id\)/);
assert.match(tableDdl(before), /created_by_user_id/);
assert.equal(tableExists(before, "booking_staff_links_legacy_0032"), false, "tabela legada descartada");
assert.equal(indexTable(before, "idx_booking_staff_provider_active"), "booking_staff_links");
assert.equal(indexTable(before, "idx_booking_staff_staff_active"), "booking_staff_links");
assert.deepEqual(indexColumns(before, "idx_booking_staff_provider_active"), ["provider_user_id", "active", "staff_user_id"]);
assert.deepEqual(indexColumns(before, "idx_booking_staff_staff_active"), ["staff_user_id", "active", "provider_user_id"]);

before
  .prepare(`INSERT INTO booking_staff_links (provider_user_id,staff_user_id,active,created_by_user_id) VALUES ('prof-b','sec-a',1,'prof-a')`)
  .run();
assert.equal(
  (before.prepare(`SELECT COUNT(*) AS n FROM booking_staff_links WHERE staff_user_id = 'sec-a'`).get() as Row).n,
  2,
  "depois da 0032 o mesmo operador aceita um segundo profissional",
);
assert.throws(
  () =>
    before
      .prepare(`INSERT INTO booking_staff_links (provider_user_id,staff_user_id,active,created_by_user_id) VALUES ('prof-a','sec-a',1,'prof-a')`)
      .run(),
  /UNIQUE|PRIMARY/i,
  "o par (profissional, recepção) continua único",
);
assert.throws(
  () =>
    before
      .prepare(`INSERT INTO booking_staff_links (provider_user_id,staff_user_id,active,created_by_user_id) VALUES ('prof-a','fantasma',1,'prof-a')`)
      .run(),
  /FOREIGN KEY/i,
  "chave estrangeira para users continua valendo",
);
assert.throws(
  () => before.prepare(`DELETE FROM users WHERE id = 'prof-a'`).run(),
  /FOREIGN KEY/i,
  "ON DELETE RESTRICT em created_by_user_id continua valendo: quem criou vínculos não some",
);
before.prepare(`DELETE FROM users WHERE id = 'prof-b'`).run();
assert.equal(
  (before.prepare(`SELECT COUNT(*) AS n FROM booking_staff_links WHERE provider_user_id = 'prof-b'`).get() as Row).n,
  0,
  "ON DELETE CASCADE pelo lado do profissional continua valendo",
);

// ── 3. Reexecução converge ao mesmo estado ────────────────────────────────
const afterFirstRun = links(before);
before.exec(migrationSql);
assert.deepEqual(links(before), afterFirstRun, "reexecutar a 0032 não perde nem duplica vínculo");
assert.equal(hasUniqueOnStaff(before), 0);
assert.equal(tableExists(before, "booking_staff_links_legacy_0032"), false);
assert.equal(indexTable(before, "idx_booking_staff_staff_active"), "booking_staff_links");
before.close();

// ── 4. Interrupção no meio + bootstrap recriando a tabela ─────────────────
{
  const database = legacyDatabase();
  seed(database);
  const expected = links(database);
  const steps = statements(migrationSql);
  assert.match(steps[0], /^ALTER TABLE booking_staff_links RENAME TO booking_staff_links_legacy_0032$/);

  database.exec(steps[0]); // renomeou; a tabela principal deixou de existir
  assert.equal(tableExists(database, "booking_staff_links"), false);
  // Uma requisição chega agora: o bootstrap real recria a tabela VAZIA.
  await ensureOperationsHardeningSchema(makeDb(database));
  assert.equal(tableExists(database, "booking_staff_links"), true);
  assert.equal(links(database).length, 0, "tabela recriada pelo bootstrap nasce vazia");
  for (const step of steps.slice(1)) database.exec(step);

  assert.deepEqual(links(database), expected, "vínculos recuperados mesmo com a tabela recriada no intervalo");
  assert.equal(hasUniqueOnStaff(database), 0);
  assert.equal(tableExists(database, "booking_staff_links_legacy_0032"), false);
  assert.equal(indexTable(database, "idx_booking_staff_provider_active"), "booking_staff_links");
  assert.equal(indexTable(database, "idx_booking_staff_staff_active"), "booking_staff_links");
  database.close();
}

// ── 5. Bootstrap já criou o índice novo na tabela ANTIGA antes da 0032 ─────
{
  const database = legacyDatabase();
  seed(database);
  await ensureOperationsHardeningSchema(makeDb(database));
  assert.equal(indexTable(database, "idx_booking_staff_staff_active"), "booking_staff_links", "pré-condição: índice novo já existe na tabela antiga");
  assert.equal(hasUniqueOnStaff(database), 1, "pré-condição: a tabela ainda é a antiga");
  database.exec(migrationSql);
  assert.equal(hasUniqueOnStaff(database), 0);
  assert.equal(
    (database.prepare(`SELECT COUNT(*) AS n FROM sqlite_master WHERE type='index' AND name='idx_booking_staff_staff_active'`).get() as Row).n,
    1,
  );
  assert.deepEqual(indexColumns(database, "idx_booking_staff_staff_active"), ["staff_user_id", "active", "provider_user_id"], "o índice sobrevive ao descarte da tabela legada");
  database.close();
}

// ── 6. Principal: um vínculo resolve; dois = fail-closed ──────────────────
{
  const database = legacyDatabase();
  seed(database);
  database.exec(migrationSql);
  const db = makeDb(database);
  const operator = (id: string) => ({ id, name: id, email: `${id}@example.test`, role: "operator" }) as never;

  const single = await resolveOperationsPrincipal(db, operator("sec-a"));
  assert.ok(single, "um vínculo ativo para profissional ativo resolve");
  assert.equal(single.providerUserId, "prof-a");
  assert.equal(single.delegated, true);
  assert.equal(single.canConfigure, false);

  assert.equal(await resolveOperationsPrincipal(db, operator("sec-b")), null, "vínculo inativo não resolve");
  assert.equal(await resolveOperationsPrincipal(db, operator("sec-c")), null, "profissional inativo não resolve");

  database
    .prepare(`INSERT INTO booking_staff_links (provider_user_id,staff_user_id,active,created_by_user_id) VALUES ('prof-b','sec-a',1,'prof-b')`)
    .run();
  assert.equal(
    await resolveOperationsPrincipal(db, operator("sec-a")),
    null,
    "dois vínculos ativos: nenhuma agenda é escolhida por acaso (fail-closed)",
  );

  database.prepare(`UPDATE booking_staff_links SET active = 0 WHERE provider_user_id = 'prof-b' AND staff_user_id = 'sec-a'`).run();
  const back = await resolveOperationsPrincipal(db, operator("sec-a"));
  assert.equal(back?.providerUserId, "prof-a", "suspender um dos vínculos devolve a agenda única");

  const professional = await resolveOperationsPrincipal(db, { id: "prof-b", name: "B", email: "b@example.test", role: "professional" } as never);
  assert.equal(professional?.providerUserId, "prof-b", "profissional continua resolvendo a própria agenda");
  assert.equal(professional?.canConfigure, true);
  database.close();
}

console.log(
  "staff-links-multi-provider-migration: UNIQUE removida sem perder vínculo, PK/FK/cascade preservadas, reexecução e interrupção convergem, bootstrap não regride o schema e operador com dois vínculos ativos falha fechado OK",
);
