/**
 * legacy-mutation-owner-predicate.test.ts — LEG-09/AUTHZ-P2-12 (ciclo 4 da
 * espiral SaaS, 2026-09-26 — docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md).
 *
 * Regra do AGENTS.md: "Toda leitura/mutação clínica repete o tenant no
 * predicado SQL final (não basta autorizar antes e depois
 * `UPDATE ... WHERE id = ?`)". Três rotas legadas autorizavam via
 * `getPatientAccess` e então executavam o UPDATE/DELETE final só por
 * `WHERE id = ?` (ou `WHERE id = ? AND is_demo = 1`), sem repetir o owner no
 * predicado da própria mutação nem verificar `changes()` antes de responder
 * sucesso — uma janela de corrida entre a checagem e a escrita (o paciente
 * muda de dono entre o `SELECT owner_user_id` e o `DELETE`/`UPDATE`) bastava
 * para uma mutação cross-owner silenciosa.
 *
 * Este teste roda sobre o schema real (db/schema.d1.sql + todas as
 * migrações) e os handlers reais de conecta/[id].ts, memory/[id].ts e
 * results/[id].ts — sem mocks de SQL, exceto um wrapper de D1 que injeta,
 * de propósito, a reatribuição de dono exatamente na janela entre a
 * checagem de acesso e a mutação final (simulando a corrida). Para cada
 * handler prova-se (1) a corrida é barrada — 404, `changes()` honesto, zero
 * linhas afetadas — e (2) o caminho normal do dono legítimo continua
 * funcionando (nenhuma regressão).
 *
 * Nenhum dado real: tudo aqui é sintético.
 *
 * Rodar: node --import tsx tests/unit/legacy-mutation-owner-predicate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequestDelete as deleteConectaEvent } from "../../functions/api/conecta/[id]";
import { ensureConectaDemoSchema } from "../../functions/api/conecta/_schema";
import {
  onRequestPatch as patchMemoryNote,
  onRequestDelete as deleteMemoryNote,
} from "../../functions/api/memory/[id]";
import { onRequestDelete as deleteScaleResult } from "../../functions/api/results/[id]";

// ── Banco: bootstrap real (mesma política de operations-tenant-isolation.test.ts) ──
const raw = new DatabaseSync(":memory:");
raw.exec("PRAGMA foreign_keys = OFF;");
raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
const superadas: string[] = [];
for (const nome of readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort()) {
  try {
    raw.exec(readFileSync(`db/migrations/${nome}`, "utf8"));
  } catch (erro) {
    assert.match(String(erro), /duplicate column name/i, `migração ${nome}: ${String(erro)}`);
    superadas.push(nome);
  }
}
assert.deepEqual(superadas, ["0001_users_auth.sql", "0002_patient_ownership.sql"]);
raw.exec("PRAGMA foreign_keys = ON;");

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
const db = makeDb(raw);
// conecta/[id].ts provisiona a tabela via ensureConectaDemoSchema (cache de
// módulo, `db.batch`); prima aqui com o D1 "normal" para que os cenários
// abaixo, que passam um D1 embrulhado (sem `.batch`) para simular a corrida,
// nunca disparem o provisionamento por conta própria.
await ensureConectaDemoSchema(db);

/**
 * Envolve o D1 real para injetar, na N-ésima vez que a consulta de acesso do
 * paciente (`SELECT owner_user_id FROM patients_demo ...`) ler o dono de
 * `patientId`, uma reatribuição imediata do dono — simulando uma escrita
 * concorrente que acontece exatamente entre a checagem de autorização e a
 * mutação final que o handler ainda vai executar.
 */
function withOwnerRaceOnAccessCheck(
  base: D1Database,
  patientId: string,
  occurrence: number,
  newOwnerUserId: string,
): D1Database {
  let seen = 0;
  const prepare = (sql: string) => {
    const stmt = base.prepare(sql);
    const isAccessCheck = sql.includes("SELECT owner_user_id") && sql.includes("patients_demo");
    return {
      bind: (...args: unknown[]) => {
        const bound = stmt.bind(...args);
        return {
          async first<T>() {
            const result = await bound.first<T>();
            if (isAccessCheck && args[0] === patientId) {
              seen += 1;
              if (seen === occurrence) {
                raw.prepare(`UPDATE patients_demo SET owner_user_id = ? WHERE id = ?`).run(newOwnerUserId, patientId);
              }
            }
            return result;
          },
          run: () => bound.run(),
          all: () => bound.all(),
        };
      },
    };
  };
  return { prepare } as unknown as D1Database;
}

