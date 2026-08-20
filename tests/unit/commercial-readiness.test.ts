import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import {
  COMMERCIAL_PLAN,
  normalizeSeatQuantity,
  resolveCommercialEntitlement,
} from "../../shared/billing";
import { verifyStripeSignature } from "../../functions/api/billing/_stripe";
import { onRequestPost as createCheckout } from "../../functions/api/billing/checkout";
import { strongPasswordSchema } from "../../functions/api/auth/_passwordPolicy";

const read = (relative: string) =>
  readFileSync(new URL(`../../${relative}`, import.meta.url), "utf8");

const now = Date.parse("2026-08-20T12:00:00.000Z");
const future = "2026-08-21T12:00:00.000Z";
const past = "2026-08-19T12:00:00.000Z";

assert.equal(COMMERCIAL_PLAN.unitAmountCents, 9_900);
assert.equal(COMMERCIAL_PLAN.currency, "BRL");
assert.equal(COMMERCIAL_PLAN.interval, "month");
assert.equal(COMMERCIAL_PLAN.trialDays, 14);
assert.equal(normalizeSeatQuantity("1"), 1);
assert.equal(normalizeSeatQuantity(250), 250);
assert.equal(normalizeSeatQuantity(0), null);
assert.equal(normalizeSeatQuantity(251), null);
assert.equal(normalizeSeatQuantity(1.5), null);
assert.equal(strongPasswordSchema.safeParse("Strong!Password123").success, true);
assert.equal(strongPasswordSchema.safeParse("senha-fraca").success, false);

assert.deepEqual(resolveCommercialEntitlement(null, 0, now), {
  canRead: false,
  canWrite: false,
  reason: "ACCOUNT_MISSING",
});
assert.deepEqual(resolveCommercialEntitlement({
  status: "trialing",
  seatQuantity: 2,
  trialEndsAt: future,
  currentPeriodEnd: null,
}, 2, now), { canRead: true, canWrite: true, reason: null });
assert.deepEqual(resolveCommercialEntitlement({
  status: "trialing",
  seatQuantity: 2,
  trialEndsAt: past,
  currentPeriodEnd: null,
}, 1, now), { canRead: true, canWrite: false, reason: "TRIAL_EXPIRED" });
assert.deepEqual(resolveCommercialEntitlement({
  status: "active",
  seatQuantity: 1,
  trialEndsAt: null,
  currentPeriodEnd: future,
}, 2, now), { canRead: true, canWrite: false, reason: "SEAT_LIMIT_EXCEEDED" });
for (const status of ["past_due", "canceled", "suspended", "incomplete"] as const) {
  assert.deepEqual(resolveCommercialEntitlement({
    status,
    seatQuantity: 2,
    trialEndsAt: null,
    currentPeriodEnd: past,
  }, 1, now), {
    canRead: true,
    canWrite: false,
    reason: "SUBSCRIPTION_INACTIVE",
  }, `${status} deve preservar leitura e bloquear novas escritas`);
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  ));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const rawWebhook = JSON.stringify({ id: "evt_contract", type: "customer.subscription.updated" });
const webhookSecret = "whsec_test_contract_123456789";
const webhookTimestamp = Math.floor(now / 1_000);
const webhookSignature = await hmacHex(webhookSecret, `${webhookTimestamp}.${rawWebhook}`);
assert.equal(
  await verifyStripeSignature(
    rawWebhook,
    `t=${webhookTimestamp},v1=${webhookSignature}`,
    webhookSecret,
    webhookTimestamp,
  ),
  true,
);
assert.equal(
  await verifyStripeSignature(
    `${rawWebhook} `,
    `t=${webhookTimestamp},v1=${webhookSignature}`,
    webhookSecret,
    webhookTimestamp,
  ),
  false,
  "assinatura é validada sobre os bytes exatos recebidos",
);
assert.equal(
  await verifyStripeSignature(
    rawWebhook,
    `t=${webhookTimestamp},v1=${webhookSignature}`,
    webhookSecret,
    webhookTimestamp + 301,
  ),
  false,
  "replay fora da tolerância deve falhar",
);

const foundation = read("db/migrations/0009_saas_phase1_foundation.sql");
const hardening = read("db/migrations/0010_saas_phase1_hardening.sql");
const commercialMigration = read("db/migrations/0012_commercial_readiness.sql");
const db = new Database(":memory:");

class D1TestStatement {
  constructor(
    private readonly sqlite: InstanceType<typeof Database>,
    private readonly sql: string,
    private readonly params: unknown[] = [],
  ) {}

  bind(...params: unknown[]) {
    return new D1TestStatement(this.sqlite, this.sql, params);
  }

  async first<T>(): Promise<T | null> {
    return (this.sqlite.prepare(this.sql).get(...this.params) as T | undefined) ?? null;
  }

