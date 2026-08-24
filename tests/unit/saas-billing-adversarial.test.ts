import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { onRequestPost } from "../../functions/api/billing/webhook";

class SqliteD1 {
  constructor(readonly db: Database.Database) {}

  prepare(sql: string) {
    let binds: unknown[] = [];
    const statement = {
      bind: (...values: unknown[]) => {
        binds = values;
        return statement;
      },
      first: <T>() => (this.db.prepare(sql).get(...binds) ?? null) as T | null,
      run: () => {
        const info = this.db.prepare(sql).run(...binds);
        return { meta: { changes: info.changes } };
      },
      all: <T>() => ({ results: this.db.prepare(sql).all(...binds) as T[] }),
    };
    return statement;
  }

  async batch(statements: Array<{ run: () => unknown }>) {
    const execute = this.db.transaction((items: Array<{ run: () => unknown }>) =>
      items.map((statement) => statement.run()),
    );
    return execute(statements);
  }
}

const db = new Database(":memory:");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE billing_customers (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    canceled_at TEXT,
    grace_ends_at TEXT,
    last_failed_at TEXT,
    last_provider_event_at TEXT,
    provider_checkout_id TEXT,
    updated_at TEXT
  );
  CREATE TABLE billing_subscriptions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    status TEXT NOT NULL,
    seats INTEGER NOT NULL,
    provider_subscription_id TEXT,
    canceled_at TEXT,
    last_provider_event_at TEXT,
    updated_at TEXT
  );
  CREATE TABLE billing_invoice_events (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_event_id TEXT,
    kind TEXT NOT NULL,
    amount_cents INTEGER,
    status TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    raw_status TEXT,
    occurred_at TEXT,
    metadata_json TEXT,
    created_at TEXT
  );
  CREATE TABLE billing_provider_checkouts (
    id TEXT PRIMARY KEY,
    billing_customer_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_checkout_id TEXT,
    external_reference TEXT,
    seats INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT,
    updated_at TEXT
  );
  CREATE TABLE tenant_lifecycle (
    clinic_id TEXT PRIMARY KEY,
    status TEXT NOT NULL
  );

  INSERT INTO billing_customers
    (id, clinic_id, status, updated_at)
    VALUES ('bc-red', 'TENANT_RED', 'trial', '2026-08-20T00:00:00.000Z');
  INSERT INTO billing_subscriptions
    (id, customer_id, status, seats, updated_at)
    VALUES ('bs-red', 'bc-red', 'trial', 1, '2026-08-20T00:00:00.000Z');
  INSERT INTO billing_provider_checkouts
    (id, billing_customer_id, provider, provider_checkout_id, external_reference,
     seats, amount_cents, status, created_at, updated_at)
    VALUES (
      'co-local-red', 'bc-red', 'asaas', 'checkout-red',
      'neuroped:bc-red:checkout-red', 3, 29700, 'active',
      '2026-08-20T00:00:00.000Z', '2026-08-20T00:00:00.000Z'
    );
  INSERT INTO tenant_lifecycle(clinic_id, status) VALUES ('TENANT_RED', 'active');
