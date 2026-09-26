/**
 * remote-intake-clinic-status.test.ts — LTB-14 (ciclo 4 da espiral SaaS,
 * 2026-09-26 — docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md): o link
 * público de pré-consulta (functions/api/public-intake.ts) ignorava o
 * estado da clínica. Uma família continuava enviando PHI de pré-consulta
 * para uma clínica suspensa ou encerrada, porque `resolveInvitation` nunca
 * olhava `clinics.status`.
 *
 * Roda os handlers REAIS (functions/api/live/intake, functions/api/
 * public-intake) contra um D1-fake (better-sqlite3) com schema mínimo
 * compatível + o SQL real da migração 0018, e a criptografia clínica REAL.
 *
 * Nenhum dado real: todo conteúdo aqui é sintético.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { onRequestPost as createInvitation } from "../../functions/api/live/intake/index";
import { onRequestGet as publicGetIntake, onRequestPost as publicPostIntake } from "../../functions/api/public-intake";

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
    return this.db.transaction(() => statements.map((statement) => {
      const raw = statement as unknown as { db: Database.Database; sql: string; values: unknown[] };
      const result = raw.db.prepare(raw.sql).run(...raw.values);
      return { success: true, meta: { changes: result.changes } };
    }))();
  }
}

const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
sqlite.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL
  );
  CREATE TABLE clinics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
  );
  CREATE TABLE clinic_memberships (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
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
  CREATE TABLE live_patients (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
  );
  CREATE TABLE saas_audit_log (
    id TEXT PRIMARY KEY,
    clinic_id TEXT,
    actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
sqlite.exec(readFileSync("db/migrations/0018_saas_remote_intake.sql", "utf8"));
sqlite.exec(readFileSync("db/migrations/0023_public_submission_audit.sql", "utf8"));

const CLINIC_A = "clinic-a-intake-synthetic";
const PATIENT_A = "patient-a-intake-synthetic";
const PROFESSIONAL_A = "user-professional-a-intake";
const now = new Date().toISOString();

sqlite.prepare("INSERT INTO users VALUES (?, ?, ?, 'professional')").run(PROFESSIONAL_A, "prof-intake@example.test", "Prof Intake");
sqlite.prepare("INSERT INTO clinics VALUES (?, ?, ?, 'active')").run(CLINIC_A, "Clínica Intake", "clinica-intake");
sqlite.prepare("INSERT INTO clinic_memberships VALUES (?, ?, ?, 'professional', 1, ?)").run("membership-a", CLINIC_A, PROFESSIONAL_A, now);
sqlite.prepare("INSERT INTO billing_customers VALUES (?, ?, 'active', NULL, NULL)").run("customer-a", CLINIC_A);
sqlite.prepare("INSERT INTO billing_subscriptions VALUES (?, ?, 'plan', 'active', ?)").run("subscription-a", "customer-a", now);
sqlite.prepare("INSERT INTO live_patients VALUES (?, ?, 'active')").run(PATIENT_A, CLINIC_A);

const env = {
  DB: new D1DatabaseMock(sqlite) as unknown as D1Database,
  CLINICAL_LIVE_ENABLED: "true",
  CLINICAL_DATA_KEY: "production-readiness-data-key-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  CLINICAL_DATA_KEY_ID: "k-test-2026-09-26",
  CLINICAL_INDEX_KEY: "production-readiness-index-key-9876543210-ZYXWVUTSRQPONMLKJIHGFEDCBA",
};

function staffContext(method: string, url: string, body?: unknown) {
  return {
    env,
    data: { authUser: { id: PROFESSIONAL_A, email: "prof-intake@example.test", name: "Prof Intake", role: "professional", mustChangePassword: false } },
    params: {},
    request: new Request(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  } as never;
}

function publicContext(method: string, token: string, body?: unknown) {
  const headers: Record<string, string> = { Authorization: `Intake ${token}` };
  if (body) headers["content-type"] = "application/json";
  return {
    env,
    data: {},
    params: {},
    request: new Request("https://app.neuroped.example/api/public-intake", {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }),
  } as never;
}

async function json(response: Response) {
  return JSON.parse(await response.text()) as Record<string, unknown>;
}

// ── Convite legítimo de pré-consulta ────────────────────────────────────────
const invite = await createInvitation(
  staffContext("POST", "https://x/api/live/intake", {
    clinicId: CLINIC_A,
    patientId: PATIENT_A,
    respondentKind: "family",
    formKind: "pre_consulta",
    expiresInHours: 168,
  }),
);
assert.equal(invite.status, 201, "convite de pré-consulta deve ser criado");
const inviteBody = await json(invite);
const token = inviteBody.token as string;

// Premissa: com a clínica ativa, o formulário público é alcançável.
assert.equal((await publicGetIntake(publicContext("GET", token))).status, 200);

// ── LTB-14: clínica suspensa bloqueia o link público ────────────────────────
sqlite.prepare("UPDATE clinics SET status = 'suspended' WHERE id = ?").run(CLINIC_A);
try {
  const bloqueadoGet = await publicGetIntake(publicContext("GET", token));
  assert.equal(bloqueadoGet.status, 410, "clínica suspensa não pode servir o formulário de pré-consulta");
  assert.equal((await json(bloqueadoGet)).code, "INTAKE_UNAVAILABLE");

  const bloqueadoPost = await publicPostIntake(
    publicContext("POST", token, {
      consentAccepted: true,
      respondentName: "Mãe da criança",
      responses: {},
    }),
  );
  assert.equal(bloqueadoPost.status, 410, "envio para clínica suspensa não pode ser aceito");

  const semLinha = sqlite
    .prepare("SELECT COUNT(*) AS n FROM live_intake_submissions WHERE invitation_id = ?")
    .get(inviteBody.id as string) as { n: number };
  assert.equal(semLinha.n, 0, "nenhuma submissão pode ser gravada enquanto a clínica está suspensa");
} finally {
  sqlite.prepare("UPDATE clinics SET status = 'active' WHERE id = ?").run(CLINIC_A);
}

// Clínica encerrada tem o mesmo bloqueio.
sqlite.prepare("UPDATE clinics SET status = 'closed' WHERE id = ?").run(CLINIC_A);
assert.equal((await publicGetIntake(publicContext("GET", token))).status, 410);

sqlite.close();
console.log("✓ remote-intake: link público de pré-consulta recusa clínica suspensa/encerrada, sem gravar submissão (LTB-14)");