const now = new Date().toISOString();
raw.prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')`).run("owner-a", "Owner A", "owner-a@example.test");
raw.prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')`).run("owner-b", "Owner B", "owner-b@example.test");

function ownerA() {
  return { id: "owner-a", email: "owner-a@example.test", name: "Owner A", role: "professional", mustChangePassword: false };
}

function criarPaciente(id: string): void {
  raw.prepare(`INSERT INTO patients_demo (id, owner_user_id, name, is_demo, created_at, updated_at) VALUES (?, 'owner-a', ?, 1, ?, ?)`)
    .run(id, `Paciente ${id}`, now, now);
}

// ── Cenário 1: conecta/[id].ts — DELETE ──
{
  const patientId = "pac-conecta";
  criarPaciente(patientId);
  const eventId = "evt-conecta-1";
  raw.prepare(
    `INSERT INTO conecta_events_demo (id, patient_id, author_user_id, category, occurred_at, is_demo) VALUES (?, ?, 'owner-a', 'humor', ?, 1)`,
  ).run(eventId, patientId, now);

  const racedDb = withOwnerRaceOnAccessCheck(db, patientId, 1, "owner-b");
  const response = await deleteConectaEvent({
    env: { DB: racedDb },
    params: { id: eventId },
    data: { authUser: ownerA() },
  } as never);
  assert.equal(response.status, 404, "conecta DELETE: corrida de dono no meio da mutação precisa ser barrada com 404");

  const stillThere = raw.prepare(`SELECT id FROM conecta_events_demo WHERE id = ?`).get(eventId);
  assert.ok(stillThere, "conecta DELETE: o evento não pode ser apagado quando o dono mudou entre a checagem e o DELETE");

  // devolve o paciente ao dono original para não vazar estado para outros cenários
  raw.prepare(`UPDATE patients_demo SET owner_user_id = 'owner-a' WHERE id = ?`).run(patientId);

  // controle: sem corrida, o dono legítimo continua conseguindo apagar normalmente
  const normalResponse = await deleteConectaEvent({
    env: { DB: db },
    params: { id: eventId },
    data: { authUser: ownerA() },
  } as never);
  assert.equal(normalResponse.status, 200, "conecta DELETE: caminho normal do dono legítimo não pode regredir");
  assert.equal(raw.prepare(`SELECT id FROM conecta_events_demo WHERE id = ?`).get(eventId), undefined);
}
console.log("✓ conecta/[id].ts DELETE: repete owner no predicado final e verifica changes() (LEG-09/AUTHZ-P2-12)");

// ── Cenário 2: memory/[id].ts — PATCH ──
{
  const patientId = "pac-memory-patch";
  criarPaciente(patientId);
  const noteId = "note-patch-1";
  raw.prepare(
    `INSERT INTO clinical_memory_notes_demo (id, patient_id, title, content, author_user_id, is_demo, created_at, updated_at) VALUES (?, ?, 'Título original', 'Conteúdo original', 'owner-a', 1, ?, ?)`,
  ).run(noteId, patientId, now, now);

  // authorize() e a checagem de nextPatient consultam o MESMO paciente (o
  // corpo não troca patientId) — a corrida dispara só na 2ª leitura, ou
  // seja, depois que as DUAS checagens já aprovaram, exatamente na janela
  // que só o predicado do UPDATE final protege.
  const racedDb = withOwnerRaceOnAccessCheck(db, patientId, 2, "owner-b");
  const request = new Request("https://neuroped.invalid/api/memory/" + noteId, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Título alterado pela corrida" }),
  });
  const response = await patchMemoryNote({
    env: { DB: racedDb },
    params: { id: noteId },
    request,
    data: { authUser: ownerA() },
  } as never);
  assert.equal(response.status, 404, "memory PATCH: corrida de dono entre as checagens e o UPDATE precisa ser barrada com 404");

  const row = raw.prepare(`SELECT title FROM clinical_memory_notes_demo WHERE id = ?`).get(noteId) as { title: string };
  assert.equal(row.title, "Título original", "memory PATCH: a nota não pode ser alterada quando o dono mudou entre a checagem e o UPDATE");

  raw.prepare(`UPDATE patients_demo SET owner_user_id = 'owner-a' WHERE id = ?`).run(patientId);

  const normalRequest = new Request("https://neuroped.invalid/api/memory/" + noteId, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Título editado normalmente" }),
  });
  const normalResponse = await patchMemoryNote({
    env: { DB: db },
    params: { id: noteId },
    request: normalRequest,
    data: { authUser: ownerA() },
  } as never);
  assert.equal(normalResponse.status, 200, "memory PATCH: caminho normal do dono legítimo não pode regredir");
  const updatedRow = raw.prepare(`SELECT title FROM clinical_memory_notes_demo WHERE id = ?`).get(noteId) as { title: string };
  assert.equal(updatedRow.title, "Título editado normalmente");
}
console.log("✓ memory/[id].ts PATCH: repete owner no predicado final e verifica changes() (LEG-09/AUTHZ-P2-12)");

