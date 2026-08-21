import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const billingGuard = read("functions/api/billing/_guard.ts");
const webhook = read("functions/api/billing/webhook.ts");
const migration = read("db/migrations/0014_saas_billing_contract_hardening.sql");
const memorySearch = read("functions/api/memory/search.ts");
const patientRoute = read("functions/api/patients/[id].ts");
const cloudflareWorkflow = read(".github/workflows/deploy-cloudflare.yml");
const vercelWorkflow = read(".github/workflows/deploy-vercel.yml");
const githubWorkflow = read(".github/workflows/deploy.yml");
const billingMigrationWorkflow = read(".github/workflows/saas-billing-d1-migration.yml");

// Tenant explícito nunca é autorização: precisa pertencer ao usuário autenticado.
assert.doesNotMatch(billingGuard, /if\s*\(explicit\)\s*return\s+explicit/);
assert.match(billingGuard, /WHERE user_id = \? AND clinic_id = \? AND active = 1/);
assert.match(billingGuard, /\.bind\(userId, explicit\)\.first/);

// Um webhook pago só pode aplicar os assentos do checkout que gerou o evento.
assert.match(webhook, /async function checkoutSeatsForEvent/);
assert.match(webhook, /external_reference = \?/);
assert.match(webhook, /provider_checkout_id = \?/);
assert.match(webhook, /const eventCheckoutSeats = kind === "paid"/);
assert.match(webhook, /seats = COALESCE\(\?, seats\)/);
assert.doesNotMatch(
  webhook,
  /seats = COALESCE\(\(SELECT seats FROM billing_provider_checkouts[\s\S]{0,240}ORDER BY created_at DESC LIMIT 1\), seats\)/,
  "webhook não pode escolher o checkout mais recente do customer sem vínculo ao evento",
);

// Memória clínica: leitura e exclusão usam a mesma tabela canônica.
assert.match(memorySearch, /const MEMORY_TABLE = "clinical_memory_notes_demo"/);
assert.doesNotMatch(memorySearch, /\bFROM\s+memory_notes\b/);
assert.match(patientRoute, /DELETE FROM clinical_memory_notes_demo WHERE patient_id = \?/);
assert.doesNotMatch(patientRoute, /DELETE FROM memory_notes WHERE patient_id/);

// Executa a migration 0014 em SQLite real para validar sintaxe e contrato de trial.
const db = new Database(":memory:");
db.exec(`
  CREATE TABLE clinics (id TEXT PRIMARY KEY);
  CREATE TABLE clinic_memberships (
    clinic_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE billing_customers (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    status TEXT NOT NULL,
    trial_ends_at TEXT,
    created_at TEXT,
    updated_at TEXT
  );
  CREATE TABLE billing_subscriptions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    seats INTEGER,
    status TEXT NOT NULL,
    anchored_at TEXT,
    current_period_starts_at TEXT,
    current_period_ends_at TEXT,
    created_at TEXT,
    updated_at TEXT
  );
  INSERT INTO clinics(id) VALUES ('clinic-existing');
  INSERT INTO billing_customers(id, clinic_id, provider, status, trial_ends_at, created_at, updated_at)
  VALUES ('customer-existing', 'clinic-existing', 'asaas', 'trial', datetime('now', '+10 days'), datetime('now'), datetime('now'));
  INSERT INTO billing_subscriptions(id, customer_id, plan_id, seats, status, anchored_at, current_period_starts_at, current_period_ends_at, created_at, updated_at)
  VALUES ('sub-existing', 'customer-existing', 'saas-professional', 1, 'trial', datetime('now'), datetime('now'), datetime('now', '+10 days'), datetime('now'), datetime('now'));
  INSERT INTO clinic_memberships(clinic_id, user_id, active) VALUES ('clinic-existing', 'owner-1', 1);
`);
db.exec(migration);
assert.equal(
  db.prepare("SELECT seats FROM billing_subscriptions WHERE id = 'sub-existing'").get().seats,
  2,
  "trial existente com owner precisa manter ao menos um assento livre",
);
db.prepare("INSERT INTO clinics(id) VALUES (?)").run("clinic-new");
assert.equal(
  db.prepare(`SELECT bs.seats FROM billing_subscriptions bs JOIN billing_customers bc ON bc.id = bs.customer_id WHERE bc.clinic_id = ?`).get("clinic-new").seats,
  2,
  "nova clínica deve nascer com 2 assentos no trial",
);
db.close();

// A migration nova precisa chegar ao D1 remoto no fluxo main-only, não apenas
// existir no repositório ou passar em SQLite local.
assert.match(billingMigrationWorkflow, /0014_saas_billing_contract_hardening\.sql/);
assert.match(
  billingMigrationWorkflow,
  /wrangler@4 d1 execute neuroped-db --remote --yes[\s\\\n]+--file=\.\/db\/migrations\/0014_saas_billing_contract_hardening\.sql/,
);
assert.match(billingMigrationWorkflow, /invalid_trials/);
assert.doesNotMatch(billingMigrationWorkflow, /^[\t ]*pull_request:/m);

// Os três deploys continuam encadeados ao mesmo SHA, com Cloudflare como backend.
assert.match(cloudflareWorkflow, /neuroped\.pages\.dev/);
assert.match(cloudflareWorkflow, /deploy-check\.json/);
assert.match(vercelWorkflow, /neuroped\.pages\.dev\/deploy-check\.json/);
assert.match(vercelWorkflow, /VITE_API_URL=https:\/\/neuroped\.pages\.dev/);
assert.match(vercelWorkflow, /superneuroped\.vercel\.app/);
assert.match(githubWorkflow, /deploy-check\.json/);
for (const workflow of [cloudflareWorkflow, vercelWorkflow, githubWorkflow]) {
  assert.match(workflow, /npm run verify/);
  assert.doesNotMatch(workflow, /^[\t ]*pull_request:/m);
}

console.log("✓ tenant, webhook, trial seats, memória, D1 e deploy contracts endurecidos");
