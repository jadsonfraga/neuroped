/**
 * patient-access-anti-enumeration.test.ts — AUTHZ-P2-11/LEG-10 (ciclo 4 da
 * espiral SaaS, 2026-09-26 — docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md).
 *
 * Prova em runtime, contra o schema real (db/schema.d1.sql) e o handler
 * real de GET /api/patients/:id, que paciente inexistente e paciente de
 * outro owner respondem EXATAMENTE igual — mesmo status, mesmo corpo. A
 * cobertura ampla (10 arquivos) do padrão corrigido está em
 * tests/unit/patient-access-anti-enumeration-static.test.mjs; este arquivo
 * é a prova comportamental de que a fusão realmente muda a resposta HTTP.
 *
 * Nenhum dado real: tudo aqui é sintético.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { onRequestGet as patientGet } from "../../functions/api/patients/[id]";

const raw = new DatabaseSync(":memory:");
raw.exec(readFileSync("db/schema.d1.sql", "utf8"));

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
  return { prepare } as unknown as D1Database;
}
const db = makeDb(raw);

const now = new Date().toISOString();
raw.prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')`).run("owner-a", "Owner A", "owner-a@example.test");
raw.prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')`).run("owner-b", "Owner B", "owner-b@example.test");
raw.prepare(
  `INSERT INTO patients_demo (id, owner_user_id, name, is_demo, created_at, updated_at)
   VALUES (?, ?, ?, 1, ?, ?)`,
).run("patient-of-b", "owner-b", "Paciente de B", now, now);

function contextFor(patientId: string) {
  return {
    env: { DB: db },
    params: { id: patientId },
    data: { authUser: { id: "owner-a", email: "owner-a@example.test", name: "Owner A", role: "professional", mustChangePassword: false } },
  } as never;
}

const inexistente = await patientGet(contextFor("patient-que-nao-existe"));
const deOutroOwner = await patientGet(contextFor("patient-of-b"));

assert.equal(inexistente.status, 404);
assert.equal(deOutroOwner.status, 404, "paciente de outro owner não pode revelar que existe via status diferente");
assert.deepEqual(
  await deOutroOwner.clone().json(),
  await inexistente.clone().json(),
  "o corpo da resposta precisa ser idêntico — nenhuma pista de que o paciente de B existe",
);

console.log("✓ GET /api/patients/:id: paciente inexistente e paciente de outro owner respondem exatamente igual (AUTHZ-P2-11/LEG-10)");