  async all<T>() {
    return { results: this.sqlite.prepare(this.sql).all(...this.params) as T[] };
  }

  async run() {
    return this.runSync();
  }

  runSync() {
    const result = this.sqlite.prepare(this.sql).run(...this.params);
    return { success: true, meta: { changes: result.changes } };
  }
}

class D1TestDatabase {
  constructor(private readonly sqlite: InstanceType<typeof Database>) {}

  prepare(sql: string) {
    return new D1TestStatement(this.sqlite, sql);
  }

  async batch(statements: D1TestStatement[]) {
    return this.sqlite.transaction(() => statements.map((statement) => statement.runSync()))();
  }
}

db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    role TEXT,
    is_active INTEGER DEFAULT 1
  );
`);
db.exec(foundation);
db.exec(hardening);
db.exec("INSERT INTO users (id, name, email, role) VALUES ('u1','Um','u1@example.test','professional'),('u2','Dois','u2@example.test','professional')");
db.exec(`
  INSERT INTO clinics (id, slug, name, created_by_user_id) VALUES
    ('c-a','a','Clínica A','u1'),
    ('c-b','b','Clínica B','u1'),
    ('c-c','c','Clínica C','u2');
  INSERT INTO clinic_memberships (clinic_id, user_id, role, active) VALUES
    ('c-a','u1','owner',1),
    ('c-a','u2','professional',1),
    ('c-b','u1','owner',1),
    ('c-c','u2','owner',1);
