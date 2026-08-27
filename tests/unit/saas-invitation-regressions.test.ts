import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { onRequest as apiMiddleware } from "../../functions/api/_middleware";
import { onRequestPost as acceptInvitation } from "../../functions/api/billing/accept";
import { resolveOperationsPrincipal } from "../../functions/api/operations/_access";

class SqliteD1 {
  constructor(readonly db: Database.Database) {}

  prepare(sql: string) {
    let bindings: unknown[] = [];
    const statement = {
      bind: (...values: unknown[]) => {
        bindings = values;
        return statement;
      },
      first: <T>() =>
        (this.db.prepare(sql).get(...bindings) ?? null) as T | null,
      all: <T>() => ({ results: this.db.prepare(sql).all(...bindings) as T[] }),
      run: () => {
        const result = this.db.prepare(sql).run(...bindings);
        return { meta: { changes: result.changes } };
      },
    };
    return statement;
  }

  async batch(statements: Array<{ run: () => unknown }>) {
    const execute = this.db.transaction(
      (items: Array<{ run: () => unknown }>) =>
        items.map((statement) => statement.run()),
    );
    return execute(statements);
  }
}

function createDatabase() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      password_hash TEXT,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE clinics (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_by_user_id TEXT,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE clinic_memberships (
      clinic_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      invited_by_user_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      PRIMARY KEY (clinic_id, user_id)
    );
    CREATE TABLE billing_customers (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      trial_ends_at TEXT
    );
    CREATE TABLE billing_subscriptions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL,
      seats INTEGER,
      updated_at TEXT
    );
    CREATE TABLE clinic_invitations (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      invited_by_user_id TEXT,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      expires_at TEXT NOT NULL,
      accepted_at TEXT,
      created_at TEXT
    );
    CREATE TABLE booking_staff_links (
      provider_user_id TEXT NOT NULL,
      staff_user_id TEXT NOT NULL UNIQUE,
      active INTEGER NOT NULL DEFAULT 1,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (provider_user_id, staff_user_id)
    );
    CREATE TABLE saas_audit_events (
      id TEXT PRIMARY KEY,
      clinic_id TEXT,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      metadata_json TEXT,
      created_at TEXT NOT NULL
    );
  `);
  return { db, adapter: new SqliteD1(db) };
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function insertClinic(db: Database.Database, id: string, creatorId: string) {
  db.prepare(
    `INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at)
     VALUES (?, ?, ?, 'active', ?, ?, ?)`,
  ).run(
    id,
    id.toLowerCase(),
    `Clínica ${id}`,
    creatorId,
    new Date().toISOString(),
    new Date().toISOString(),
  );
}

function insertUser(
  db: Database.Database,
  user: { id: string; name: string; email: string; role: string },
) {
  db.prepare(
    `INSERT INTO users
      (id, name, email, role, is_active, password_hash, must_change_password,
       failed_login_attempts, locked_until, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, NULL, 0, 0, NULL, ?, ?)`,
  ).run(
    user.id,
    user.name,
    user.email,
    user.role,
    new Date().toISOString(),
    new Date().toISOString(),
  );
}

function insertBilling(db: Database.Database, clinicId: string, seats = 3) {
  db.prepare(
    `INSERT INTO billing_customers (id, clinic_id, status, trial_ends_at)
     VALUES (?, ?, 'active', NULL)`,
  ).run(`customer-${clinicId}`, clinicId);
  db.prepare(
    `INSERT INTO billing_subscriptions (id, customer_id, status, seats, updated_at)
     VALUES (?, ?, 'active', ?, ?)`,
  ).run(
    `subscription-${clinicId}`,
    `customer-${clinicId}`,
    seats,
    new Date().toISOString(),
  );
}

async function insertInvitation(
  db: Database.Database,
  input: {
    id: string;
    clinicId: string;
    invitedByUserId: string;
    email: string;
    role: string;
    token: string;
  },
) {
  db.prepare(
    `INSERT INTO clinic_invitations
      (id, clinic_id, invited_by_user_id, email, role, token_hash, status, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
  ).run(
    input.id,
    input.clinicId,
    input.invitedByUserId,
    input.email,
    input.role,
    await sha256Hex(input.token),
    new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    new Date().toISOString(),
  );
}

async function acceptThroughPublicRoute(
  adapter: SqliteD1,
  body: Record<string, unknown>,
) {
  const request = new Request("https://neuroped.test/api/billing/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const response = await apiMiddleware({
    request,
    env: { DB: adapter as never },
    next: async () =>
      acceptInvitation({ env: { DB: adapter as never }, request } as never),
    data: {},
  } as never);
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