// ── Cenário 3: memory/[id].ts — DELETE ──
{
  const patientId = "pac-memory-delete";
  criarPaciente(patientId);
  const noteId = "note-delete-1";
  raw.prepare(
    `INSERT INTO clinical_memory_notes_demo (id, patient_id, title, content, author_user_id, is_demo, created_at, updated_at) VALUES (?, ?, 'Nota', 'Conteúdo', 'owner-a', 1, ?, ?)`,
  ).run(noteId, patientId, now, now);

  const racedDb = withOwnerRaceOnAccessCheck(db, patientId, 1, "owner-b");
  const response = await deleteMemoryNote({
    env: { DB: racedDb },
    params: { id: noteId },
    data: { authUser: ownerA() },
  } as never);
  assert.equal(response.status, 404, "memory DELETE: corrida de dono no meio da mutação precisa ser barrada com 404");

  const stillThere = raw.prepare(`SELECT id FROM clinical_memory_notes_demo WHERE id = ?`).get(noteId);
  assert.ok(stillThere, "memory DELETE: a nota não pode ser apagada quando o dono mudou entre a checagem e o DELETE");

  raw.prepare(`UPDATE patients_demo SET owner_user_id = 'owner-a' WHERE id = ?`).run(patientId);

  const normalResponse = await deleteMemoryNote({
    env: { DB: db },
    params: { id: noteId },
    data: { authUser: ownerA() },
  } as never);
  assert.equal(normalResponse.status, 204, "memory DELETE: caminho normal do dono legítimo não pode regredir");
  assert.equal(raw.prepare(`SELECT id FROM clinical_memory_notes_demo WHERE id = ?`).get(noteId), undefined);
}
console.log("✓ memory/[id].ts DELETE: repete owner no predicado final e verifica changes() (LEG-09/AUTHZ-P2-12)");

// ── Cenário 4: results/[id].ts — DELETE ──
{
  const patientId = "pac-results";
  criarPaciente(patientId);
  const resultId = "result-delete-1";
  raw.prepare(
    `INSERT INTO scale_results_demo (id, patient_id, scale_id, scale_name, is_demo) VALUES (?, ?, 'escala-teste', 'Escala de teste', 1)`,
  ).run(resultId, patientId);

  const racedDb = withOwnerRaceOnAccessCheck(db, patientId, 1, "owner-b");
  const response = await deleteScaleResult({
    env: { DB: racedDb },
    params: { id: resultId },
    data: { authUser: ownerA() },
  } as never);
  assert.equal(response.status, 404, "results DELETE: corrida de dono no meio da mutação precisa ser barrada com 404");
  const payload = await response.clone().json() as { deleted?: boolean };
  assert.notEqual(payload.deleted, true, "results DELETE: não pode declarar deleted:true sem afetar nenhuma linha");

  const stillThere = raw.prepare(`SELECT id FROM scale_results_demo WHERE id = ?`).get(resultId);
  assert.ok(stillThere, "results DELETE: o resultado não pode ser apagado quando o dono mudou entre a checagem e o DELETE");

  raw.prepare(`UPDATE patients_demo SET owner_user_id = 'owner-a' WHERE id = ?`).run(patientId);

  const normalResponse = await deleteScaleResult({
    env: { DB: db },
    params: { id: resultId },
    data: { authUser: ownerA() },
  } as never);
  assert.equal(normalResponse.status, 200, "results DELETE: caminho normal do dono legítimo não pode regredir");
  const normalPayload = await normalResponse.clone().json() as { deleted?: boolean };
  assert.equal(normalPayload.deleted, true);
  assert.equal(raw.prepare(`SELECT id FROM scale_results_demo WHERE id = ?`).get(resultId), undefined);
}
console.log("✓ results/[id].ts DELETE: repete owner no predicado final, verifica changes() e não afirma deleted:true sem efeito (LEG-09/AUTHZ-P2-12)");
