/**
 * tenant-audit-trail.test.ts — AUTHZ-P1-10 (ciclo 4 da espiral SaaS,
 * 2026-09-26 — docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md).
 *
 * Nenhuma rota expunha a trilha de auditoria SaaS (saas_audit_log) para
 * owner/clinic_admin da própria clínica — só o admin global lia audit_logs
 * (legado, sem tenant), e metrics.ts só expõe contagens agregadas. Este
 * teste roda contra o schema real (db/schema.d1.sql + todas as migrações) e
 * o handler real de GET /api/tenants/:id/audit: prova isolamento entre
 * clínicas, o guard de papel (mesmo padrão de metrics.ts/export.ts) e a
 * resposta anti-enumeração uniforme para clínica inexistente vs. sem
 * permissão vs. clínica suspensa.
 *
 * Nenhum dado real: tudo aqui é sintético.
 *
 * Rodar: node --import tsx tests/unit/tenant-audit-trail.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequestGet as tenantAudit } from "../../functions/api/tenants/[id]/audit";

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
  return { prepare } as unknown as D1Database;
}
const db = makeDb(raw);

const now = new Date().toISOString();

function criarUsuario(id: string, role = "professional"): void {
  raw.prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)`)
    .run(id, `Usuário ${id}`, `${id}@example.test`, role);
}
function criarClinica(id: string, status: "active" | "suspended" | "closed" = "active"): void {
  raw.prepare(
    `INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, id, `Clínica ${id}`, status, `${id}-owner`, now, now);
}
function criarMembership(clinicId: string, userId: string, role: string): void {
  raw.prepare(
    `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)`,
  ).run(clinicId, userId, role, now, now);
}
function criarEvento(clinicId: string, actorUserId: string, action: string): void {
  raw.prepare(
    `INSERT INTO saas_audit_log (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
     VALUES (?, ?, ?, ?, 'test_target', 'target-1', '{"ok":true}', ?)`,
  ).run(`audit-${crypto.randomUUID()}`, clinicId, actorUserId, action, now);
}

criarUsuario("clinica-a-owner", "professional");
criarUsuario("clinica-a-prof", "professional");
criarUsuario("clinica-b-owner", "professional");
criarClinica("clinica-a");
criarClinica("clinica-b");
criarMembership("clinica-a", "clinica-a-owner", "owner");
criarMembership("clinica-a", "clinica-a-prof", "professional");
criarMembership("clinica-b", "clinica-b-owner", "owner");

criarEvento("clinica-a", "clinica-a-owner", "member_role_changed");
criarEvento("clinica-a", "clinica-a-owner", "invitation_created");
criarEvento("clinica-b", "clinica-b-owner", "member_role_changed");

function ator(id: string) {
  return { id, email: `${id}@example.test`, name: id, role: "professional", mustChangePassword: false };
}

async function chamar(clinicId: string, userId: string, query = "") {
  return tenantAudit({
    env: { DB: db },
    params: { id: clinicId },
    request: new Request(`https://neuroped.test/api/tenants/${clinicId}/audit${query}`),
    data: { authUser: ator(userId) },
  } as never);
}

// ── caminho normal: owner vê só os eventos da própria clínica ──
{
  const response = await chamar("clinica-a", "clinica-a-owner");
  assert.equal(response.status, 200);
  const body = await response.json() as { data: Array<{ action: string }>; total: number };
  assert.equal(body.total, 2, "clínica A tem exatamente 2 eventos");
  assert.equal(body.data.length, 2);
  assert.deepEqual(body.data.map((e) => e.action).sort(), ["invitation_created", "member_role_changed"]);
  assert.ok(
    !JSON.stringify(body).includes("clinica-b-owner"),
    "nenhum ator de outra clínica pode vazar",
  );
}
console.log("✓ GET /api/tenants/:id/audit: owner vê só os eventos da própria clínica (AUTHZ-P1-10)");

// ── isolamento: owner de B nunca vê os eventos de A ──
{
  const response = await chamar("clinica-a", "clinica-b-owner");
  assert.equal(response.status, 404, "membro de outra clínica não pode ler a auditoria de A");
}

// ── membro sem papel de gestor (professional comum) não lê ──
{
  const semGestao = await chamar("clinica-a", "clinica-a-prof");
  const inexistente = await chamar("clinica-inexistente", "clinica-a-owner");
  assert.equal(semGestao.status, 404);
  assert.equal(inexistente.status, 404);
  assert.deepEqual(
    await semGestao.clone().json(),
    await inexistente.clone().json(),
    "papel insuficiente e clínica inexistente respondem exatamente igual (anti-enumeração)",
  );
}
console.log("✓ GET /api/tenants/:id/audit: membro sem gestão, clínica alheia e clínica inexistente respondem 404 idêntico (AUTHZ-P1-10)");

// ── clínica suspensa: mesmo guard de metrics.ts/export.ts recusa ──
{
  criarUsuario("clinica-c-owner", "professional");
  criarClinica("clinica-c", "suspended");
  criarMembership("clinica-c", "clinica-c-owner", "owner");
  const response = await chamar("clinica-c", "clinica-c-owner");
  assert.equal(response.status, 404, "clínica suspensa não pode expor a própria auditoria");
}
console.log("✓ GET /api/tenants/:id/audit: clínica suspensa recusa com o mesmo guard de metrics.ts/export.ts");

// ── paginação básica ──
{
  const response = await chamar("clinica-a", "clinica-a-owner", "?page=1&limit=1");
  const body = await response.json() as { data: unknown[]; total: number; limit: number };
  assert.equal(response.status, 200);
  assert.equal(body.data.length, 1);
  assert.equal(body.total, 2);
  assert.equal(body.limit, 1);
}
console.log("✓ GET /api/tenants/:id/audit: paginação respeitada");
