/**
 * Agenda da clínica inteira: GET /api/operations?resource=clinic_day&date=AAAA-MM-DD
 * e a aba "Clínica" (client/src/components/AgendaClinicDay.tsx).
 *
 * Harness real: db/schema.d1.sql + todas as migrações, middleware e handler
 * reais. Cobre: dono e administrador da clínica veem todos os profissionais com
 * membership ativa; profissional comum e recepção NÃO recebem o recurso; isolamento
 * entre clínicas; recorte exato do dia; data inválida; e a flag `clinicWide` do
 * painel (que controla a aba no cliente).
 *
 * Rodar: node --import tsx tests/unit/operations-clinic-day.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { onRequest as opsMiddleware } from "../../functions/api/operations/_middleware";
import { onRequestGet as opsGet } from "../../functions/api/operations/index";
import { nowInProviderTimezone } from "../../functions/api/operations/_core";

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

function makeDb(database: DatabaseSync): D1Database {
  const prepare = (sql: string) => {
    const make = (args: unknown[]) => ({
      async first<T>() {
        return (database.prepare(sql).get(...(args as never[])) as T | undefined) ?? null;
      },
      async run() {
        const info = database.prepare(sql).run(...(args as never[]));
        return { meta: { changes: Number(info.changes) } };
      },
      async all<T>() {
        return { results: database.prepare(sql).all(...(args as never[])) as T[] };
      },
    });
    return { bind: (...args: unknown[]) => make(args), ...make([]) };
  };
  return {
    prepare,
    async batch(statements: Array<{ run(): Promise<unknown> }>) {
      database.exec("SAVEPOINT d1_test_batch");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        database.exec("RELEASE d1_test_batch");
        return results;
      } catch (error) {
        database.exec("ROLLBACK TO d1_test_batch; RELEASE d1_test_batch");
        throw error;
      }
    },
  } as unknown as D1Database;
}

const db = makeDb(raw);
const now = () => new Date().toISOString();

function insertUser(id: string, name: string, role: string) {
  raw.prepare(
    `INSERT INTO users (id, name, email, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)`,
  ).run(id, name, `${id}@example.test`, role, now(), now());
}

function insertClinic(id: string, slug: string, createdBy: string) {
  raw.prepare(
    `INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?, ?)`,
  ).run(id, slug, `Clínica ${slug}`, createdBy, now(), now());
  raw.prepare(
    `UPDATE billing_subscriptions SET seats = 10 WHERE customer_id IN (SELECT id FROM billing_customers WHERE clinic_id = ?)`,
  ).run(id);
}

function insertMembership(clinicId: string, userId: string, role: string) {
  raw.prepare(
    `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)`,
  ).run(clinicId, userId, role, now(), now());
}

insertUser("dono", "Dona Alfa", "professional");
insertUser("admin-alfa", "Administrador Alfa", "professional");
insertUser("prof-a", "Profissional Alfa", "professional");
insertUser("prof-inativo", "Profissional Inativo", "professional");
insertUser("prof-b", "Profissional Beta", "professional");
insertUser("sec-a", "Secretária Alfa", "operator");

insertClinic("clinic-alfa", "clinica-alfa", "dono");
insertClinic("clinic-beta", "clinica-beta", "prof-b");

insertMembership("clinic-alfa", "dono", "owner");
insertMembership("clinic-alfa", "admin-alfa", "clinic_admin");
insertMembership("clinic-alfa", "prof-a", "professional");
insertMembership("clinic-alfa", "prof-inativo", "professional");
insertMembership("clinic-alfa", "sec-a", "assistant");
raw.prepare(
  `INSERT INTO booking_staff_links (provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at)
   VALUES ('dono', 'sec-a', 1, 'dono', ?, ?)`,
).run(now(), now());
insertMembership("clinic-beta", "prof-b", "owner");
raw.prepare(`UPDATE users SET is_active = 0 WHERE id = 'prof-inativo'`).run();

async function call(userId: string, role: string, opts: { query?: string } = {}) {
  const context = {
    request: new Request(`https://neuroped.test/api/operations${opts.query ? `?${opts.query}` : ""}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
    data: { authUser: { id: userId, email: `${userId}@example.test`, name: userId, role, mustChangePassword: false } },
  } as any;
  context.next = async () => opsGet(context);
  const response = await opsMiddleware(context);
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function createService(userId: string) {
  const context = {
    request: new Request(`https://neuroped.test/api/operations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_service", name: "Consulta", durationMinutes: 30, priceCents: 50000 }),
    }),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
    data: { authUser: { id: userId, email: `${userId}@example.test`, name: userId, role: "professional", mustChangePassword: false } },
  } as any;
  const { onRequestPost: opsPost } = await import("../../functions/api/operations/index");
  context.next = async () => opsPost(context);
  const response = await opsMiddleware(context);
  assert.equal(response.status, 200, `${userId}: ${await response.text()}`);
}

await createService("dono");
await createService("prof-a");
await createService("prof-inativo");
await createService("prof-b");

const svcOf = (provider: string) =>
  (raw.prepare(`SELECT id FROM booking_services WHERE provider_user_id = ?`).get(provider) as Record<string, unknown>).id as string;

async function book(provider: string, startsAtLocal: string, patientName: string) {
  const context = {
    request: new Request(`https://neuroped.test/api/operations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_appointment",
        serviceId: svcOf(provider),
        startsAtLocal,
        patientName,
        guardianName: `Resp. ${patientName}`,
        guardianPhone: "+55 (81) 99000-0001",
      }),
    }),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
    data: { authUser: { id: provider, email: `${provider}@example.test`, name: provider, role: "professional", mustChangePassword: false } },
  } as any;
  const { onRequestPost: opsPost } = await import("../../functions/api/operations/index");
  context.next = async () => opsPost(context);
  const response = await opsMiddleware(context);
  assert.equal(response.status, 200, `${provider} ${startsAtLocal}: ${await response.text()}`);
}

const TODAY = nowInProviderTimezone("America/Recife").slice(0, 10);
const YESTERDAY_DATE = new Date(Date.UTC(Number(TODAY.slice(0, 4)), Number(TODAY.slice(5, 7)) - 1, Number(TODAY.slice(8, 10)) - 1)).toISOString().slice(0, 10);
const TOMORROW_DATE = new Date(Date.UTC(Number(TODAY.slice(0, 4)), Number(TODAY.slice(5, 7)) - 1, Number(TODAY.slice(8, 10)) + 1)).toISOString().slice(0, 10);

await book("dono", `${TODAY}T08:00`, "Dona Hoje");
await book("prof-a", `${TODAY}T09:00`, "Alfa Hoje");
await book("prof-inativo", `${TODAY}T10:00`, "Inativo Hoje");
await book("prof-b", `${TODAY}T09:00`, "Beta Hoje");
await book("prof-a", `${YESTERDAY_DATE}T23:30`, "Fora Ontem");
await book("prof-a", `${TOMORROW_DATE}T00:00`, "Fora Amanhã");

const clinicDayAs = (userId: string, role: string, date: string) =>
  call(userId, role, { query: `resource=clinic_day&date=${date}` });
const dashboardAs = (userId: string, role: string) => call(userId, role, {});

// ── 1. Dono vê a clínica inteira do dia, por profissional, sem o inativo ──────
{
  const result = await clinicDayAs("dono", "professional", TODAY);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  const body = result.body;
  assert.equal(body.date, TODAY);
  assert.equal(body.timezone, "America/Recife");
  assert.match(body.nowLocal, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  assert.equal(body.truncated, false);
  assert.deepEqual(
    body.providers.map((p: any) => p.providerName),
    ["Administrador Alfa", "Dona Alfa", "Profissional Alfa"],
    "todos os membros ativos da clínica, em ordem de nome, sem o inativo e sem outra clínica",
  );
  const profAlfa = body.providers.find((p: any) => p.providerUserId === "prof-a");
  assert.deepEqual(
    profAlfa.appointments.map((a: any) => a.patientName),
    ["Alfa Hoje"],
    "recorte exato do dia: ontem e amanhã ficam de fora",
  );
  const dona = body.providers.find((p: any) => p.providerUserId === "dono");
  assert.deepEqual(
    dona.appointments.map((a: any) => a.patientName),
    ["Dona Hoje"],
  );
  assert.equal(body.totalAppointments, 2);
  assert.equal(
    dona.appointments[0].amountCents,
    50000,
    "dono/administrador vê o financeiro (canConfigure)",
  );
}

// ── 2. Administrador da clínica também vê; flag clinicWide no painel ─────────
{
  const admin = await clinicDayAs("admin-alfa", "professional", TODAY);
  assert.equal(admin.status, 200, JSON.stringify(admin.body));
  assert.equal(admin.body.totalAppointments, 2);
  const dash = await dashboardAs("admin-alfa", "professional");
  assert.equal(dash.status, 200);
  assert.equal(dash.body.access.clinicWide, true, "painel anuncia a aba Clínica para o administrador");
  const donoDash = await dashboardAs("dono", "professional");
  assert.equal(donoDash.body.access.clinicWide, true, "painel anuncia a aba Clínica para o dono");
}

// ── 3. Profissional comum e recepção não recebem o recurso ────────────────────
{
  const prof = await clinicDayAs("prof-a", "professional", TODAY);
  assert.equal(prof.status, 403, "profissional sem membership owner/clinic_admin não vê a clínica");
  assert.equal(prof.body.code, "FORBIDDEN");
  const profDash = await dashboardAs("prof-a", "professional");
  assert.equal(profDash.body.access.clinicWide, false, "aba Clínica não aparece para o profissional comum");
  const sec = await clinicDayAs("sec-a", "operator", TODAY);
  assert.equal(sec.status, 403, "recepção não vê a clínica inteira");
  const secDash = await dashboardAs("sec-a", "operator");
  assert.equal(secDash.body.access.clinicWide, undefined, "recepção sem a flag no payload");
}

// ── 4. Isolamento entre clínicas ──────────────────────────────────────────────
{
  const beta = await clinicDayAs("prof-b", "professional", TODAY);
  assert.equal(beta.status, 200);
  assert.deepEqual(
    beta.body.providers.map((p: any) => p.providerName),
    ["Profissional Beta"],
    "dono da clínica beta não enxerga a clínica alfa",
  );
  assert.deepEqual(
    beta.body.providers[0].appointments.map((a: any) => a.patientName),
    ["Beta Hoje"],
  );
}

// ── 5. Data inválida ──────────────────────────────────────────────────────────
{
  const invalid = await clinicDayAs("dono", "professional", "2026-13-40");
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.code, "VALIDATION_ERROR");
}

// ── 6. Chaves do cliente ──────────────────────────────────────────────────────
{
  const { clinicDayKey, shiftClinicDayDate } = await import("../../client/src/lib/agendaClinicDay");
  assert.equal(clinicDayKey("2026-10-06"), "/api/operations?resource=clinic_day&date=2026-10-06");
  assert.equal(clinicDayKey("'); DROP TABLE users;--"), "/api/operations?resource=clinic_day");
  assert.equal(shiftClinicDayDate("2026-10-06", 1), "2026-10-07");
  assert.equal(shiftClinicDayDate("2026-10-01", -1), "2026-09-30");
}

console.log("operations-clinic-day: todos os testes passaram");