// P1: o destinatário de um convite é anônimo por definição. O middleware deve
// deixar o capability-token chegar ao handler, que cria a conta e a membership.
{
  const { db, adapter } = createDatabase();
  insertUser(db, {
    id: "provider-anon",
    name: "Profissional",
    email: "provider@example.test",
    role: "professional",
  });
  insertClinic(db, "clinic-anon", "provider-anon");
  db.prepare(
    `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, invited_by_user_id)
     VALUES ('clinic-anon', 'provider-anon', 'professional', 1, NULL)`,
  ).run();
  insertBilling(db, "clinic-anon");
  const token = "anonymous-invitation-token-with-more-than-32-characters";
  await insertInvitation(db, {
    id: "inv-anonymous",
    clinicId: "clinic-anon",
    invitedByUserId: "provider-anon",
    email: "new-recipient@example.test",
    role: "professional",
    token,
  });

  const result = await acceptThroughPublicRoute(adapter, {
    token,
    name: "Novo Profissional",
    password: "senha-segura-com-mais-dez",
  });
  assert.equal(
    result.status,
    201,
    "destinatário deslogado deve conseguir aceitar convite válido",
  );
  assert.equal(result.body.accountCreated, true);
  assert.equal(result.body.role, "professional");
  assert.equal(
    db
      .prepare(
        "SELECT COUNT(*) AS count FROM users WHERE email = 'new-recipient@example.test'",
      )
      .get().count,
    1,
  );
  assert.equal(
    db
      .prepare(
        "SELECT role FROM clinic_memberships WHERE clinic_id = 'clinic-anon' AND user_id = ?",
      )
      .get(result.body.userId).role,
    "professional",
  );
  assert.equal(
    db
      .prepare(
        "SELECT status FROM clinic_invitations WHERE id = 'inv-anonymous'",
      )
      .get().status,
    "accepted",
  );
  db.close();
}

// P1: uma conta que já é profissional em outra clínica pode aceitar uma
// membership assistant. O vínculo operacional específico deve vencer o papel
// global ao resolver a Agenda, sem rebaixar a conta para operator.
{
  const { db, adapter } = createDatabase();
  insertUser(db, {
    id: "provider-delegated",
    name: "Profissional responsável",
    email: "owner@example.test",
    role: "professional",
  });
  insertUser(db, {
    id: "existing-professional",
    name: "Profissional assistente",
    email: "existing@example.test",
    role: "professional",
  });
  insertClinic(db, "clinic-own", "existing-professional");
  insertClinic(db, "clinic-delegated", "provider-delegated");
  db.prepare(
    `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, invited_by_user_id)
     VALUES
       ('clinic-own', 'existing-professional', 'professional', 1, NULL),
       ('clinic-delegated', 'provider-delegated', 'professional', 1, NULL)`,
  ).run();
  insertBilling(db, "clinic-delegated");
  const token =
    "existing-professional-assistant-token-with-more-than-32-characters";
  await insertInvitation(db, {
    id: "inv-delegated",
    clinicId: "clinic-delegated",
    invitedByUserId: "provider-delegated",
    email: "existing@example.test",
    role: "assistant",
    token,
  });

  const result = await acceptThroughPublicRoute(adapter, { token });
  assert.equal(
    result.status,
    201,
    "conta profissional existente deve aceitar convite de assistente",
  );
  assert.equal(result.body.accountCreated, false);
  assert.equal(result.body.role, "assistant");
  assert.equal(
    db
      .prepare("SELECT role FROM users WHERE id = 'existing-professional'")
      .get().role,
    "professional",
    "a membership assistant não pode rebaixar o papel global da conta",
  );
  assert.deepEqual(
    db
      .prepare(
        "SELECT provider_user_id, staff_user_id, active FROM booking_staff_links WHERE staff_user_id = 'existing-professional'",
      )
      .get(),
    {
      provider_user_id: "provider-delegated",
      staff_user_id: "existing-professional",
      active: 1,
    },
  );

  const principal = await resolveOperationsPrincipal(adapter as never, {
    id: "existing-professional",
    email: "existing@example.test",
    name: "Profissional assistente",
    role: "professional",
    mustChangePassword: false,
  });
  assert.equal(principal?.providerUserId, "provider-delegated");
  assert.equal(principal?.delegated, true);
  assert.equal(principal?.canConfigure, false);
  db.close();
}

console.log(
  "✓ invitation regressions: aceite anônimo e agenda delegada preservados",
);
