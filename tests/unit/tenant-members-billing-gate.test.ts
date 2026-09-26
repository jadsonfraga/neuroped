/**
 * tenant-members-billing-gate.test.ts — LTB-15 (ciclo 4 da espiral SaaS,
 * 2026-09-26 — docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md).
 *
 * functions/api/tenants/[id]/_middleware.ts é o gate de billing de
 * `/api/tenants/:id/members`. Ele só roda de verdade por trás do
 * roteamento do Cloudflare Pages — uma chamada direta ao handler de
 * members.ts (como em tests/unit/cliente-zero-journey.test.ts) o ignora
 * por completo. Este teste exercita o `onRequest` do middleware
 * diretamente, com um `next()` sintético, provando que:
 *
 *  1. GET e DELETE alcançam `next()` mesmo com billing suspenso (past_due
 *     sem carência) — listar e desligar não custam assento;
 *  2. POST continua bloqueado (402) no mesmo estado — adicionar custa.
 *
 * Nenhum dado real: tudo aqui é sintético.
 */
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { onRequest as membersMiddleware } from "../../functions/api/tenants/[id]/_middleware";

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
}

const sqlite = new Database(":memory:");
sqlite.exec(`
  CREATE TABLE clinics (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'active'
  );
  CREATE TABLE clinic_memberships (
    clinic_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE billing_customers (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    status TEXT NOT NULL,
    trial_ends_at TEXT,
    grace_ends_at TEXT
  );
  CREATE TABLE billing_subscriptions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    plan_id TEXT,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const CLINIC = "clinic-billing-gate-synthetic";
const OWNER = "user-owner-billing-gate";
const now = new Date().toISOString();

sqlite.prepare("INSERT INTO clinics VALUES (?, 'active')").run(CLINIC);
sqlite.prepare("INSERT INTO clinic_memberships VALUES (?, ?, 'owner', 1)").run(CLINIC, OWNER);
sqlite.prepare("INSERT INTO billing_customers VALUES (?, ?, 'past_due', NULL, NULL)").run("customer-1", CLINIC);
sqlite.prepare("INSERT INTO billing_subscriptions VALUES (?, ?, NULL, 'past_due', ?)").run("sub-1", "customer-1", now);

const env = { DB: new D1DatabaseMock(sqlite) as unknown as D1Database };

async function run(method: string) {
  let nextCalled = false;
  const response = await membersMiddleware({
    request: new Request(`https://x.test/api/tenants/${CLINIC}/members`, { method }),
    env,
    params: { id: CLINIC },
    data: { authUser: { id: OWNER, email: "owner@example.test", name: "Owner", role: "professional", mustChangePassword: false } },
    next: async () => {
      nextCalled = true;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  } as never);
  return { response, nextCalled };
}

// ── Billing suspenso (past_due sem carência): premissa ──────────────────────
{
  const denial = await import("../../functions/api/billing/_guard").then((m) =>
    m.requireBillingEntitlement(env.DB, OWNER, CLINIC, "admin"),
  );
  assert.ok(denial, "premissa: o entitlement admin precisa estar negado neste estado sintético");
}

// ── GET e DELETE alcançam next() mesmo com billing suspenso ──────────────────
for (const method of ["GET", "DELETE"]) {
  const { response, nextCalled } = await run(method);
  assert.equal(nextCalled, true, `${method} precisa alcançar next() mesmo com billing suspenso`);
  assert.equal(await response.text(), JSON.stringify({ ok: true }));
}

// ── POST continua bloqueado no mesmo estado ──────────────────────────────────
{
  const { response, nextCalled } = await run("POST");
  assert.equal(nextCalled, false, "POST não pode alcançar next() com billing suspenso");
  assert.equal(response.status, 402);
}

sqlite.close();
console.log("✓ tenant-members-billing-gate: GET/DELETE de /members alcançam next() com billing suspenso; POST continua bloqueado (LTB-15)");
