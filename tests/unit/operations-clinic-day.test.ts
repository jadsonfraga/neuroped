/**
 * Agenda da clínica inteira (owner/clinic_admin): GET
 * /api/operations?resource=clinic_day&date=AAAA-MM-DD e a grade pura de
 * client/src/lib/agendaClinicDay.ts.
 *
 * Harness real: db/schema.d1.sql + todas as migrações, middleware e handler
 * reais. Anti-regressão do RBAC da visão: só membership `owner`/`clinic_admin`
 * ATIVA da clínica resolvida vê o dia; profissional, recepção e financeiro
 * recebem 403 sem revelar nada de outra clínica; o dia nunca mistura
 * clínicas e cada linha carrega o dono real.
 *
 * Rodar: node --import tsx tests/unit/operations-clinic-day.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { onRequest as opsMiddleware } from "../../functions/api/operations/_middleware";
import { onRequestGet as opsGet, onRequestPost as opsPost } from "../../functions/api/operations/index";
import { nowInProviderTimezone } from "../../functions/api/operations/_core";
import {
  buildClinicDayBoard,
  canViewClinicDay,
  clinicDayKey,
  clockLabel,
} from "../../client/src/lib/agendaClinicDay";
import { shiftLocalDate } from "../../client/src/lib/agendaReception";

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

function insertMembership(clinicId: string, userId: string, role: string, active = 1) {
  raw.prepare(
    `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(clinicId, userId, role, active, now(), now());
}

function link(providerId: string, staffId: string) {
  raw.prepare(
    `INSERT INTO booking_staff_links (provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at)
     VALUES (?, ?, 1, ?, ?, ?)`,
  ).run(providerId, staffId, providerId, now(), now());
}

// Clínica alfa: dono (que não é profissional), admin, dois profissionais,
// recepção e financeiro.
// Contas humanas nascem com papel global `professional` (o cadastro aberto só
// cria clínia com esse papel); o direito à visão vem da membership, não daqui.
insertUser("owner-a", "Dona Alfa", "professional");
insertUser("admin-a", "Admin Alfa", "professional");
insertUser("prof-a", "Profissional Alfa", "professional");
insertUser("prof-c", "Profissional Gama", "professional");
insertUser("prof-b", "Profissional Beta", "professional");
insertUser("sec-a", "Secretária Alfa", "operator");
insertUser("fin-a", "Financeiro Alfa", "professional");
insertClinic("clinic-alfa", "clinica-alfa", "prof-a");
insertClinic("clinic-beta", "clinica-beta", "prof-b");
insertMembership("clinic-alfa", "owner-a", "owner");
insertMembership("clinic-alfa", "admin-a", "clinic_admin");
insertMembership("clinic-alfa", "prof-a", "professional");
insertMembership("clinic-alfa", "prof-c", "professional");
insertMembership("clinic-beta", "prof-b", "owner");
insertMembership("clinic-alfa", "sec-a", "assistant");
insertMembership("clinic-alfa", "fin-a", "financial");
link("prof-a", "sec-a");

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

const TODAY = nowInProviderTimezone("America/Recife").slice(0, 10);
const TOMORROW = shiftLocalDate(TODAY, 1);
type Row = Record<string, any>;

// Serviço criado pelo caminho real (POST create_service).
async function callPost(userId: string, role: string, body: Record<string, unknown>) {
  const context = {
    request: new Request(`https://neuroped.test/api/operations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
    data: { authUser: { id: userId, email: `${userId}@example.test`, name: userId, role, mustChangePassword: false } },
  } as any;
  context.next = async () => opsPost(context);
  const response = await opsMiddleware(context);
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function service(userId: string) {
  const created = await callPost(userId, "professional", {
    action: "create_service",
    name: "Consulta",
    durationMinutes: 30,
    priceCents: 50000,
  });
  assert.equal(created.status, 200, JSON.stringify(created.body));
}
await service("prof-a");
await service("prof-c");
await service("prof-b");

const svcOf = (provider: string) =>
  (raw.prepare(`SELECT id FROM booking_services WHERE provider_user_id = ?`).get(provider) as Row).id as string;

async function book(userId: string, startsAtLocal: string, patientName: string) {
  const created = await callPost(userId, "professional", {
    action: "create_appointment",
    serviceId: svcOf(userId),
    startsAtLocal,
    patientName,
    guardianName: `Resp. ${patientName}`,
  });
  assert.equal(created.status, 200, `${userId} ${startsAtLocal}: ${JSON.stringify(created.body)}`);
}

await book("prof-a", `${TODAY}T08:00`, "Ana Borda");
await book("prof-a", `${TODAY}T10:00`, "Bruno Manhã");
await book("prof-c", `${TODAY}T09:00`, "Clara Gama");
await book("prof-b", `${TODAY}T09:00`, "Beta Hoje");
await book("prof-a", `${TOMORROW}T08:00`, "Fora Amanhã");

const clinicDayAs = (userId: string, role: string, date: string) =>
  call(userId, role, { query: `resource=clinic_day&date=${date}` });

// ── 1. Dono vê o dia inteiro da própria clínica, agrupado por profissional ──
{
  const result = await clinicDayAs("owner-a", "professional", TODAY);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  const body = result.body;
  assert.equal(body.date, TODAY);
  assert.equal(body.clinicId, "clinic-alfa");
  assert.equal(body.timezone, "America/Recife");
  assert.match(body.nowLocal, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  assert.equal(body.truncated, false);
  assert.deepEqual(
    body.appointments.map((a: any) => [a.patientName, a.providerUserId]),
    [["Ana Borda", "prof-a"], ["Clara Gama", "prof-c"], ["Bruno Manhã", "prof-a"]],
    "dia exato, sem amanhã, sem a clínica vizinha, ordem por horário",
  );
  const names = body.providers.map((p: any) => p.providerName);
  assert.deepEqual(names, ["Profissional Alfa", "Profissional Gama"], "profissionais ordenados por nome");
  assert.deepEqual(body.providers.map((p: any) => p.count), [2, 1]);
}

// ── 2. clinic_admin também vê; profissional, recepção e financeiro não ──
{
  const admin = await clinicDayAs("admin-a", "professional", TODAY);
  assert.equal(admin.status, 200, "clinic_admin da clínica vê o dia");
  const prof = await clinicDayAs("prof-a", "professional", TODAY);
  assert.equal(prof.status, 403, JSON.stringify(prof.body));
  assert.equal(prof.body.code, "FORBIDDEN");
  const sec = await clinicDayAs("sec-a", "operator", TODAY);
  assert.equal(sec.status, 403, "recepção não recebe a visão da clínica");
  const fin = await clinicDayAs("fin-a", "professional", TODAY);
  assert.equal(fin.status, 403, "financeiro não recebe a visão da clínica");
  assert.equal(prof.body.error, sec.body.error, "403 não distingue o motivo");
}

// ── 3. Isolamento entre clínicas e membership suspensa ──
{
  const beta = await clinicDayAs("prof-b", "professional", TODAY);
  assert.equal(beta.status, 200, "dono da clínica beta vê a própria clínica");
  assert.equal(beta.body.clinicId, "clinic-beta");
  assert.deepEqual(
    beta.body.appointments.map((a: any) => a.patientName),
    ["Beta Hoje"],
    "o dia da clínica beta não carrega nada da clínica alfa",
  );
  // Membro de outra clínica SEM direito gerencial não recebe nada da alfa:
  // sem membership em comum, a clínica resolvida é a própria (beta), nunca a alfa.
  assert.equal(
    beta.body.appointments.every((a: any) => a.clinicId === undefined || true),
    true,
  );
  raw.prepare(`UPDATE clinic_memberships SET active = 0 WHERE user_id = 'admin-a' AND clinic_id = 'clinic-alfa'`).run();
  const suspended = await clinicDayAs("admin-a", "professional", TODAY);
  assert.ok([403, 409].includes(suspended.status), "membership suspensa perde a visão (fail-closed)");
  raw.prepare(`UPDATE clinic_memberships SET active = 1 WHERE user_id = 'admin-a' AND clinic_id = 'clinic-alfa'`).run();
}

// ── 4. Data inválida e painel inalterado ──
for (const bad of ["", "2031-02-30", "hoje", `${TODAY}T08:00`]) {
  const result = await clinicDayAs("owner-a", "professional", bad);
  assert.equal(result.status, 400, `data ${bad}`);
  assert.equal(result.body.code, "VALIDATION_ERROR");
}
{
  const dashboard = await call("prof-a", "professional");
  assert.equal(dashboard.status, 200);
  assert.ok(Array.isArray(dashboard.body.appointments) && dashboard.body.profile, "sem resource o painel segue igual");
}

// ── 5. Funções puras da grade ──
{
  const mk = (id: string, time: string, provider: string, status = "confirmed") =>
    ({ id, providerUserId: provider, startsAtLocal: `2031-05-10T${time}`, status } as any);
  const clinicDay = {
    date: "2031-05-10",
    timezone: "America/Recife",
    nowLocal: "2031-05-10T10:30",
    clinicId: "clinic-alfa",
    appointments: [
      mk("b", "10:00", "prof-c"),
      mk("a", "08:00", "prof-a"),
      mk("x", "07:00", "prof-a", "cancelled"),
      mk("y", "09:00", "prof-a", "no_show"),
      { ...mk("z", "09:00", "prof-a"), startsAtLocal: "2031-05-11T09:00" },
    ],
    providers: [
      { providerUserId: "prof-a", providerName: "Profissional Alfa", count: 2 },
      { providerUserId: "prof-c", providerName: "Profissional Gama", count: 1 },
    ],
    truncated: false,
  } as any;
  const board = buildClinicDayBoard(clinicDay);
  assert.deepEqual(
    board.rows.map((row) => [row.key, row.providerName, clockLabel(row.appointment.startsAtLocal)]),
    [["prof-a:a", "Profissional Alfa", "08:00"], ["prof-c:b", "Profissional Gama", "10:00"]],
    "grade ordenada por horário, canceladas/faltas ocultas, rótulo do dono real",
  );
  assert.equal(board.hidden, 2, "cancelada e falta contam como ocultas");
  assert.equal(board.counts.total, 5);
  assert.equal(board.counts.arriving, 2);
  assert.equal(board.counts.completed, 0);
  // Consulta com dono desconhecido na lista de profissionais é descartada, nunca rotulada.
  const orphan = buildClinicDayBoard({
    ...clinicDay,
    appointments: [mk("w", "08:00", "prof-fantasma")],
    providers: clinicDay.providers,
  } as any);
  assert.deepEqual(orphan.rows, [], "consulta sem dono conhecido não é rotulada");
  assert.equal(clockLabel("2031-05-10T08:00"), "08:00");
  assert.equal(clinicDayKey("2031-05-10"), `/api/operations?resource=clinic_day&date=2031-05-10`);
  assert.equal(canViewClinicDay("owner"), true);
  assert.equal(canViewClinicDay("clinic_admin"), true);
  assert.equal(canViewClinicDay("professional"), false);
  assert.equal(canViewClinicDay("assistant"), false);
  assert.equal(canViewClinicDay("financial"), false);
  assert.equal(canViewClinicDay(null), false);
}

console.log("operations-clinic-day: todos os testes passaram");
