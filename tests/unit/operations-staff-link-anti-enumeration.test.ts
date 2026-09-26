/**
 * operations-staff-link-anti-enumeration.test.ts — AUTHZ-P1-06 (ciclo 4 da
 * espiral SaaS, 2026-09-26 — docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md).
 *
 * `POST /api/operations` `action=staff_link` (vínculo de recepção por
 * e-mail) respondia com código/status DISTINTOS para três situações: e-mail
 * sem conta na plataforma (404 STAFF_NOT_FOUND), conta existente sem papel
 * "operator" ativo (409 STAFF_ROLE_INVALID) e conta "operator" válida mas já
 * vinculada a outro profissional (409 STAFF_ALREADY_LINKED) — um oráculo que
 * deixava qualquer profissional/admin da plataforma sondar e-mails alheios e
 * aprender se existem, qual o papel e se já estão comprometidos com outro
 * profissional.
 *
 * Este teste roda sobre o schema real (db/schema.d1.sql + todas as
 * migrações) e o handler real de POST /api/operations: prova que as três
 * situações respondem EXATAMENTE igual (mesmo status, mesmo corpo), e que o
 * caminho normal (operador de fato disponível) continua funcionando.
 *
 * Nenhum dado real: tudo aqui é sintético.
 *
 * Rodar: node --import tsx tests/unit/operations-staff-link-anti-enumeration.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequestPost as operationsPost } from "../../functions/api/operations/index";

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

const now = new Date().toISOString();

function criarUsuario(id: string, role: string, active = true): void {
  raw.prepare(`INSERT INTO users (id, name, email, role, is_active) VALUES (?, ?, ?, ?, ?)`)
    .run(id, `Usuário ${id}`, `${id}@example.test`, role, active ? 1 : 0);
}

criarUsuario("pro-a", "professional");
raw.prepare(`INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at) VALUES ('clinica-a', 'clinica-a', 'Clínica A', 'active', 'pro-a', ?, ?)`).run(now, now);
raw.prepare(`INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES ('clinica-a', 'pro-a', 'professional', 1, ?, ?)`).run(now, now);

// candidato inválido: existe, mas não é "operator"
criarUsuario("prof-b", "professional");

// candidato válido, mas já vinculado a OUTRO profissional
criarUsuario("pro-c", "professional");
raw.prepare(`INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at) VALUES ('clinica-c', 'clinica-c', 'Clínica C', 'active', 'pro-c', ?, ?)`).run(now, now);
raw.prepare(`INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES ('clinica-c', 'pro-c', 'professional', 1, ?, ?)`).run(now, now);
criarUsuario("op-linked", "operator");
raw.prepare(
  `INSERT INTO booking_staff_links (provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at)
   VALUES ('pro-c', 'op-linked', 1, 'pro-c', ?, ?)`,
).run(now, now);

// candidato genuinamente disponível (controle de não regressão)
criarUsuario("op-livre", "operator");

function proA() {
  return { id: "pro-a", email: "pro-a@example.test", name: "Pro A", role: "professional", mustChangePassword: false };
}

async function staffLink(email: string) {
  const request = new Request("https://neuroped.test/api/operations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "staff_link", email }),
  });
  return operationsPost({
    env: { DB: db },
    request,
    data: { authUser: proA() },
  } as never);
}

const inexistente = await staffLink("naoexiste@example.test");
const papelInvalido = await staffLink("prof-b@example.test");
const jaVinculado = await staffLink("op-linked@example.test");

for (const [nome, resp] of [
  ["e-mail inexistente", inexistente],
  ["conta sem papel operator", papelInvalido],
  ["operator já vinculado a outro profissional", jaVinculado],
] as const) {
  assert.equal(resp.status, 404, `${nome}: precisa responder 404 (AUTHZ-P1-06)`);
}

const bodies = await Promise.all(
  [inexistente, papelInvalido, jaVinculado].map((r) => r.clone().json()),
);
assert.deepEqual(bodies[0], bodies[1], "e-mail inexistente e papel inválido precisam responder corpo idêntico");
assert.deepEqual(bodies[1], bodies[2], "papel inválido e já vinculado a outro precisam responder corpo idêntico");
assert.equal((bodies[0] as { code?: string }).code, "STAFF_NOT_AVAILABLE");

console.log("✓ POST /api/operations staff_link: e-mail inexistente, papel inválido e já vinculado a outro respondem exatamente igual (AUTHZ-P1-06)");

// ── controle: operador genuinamente disponível continua vinculando normalmente ──
{
  const response = await staffLink("op-livre@example.test");
  assert.equal(response.status, 200, "vínculo de operador disponível não pode regredir");
  const link = raw.prepare(`SELECT provider_user_id, active FROM booking_staff_links WHERE staff_user_id = 'op-livre'`).get() as { provider_user_id: string; active: number } | undefined;
  assert.ok(link, "o vínculo precisa ser criado de verdade");
  assert.equal(link?.provider_user_id, "pro-a");
  assert.equal(link?.active, 1);
}
console.log("✓ caminho normal (operador disponível) não regrediu");
