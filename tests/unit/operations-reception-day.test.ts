/**
 * Recepção do dia: GET /api/operations?resource=day&date=AAAA-MM-DD e o quadro
 * de chegada (client/src/lib/agendaReception.ts).
 *
 * Harness real: db/schema.d1.sql + todas as migrações, middleware e handler
 * reais. Cobre: recorte exato do dia (bordas 00:00 e dia seguinte), todos os
 * estados, ordem, redação do financeiro para a recepção, recepção com vários
 * profissionais (escolha obrigatória e alvo validado), isolamento entre
 * clínicas, fluxo de balcão pelo `appointment_status` existente, data inválida,
 * limite do dia e as funções puras do quadro.
 *
 * Rodar: node --import tsx tests/unit/operations-reception-day.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequest as opsMiddleware } from "../../functions/api/operations/_middleware";
import { onRequestGet as opsGet, onRequestPost as opsPost } from "../../functions/api/operations/index";
import { nowInProviderTimezone } from "../../functions/api/operations/_core";
import {
  RECEPTION_ACTIONS,
  buildReceptionBoard,
  minutesSince,
  receptionDayKey,
  shiftLocalDate,
  telHref,
  waitingLabel,
} from "../../client/src/lib/agendaReception";

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
  // O trial automático traz poucos assentos; este teste usa vários membros.
  raw.prepare(
    `UPDATE billing_subscriptions SET seats = 10 WHERE customer_id IN (SELECT id FROM billing_customers WHERE clinic_id = ?)`,
  ).run(id);
}
function insertMembership(clinicId: string, userId: string, role: string) {
  raw.prepare(
    `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)`,
  ).run(clinicId, userId, role, now(), now());
}
function link(providerId: string, staffId: string) {
  raw.prepare(
    `INSERT INTO booking_staff_links (provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at)
     VALUES (?, ?, 1, ?, ?, ?)`,
  ).run(providerId, staffId, providerId, now(), now());
}

insertUser("prof-a", "Profissional Alfa", "professional");
insertUser("prof-c", "Profissional Gama", "professional");
insertUser("prof-b", "Profissional Beta", "professional");
insertUser("sec-a", "Secretária Alfa", "operator");
insertClinic("clinic-alfa", "clinica-alfa", "prof-a");
insertClinic("clinic-beta", "clinica-beta", "prof-b");
insertMembership("clinic-alfa", "prof-a", "owner");
insertMembership("clinic-alfa", "prof-c", "professional");
insertMembership("clinic-beta", "prof-b", "owner");
insertMembership("clinic-alfa", "sec-a", "assistant");
link("prof-a", "sec-a");
link("prof-c", "sec-a");

async function call(userId: string, role: string, opts: { body?: Record<string, unknown>; query?: string } = {}) {
  const method = opts.body ? "POST" : "GET";
  const context = {
    request: new Request(`https://neuroped.test/api/operations${opts.query ? `?${opts.query}` : ""}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
    data: { authUser: { id: userId, email: `${userId}@example.test`, name: userId, role, mustChangePassword: false } },
  } as any;
  context.next = async () => (method === "GET" ? opsGet(context) : opsPost(context));
  const response = await opsMiddleware(context);
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}
const prof = (body: Record<string, unknown>) => call("prof-a", "professional", { body });
const secOn = (provider: string, body: Record<string, unknown>) => call("sec-a", "operator", { body, query: `provider=${provider}` });
const dayAs = (userId: string, role: string, date: string, provider?: string) =>
  call(userId, role, { query: `resource=day&date=${date}${provider ? `&provider=${provider}` : ""}` });

type Row = Record<string, any>;
const TODAY = nowInProviderTimezone("America/Recife").slice(0, 10);
const YESTERDAY = shiftLocalDate(TODAY, -1);
const TOMORROW = shiftLocalDate(TODAY, 1);

async function service(userId: string, role: string, provider?: string) {
  const created = await call(userId, role, {
    body: { action: "create_service", name: "Consulta", durationMinutes: 30, priceCents: 50000 },
    query: provider ? `provider=${provider}` : undefined,
  });
  assert.equal(created.status, 200, JSON.stringify(created.body));
}
await service("prof-a", "professional");
await service("prof-c", "professional");
await service("prof-b", "professional");
const svcOf = (provider: string) =>
  (raw.prepare(`SELECT id FROM booking_services WHERE provider_user_id = ?`).get(provider) as Row).id as string;

async function book(userId: string, role: string, startsAtLocal: string, patientName: string, guardianPhone = "+55 (81) 99000-0001") {
  const created = await call(userId, role, {
    body: { action: "create_appointment", serviceId: svcOf(userId), startsAtLocal, patientName, guardianName: `Resp. ${patientName}`, guardianPhone },
  });
  assert.equal(created.status, 200, `${startsAtLocal}: ${JSON.stringify(created.body)}`);
  return (raw.prepare(`SELECT id FROM appointments WHERE provider_user_id = ? AND starts_at_local = ?`).get(userId, startsAtLocal) as Row).id as string;
}

const early = await book("prof-a", "professional", `${TODAY}T00:00`, "Ana Borda");
const morning = await book("prof-a", "professional", `${TODAY}T08:00`, "Bruno Manhã");
const midday = await book("prof-a", "professional", `${TODAY}T12:00`, "Clara Meio-dia");
const late = await book("prof-a", "professional", `${TODAY}T23:30`, "Davi Noite");
await book("prof-a", "professional", `${YESTERDAY}T23:30`, "Fora Ontem");
await book("prof-a", "professional", `${TOMORROW}T00:00`, "Fora Amanhã");
await book("prof-c", "professional", `${TODAY}T09:00`, "Gama Hoje");
await book("prof-b", "professional", `${TODAY}T09:00`, "Beta Hoje");
assert.equal((await prof({ action: "appointment_payment", id: morning, paymentStatus: "paid", amountCents: 50000 })).status, 200);
assert.equal((await prof({ action: "appointment_status", id: late, status: "cancelled" })).status, 200);

// ── 1. Profissional: recorte exato do dia, todos os estados, em ordem ───────
{
  const result = await dayAs("prof-a", "professional", TODAY);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  const body = result.body;
  assert.equal(body.date, TODAY);
  assert.equal(body.timezone, "America/Recife");
  assert.match(body.nowLocal, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  assert.equal(body.truncated, false);
  assert.deepEqual(
    body.appointments.map((a: any) => [a.patientName, a.status]),
    [
      ["Ana Borda", "confirmed"],
      ["Bruno Manhã", "confirmed"],
      ["Clara Meio-dia", "confirmed"],
      ["Davi Noite", "cancelled"],
    ],
    "00:00 entra, ontem e amanhã não, cancelada continua visível, ordem por horário",
  );
  assert.equal(body.appointments[1].amountCents, 50000, "profissional vê o financeiro");
  assert.equal(body.appointments[1].paymentStatus, "paid");
  assert.equal(body.appointments[0].serviceName, "Consulta");
}

// ── 2. Recepção com dois profissionais: escolha obrigatória, alvo validado ──
{
  const noChoice = await dayAs("sec-a", "operator", TODAY);
  assert.equal(noChoice.status, 409, "sem escolha não há agenda por acaso");
  assert.equal(noChoice.body.code, "PROVIDER_SELECTION_REQUIRED");
  const foreign = await dayAs("sec-a", "operator", TODAY, "prof-b");
  assert.equal(foreign.status, 403, "profissional de outra clínica é indisponível");
  assert.equal(foreign.body.code, "PROVIDER_NOT_AVAILABLE");

  const alfa = await dayAs("sec-a", "operator", TODAY, "prof-a");
  assert.equal(alfa.status, 200, JSON.stringify(alfa.body));
  assert.equal(alfa.body.providerName, "Profissional Alfa");
  assert.equal(alfa.body.appointments.length, 4);
  assert.ok(
    alfa.body.appointments.every((a: any) => a.amountCents === null && a.paymentMethod === null && a.paymentStatus === "pending"),
    "financeiro redigido para a recepção",
  );
  assert.equal(alfa.body.appointments[0].guardianPhone, "+55 (81) 99000-0001", "contato disponível para a recepção ligar");

  const gama = await dayAs("sec-a", "operator", TODAY, "prof-c");
  assert.deepEqual(gama.body.appointments.map((a: any) => a.patientName), ["Gama Hoje"], "cada agenda só com as suas consultas");
}

// ── 3. Isolamento entre clínicas ─────────────────────────────────────────────
{
  const beta = await dayAs("prof-b", "professional", TODAY);
  assert.deepEqual(beta.body.appointments.map((a: any) => a.patientName), ["Beta Hoje"]);
}

// ── 4. Fluxo de balcão pela ação existente, refletido no dia ─────────────────
{
  const before = Date.now();
  for (const status of ["checked_in"]) {
    const moved = await secOn("prof-a", { action: "appointment_status", id: morning, status });
    assert.equal(moved.status, 200, JSON.stringify(moved.body));
  }
  const afterCheckIn = await dayAs("sec-a", "operator", TODAY, "prof-a");
  const bruno = afterCheckIn.body.appointments.find((a: any) => a.id === morning);
  assert.equal(bruno.status, "checked_in");
  assert.ok(bruno.checkedInAt && Date.parse(bruno.checkedInAt) >= before - 1000, "horário da chegada gravado");

  const board = buildReceptionBoard(afterCheckIn.body.appointments, TODAY, afterCheckIn.body.nowLocal, Date.now());
  assert.deepEqual(board.columns.waiting.map((i) => i.appointment.id), [morning], "chegou → na recepção");
  assert.equal(board.columns.waiting[0].waitingMinutes, 0);
  assert.deepEqual(board.columns.done.map((i) => i.appointment.patientName), ["Davi Noite"]);

  assert.equal((await secOn("prof-a", { action: "appointment_status", id: morning, status: "in_care" })).status, 200);
  assert.equal((await secOn("prof-a", { action: "appointment_status", id: morning, status: "completed" })).status, 200);
  assert.equal((await secOn("prof-a", { action: "appointment_status", id: early, status: "no_show" })).status, 200);
  const skip = await secOn("prof-a", { action: "appointment_status", id: midday, status: "completed" });
  assert.equal(skip.status, 409, "o servidor continua barrando pular etapas");

  const end = await dayAs("prof-a", "professional", TODAY);
  const finalBoard = buildReceptionBoard(end.body.appointments, TODAY, end.body.nowLocal, Date.now());
  assert.equal(finalBoard.counts.completed, 1);
  assert.equal(finalBoard.counts.noShow, 1);
  assert.equal(finalBoard.counts.cancelled, 1);
  assert.equal(finalBoard.counts.arriving, 1);
  const audits = raw.prepare(`SELECT actor_user_id FROM operations_audit_log WHERE action = 'appointment_status' AND target_id = ?`).all(morning) as Row[];
  assert.deepEqual(audits.map((a) => a.actor_user_id), ["sec-a", "sec-a", "sec-a"], "trilha registra a recepção em cada passo");
}

// ── 5. Data inválida e painel inalterado ─────────────────────────────────────
for (const bad of ["", "2031-02-30", "hoje", `${TODAY}T08:00`]) {
  const result = await dayAs("prof-a", "professional", bad);
  assert.equal(result.status, 400, `data ${bad}`);
  assert.equal(result.body.code, "VALIDATION_ERROR");
}
{
  const dashboard = await call("prof-a", "professional");
  assert.equal(dashboard.status, 200);
  assert.ok(Array.isArray(dashboard.body.appointments) && dashboard.body.profile, "sem `resource=day` o painel segue igual");
}

// ── 6. Limite do dia (200) sinalizado ────────────────────────────────────────
{
  const template = raw.prepare(`SELECT * FROM appointments WHERE id = ?`).get(midday) as Row;
  const columns = Object.keys(template);
  const insert = raw.prepare(`INSERT INTO appointments (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`);
  const busyDay = shiftLocalDate(TODAY, 40);
  for (let i = 0; i < 201; i += 1) {
    const minutes = i * 5;
    const clock = (total: number) => `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    const row = { ...template, id: `bulk-${i}`, starts_at_local: `${busyDay}T${clock(minutes)}`, ends_at_local: `${busyDay}T${clock(minutes + 5)}`, booking_token_hash: `bulk-hash-${i}` };
    insert.run(...(columns.map((c) => row[c]) as never[]));
  }
  const crowded = await dayAs("prof-a", "professional", busyDay);
  assert.equal(crowded.body.appointments.length, 200);
  assert.equal(crowded.body.truncated, true, "dia com mais de 200 consultas avisa");
}

// ── 7. Funções puras do quadro ───────────────────────────────────────────────
{
  const base = { serviceId: "s", providerUserId: "p", patientId: null, timezone: "America/Recife", source: "professional", guardianName: null, guardianEmail: null, guardianPhone: null, patientName: "X", amountCents: null, paymentStatus: "pending", paymentMethod: null, checkedInAt: null, completedAt: null, cancelledAt: null, cancelReason: null, createdAt: "", updatedAt: "" } as const;
  const mk = (id: string, time: string, status: string, checkedInAt: string | null = null) =>
    ({ ...base, id, startsAtLocal: `2031-05-10T${time}`, endsAtLocal: `2031-05-10T${time}`, status, checkedInAt }) as any;
  const nowMs = Date.parse("2031-05-10T13:30:00Z");
  const items = [
    mk("b", "09:00", "confirmed"),
    mk("a", "08:00", "requested"),
    mk("c", "11:00", "checked_in", "2031-05-10T13:05:00Z"),
    mk("d", "11:30", "in_care"),
    mk("e", "07:00", "completed"),
    mk("f", "10:00", "no_show"),
    mk("g", "15:00", "confirmed"),
    { ...mk("z", "09:00", "confirmed"), startsAtLocal: "2031-05-11T09:00" },
  ];
  const board = buildReceptionBoard(items, "2031-05-10", "2031-05-10T10:30", nowMs);
  assert.deepEqual(board.columns.arriving.map((i) => [i.appointment.id, i.late]), [["a", true], ["b", true], ["g", false]], "atrasada só se o horário passou no dia de hoje");
  assert.equal(board.columns.waiting[0].waitingMinutes, 25);
  assert.deepEqual(board.columns.in_care.map((i) => i.appointment.id), ["d"]);
  assert.deepEqual(board.columns.done.map((i) => i.appointment.id), ["e", "f"]);
  assert.equal(board.counts.total, 7, "consulta de outro dia ignorada");
  assert.equal(board.counts.late, 2);
  const otherDay = buildReceptionBoard(items, "2031-05-10", "2031-05-11T10:30", nowMs);
  assert.equal(otherDay.counts.late, 0, "em dia que não é hoje nada é marcado como atrasado");

  assert.equal(minutesSince(null, nowMs), null);
  assert.equal(minutesSince("lixo", nowMs), null);
  assert.equal(minutesSince("2031-05-10T14:00:00Z", nowMs), 0, "relógio adiantado não vira espera negativa");
  assert.equal(waitingLabel(5), "há 5 min");
  assert.equal(waitingLabel(60), "há 1 h");
  assert.equal(waitingLabel(80), "há 1 h 20 min");
  assert.equal(telHref("+55 (81) 99000-0001"), "tel:+5581990000001");
  assert.equal(telHref("123"), null);
  assert.equal(telHref(null), null);
  assert.equal(receptionDayKey("2031-05-10", null), "/api/operations?resource=day&date=2031-05-10");
  assert.equal(receptionDayKey("2031-05-10", "prof-a"), "/api/operations?resource=day&date=2031-05-10&provider=prof-a");
  assert.equal(receptionDayKey("2031-05-10", "x&provider=y"), "/api/operations?resource=day&date=2031-05-10", "id inseguro não vai à URL");
  assert.equal(shiftLocalDate("2031-03-01", -1), "2031-02-28");
  assert.equal(shiftLocalDate("2031-12-31", 1), "2032-01-01");
  // Ações oferecidas são um subconjunto das transições aceitas pelo servidor.
  const serverAllowed: Record<string, string[]> = {
    requested: ["confirmed", "cancelled", "no_show"],
    confirmed: ["checked_in", "cancelled", "no_show"],
    checked_in: ["in_care", "cancelled"],
    in_care: ["completed"],
  };
  for (const [status, actions] of Object.entries(RECEPTION_ACTIONS)) {
    for (const action of actions ?? []) {
      assert.ok(serverAllowed[status]?.includes(action.status), `${status} → ${action.status} precisa ser aceito pelo servidor`);
    }
  }
}

raw.close();
console.log("✓ recepção do dia: recorte exato do dia, redação para a recepção, escolha de profissional validada, isolamento, fluxo de balcão auditado, data inválida, limite do dia e quadro de chegada");
