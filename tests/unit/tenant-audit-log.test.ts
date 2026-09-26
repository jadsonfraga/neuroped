import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { onRequestGet as readTenantAudit, parseAuditMetadata } from "../../functions/api/tenants/[id]/audit";
import { rolesWithPermission } from "../../shared/permissions";

/**
 * Trilha de auditoria restrita à clínica: quem detém `audit.read` lê só as
 * linhas de `saas_audit_log` da própria clínica; qualquer outro caso é 404
 * indistinguível (clínica alheia, inexistente, papel sem permissão, clínica
 * inativa). Todos os dados são sintéticos.
 */

class D1StatementMock {
  constructor(
    private readonly db: Database.Database,
    private readonly sql: string,
    private readonly values: unknown[] = [],
  ) {}
  bind(...values: unknown[]) {
    return new D1StatementMock(this.db, this.sql, values);
  }
  async first<T>() {
    return (this.db.prepare(this.sql).get(...this.values) as T | undefined) ?? null;
  }
  async all<T>() {
    return { success: true, results: this.db.prepare(this.sql).all(...this.values) as T[], meta: {} };
  }
  async run() {
    const result = this.db.prepare(this.sql).run(...this.values);
    return { success: true, meta: { changes: result.changes } };
  }
}
class D1DatabaseMock {
  constructor(private readonly db: Database.Database) {}
  prepare(sql: string) {
    return new D1StatementMock(this.db, sql);
  }
  async batch(statements: D1StatementMock[]) {
    return this.db.transaction(() =>
      statements.map((statement) => {
        const raw = statement as unknown as { db: Database.Database; sql: string; values: unknown[] };
        const result = raw.db.prepare(raw.sql).run(...raw.values);
        return { success: true, meta: { changes: result.changes } };
      }),
    )();
  }
}