`);
db.exec(commercialMigration);
db.exec(commercialMigration);

const accounts = db.prepare(
  "SELECT clinic_id, status, seat_quantity, trial_ends_at FROM billing_accounts ORDER BY clinic_id",
).all() as Array<{ clinic_id: string; status: string; seat_quantity: number; trial_ends_at: string | null }>;
assert.equal(accounts.length, 3, "migração é idempotente");
assert.deepEqual(accounts.map(({ clinic_id, status, seat_quantity }) => ({ clinic_id, status, seat_quantity })), [
  { clinic_id: "c-a", status: "trialing", seat_quantity: 2 },
  { clinic_id: "c-b", status: "incomplete", seat_quantity: 1 },
  { clinic_id: "c-c", status: "trialing", seat_quantity: 1 },
]);
assert.equal(accounts[1].trial_ends_at, null, "backfill não concede dois trials ao mesmo criador");
assert.equal(
  Number(db.prepare("SELECT COUNT(*) AS total FROM commercial_trial_claims").get()?.total),
  2,
  "cada usuário reivindica no máximo um trial",
);
assert.throws(
  () => db.prepare("UPDATE billing_accounts SET plan_code = 'plano_inventado' WHERE clinic_id = 'c-a'").run(),
  /CHECK constraint failed/,
);
db.prepare("UPDATE billing_accounts SET provider_customer_id = 'cus_unique' WHERE clinic_id = 'c-a'").run();
assert.throws(
  () => db.prepare("UPDATE billing_accounts SET provider_customer_id = 'cus_unique' WHERE clinic_id = 'c-c'").run(),
  /UNIQUE constraint failed/,
);
db.prepare("UPDATE billing_accounts SET provider_checkout_session_id = 'cs_unique' WHERE clinic_id = 'c-a'").run();
assert.throws(
  () => db.prepare("UPDATE billing_accounts SET provider_checkout_session_id = 'cs_unique' WHERE clinic_id = 'c-c'").run(),
  /UNIQUE constraint failed/,
  "uma sessão Checkout nunca pode pertencer a duas clínicas",
);
assert.throws(
  () => db.prepare("UPDATE billing_accounts SET checkout_seat_quantity = 251 WHERE clinic_id = 'c-a'").run(),
  /CHECK constraint failed/,
);
assert.throws(
  () => db.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role, active) VALUES ('c-b','u2','professional',1)").run(),
  /SEAT_LIMIT_REACHED/,
  "o banco impede oversubscription mesmo sob corrida entre inclusões",
);
db.prepare("UPDATE billing_accounts SET seat_quantity = 2 WHERE clinic_id = 'c-b'").run();
db.prepare(`INSERT INTO clinic_invitations
  (id, clinic_id, email, role, token_hash, invited_by_user_id, expires_at)
  VALUES ('i1','c-b','invite1@example.test','professional',?,'u1',datetime('now','+7 days'))`).run("a".repeat(64));
assert.throws(
  () => db.prepare(`INSERT INTO clinic_invitations
    (id, clinic_id, email, role, token_hash, invited_by_user_id, expires_at)
    VALUES ('i2','c-b','invite2@example.test','professional',?,'u1',datetime('now','+7 days'))`).run("b".repeat(64)),
  /SEAT_LIMIT_REACHED/,
  "convite pendente reserva assento fisicamente",
);
db.prepare("UPDATE clinic_invitations SET accepted_at = CURRENT_TIMESTAMP, accepted_user_id = 'u2' WHERE id = 'i1'").run();
db.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role, active) VALUES ('c-b','u2','professional',1)").run();
db.prepare(`INSERT INTO billing_events
  (id, provider, provider_event_id, event_type, payload_sha256, provider_created_at)
  VALUES ('be1','stripe','evt_unique','test','hash',1)`).run();
assert.throws(
  () => db.prepare(`INSERT INTO billing_events
    (id, provider, provider_event_id, event_type, payload_sha256, provider_created_at)
    VALUES ('be2','stripe','evt_unique','test','hash',1)`).run(),
  /UNIQUE constraint failed/,
  "eventos do provedor são fisicamente idempotentes",
);

const d1 = new D1TestDatabase(db) as unknown as D1Database;
const originalFetch = globalThis.fetch;
let checkoutCreations = 0;
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  const method = init?.method ?? "GET";
  if (method === "GET" && url.pathname === "/v1/prices/price_canonical") {
    return Response.json({ active: true, currency: "brl", unit_amount: 9_900, recurring: { interval: "month" } });
  }
  if (method === "POST" && url.pathname === "/v1/checkout/sessions") {
    checkoutCreations += 1;
    return Response.json({
      id: "cs_checkout_canonical",
      url: "https://checkout.stripe.test/session/canonical",
      status: "open",
    });
  }
  if (method === "GET" && url.pathname === "/v1/checkout/sessions/cs_checkout_canonical") {
    return Response.json({
      id: "cs_checkout_canonical",
      url: "https://checkout.stripe.test/session/canonical",
      status: "open",
    });
  }
  return Response.json({ error: { message: `Stripe mock sem rota: ${method} ${url.pathname}` } }, { status: 404 });
};

function checkoutRequest(seats: number) {
  return createCheckout({
    request: new Request("https://neuroped.pages.dev/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinicId: "c-c", seats }),
    }),
    env: {
      DB: d1,
      STRIPE_SECRET_KEY: "sk_test_contract",
      STRIPE_PRICE_ID: "price_canonical",
      CANONICAL_APP_URL: "https://neuroped.pages.dev",
    },
    data: {
      authUser: {
        id: "u2",
        name: "Dois",
        email: "u2@example.test",
        role: "professional",
        mustChangePassword: false,
      },
    },
  } as never);
}

try {
  const concurrent = await Promise.all([checkoutRequest(1), checkoutRequest(1)]);
  assert.deepEqual(
    concurrent.map((response) => response.status).sort((left, right) => left - right),
    [201, 409],
    "a lease atômica permite somente uma criação Stripe concorrente",
  );
  assert.equal(checkoutCreations, 1);
  const reused = await checkoutRequest(1);
  assert.equal(reused.status, 200);
  assert.equal((await reused.json() as { reused?: boolean }).reused, true);
  assert.equal(checkoutCreations, 1, "retry reutiliza a sessão aberta em vez de cobrar novamente");
  const changedSeats = await checkoutRequest(2);
  assert.equal(changedSeats.status, 409, "não troca assentos sob uma sessão aberta");
} finally {
  globalThis.fetch = originalFetch;
}
db.close();

assert.match(commercialMigration, /CREATE TABLE IF NOT EXISTS billing_accounts/);
assert.match(commercialMigration, /CHECK \(plan_code = 'neuroped_pro_99'\)/);
assert.match(commercialMigration, /UNIQUE \(provider, provider_event_id\)/);
assert.match(commercialMigration, /commercial_trial_claims/);
assert.match(commercialMigration, /CREATE TABLE IF NOT EXISTS clinic_invitations/);
assert.match(commercialMigration, /CHECK \(length\(token_hash\) = 64\)/);
assert.match(commercialMigration, /ux_billing_provider_checkout_session/);
assert.match(commercialMigration, /trg_clinic_memberships_billing_seat_insert/);
assert.match(commercialMigration, /trg_clinic_memberships_billing_seat_reactivate/);
assert.match(commercialMigration, /trg_clinic_invitations_billing_seat_insert/);

const checkout = read("functions/api/billing/checkout.ts");
const stripeCore = read("functions/api/billing/_stripe.ts");
const webhook = read("functions/api/billing/webhook.ts");
const livePatients = read("functions/api/live/patients/index.ts");
const liveEvents = read("functions/api/live/events/index.ts");
const members = read("functions/api/tenants/[id]/members.ts");
const tenants = read("functions/api/tenants/index.ts");
const invitations = read("functions/api/tenants/[id]/invitations.ts");
const inviteAcceptance = read("functions/api/auth/invite.ts");
const middleware = read("functions/api/_middleware.ts");
const commercialPage = read("client/src/pages/plano-equipe.tsx");
const invitePage = read("client/src/pages/aceitar-convite.tsx");
const publicRoutes = read("client/src/lib/publicRoutes.ts");
const deployWorkflow = read(".github/workflows/deploy-cloudflare.yml");
const d1Workflow = read(".github/workflows/saas-phase1-d1-migration.yml");
const provisionWorkflow = read(".github/workflows/provision-d1.yml");

assert.match(checkout, /assertCommercialPrice/);
assert.match(checkout, /subscription_data\[metadata\]\[clinic_id\]/);
assert.match(checkout, /SEAT_BELOW_USAGE/);
assert.match(checkout, /checkoutAttemptId = crypto\.randomUUID\(\)/);
assert.match(checkout, /CHECKOUT_ALREADY_PENDING/);
assert.match(checkout, /provider_checkout_session_id/);
assert.match(checkout, /checkout:\$\{clinicId\}:\$\{checkoutAttemptId\}/);
assert.match(checkout, /checkout_locked_until IS NULL OR datetime\(checkout_locked_until\)/);
assert.match(checkout, /acquired\.meta\?\.changes/);
assert.match(stripeCore, /Idempotency-Key/);
assert.doesNotMatch(checkout, /body\.(?:canWrite|planCode|unitAmount)/);
assert.match(webhook, /request\.text\(\)/);
assert.match(webhook, /verifyStripeSignature/);
assert.match(webhook, /INSERT OR IGNORE INTO billing_events/);
assert.match(webhook, /provider_event_created_at IS NULL OR provider_event_created_at <=/);
assert.match(webhook, /billing_subscription_reconciled/);
assert.match(webhook, /itemPriceId === configuredPriceId/);
assert.match(webhook, /priceContractValid \? mapStripeStatus\(subscription\.status\) : "suspended"/);
assert.match(webhook, /\/subscriptions\/\$\{encodeURIComponent\(eventSubscription\.id\)\}/);
assert.match(webhook, /provider_checkout_session_id = NULL, checkout_attempt_id = NULL/);
assert.match(livePatients, /getCommercialEntitlement/);
assert.match(livePatients, /commercialAccessError/);
assert.match(liveEvents, /getCommercialEntitlement/);
assert.match(liveEvents, /commercialAccessError/);
assert.match(members, /SEAT_LIMIT_REACHED/);
assert.match(members, /isSeatLimitConstraintError/);
assert.match(tenants, /TRIAL_ALREADY_USED/);
assert.match(tenants, /INSERT INTO commercial_trial_claims/);
assert.match(tenants, /wonByConcurrentRequest/);
assert.match(invitations, /createRawToken/);
assert.match(invitations, /sha256Hex\(rawToken\)/);
assert.match(invitations, /clinic_invitation_create/);
assert.match(invitations, /SEAT_LIMIT_REACHED/);
const invitationResponseStart = invitations.lastIndexOf("  const url = `${canonicalOrigin");
assert.notEqual(invitationResponseStart, -1);
const invitationResponse = invitations.slice(
  invitationResponseStart,
  invitations.indexOf("export const onRequestDelete", invitationResponseStart),
);
assert.doesNotMatch(invitationResponse, /tokenHash|token_hash/);
assert.match(inviteAcceptance, /findInvitation/);
assert.match(inviteAcceptance, /verifyPassword/);
assert.match(inviteAcceptance, /strongPasswordSchema/);
assert.match(inviteAcceptance, /clinic_invitation_accept/);
assert.match(inviteAcceptance, /db\.batch\(statements\)/);
assert.match(middleware, /\/api\/billing\/webhook/);
assert.match(middleware, /\/api\/auth\/invite/);
assert.match(commercialPage, /R\$ 99 por pessoa\/mês/);
assert.match(commercialPage, /Cancelamentos nunca bloqueiam a leitura/);
assert.match(commercialPage, /Link seguro criado/);
assert.match(invitePage, /uso único e expira em 7 dias/);
assert.match(publicRoutes, /\/aceitar-convite/);
assert.match(deployWorkflow, /0012_commercial_readiness\.sql/);
assert.match(deployWorkflow, /STRIPE_WEBHOOK_SECRET/);
assert.match(deployWorkflow, /ux_clinic_invitations_pending_email/);
assert.match(deployWorkflow, /trg_clinic_invitations_billing_seat_insert/);
assert.match(d1Workflow, /commercial-readiness\.test\.ts/);
assert.match(d1Workflow, /billing_accounts/);
assert.match(d1Workflow, /ux_clinic_invitations_pending_email/);
assert.match(d1Workflow, /trg_clinic_invitations_billing_seat_insert/);
assert.match(provisionWorkflow, /ux_clinic_invitations_pending_email/);
assert.match(provisionWorkflow, /trg_clinic_invitations_billing_seat_insert/);

console.log("✓ commercial readiness: preço, trial, assentos, entitlement, webhooks e deploy protegidos");
