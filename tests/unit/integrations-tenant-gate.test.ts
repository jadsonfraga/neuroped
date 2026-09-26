/**
 * integrations-tenant-gate.test.ts — AUTHZ-P1-09 (ciclo 4 da espiral SaaS,
 * 2026-09-26 — docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md).
 *
 * O bridge de importação do BoaConsulta (functions/api/integrations/
 * boaconsulta/import.ts) autoriza só por `canWriteClinicalData(user)` —
 * verdadeiro para QUALQUER conta com papel global "professional", que é o
 * papel com que TODO signup nasce (sem clínica, sem billing, sem e-mail
 * verificado). Ao contrário de patients/** e operations/**, a pasta
 * functions/api/integrations não tinha nenhum `_middleware.ts` de
 * clínica/billing — qualquer conta recém-criada podia importar PHI de
 * terceiros sem nunca ter pago nem provado clínica.
 *
 * Este teste roda sobre o schema real (db/schema.d1.sql + todas as
 * migrações, incluindo 0008_boaconsulta_import_bridge.sql) e encadeia o
 * `onRequest` real do novo functions/api/integrations/_middleware.ts com os
 * handlers reais de onRequestGet/onRequestPost do bridge — sem mock de SQL,
 * com FormData/File reais (o mesmo runtime de multipart usado em produção).
 *
 * Nenhum dado real: tudo aqui é sintético.
 *
 * Rodar: node --import tsx tests/unit/integrations-tenant-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequest as integrationsGate } from "../../functions/api/integrations/_middleware";
import {
  onRequestGet as importGet,
  onRequestPost as importPost,
} from "../../functions/api/integrations/boaconsulta/import";

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

// 32 bytes fixos, só para o teste — nunca usar em produção.
const IMPORT_KEY = "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA";

function professional(id: string) {
  return { id, email: `${id}@example.test`, name: id, role: "professional", mustChangePassword: false };
}

function csvUpload(): FormData {
  const form = new FormData();
  form.set("mode", "store");
  form.set("file", new File(["nome,cpf\nFulano de Tal,12345678901\n"], "export.csv", { type: "text/csv" }));
  return form;
}

async function invoke(method: "GET" | "POST", user: ReturnType<typeof professional>, headers: Record<string, string> = {}) {
  const request = new Request("https://neuroped.test/api/integrations/boaconsulta/import", {
    method,
    headers,
    body: method === "POST" ? csvUpload() : undefined,
  });
  const context = {
    request,
    env: { DB: db, NEUROPED_IMPORT_ENCRYPTION_KEY: IMPORT_KEY },
    params: {},
    data: { authUser: user },
    next: () => (method === "GET" ? importGet(context as never) : importPost(context as never)),
  };
  return integrationsGate(context as never);
}

function batchCount(ownerUserId: string): number {
  const row = raw.prepare(
    `SELECT COUNT(*) AS n FROM external_import_batches WHERE owner_user_id = ? AND source_system = 'boaconsulta'`,
  ).get(ownerUserId) as { n: number };
  return row.n;
}

const now = new Date().toISOString();

raw.prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')`).run(
  "user-sem-clinica", "Sem Clínica", "sem-clinica@example.test",
);
raw.prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')`).run(
  "user-clinica-ativa", "Clínica Ativa", "clinica-ativa@example.test",
);
raw.prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')`).run(
  "user-clinica-suspensa", "Clínica Suspensa", "clinica-suspensa@example.test",
);

// A criação da clínica já dispara trg_clinic_create_billing_trial (migração
// 0015): billing_customers/billing_subscriptions nascem sozinhos em trial
// válido por 14 dias — não precisa (nem pode, é UNIQUE) inserir à mão.
raw.prepare(`INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at) VALUES ('clinica-ativa', 'clinica-ativa', 'Clínica Ativa', 'active', 'user-clinica-ativa', ?, ?)`).run(now, now);
raw.prepare(`INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES ('clinica-ativa', 'user-clinica-ativa', 'professional', 1, ?, ?)`).run(now, now);

raw.prepare(`INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at) VALUES ('clinica-suspensa', 'clinica-suspensa', 'Clínica Suspensa', 'active', 'user-clinica-suspensa', ?, ?)`).run(now, now);
raw.prepare(`INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES ('clinica-suspensa', 'user-clinica-suspensa', 'professional', 1, ?, ?)`).run(now, now);
raw.prepare(`UPDATE billing_customers SET status = 'past_due', grace_ends_at = NULL WHERE clinic_id = 'clinica-suspensa'`).run();

// ── Caso 1: conta recém-criada, zero clínicas — POST precisa ser barrado ──
{
  const antes = batchCount("user-sem-clinica");
  const response = await invoke("POST", professional("user-sem-clinica"));
  assert.equal(response.status, 409, "POST sem clínica/billing precisa ser barrado com 409 antes do handler");
  assert.equal((await response.clone().json() as { code?: string }).code, "BILLING_CLINIC_CONTEXT_REQUIRED");
  assert.equal(batchCount("user-sem-clinica"), antes, "nenhum lote pode ser criado sem contexto de clínica/billing");
}
console.log("✓ POST /api/integrations/boaconsulta/import: conta sem clínica é barrada antes do handler (AUTHZ-P1-09)");

// ── Caso 2: mesma conta, GET (listagem) — também barrado ──
{
  const response = await invoke("GET", professional("user-sem-clinica"));
  assert.equal(response.status, 409, "GET sem clínica/billing também precisa ser barrado");
  assert.equal((await response.clone().json() as { code?: string }).code, "BILLING_CLINIC_CONTEXT_REQUIRED");
}
console.log("✓ GET /api/integrations/boaconsulta/import: conta sem clínica é barrada antes do handler (AUTHZ-P1-09)");

// ── Caso 3: controle — clínica ativa com billing em dia continua funcionando ──
{
  const antes = batchCount("user-clinica-ativa");
  const response = await invoke("POST", professional("user-clinica-ativa"));
  assert.equal(response.status, 201, "clínica ativa com billing em dia não pode regredir");
  assert.equal(batchCount("user-clinica-ativa"), antes + 1, "o lote precisa ser criado normalmente para quem tem direito");

  const list = await invoke("GET", professional("user-clinica-ativa"));
  assert.equal(list.status, 200, "listagem continua acessível para quem tem direito");
  const body = await list.clone().json() as { data: unknown[] };
  assert.equal(body.data.length, 1);
}
console.log("✓ caminho normal (clínica ativa, billing em dia) não regrediu");

// ── Caso 4: billing suspenso (past_due sem carência) — mesma paridade de patients/operations ──
{
  const antes = batchCount("user-clinica-suspensa");
  const response = await invoke("POST", professional("user-clinica-suspensa"));
  assert.equal(response.status, 402, "billing suspenso precisa negar com o mesmo código de patients/operations");
  assert.equal((await response.clone().json() as { code?: string }).code, "ENTITLEMENT_SUSPENDED");
  assert.equal(batchCount("user-clinica-suspensa"), antes, "nenhum lote pode ser criado com billing suspenso");
}
console.log("✓ billing suspenso nega importação com a mesma paridade de patients/operations (AUTHZ-P1-09)");
