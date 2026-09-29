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
import {
  onRequestGet as getPatient,
  onRequestDelete as deletePatient,
} from "../../functions/api/patients/[id]";
import { onRequestGet as listPatientResults } from "../../functions/api/patients/[id]/results";
import { onRequestPost as createUiResult } from "../../functions/api/results";
import { onRequestPost as createScaleResult } from "../../functions/api/scales/results";
import { onRequestPost as createConsultation } from "../../functions/api/consultations/index";

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
  return {
    prepare,
    batch: (statements: Array<{ run(): Promise<unknown> }>) => base.batch(statements as never),
  } as unknown as D1Database;
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

// ── Cenário 5: patients/[id].ts — DELETE com tabelas filhas ──
// Antes, só o DELETE do paciente repetia o owner: na corrida ele não afetava
// nada (404), mas o mesmo batch já tinha apagado consultas e escalas que
// passaram a pertencer ao novo dono, e ainda gravava auditoria de exclusão.
{
  const patientId = "pac-delete-cascade";
  criarPaciente(patientId);
  raw.prepare(`INSERT INTO consultations_demo (id, patient_id, date, is_demo) VALUES ('cons-cascade', ?, '2026-09-01', 1)`).run(patientId);
  raw.prepare(`INSERT INTO scale_results_demo (id, patient_id, scale_id, scale_name, is_demo) VALUES ('res-cascade', ?, 'escala-teste', 'Escala de teste', 1)`).run(patientId);
  const auditCount = () =>
    (raw.prepare(`SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'patient.delete' AND resource_id = ?`).get(patientId) as { n: number }).n;

  const racedDb = withOwnerRaceOnAccessCheck(db, patientId, 1, "owner-b");
  const response = await deletePatient({
    env: { DB: racedDb },
    params: { id: patientId },
    request: new Request("https://neuroped.invalid/api/patients/" + patientId, { method: "DELETE" }),
    data: { authUser: ownerA() },
  } as never);
  assert.equal(response.status, 404, "patients DELETE: corrida de dono precisa ser barrada com 404");
  assert.ok(raw.prepare(`SELECT id FROM patients_demo WHERE id = ?`).get(patientId), "paciente do novo dono permanece");
  assert.ok(raw.prepare(`SELECT id FROM consultations_demo WHERE id = 'cons-cascade'`).get(), "consulta do novo dono não pode ser apagada");
  assert.ok(raw.prepare(`SELECT id FROM scale_results_demo WHERE id = 'res-cascade'`).get(), "escala do novo dono não pode ser apagada");
  assert.equal(auditCount(), 0, "sem exclusão efetiva, nenhuma auditoria de exclusão");

  raw.prepare(`UPDATE patients_demo SET owner_user_id = 'owner-a' WHERE id = ?`).run(patientId);
  const normalResponse = await deletePatient({
    env: { DB: db },
    params: { id: patientId },
    request: new Request("https://neuroped.invalid/api/patients/" + patientId, { method: "DELETE" }),
    data: { authUser: ownerA() },
  } as never);
  assert.equal(normalResponse.status, 200, "patients DELETE: caminho normal do dono legítimo não pode regredir");
  assert.equal(raw.prepare(`SELECT id FROM consultations_demo WHERE id = 'cons-cascade'`).get(), undefined);
  assert.equal(raw.prepare(`SELECT id FROM scale_results_demo WHERE id = 'res-cascade'`).get(), undefined);
  assert.equal(raw.prepare(`SELECT id FROM patients_demo WHERE id = ?`).get(patientId), undefined);
  assert.equal(auditCount(), 1, "exclusão efetiva gera exatamente uma auditoria");
}
console.log("✓ patients/[id].ts DELETE: tabelas filhas e auditoria respeitam o owner no predicado final");

// ── Cenário 6: patients/[id].ts e patients/[id]/results.ts — leituras ──
{
  const patientId = "pac-read";
  criarPaciente(patientId);
  raw.prepare(`INSERT INTO scale_results_demo (id, patient_id, scale_id, scale_name, is_demo) VALUES ('res-read', ?, 'escala-teste', 'Escala de teste', 1)`).run(patientId);

  const racedGet = await getPatient({
    env: { DB: withOwnerRaceOnAccessCheck(db, patientId, 1, "owner-b") },
    params: { id: patientId },
    data: { authUser: ownerA() },
  } as never);
  assert.equal(racedGet.status, 404, "patients GET: dado do novo dono não pode vazar após a checagem");
  raw.prepare(`UPDATE patients_demo SET owner_user_id = 'owner-a' WHERE id = ?`).run(patientId);

  const racedList = await listPatientResults({
    env: { DB: withOwnerRaceOnAccessCheck(db, patientId, 1, "owner-b") },
    params: { id: patientId },
    request: new Request(`https://neuroped.invalid/api/patients/${patientId}/results`),
    data: { authUser: ownerA() },
  } as never);
  assert.deepEqual(await racedList.json(), [], "patients/:id/results: resultados do novo dono não podem vazar");
  raw.prepare(`UPDATE patients_demo SET owner_user_id = 'owner-a' WHERE id = ?`).run(patientId);

  const normalGet = await getPatient({ env: { DB: db }, params: { id: patientId }, data: { authUser: ownerA() } } as never);
  assert.equal(normalGet.status, 200);
  const normalList = await listPatientResults({
    env: { DB: db },
    params: { id: patientId },
    request: new Request(`https://neuroped.invalid/api/patients/${patientId}/results`),
    data: { authUser: ownerA() },
  } as never);
  assert.equal((await normalList.json() as unknown[]).length, 1, "dono legítimo continua lendo os próprios resultados");
}
console.log("✓ patients/[id].ts GET e patients/[id]/results.ts: leituras repetem o owner no predicado final");

// ── Cenário 7: inserções legadas (resultados, escalas, consultas) ──
{
  const patientId = "pac-insert";
  criarPaciente(patientId);
  const responses = [{ question: "Pergunta sintética", answer: "Resposta sintética" }];
  const cases: Array<[string, PagesFunction<never>, Record<string, unknown>, string]> = [
    ["results POST", createUiResult as never, { patientId, scaleName: "Escala sintética", responses }, "scale_results_demo"],
    ["scales/results POST", createScaleResult as never, { patient_id: patientId, scale_id: "escala-sintetica", scale_name: "Escala sintética", responses }, "scale_results_demo"],
    ["consultations POST", createConsultation as never, { patient_id: patientId, date: "2026-09-01", subjective: "Relato sintético." }, "consultations_demo"],
  ];
  for (const [label, handler, body, table] of cases) {
    const count = () => (raw.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE patient_id = ?`).get(patientId) as { n: number }).n;
    const before = count();
    const post = (database: D1Database) =>
      handler({
        env: { DB: database },
        params: {},
        request: new Request("https://neuroped.invalid/api/legacy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        data: { authUser: ownerA() },
      } as never);

    const raced = await post(withOwnerRaceOnAccessCheck(db, patientId, 1, "owner-b"));
    assert.equal(raced.status, 404, `${label}: corrida de dono precisa responder 404, nunca 201`);
    assert.equal(count(), before, `${label}: nada é gravado no paciente do novo dono`);
    raw.prepare(`UPDATE patients_demo SET owner_user_id = 'owner-a' WHERE id = ?`).run(patientId);

    const normal = await post(db);
    assert.equal(normal.status, 201, `${label}: caminho normal do dono legítimo não pode regredir`);
    assert.equal(count(), before + 1, `${label}: registro gravado exatamente uma vez`);
  }
}
console.log("✓ results, scales/results e consultations POST: INSERT final condicionado ao owner do paciente");