const sqlite = new Database(":memory:");
sqlite.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL);
  CREATE TABLE clinics (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active');
  CREATE TABLE clinic_memberships (
    id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
  );
  CREATE TABLE saas_audit_log (
    id TEXT PRIMARY KEY, clinic_id TEXT, actor_user_id TEXT NOT NULL, action TEXT NOT NULL,
    target_type TEXT NOT NULL, target_id TEXT, metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const RED = "clinic-red-synthetic";
const BLUE = "clinic-blue-synthetic";
const GREY = "clinic-grey-suspended-synthetic";
const OWNER_RED = "user-owner-red";
const ADMIN_RED = "user-admin-red";
const PRO_RED = "user-pro-red";
const ASSISTANT_RED = "user-assistant-red";
const OWNER_BLUE = "user-owner-blue";
const OWNER_GREY = "user-owner-grey";
const now = "2026-09-20T10:00:00.000Z";

for (const [id, name] of [
  [OWNER_RED, "Owner Red"], [ADMIN_RED, "Admin Red"], [PRO_RED, "Pro Red"],
  [ASSISTANT_RED, "Assistant Red"], [OWNER_BLUE, "Owner Blue"], [OWNER_GREY, "Owner Grey"],
]) {
  sqlite.prepare("INSERT INTO users VALUES (?, ?, ?, 'professional')").run(id, `${id}@example.test`, name);
}
sqlite.prepare("INSERT INTO clinics VALUES (?, 'Red', 'red', 'active')").run(RED);
sqlite.prepare("INSERT INTO clinics VALUES (?, 'Blue', 'blue', 'active')").run(BLUE);
sqlite.prepare("INSERT INTO clinics VALUES (?, 'Grey', 'grey', 'suspended')").run(GREY);
for (const [clinic, userId, role] of [
  [RED, OWNER_RED, "owner"], [RED, ADMIN_RED, "clinic_admin"], [RED, PRO_RED, "professional"],
  [RED, ASSISTANT_RED, "assistant"], [BLUE, OWNER_BLUE, "owner"], [GREY, OWNER_GREY, "owner"],
]) {
  sqlite.prepare("INSERT INTO clinic_memberships VALUES (?, ?, ?, ?, 1, ?)").run(`m-${clinic}-${userId}`, clinic, userId, role, now);
}

const insertAudit = sqlite.prepare(
  "INSERT INTO saas_audit_log (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
);
insertAudit.run("a-red-1", RED, OWNER_RED, "clinic_membership_upsert", "clinic_membership", ADMIN_RED, JSON.stringify({ role: "clinic_admin" }), "2026-09-01T08:00:00.000Z");
insertAudit.run("a-red-2", RED, ADMIN_RED, "remote_intake_invite_create", "live_intake_invitation", "inv-1", null, "2026-09-10T09:00:00.000Z");
insertAudit.run("a-red-3", RED, OWNER_RED, "clinic_update", "clinic", RED, "{not json", "2026-09-15T12:00:00.000Z");
insertAudit.run("a-blue-1", BLUE, OWNER_BLUE, "clinic_update", "clinic", BLUE, null, "2026-09-16T12:00:00.000Z");
// O mesmo ator agindo em outra clínica: não vaza para a trilha da RED.
insertAudit.run("a-blue-2", BLUE, OWNER_RED, "clinic_membership_upsert", "clinic_membership", OWNER_RED, null, "2026-09-17T12:00:00.000Z");
// Evento de plataforma sem clínica: invisível para qualquer tenant.
insertAudit.run("a-platform", null, OWNER_RED, "platform_action", "platform", null, null, "2026-09-18T12:00:00.000Z");
insertAudit.run("a-grey-1", GREY, OWNER_GREY, "clinic_update", "clinic", GREY, null, "2026-09-18T12:00:00.000Z");

const env = { DB: new D1DatabaseMock(sqlite) as unknown as D1Database };

function ctx(userId: string | null, clinicId: string, query = "", db: unknown = env.DB) {
  return {
    env: { DB: db === null ? undefined : db },
    data: userId ? { authUser: { id: userId, email: `${userId}@example.test`, name: userId, role: "professional", mustChangePassword: false } } : {},
    params: { id: clinicId },
    request: new Request(`https://app.neuroped.example/api/tenants/${clinicId}/audit${query}`),
  } as never;
}
async function json(response: Response) {
  return JSON.parse(await response.text()) as {
    code?: string;
    data?: Array<{ id: string; actorName: string | null; metadata: Record<string, unknown> | null; action: string }>;
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Catálogo: só gestores leem a trilha.
assert.deepEqual(rolesWithPermission("audit.read"), ["owner", "clinic_admin"]);

// Fail-closed sem DB e sem sessão.
assert.equal((await readTenantAudit(ctx(OWNER_RED, RED, "", null))).status, 503);
assert.equal((await readTenantAudit(ctx(null, RED))).status, 401);

// Gestor da RED vê só a RED, em ordem decrescente, com nome do ator e metadados.
{
  const response = await readTenantAudit(ctx(OWNER_RED, RED));
  assert.equal(response.status, 200);
  const body = await json(response);
  assert.deepEqual(body.data?.map((row) => row.id), ["a-red-3", "a-red-2", "a-red-1"]);
  assert.equal(body.total, 3);
  assert.equal(body.data?.[2].actorName, "Owner Red");
  assert.deepEqual(body.data?.[2].metadata, { role: "clinic_admin" });
  assert.equal(body.data?.[0].metadata, null, "metadata malformado vira null, nunca erro");
  const ids = new Set(body.data?.map((row) => row.id));
  for (const foreign of ["a-blue-1", "a-blue-2", "a-platform", "a-grey-1"]) {
    assert.equal(ids.has(foreign), false, `${foreign} vazou para a trilha da RED`);
  }
}
assert.equal((await readTenantAudit(ctx(ADMIN_RED, RED))).status, 200, "clinic_admin lê");

// 404 indistinguível: papel sem permissão, clínica alheia, inexistente, inativa.
for (const [userId, clinicId, label] of [
  [PRO_RED, RED, "profissional"],
  [ASSISTANT_RED, RED, "assistente"],
  [OWNER_BLUE, RED, "owner de outra clínica"],
  [OWNER_RED, BLUE, "gestor tentando a clínica alheia"],
  [OWNER_RED, "clinic-does-not-exist", "clínica inexistente"],
  [OWNER_GREY, GREY, "clínica suspensa"],
] as const) {
  const response = await readTenantAudit(ctx(userId, clinicId));
  assert.equal(response.status, 404, label);
  const body = await json(response);
  assert.equal(body.code, "NOT_FOUND", label);
  assert.equal("data" in body, false, `${label}: negação não pode carregar dados`);
}

// Filtros: trecho de ação, tipo de alvo, intervalo de datas, paginação com teto.
{
  const byAction = await json(await readTenantAudit(ctx(OWNER_RED, RED, "?action=membership")));
  assert.deepEqual(byAction.data?.map((row) => row.id), ["a-red-1"]);
  const byResource = await json(await readTenantAudit(ctx(OWNER_RED, RED, "?resource=clinic")));
  assert.deepEqual(byResource.data?.map((row) => row.id), ["a-red-3"]);
  const byRange = await json(await readTenantAudit(ctx(OWNER_RED, RED, "?from=2026-09-05&to=2026-09-15")));
  assert.deepEqual(byRange.data?.map((row) => row.id), ["a-red-3", "a-red-2"], "to é inclusivo no dia");
  const paged = await json(await readTenantAudit(ctx(OWNER_RED, RED, "?page=2&limit=2")));
  assert.deepEqual(paged.data?.map((row) => row.id), ["a-red-1"]);
  assert.equal(paged.total, 3);
  assert.equal(paged.page, 2);
  const capped = await json(await readTenantAudit(ctx(OWNER_RED, RED, "?limit=999")));
  assert.equal(capped.limit, 100);
  // Curinga do LIKE vindo do usuário é literal, não coringa.
  const wildcard = await json(await readTenantAudit(ctx(OWNER_RED, RED, "?action=%")));
  assert.deepEqual(wildcard.data, [], "'%' não pode virar 'tudo'");
}
assert.equal((await readTenantAudit(ctx(OWNER_RED, RED, "?from=2026-02-30"))).status, 400);
assert.equal((await readTenantAudit(ctx(OWNER_RED, RED, "?from=2026-09-10&to=2026-09-01"))).status, 400);

assert.deepEqual(parseAuditMetadata("[1,2]"), null, "array não é metadata de objeto");
assert.deepEqual(parseAuditMetadata(null), null);

// Trava estática: a rota autoriza pela permissão e repete a clínica no SQL.
const source = readFileSync("functions/api/tenants/[id]/audit.ts", "utf8");
assert.match(source, /membershipHas\(membership, "audit\.read"\)/);
assert.match(source, /WHERE a\.clinic_id = \?/);
assert.doesNotMatch(source, /membership\.role\s*[!=]==/);

console.log("tenant-audit-log: trilha da clínica isolada por tenant, 404 uniforme, filtros e paginação OK");
