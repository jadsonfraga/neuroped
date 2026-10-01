/**
 * Lista de espera: `booked` e `closed` são terminais. Antes, `waitlist_status`
 * aceitava qualquer transição, então aba desatualizada ou clique duplo reabria
 * uma entrada já encerrada ou agendada (`closed` → `waiting`).
 *
 * Harness real: schema + migrações, middleware e handler de /api/operations e
 * /api/public-booking. Fixtures 100% sintéticas, sem PHI.
 *
 * Rodar: node --import tsx tests/unit/operations-waitlist-status-guard.test.ts
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

for (const [id, name, role] of [["prof-a", "Profissional Alfa", "professional"], ["prof-b", "Profissional Beta", "professional"]] as const) {
  raw.prepare(`INSERT INTO users (id,name,email,role,is_active,created_at,updated_at) VALUES (?,?,?,?,1,?,?)`).run(id, name, `${id}@example.test`, role, now(), now());
}
for (const [clinic, owner] of [["clinic-alfa", "prof-a"], ["clinic-beta", "prof-b"]] as const) {
  raw.prepare(`INSERT INTO clinics (id,slug,name,status,created_by_user_id,created_at,updated_at) VALUES (?,?,?,'active',?,?,?)`).run(clinic, clinic.replace("clinic-", "clinica-"), clinic, owner, now(), now());
  raw.prepare(`INSERT INTO clinic_memberships (clinic_id,user_id,role,active,created_at,updated_at) VALUES (?,?,'owner',1,?,?)`).run(clinic, owner, now(), now());
}

async function call(userId: string, body?: Record<string, unknown>) {
  const method = body ? "POST" : "GET";
  const context = {
    request: new Request("https://neuroped.test/api/operations", {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env: env(),
    data: { authUser: { id: userId, email: `${userId}@example.test`, name: userId, role: "professional", mustChangePassword: false } },
  } as any;
  context.next = async () => (method === "GET" ? opsGet(context) : opsPost(context));
  const response = await opsMiddleware(context);
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}
const alfa = (body?: Record<string, unknown>) => call("prof-a", body);
async function pub(body: Record<string, unknown>) {
  const response = await publicPost({
    request: new Request("https://neuroped.test/api/public-booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    env: env(),
  } as never);
  return { status: response.status, body: await response.json() as any };
}

type Row = Record<string, any>;
// Preparação: perfil público, serviço e uma entrada de espera real (pelo fluxo público).
assert.equal((await alfa({ action: "upsert_profile", displayName: "Dra. Alfa", specialty: "Neuropediatria", slug: "dra-alfa", timezone: "America/Sao_Paulo", bookingEnabled: true })).status, 200);
assert.equal((await alfa({ action: "create_service", name: "Consulta", durationMinutes: 60, priceCents: 0 })).status, 200);
const serviceId = (raw.prepare(`SELECT id FROM booking_services WHERE provider_user_id = 'prof-a'`).get() as Row).id as string;
const day = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
async function newEntry(): Promise<string> {
  const joined = await pub({
    action: "waitlist", provider: "dra-alfa", clinic: "clinica-alfa", serviceId, preferredDate: day,
    guardianName: "Resp Sintético", guardianPhone: "11999998888", patientName: "Criança Sintética", privacyAccepted: true,
  });
  assert.equal(joined.status, 201, JSON.stringify(joined.body));
  return joined.body.waitlistId as string;
}
const statusOf = (id: string) => (raw.prepare(`SELECT status FROM waitlist_entries WHERE id = ?`).get(id) as Row).status as string;
const set = (id: string, status: string) => alfa({ action: "waitlist_status", id, status });
const audits = (id: string) => (raw.prepare(`SELECT COUNT(*) AS n FROM operations_audit_log WHERE action = 'waitlist_status' AND target_id = ?`).get(id) as Row).n as number;

// ── 1. Fluxo normal ───────────────────────────────────────────────────────
{
  const id = await newEntry();
  assert.equal(statusOf(id), "waiting");
  assert.equal((await set(id, "offered")).status, 200, "oferecer");
  assert.equal(statusOf(id), "offered");
  assert.equal((await set(id, "offered")).status, 200, "repetir o estado de um não terminal é idempotente (clique duplo)");
  assert.equal((await set(id, "waiting")).status, 200, "desfazer a oferta");
  assert.equal(statusOf(id), "waiting");
  assert.equal((await set(id, "closed")).status, 200, "encerrar");
  assert.equal(statusOf(id), "closed");
  assert.equal(audits(id), 4, "as quatro mudanças aceitas foram auditadas");
}

// ── 2. Terminais não voltam ───────────────────────────────────────────────
{
  const closed = await newEntry();
  assert.equal((await set(closed, "closed")).status, 200);
  const closedAt = (raw.prepare(`SELECT updated_at FROM waitlist_entries WHERE id = ?`).get(closed) as Row).updated_at;
  for (const target of ["waiting", "offered", "booked", "closed"]) {
    const attempt = await set(closed, target);
    assert.equal(attempt.status, 409, `closed → ${target}: ${JSON.stringify(attempt.body)}`);
    assert.equal(attempt.body.code, "INVALID_TRANSITION");
    assert.equal(statusOf(closed), "closed", "a entrada encerrada continua encerrada");
  }
  assert.equal((raw.prepare(`SELECT updated_at FROM waitlist_entries WHERE id = ?`).get(closed) as Row).updated_at, closedAt, "recusar não mexe na linha");
  assert.equal(audits(closed), 1, "transição recusada não é auditada");

  const booked = await newEntry();
  assert.equal((await set(booked, "booked")).status, 200, "agendar a partir de waiting");
  for (const target of ["waiting", "offered", "closed"]) {
    const attempt = await set(booked, target);
    assert.equal(attempt.status, 409, `booked → ${target}`);
    assert.equal(attempt.body.code, "INVALID_TRANSITION");
  }
  assert.equal(statusOf(booked), "booked");

  const offeredThenBooked = await newEntry();
  assert.equal((await set(offeredThenBooked, "offered")).status, 200);
  assert.equal((await set(offeredThenBooked, "booked")).status, 200, "agendar a partir de offered");
}

// ── 3. Erros de entrada e isolamento ──────────────────────────────────────
{
  const id = await newEntry();
  assert.equal((await set(id, "arquivado")).status, 400, "status inexistente");
  assert.equal((await alfa({ action: "waitlist_status", status: "offered" })).status, 400, "sem id");
  const missing = await set("wait-que-nao-existe", "offered");
  assert.equal(missing.status, 404);
  assert.equal(missing.body.code, "NOT_FOUND");
  // Outra clínica: mesma resposta de inexistente (anti-enumeração), nada muda.
  const foreign = await call("prof-b", { action: "waitlist_status", id, status: "closed" });
  assert.equal(foreign.status, 404, "entrada de outro profissional/clínica");
  assert.equal(foreign.body.code, "NOT_FOUND");
  assert.equal(statusOf(id), "waiting");
}

console.log("operations-waitlist-status-guard: fluxo normal e idempotente; closed e booked são terminais (409 INVALID_TRANSITION, linha e auditoria intactas); id inexistente e de outra clínica respondem 404 OK");
