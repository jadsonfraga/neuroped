import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import Database from "better-sqlite3";
import {
  onRequestGet,
  readTenantOnboarding,
} from "../../functions/api/tenants/[id]/onboarding";

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
    return { results: this.db.prepare(this.sql).all(...this.values) as T[] };
  }
  async run() {
    const result = this.db.prepare(this.sql).run(...this.values);
    return { meta: { changes: result.changes } };
  }
}

class D1DatabaseMock {
  constructor(private readonly db: Database.Database) {}
  prepare(sql: string) {
    return new D1StatementMock(this.db, sql);
  }
}

function freshDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(readFileSync("db/schema.d1.sql", "utf8"));
  for (const file of readdirSync("db/migrations").filter((name) => name.endsWith(".sql")).sort()) {
    try {
      sqlite.exec(readFileSync(`db/migrations/${file}`, "utf8"));
    } catch (error) {
      assert.match(String(error), /duplicate column name/i, `migração ${file}: ${String(error)}`);
    }
  }
  return { sqlite, db: new D1DatabaseMock(sqlite) as unknown as D1Database };
}

const { sqlite, db } = freshDb();
const base = "2026-09-26T12:00:00.000Z";

function insertUser(id: string, role = "professional", verified = true) {
  sqlite.prepare(
    `INSERT INTO users
      (id, name, email, role, is_active, email_verified_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
  ).run(id, `Usuário ${id}`, `${id}@example.test`, role, verified ? base : null, base, base);
}

function insertClinic(id: string, ownerId: string) {
  sqlite.prepare(
    `INSERT INTO clinics
      (id, slug, name, timezone, status, created_by_user_id, created_at, updated_at)
     VALUES (?, ?, ?, 'America/Recife', 'active', ?, ?, ?)`,
  ).run(id, id, `Clínica ${id}`, ownerId, base, base);
  sqlite.prepare(
    `INSERT INTO clinic_memberships
      (clinic_id, user_id, role, active, invited_by_user_id, created_at, updated_at)
     VALUES (?, ?, 'owner', 1, ?, ?, ?)`,
  ).run(id, ownerId, ownerId, base, base);
}

insertUser("owner-a");
insertUser("owner-b");
insertClinic("clinic-a", "owner-a");
insertClinic("clinic-b", "owner-b");

const semProvider = await readTenantOnboarding(
  db,
  "clinic-a",
  {},
  new Date("2026-09-26T13:00:00.000Z"),
);
assert.ok(semProvider);
assert.equal(semProvider.milestones.length, 10);
assert.equal(semProvider.progress.completed, 4, "conta, e-mail, clínica e plano vêm das fontes canônicas");
assert.equal(semProvider.progress.total, 10);
assert.equal(
  semProvider.milestones.find((item) => item.key === "billing_configured")?.status,
  "blocked_external",
  "sem configuração externa billing não pode parecer pendência interna concluível",
);
assert.equal(semProvider.billingEvidence.status, "BLOCKED_EXTERNAL");

insertUser("member-a");
sqlite.prepare(
  `INSERT INTO clinic_memberships
    (clinic_id, user_id, role, active, invited_by_user_id, created_at, updated_at)
   VALUES ('clinic-a', 'member-a', 'professional', 1, 'owner-a', ?, ?)`,
).run("2026-09-26T13:10:00.000Z", "2026-09-26T13:10:00.000Z");

const auditEvents = [
  ["audit-patient", "live_patient_create", "patient", "patient-a", null, "2026-09-26T13:20:00.000Z"],
  [
    "audit-encounter",
    "live_clinical_event_create",
    "clinical_event",
    "event-a",
    JSON.stringify({ eventType: "encounter" }),
    "2026-09-26T13:30:00.000Z",
  ],
  ["audit-document", "live_document_create", "document", "document-a", null, "2026-09-26T13:40:00.000Z"],
  ["audit-assessment", "live_assessment_create", "assessment", "assessment-a", null, "2026-09-26T13:50:00.000Z"],
] as const;
for (const event of auditEvents) {
  sqlite.prepare(
    `INSERT INTO saas_audit_log
      (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
     VALUES (?, 'clinic-a', 'owner-a', ?, ?, ?, ?, ?)`,
  ).run(...event);
}

const billing = sqlite.prepare(
  `SELECT bc.id AS customer_id, bs.id AS subscription_id
     FROM billing_customers bc
     JOIN billing_subscriptions bs ON bs.customer_id = bc.id
    WHERE bc.clinic_id = 'clinic-a' LIMIT 1`,
).get() as { customer_id: string; subscription_id: string };
sqlite.prepare(
  `INSERT INTO billing_invoice_events
    (id, subscription_id, provider, provider_event_id, kind, amount_cents,
     status, idempotency_key, occurred_at, created_at)
   VALUES ('invoice-paid-a', ?, 'asaas', 'provider-event-a', 'charge_paid', 19800,
           'done', 'asaas:provider-event-a', ?, ?)`,
).run(billing.subscription_id, "2026-09-26T14:00:00.000Z", "2026-09-26T14:00:00.000Z");

const completo = await readTenantOnboarding(
  db,
  "clinic-a",
  {
    ASAAS_API_KEY: "asaas-chave-configurada",
    ASAAS_WEBHOOK_TOKEN: "token-webhook-configurado-com-32-caracteres",
    ASAAS_ENVIRONMENT: "sandbox",
  },
  new Date("2026-09-26T14:10:00.000Z"),
);
assert.ok(completo);
assert.equal(completo.progress.completed, 10);
assert.equal(completo.progress.percent, 100);
assert.equal(completo.billingEvidence.status, "SERVER_CONFIRMED");
assert.equal(completo.billingEvidence.confirmedAt, "2026-09-26T14:00:00.000Z");
assert.equal(
  completo.milestones.find((item) => item.key === "first_consultation")?.completedAt,
  "2026-09-26T13:30:00.000Z",
);

function context(userId: string, clinicId: string, role = "professional") {
  return {
    env: { DB: db },
    data: {
      authUser: {
        id: userId,
        name: userId,
        email: `${userId}@example.test`,
        role,
        mustChangePassword: false,
      },
    },
    params: { id: clinicId },
    request: new Request(`https://example.test/api/tenants/${clinicId}/onboarding`),
  } as never;
}

const crossTenant = await onRequestGet(context("owner-b", "clinic-a"));
assert.equal(crossTenant.status, 404, "owner de outra clínica não infere o onboarding alheio");

const ownTenant = await onRequestGet(context("owner-a", "clinic-a"));
assert.equal(ownTenant.status, 200);
assert.equal((await ownTenant.json() as { clinicId: string }).clinicId, "clinic-a");

const ordinaryMember = await onRequestGet(context("member-a", "clinic-a"));
assert.equal(ordinaryMember.status, 404, "checklist gerencial não expõe billing a membro comum");

console.log("✓ onboarding SaaS: 10 marcos server-computed, billing confirmado no servidor, BLOCKED_EXTERNAL e anti-IDOR aprovados");
