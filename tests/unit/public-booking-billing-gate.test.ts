/**
 * Agendamento público respeita o status de cobrança da clínica, com a mesma
 * decisão da agenda interna (billing/_guard.requireBillingEntitlement).
 * Avaliação e assinatura ativa: pedido criado. Avaliação vencida, cobrança
 * suspensa: mensagem amigável e nenhum pedido criado
 * (nem consulta, nem lista de espera).
 *
 * Rodar: node --import tsx tests/unit/public-booking-billing-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequest as opsMiddleware } from "../../functions/api/operations/_middleware";
import { onRequestGet as opsGet, onRequestPost as opsPost } from "../../functions/api/operations/index";
import { onRequestPost as publicPost } from "../../functions/api/public-booking";

const OPERATIONAL_KEY = "chave-operacional-de-teste-com-32-caracteres!!";
const raw = new DatabaseSync(":memory:");
raw.exec("PRAGMA foreign_keys = OFF;");
raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
for (const nome of readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort()) {
  try {
    raw.exec(readFileSync(`db/migrations/${nome}`, "utf8"));
  } catch (erro) {
    assert.match(String(erro), /duplicate column name/i, `migração ${nome}: ${String(erro)}`);
  }
}
raw.exec("PRAGMA foreign_keys = ON;");
const db = {
  prepare(sql: string) {
    const make = (args: unknown[]) => ({
      async first<T>() { return (raw.prepare(sql).get(...(args as never[])) as T | undefined) ?? null; },
      async run() { const info = raw.prepare(sql).run(...(args as never[])); return { meta: { changes: Number(info.changes) } }; },
      async all<T>() { return { results: raw.prepare(sql).all(...(args as never[])) as T[] }; },
    });
    return { bind: (...args: unknown[]) => make(args), ...make([]) };
  },
  async batch(statements: Array<{ run(): Promise<unknown> }>) {
    raw.exec("SAVEPOINT b");
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      raw.exec("RELEASE b");
      return results;
    } catch (error) {
      raw.exec("ROLLBACK TO b; RELEASE b");
      throw error;
    }
  },
} as unknown as D1Database;

const env = () => ({ DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY });

const now = () => new Date().toISOString();
raw.prepare(`INSERT INTO users (id,name,email,role,is_active,created_at,updated_at) VALUES ('prof-a','Profissional Alfa','prof-a@example.test','professional',1,?,?)`).run(now(), now());
raw.prepare(`INSERT INTO users (id,name,email,role,is_active,created_at,updated_at) VALUES ('sec-a','Secretária Alfa','sec-a@example.test','operator',1,?,?)`).run(now(), now());
raw.prepare(`INSERT INTO clinics (id,slug,name,status,created_by_user_id,created_at,updated_at) VALUES ('clinic-alfa','clinica-alfa','Clínica Alfa','active','prof-a',?,?)`).run(now(), now());
raw.prepare(`INSERT INTO clinic_memberships (clinic_id,user_id,role,active,created_at,updated_at) VALUES ('clinic-alfa','prof-a','owner',1,?,?)`).run(now(), now());
raw.prepare(`INSERT INTO clinic_memberships (clinic_id,user_id,role,active,created_at,updated_at) VALUES ('clinic-alfa','sec-a','assistant',1,?,?)`).run(now(), now());
raw.prepare(`INSERT INTO booking_staff_links (provider_user_id,staff_user_id,active,created_by_user_id,created_at,updated_at) VALUES ('prof-a','sec-a',1,'prof-a',?,?)`).run(now(), now());

async function call(userId: string, role: string, body?: Record<string, unknown>) {
  const method = body ? "POST" : "GET";
  const context = {
    request: new Request("https://neuroped.test/api/operations", {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env: env(),
    data: { authUser: { id: userId, email: `${userId}@example.test`, name: userId, role, mustChangePassword: false } },
  } as any;
  context.next = async () => (method === "GET" ? opsGet(context) : opsPost(context));
  const response = await opsMiddleware(context);
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}
const prof = (body?: Record<string, unknown>) => call("prof-a", "professional", body);
async function pub(body: Record<string, unknown>) {
  const response = await publicPost({
    request: new Request("https://neuroped.test/api/public-booking", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }),
    env: env(),
  } as never);
  return { status: response.status, body: await response.json() as any };
}

type Row = Record<string, any>;
const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

// Preparação: perfil público, serviço e regras (8h–18h todos os dias).
{
  assert.equal((await prof({ action: "upsert_profile", displayName: "Dra. Alfa", specialty: "Neuropediatria", slug: "dra-alfa", timezone: "America/Sao_Paulo", bookingEnabled: true })).status, 200);
  assert.equal((await prof({ action: "create_service", name: "Consulta", durationMinutes: 60, priceCents: 0 })).status, 200);
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    assert.equal((await prof({ action: "create_rule", weekday, startMinute: 480, endMinute: 1080, slotMinutes: 60 })).status, 200);
  }
}
const serviceId = (raw.prepare(`SELECT id FROM booking_services`).get() as Row).id as string;
const D = day(15);


const count = (table: string) => (raw.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as Row).n as number;
const book = (hour: string) => pub({
  action: "book", provider: "dra-alfa", clinic: "clinica-alfa", serviceId, startsAtLocal: `${D}T${hour}`,
  guardianName: "Resp Sintético", guardianEmail: "resp@example.test", guardianPhone: "11999998888",
  patientName: "Criança Sintética", privacyAccepted: true,
});
const waitlist = () => pub({
  action: "waitlist", provider: "dra-alfa", clinic: "clinica-alfa", serviceId, preferredDate: D,
  guardianName: "Resp Sintético", guardianEmail: "resp@example.test", guardianPhone: "11999998888",
  patientName: "Criança Sintética", privacyAccepted: true,
});
async function assertBlocked(label: string) {
  const before = { appointments: count("appointments"), waitlist: count("waitlist_entries"), outbox: count("notification_outbox") };
  const booked = await book("15:00");
  assert.equal(booked.status, 409, `${label}: ${JSON.stringify(booked.body)}`);
  assert.equal(booked.body.code, "CLINIC_BOOKING_UNAVAILABLE");
  assert.match(booked.body.error, /temporariamente indisponível.*contato diretamente com a clínica/);
  const queued = await waitlist();
  assert.equal(queued.status, 409, `${label} (espera): ${JSON.stringify(queued.body)}`);
  assert.equal(queued.body.code, "CLINIC_BOOKING_UNAVAILABLE");
  assert.deepEqual(
    { appointments: count("appointments"), waitlist: count("waitlist_entries"), outbox: count("notification_outbox") },
    before,
    `${label}: nenhum pedido criado`,
  );
}

// 1. Avaliação (criada pelo onboarding da clínica): inalterado.
const customer = raw.prepare(`SELECT id, status FROM billing_customers WHERE clinic_id = 'clinic-alfa'`).get() as Row;
assert.equal(customer?.status, "trial", "clínica nasce em avaliação");
assert.equal((await book("09:00")).status, 201, "avaliação agenda normalmente");
assert.equal((await waitlist()).status, 201, "avaliação entra na lista de espera normalmente");

// 2. Avaliação vencida sem assinatura: bloqueado.
raw.prepare(`UPDATE billing_customers SET trial_ends_at = ? WHERE id = ?`).run(new Date(Date.now() - 864e5).toISOString(), customer.id);
raw.prepare(`UPDATE billing_subscriptions SET status = 'expired' WHERE customer_id = ?`).run(customer.id);
await assertBlocked("avaliação vencida");

// 3. Assinatura ativa: inalterado.
raw.prepare(`UPDATE billing_customers SET status = 'active' WHERE id = ?`).run(customer.id);
raw.prepare(`UPDATE billing_subscriptions SET status = 'active' WHERE customer_id = ?`).run(customer.id);
assert.equal((await book("10:00")).status, 201, "assinatura ativa agenda normalmente");

// 4. Cobrança suspensa: bloqueado.
raw.prepare(`UPDATE billing_customers SET status = 'suspended' WHERE id = ?`).run(customer.id);
raw.prepare(`UPDATE billing_subscriptions SET status = 'past_due' WHERE customer_id = ?`).run(customer.id);
await assertBlocked("cobrança suspensa");

// 5. Clínica encerrada já era recusada antes (resolução da clínica pública):
//    continua 409 e sem pedido criado.
raw.prepare(`UPDATE billing_customers SET status = 'active' WHERE id = ?`).run(customer.id);
raw.prepare(`UPDATE billing_subscriptions SET status = 'active' WHERE customer_id = ?`).run(customer.id);
raw.prepare(`UPDATE clinics SET status = 'closed' WHERE id = 'clinic-alfa'`).run();
{
  const before = count("appointments");
  assert.equal((await book("16:00")).status, 409, "clínica encerrada não recebe pedido");
  assert.equal(count("appointments"), before);
}

console.log("public-booking-billing-gate: avaliação e ativa agendam; vencida e suspensa bloqueiam com mensagem amigável; encerrada segue recusada sem criar pedido OK");