`);

const adapter = new SqliteD1(db);
const TOKEN = "billing-webhook-token-0123456789-abcdef";

async function send(event: Record<string, unknown>, token = TOKEN) {
  const request = new Request("https://neuroped.example/api/billing/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "asaas-access-token": token,
    },
    body: JSON.stringify(event),
  });
  const response = await onRequestPost({
    env: { DB: adapter as never, ASAAS_WEBHOOK_TOKEN: TOKEN },
    request,
  } as never);
  const body = await response.json() as Record<string, unknown>;
  return { status: response.status, body };
}

function state() {
  const customer = db.prepare(
    "SELECT status, grace_ends_at, canceled_at, last_provider_event_at FROM billing_customers WHERE id='bc-red'",
  ).get() as Record<string, unknown>;
  const subscription = db.prepare(
    "SELECT status, seats, canceled_at, last_provider_event_at FROM billing_subscriptions WHERE id='bs-red'",
  ).get() as Record<string, unknown>;
  return { customer, subscription };
}

// Token errado: nenhuma mutação de billing pode acontecer.
{
  const result = await send({
    id: "evt-invalid-token",
    event: "PAYMENT_CONFIRMED",
    dateCreated: "2026-08-23T10:00:00Z",
    checkout: { id: "checkout-red", externalReference: "neuroped:bc-red:checkout-red" },
  }, "wrong-token-that-is-long-enough-0123456789");
  assert.equal(result.status, 401);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM billing_invoice_events").get().n, 0);
}

// Payload tenta insinuar valor baixo; quantidade de assentos vem do checkout
// persistido server-side (3), nunca do evento do cliente/provedor.
const paidEvent = {
  id: "evt-paid-1",
  event: "PAYMENT_CONFIRMED",
  dateCreated: "2026-08-23T12:00:00Z",
  checkout: {
    id: "checkout-red",
    externalReference: "neuroped:bc-red:checkout-red",
    status: "ACTIVE",
  },
  payment: {
    id: "payment-red-1",
    value: 0.01,
    status: "CONFIRMED",
    subscription: "asaas-sub-red",
  },
};
{
  const result = await send(paidEvent);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { ok: true });
  const current = state();
  assert.equal(current.customer.status, "active");
  assert.equal(current.subscription.status, "active");
  assert.equal(current.subscription.seats, 3, "webhook não pode manipular seats fora do checkout persistido");
}

// Replay idêntico é reconhecido como duplicado e não duplica ledger.
{
  const replay = await send(paidEvent);
  assert.equal(replay.status, 200);
  assert.equal(replay.body.duplicate, true);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM billing_invoice_events").get().n, 1);
}

// Evento antigo não pode regredir active -> past_due.
{
  const olderFailure = await send({
    id: "evt-old-failure",
    event: "PAYMENT_OVERDUE",
    dateCreated: "2026-08-22T12:00:00Z",
    checkout: { id: "checkout-red", externalReference: "neuroped:bc-red:checkout-red" },
    payment: { id: "payment-red-old", value: 99, status: "OVERDUE" },
  });
  assert.equal(olderFailure.status, 200);
  const current = state();
  assert.equal(current.customer.status, "active");
  assert.equal(current.subscription.status, "active");
}

// Evento novo de inadimplência entra em past_due; um pagamento mais antigo
// recebido depois não pode sobrescrever o relógio monotônico do provider.
{
  const overdue = await send({
    id: "evt-new-failure",
    event: "PAYMENT_OVERDUE",
    dateCreated: "2026-08-24T12:00:00Z",
    checkout: { id: "checkout-red", externalReference: "neuroped:bc-red:checkout-red" },
    payment: { id: "payment-red-overdue", value: 99, status: "OVERDUE" },
  });
  assert.equal(overdue.status, 200);
  assert.equal(state().customer.status, "past_due");
  assert.equal(state().subscription.status, "past_due");

  const stalePaid = await send({
    ...paidEvent,
    id: "evt-stale-paid",
    dateCreated: "2026-08-23T18:00:00Z",
    payment: { id: "payment-red-stale", value: 99, status: "CONFIRMED" },
  });
  assert.equal(stalePaid.status, 200);
  assert.equal(state().customer.status, "past_due");
  assert.equal(state().subscription.status, "past_due");
}

// Cancelamento é terminal: pagamento posterior não reabre customer/subscription.
{
  const canceled = await send({
    id: "evt-cancel",
    event: "CHECKOUT_CANCELED",
    dateCreated: "2026-08-25T12:00:00Z",
    checkout: { id: "checkout-red", externalReference: "neuroped:bc-red:checkout-red" },
  });
  assert.equal(canceled.status, 200);
  assert.equal(state().customer.status, "canceled");
  assert.equal(state().subscription.status, "canceled");

  const latePaid = await send({
    ...paidEvent,
    id: "evt-after-cancel",
    dateCreated: "2026-08-26T12:00:00Z",
    payment: { id: "payment-red-late", value: 99, status: "CONFIRMED" },
  });
  assert.equal(latePaid.status, 200);
  assert.equal(state().customer.status, "canceled");
  assert.equal(state().subscription.status, "canceled");
}

// Token válido não é suficiente: evento sem vínculo server-side não pode escolher tenant.
{
  const unknown = await send({
    id: "evt-blue-spoof",
    event: "PAYMENT_CONFIRMED",
    dateCreated: "2026-08-27T12:00:00Z",
    checkout: { id: "checkout-blue", externalReference: "neuroped:bc-blue:attacker" },
    payment: { id: "payment-blue", value: 99, status: "CONFIRMED" },
  });
  assert.equal(unknown.status, 409);
  assert.equal(unknown.body.code, "BILLING_CONTEXT_NOT_FOUND");
}

assert.equal(
  db.prepare("SELECT COUNT(*) AS n FROM billing_invoice_events WHERE idempotency_key='asaas:evt-paid-1'").get().n,
  1,
);

db.close();
console.log("✓ billing adversarial: auth, replay, ordering, seats, terminal cancel e contexto server-side aprovados");
