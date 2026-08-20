import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import {
  asaasBaseUrl,
  amountCentsFromWebhook,
  webhookEventKey,
  webhookExternalReference,
} from "../../functions/api/billing/_provider";
import {
  CANONICAL_PRICE_CENTS,
  transitionCustomerOnPaymentSuccess,
} from "../../shared/billing";

const read = (relative: string) =>
  readFileSync(new URL(`../../${relative}`, import.meta.url), "utf8");

assert.equal(CANONICAL_PRICE_CENTS, 9900);
assert.equal(asaasBaseUrl({ ASAAS_ENVIRONMENT: "sandbox" }), "https://api-sandbox.asaas.com/v3");
assert.equal(asaasBaseUrl({ ASAAS_ENVIRONMENT: "production" }), "https://api.asaas.com/v3");
assert.throws(() => asaasBaseUrl({ ASAAS_ENVIRONMENT: "invalid" }), /ASAAS_ENVIRONMENT_INVALID/);
assert.equal(webhookEventKey({ id: "evt_1" }), "asaas:evt_1");
assert.throws(() => webhookEventKey({}), /ASAAS_EVENT_ID_REQUIRED/);
assert.equal(
  webhookExternalReference({ checkout: { externalReference: "neuroped:customer:checkout" } }),
  "neuroped:customer:checkout",
);
assert.equal(amountCentsFromWebhook({ payment: { value: 99.9 } }), 9990);
assert.equal(transitionCustomerOnPaymentSuccess("canceled", true), "canceled");

const migration = read("db/migrations/0013_saas_billing_provider.sql");
const db = new Database(":memory:");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT UNIQUE);
  CREATE TABLE clinics (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE clinic_memberships (
    clinic_id TEXT NOT NULL REFERENCES clinics(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    invited_by_user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (clinic_id, user_id)
  );
  CREATE TABLE billing_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    price_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    seat_price_cents INTEGER NOT NULL,
    trial_days INTEGER NOT NULL,
    max_seats INTEGER,
    billing_cycle_days INTEGER NOT NULL,
    is_active INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  INSERT INTO billing_plans VALUES
    ('saas-professional','NeuroPed Professional','professional',9900,'BRL',9900,14,NULL,30,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
  CREATE TABLE billing_customers (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL UNIQUE REFERENCES clinics(id),
    provider TEXT NOT NULL,
    provider_customer_id TEXT,
    billing_email TEXT,
    status TEXT NOT NULL,
    trial_ends_at DATETIME,
    last_failed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE billing_subscriptions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES billing_customers(id),
    plan_id TEXT NOT NULL REFERENCES billing_plans(id),
    seats INTEGER,
    status TEXT NOT NULL CHECK (status IN ('trial','active','past_due','canceled','expired')),
    provider_subscription_id TEXT,
    anchored_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    current_period_starts_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    current_period_ends_at DATETIME,
    canceled_at DATETIME,
    cancel_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE billing_invoice_events (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL REFERENCES billing_subscriptions(id),
    provider TEXT NOT NULL,
    provider_event_id TEXT,
    kind TEXT NOT NULL,
    amount_cents INTEGER,
    status TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE clinic_invitations (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id),
    invited_by_user_id TEXT,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    expires_at DATETIME NOT NULL,
    last_sent_at DATETIME,
    accepted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE appointments (
    id TEXT PRIMARY KEY,
    provider_user_id TEXT NOT NULL,
    source TEXT NOT NULL,
    starts_at_local TEXT NOT NULL,
    ends_at_local TEXT NOT NULL
  );
  CREATE TABLE waitlist_entries (
    id TEXT PRIMARY KEY,
    provider_user_id TEXT NOT NULL
  );
  INSERT INTO users(id,email) VALUES ('u1','owner@example.test'), ('u2','two@example.test');
  INSERT INTO clinics(id) VALUES ('clinic-1');
`);

db.exec(migration);

const customer = db.prepare(
  "SELECT id, status, trial_ends_at FROM billing_customers WHERE clinic_id = 'clinic-1'",
).get() as { id: string; status: string; trial_ends_at: string };
assert.equal(customer.status, "trial");
assert.ok(customer.trial_ends_at);

const subscription = db.prepare(
  "SELECT status, seats, plan_id FROM billing_subscriptions WHERE customer_id = ?",
).get(customer.id) as { status: string; seats: number; plan_id: string };
assert.deepEqual(subscription, { status: "trial", seats: 1, plan_id: "saas-professional" });

db.prepare(
  "INSERT INTO clinic_memberships(clinic_id,user_id,role,active) VALUES ('clinic-1','u1','owner',1)",
).run();
assert.throws(
  () => db.prepare(
    "INSERT INTO clinic_memberships(clinic_id,user_id,role,active) VALUES ('clinic-1','u2','professional',1)",
  ).run(),
  /SEAT_LIMIT_REACHED/,
);

db.prepare("UPDATE billing_customers SET status = 'suspended' WHERE id = ?").run(customer.id);
assert.throws(
  () => db.prepare(
    "INSERT INTO appointments(id,provider_user_id,source,starts_at_local,ends_at_local) VALUES ('a1','u1','public','2026-08-21 10:00','2026-08-21 11:00')",
  ).run(),
  /BILLING_PUBLIC_BOOKING_DISABLED/,
);

db.prepare("UPDATE billing_customers SET status = 'canceled' WHERE id = ?").run(customer.id);
assert.throws(
  () => db.prepare("UPDATE billing_customers SET status = 'active' WHERE id = ?").run(customer.id),
  /BILLING_CANCELED_TERMINAL/,
);

db.close();
console.log("saas-billing-provider: provider + migration hardening passed ✔");
