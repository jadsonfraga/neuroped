import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";

const read = (relative: string) => readFileSync(new URL(`../../${relative}`, import.meta.url), "utf8");
const migration = read("db/migrations/0016_saas_hub.sql");
const hubCore = read("functions/api/saas/_core.ts");
const onboardingApi = read("functions/api/onboarding/index.ts");
const partnersApi = read("functions/api/partners/index.ts");
const communicationApi = read("functions/api/communication/index.ts");
const feedbackApi = read("functions/api/feedback/index.ts");
const lifecycleApi = read("functions/api/tenants/[id]/lifecycle.ts");
const middleware = read("functions/api/_middleware.ts");
const workflow = read(".github/workflows/saas-billing-d1-migration.yml");

for (const table of [
  "onboarding_steps",
  "tenant_webhook_events",
  "tenant_reactivation_requests",
  "availability_templates",
  "partner_directory",
  "partner_referrals",
  "communication_templates",
  "communication_campaigns",
  "communication_deliveries",
  "feedback_surveys",
  "feedback_survey_events",
]) assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));

assert.match(hubCore, /resolveHubClinic/);
assert.match(hubCore, /PARTNER_REFERRAL_TENANT_MISMATCH/);
assert.match(hubCore, /COMMUNICATION_TEMPLATE_TENANT_MISMATCH/);
assert.match(onboardingApi, /completed_by_user_id/);
assert.match(onboardingApi, /reconcileOnboarding/);
assert.match(partnersApi, /membershipCanWriteClinical/);
assert.match(partnersApi, /encryptText/);
assert.match(communicationApi, /COMMUNICATION_CHANNEL_NOT_ALLOWED/);
assert.match(communicationApi, /queue_campaign/);
assert.match(feedbackApi, /status = 'answered'/);
assert.match(feedbackApi, /token_hash/);
assert.match(lifecycleApi, /reactivation_requested/);
assert.match(lifecycleApi, /tenant\.reactivated/);
assert.match(middleware, /"\/api\/feedback"/);
assert.match(middleware, /X-Clinic-Id/);
assert.match(workflow, /0016_saas_hub\.sql/);

const db = new Database(":memory:");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT, email TEXT, role TEXT, is_active INTEGER DEFAULT 1);
  CREATE TABLE clinics (id TEXT PRIMARY KEY, slug TEXT NOT NULL, name TEXT NOT NULL, timezone TEXT, status TEXT DEFAULT 'active', created_by_user_id TEXT REFERENCES users(id));
  CREATE TABLE appointments (id TEXT PRIMARY KEY, provider_user_id TEXT REFERENCES users(id), starts_at_local TEXT, ends_at_local TEXT, status TEXT);
  CREATE TABLE tenant_lifecycle (
    clinic_id TEXT PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','closure_requested','closed')),
    previous_clinic_status TEXT, previous_billing_status TEXT, reason_code TEXT,
    requested_by_user_id TEXT, requested_at DATETIME, retention_until DATETIME,
    canceled_at DATETIME, finalized_at DATETIME, legal_hold INTEGER DEFAULT 0, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
db.exec(migration);

const tableNames = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>;
for (const table of ["partner_directory", "partner_referrals", "communication_templates", "communication_campaigns", "feedback_surveys", "tenant_reactivation_requests"]) {
  assert.ok(tableNames.some((row) => row.name === table), `${table} deve existir após a migration`);
}

const insertUser = db.prepare("INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')");
insertUser.run("u1", "Profissional 1", "u1@example.test");
insertUser.run("u2", "Profissional 2", "u2@example.test");
db.prepare("INSERT INTO clinics (id, slug, name, timezone, status, created_by_user_id) VALUES ('c1','c1','Clínica 1','America/Recife','active','u1'), ('c2','c2','Clínica 2','America/Recife','active','u2')").run();

db.prepare("INSERT INTO partner_directory (id, clinic_id, name, created_by_user_id) VALUES ('p1','c1','Parceiro 1','u1'), ('p2','c2','Parceiro 2','u2')").run();
assert.throws(
  () => db.prepare("INSERT INTO partner_referrals (id, clinic_id, partner_id, created_by_user_id, direction) VALUES ('r-cross','c1','p2','u1','outbound')").run(),
  /PARTNER_REFERRAL_TENANT_MISMATCH/,
  "referral nunca pode cruzar o tenant do parceiro",
);

db.prepare(`INSERT INTO communication_templates (id, clinic_id, template_key, name, channels_json, body_template) VALUES ('t1','c1','hello','Hello','["email"]','Olá')`).run();
assert.throws(
  () => db.prepare("INSERT INTO communication_campaigns (id, clinic_id, template_id, name, created_by_user_id) VALUES ('cmp-cross','c2','t1','Campanha','u2')").run(),
  /COMMUNICATION_TEMPLATE_TENANT_MISMATCH/,
  "campanha nunca pode usar template de outro tenant",
);

db.prepare("INSERT INTO tenant_reactivation_requests (id, clinic_id, requested_by_user_id, reason) VALUES ('rea1','c1','u1','retorno')").run();
assert.equal(db.prepare("SELECT status FROM tenant_reactivation_requests WHERE id = 'rea1'").get().status, "pending");
db.prepare("UPDATE tenant_lifecycle SET status = 'closure_requested', requested_at = CURRENT_TIMESTAMP, retention_until = datetime('now', '+30 day'), reason_code = 'customer_request' WHERE clinic_id = 'c1'").run();
db.exec(migration);
assert.equal(db.prepare("SELECT status FROM tenant_lifecycle WHERE clinic_id = 'c1'").get().status, "closure_requested");
assert.equal(db.prepare("SELECT status FROM tenant_reactivation_requests WHERE id = 'rea1'").get().status, "pending");

db.close();
console.log("✓ SaaS Hub: migration, checklist, partners, comunicação, NPS e isolamento tenant protegidos");
