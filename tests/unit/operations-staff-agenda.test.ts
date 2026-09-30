/**
 * Ciclo 1 (agenda operada pela equipe): remarcação pela equipe, notificação
 * na caixa de saída quando a equipe cria/remarca/cancela, e bloqueio de dia
 * inteiro com rótulo (ex.: feriado).
 *
 * Harness real: db/schema.d1.sql + todas as migrações, middleware e handlers
 * reais de functions/api/operations e functions/api/public-booking. Sem mocks
 * de SQL; triggers de conflito e locks de horário são os de produção.
 *
 * Rodar: node --import tsx tests/unit/operations-staff-agenda.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequest as opsMiddleware } from "../../functions/api/operations/_middleware";
import { onRequestGet as opsGet, onRequestPost as opsPost } from "../../functions/api/operations/index";
import { onRequestGet as publicGet } from "../../functions/api/public-booking";
import { formatPatientDateTime as fmt } from "../../functions/api/operations/_notificationDelivery";

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

let beforeRun: ((sql: string) => void) | null = null;

function makeDb(database: DatabaseSync): D1Database {
  const prepare = (sql: string) => {
    const make = (args: unknown[]) => ({
      async first<T>() {
        return (database.prepare(sql).get(...(args as never[])) as T | undefined) ?? null;
      },
      async run() {
        beforeRun?.(sql);
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
    `INSERT INTO users (id, name, email, role, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
  ).run(id, name, `${id}@example.test`, role, now(), now());
}
function insertClinic(id: string, slug: string, createdBy: string) {
  raw.prepare(
    `INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at)
     VALUES (?, ?, ?, 'active', ?, ?, ?)`,
  ).run(id, slug, `Clínica ${slug}`, createdBy, now(), now());
}
function insertMembership(clinicId: string, userId: string, role: string) {
  raw.prepare(
    `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?)`,
  ).run(clinicId, userId, role, now(), now());
}

insertUser("prof-a", "Profissional Alfa", "professional");
insertUser("prof-b", "Profissional Beta", "professional");
insertUser("sec-a", "Secretária Alfa", "operator");
insertClinic("clinic-alfa", "clinica-alfa", "prof-a");
insertClinic("clinic-beta", "clinica-beta", "prof-b");
insertMembership("clinic-alfa", "prof-a", "owner");
insertMembership("clinic-beta", "prof-b", "owner");
insertMembership("clinic-alfa", "sec-a", "assistant");
raw.prepare(
  `INSERT INTO booking_staff_links
     (provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at)
   VALUES ('prof-a', 'sec-a', 1, 'prof-a', ?, ?)`,
).run(now(), now());

async function call(userId: string, role: string, body?: Record<string, unknown>) {
  const method = body ? "POST" : "GET";
  const context = {
    request: new Request("https://neuroped.test/api/operations", {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
    data: { authUser: { id: userId, email: `${userId}@example.test`, name: userId, role, mustChangePassword: false } },
  } as any;
  context.next = async () => (method === "GET" ? opsGet(context) : opsPost(context));
  const response = await opsMiddleware(context);
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}
const prof = (body?: Record<string, unknown>) => call("prof-a", "professional", body);
const sec = (body?: Record<string, unknown>) => call("sec-a", "operator", body);
const profB = (body?: Record<string, unknown>) => call("prof-b", "professional", body);

function dayOffset(days: number): string {
  return new Date(Date.now() + days * 24 * 3600 * 1000).toISOString().slice(0, 10);
}
const D1 = dayOffset(20);
const D2 = dayOffset(21);
const D3 = dayOffset(22);

type Row = Record<string, any>;
const appointment = (id: string) => raw.prepare(`SELECT * FROM appointments WHERE id = ?`).get(id) as Row;
const locks = (id: string) =>
  (raw.prepare(`SELECT slot_key FROM appointment_slot_locks WHERE appointment_id = ? ORDER BY slot_key`).all(id) as Row[])
    .map((row) => String(row.slot_key));
const outbox = () => raw.prepare(`SELECT * FROM notification_outbox ORDER BY created_at, rowid`).all() as Row[];
const audit = (action: string) =>
  raw.prepare(`SELECT * FROM operations_audit_log WHERE action = ? ORDER BY created_at, rowid`).all(action) as Row[];

// ── Preparação: serviço de 60 min, regras em todos os dias, perfil público ──
{
  const created = await prof({ action: "create_service", name: "Consulta", durationMinutes: 60, priceCents: 80000 });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const rule = await prof({ action: "create_rule", weekday, startMinute: 480, endMinute: 720, slotMinutes: 60 });
    assert.equal(rule.status, 200);
  }
  const profile = await prof({
    action: "upsert_profile",
    displayName: "Dra. Alfa",
    specialty: "Neuropediatria",
    slug: "dra-alfa",
    timezone: "America/Recife",
    bookingEnabled: true,
  });
  assert.equal(profile.status, 200, JSON.stringify(profile.body));
}
const serviceId = (raw.prepare(`SELECT id FROM booking_services WHERE clinic_id = 'clinic-alfa'`).get() as Row).id as string;

// ── 1. Equipe cria consulta → notificação pendente na caixa de saída ────────
let firstId = "";
{
  const created = await sec({
    action: "create_appointment",
    serviceId,
    startsAtLocal: `${D1}T10:00`,
    guardianName: "Responsável Sintético",
    guardianPhone: "+5587999990000",
    patientName: "Criança Sintética",
  });
  assert.equal(created.status, 200, `recepção cria consulta: ${JSON.stringify(created.body)}`);
  firstId = (raw.prepare(`SELECT id FROM appointments WHERE starts_at_local = ?`).get(`${D1}T10:00`) as Row).id;
  const queued = outbox().filter((row) => row.appointment_id === firstId);
  assert.equal(queued.length, 1, "criação pela equipe enfileira exatamente uma notificação");
  assert.equal(queued[0].template, "appointment_created");
  assert.equal(queued[0].channel, "manual", "sem provedor externo o canal continua manual");
  assert.equal(queued[0].status, "pending_provider", "sem provedor externo a mensagem fica pendente");
  assert.equal(queued[0].clinic_id, "clinic-alfa");
  assert.ok(!String(queued[0].recipient_encrypted).includes("5587999990000"), "destinatário cifrado em repouso");
  const dashboard = await sec();
  const note = dashboard.body.notifications.find((item: any) => item.appointmentId === firstId);
  assert.equal(note.recipient, "+5587999990000", "destinatário decifrado para a equipe");
  assert.ok(note.message.includes(fmt(`${D1}T10:00`)), note.message);
}

// ── 2. Recepção remarca: horário, duração, locks, auditoria e notificação ──
{
  const locksBefore = locks(firstId);
  assert.ok(locksBefore.length > 0);
  const moved = await sec({ action: "appointment_reschedule", id: firstId, startsAtLocal: `${D1}T14:00` });
  assert.equal(moved.status, 200, `recepção remarca: ${JSON.stringify(moved.body)}`);
  const row = appointment(firstId);
  assert.equal(row.starts_at_local, `${D1}T14:00`);
  assert.equal(row.ends_at_local, `${D1}T15:00`, "duração do serviço preservada");
  assert.equal(row.status, "confirmed", "remarcação pela equipe não rebaixa o status");
  const locksAfter = locks(firstId);
  assert.equal(locksAfter.length, locksBefore.length, "mesma quantidade de locks para a mesma duração");
  assert.ok(locksAfter.every((key) => !locksBefore.includes(key)), "locks antigos liberados");
  assert.ok(locksAfter.every((key) => key.includes(`${D1}T14`)), "locks novos no novo horário");

  const entries = audit("appointment_reschedule");
  assert.equal(entries.length, 1, "remarcação auditada");
  assert.equal(entries[0].actor_user_id, "sec-a", "auditoria registra quem remarcou");
  assert.equal(entries[0].target_id, firstId);
  assert.equal(entries[0].clinic_id, "clinic-alfa");
  assert.deepEqual(JSON.parse(entries[0].metadata_json), { status: "rescheduled", source: "operator" });

  const queued = outbox().filter((item) => item.appointment_id === firstId && item.template === "appointment_rescheduled");
  assert.equal(queued.length, 1, "remarcação enfileira notificação");
  assert.equal(queued[0].status, "pending_provider");
  const dashboard = await sec();
  const note = dashboard.body.notifications.find((item: any) => item.template === "appointment_rescheduled");
  assert.equal(note.recipient, "+5587999990000");
  assert.ok(note.message.includes(`de ${fmt(`${D1}T10:00`)} para ${fmt(`${D1}T14:00`)}`), note.message);
  assert.equal(dashboard.body.audit.some((item: any) => item.action === "appointment_reschedule"), true);
}

// ── 3. Conflitos: outra consulta ou bloqueio recusam sem efeito colateral ──
{
  const second = await prof({ action: "create_appointment", serviceId, startsAtLocal: `${D1}T16:00`, patientName: "Outra" });
  assert.equal(second.status, 200);
  const block = await prof({ action: "create_block", startsAtLocal: `${D1}T18:00`, endsAtLocal: `${D1}T19:00`, reason: "Reunião" });
  assert.equal(block.status, 200);

  const snapshotLocks = locks(firstId);
  const snapshotOutbox = outbox().length;
  const snapshotAudit = audit("appointment_reschedule").length;
  for (const target of [`${D1}T16:30`, `${D1}T15:30`, `${D1}T18:00`, `${D1}T17:30`]) {
    const clash = await sec({ action: "appointment_reschedule", id: firstId, startsAtLocal: target });
    assert.equal(clash.status, 409, `conflito em ${target} deve ser 409: ${JSON.stringify(clash.body)}`);
    assert.ok(["SLOT_CONFLICT", "SCHEDULE_CONFLICT"].includes(clash.body.code), clash.body.code);
    assert.equal(appointment(firstId).starts_at_local, `${D1}T14:00`, "consulta não se move em conflito");
    assert.deepEqual(locks(firstId), snapshotLocks, "locks preservados após conflito (batch atômico)");
  }
  assert.equal(outbox().length, snapshotOutbox, "conflito não enfileira notificação");
  assert.equal(audit("appointment_reschedule").length, snapshotAudit, "conflito não gera auditoria de sucesso");
}

// ── 4. Validações e fronteira de clínica ────────────────────────────────────
{
  const past = await sec({ action: "appointment_reschedule", id: firstId, startsAtLocal: "2020-01-01T10:00" });
  assert.equal(past.status, 400, "horário no passado recusado");
  const same = await sec({ action: "appointment_reschedule", id: firstId, startsAtLocal: `${D1}T14:00` });
  assert.equal(same.status, 400, "mesmo horário recusado");
  const invalid = await sec({ action: "appointment_reschedule", id: firstId, startsAtLocal: "amanhã" });
  assert.equal(invalid.status, 400, "data inválida recusada");
  const ghost = await sec({ action: "appointment_reschedule", id: "apt-inexistente", startsAtLocal: `${D1}T11:00` });
  assert.equal(ghost.status, 404);
  const crossClinic = await profB({ action: "appointment_reschedule", id: firstId, startsAtLocal: `${D1}T11:00` });
  assert.equal(crossClinic.status, 404, "outra clínica não alcança a consulta");
  assert.equal(appointment(firstId).starts_at_local, `${D1}T14:00`);
}

// ── 5. Corrida: estado muda entre a leitura e o batch → 409 sem efeito ─────
{
  const locksBefore = locks(firstId);
  const outboxBefore = outbox().length;
  let injected = false;
  beforeRun = (sql) => {
    if (!injected && sql.includes("SET starts_at_local = ?, ends_at_local = ?, updated_at = ?")) {
      injected = true;
      raw.prepare(`UPDATE appointments SET status = 'checked_in' WHERE id = ?`).run(firstId);
    }
  };
  try {
    const stale = await sec({ action: "appointment_reschedule", id: firstId, startsAtLocal: `${D1}T11:00` });
    assert.equal(injected, true, "a corrida foi realmente injetada");
    assert.equal(stale.status, 409);
    assert.equal(stale.body.code, "STALE_APPOINTMENT");
  } finally {
    beforeRun = null;
  }
  assert.equal(appointment(firstId).starts_at_local, `${D1}T14:00`, "consulta não se move em corrida");
  assert.deepEqual(locks(firstId), locksBefore, "locks nem liberados nem duplicados na corrida");
  assert.equal(outbox().length, outboxBefore, "corrida não enfileira notificação");

  const checkedIn = await sec({ action: "appointment_reschedule", id: firstId, startsAtLocal: `${D1}T11:00` });
  assert.equal(checkedIn.status, 409, "consulta com check-in não é remarcada");
  assert.equal(checkedIn.body.code, "INVALID_TRANSITION");
  raw.prepare(`UPDATE appointments SET status = 'confirmed' WHERE id = ?`).run(firstId);
}

// ── 6. Profissional também remarca (origem registrada na auditoria) ─────────
{
  const moved = await prof({ action: "appointment_reschedule", id: firstId, startsAtLocal: `${D1}T09:00` });
  assert.equal(moved.status, 200, JSON.stringify(moved.body));
  const last = audit("appointment_reschedule").at(-1)!;
  assert.equal(last.actor_user_id, "prof-a");
  assert.deepEqual(JSON.parse(last.metadata_json), { status: "rescheduled", source: "professional" });
}

// ── 7. Cancelamento pela equipe → notificação em pt-BR ──────────────────────
{
  const cancelled = await sec({ action: "appointment_status", id: firstId, status: "cancelled" });
  assert.equal(cancelled.status, 200);
  const queued = outbox().filter((item) => item.appointment_id === firstId && item.template === "appointment_cancelled");
  assert.equal(queued.length, 1, "cancelamento pela equipe enfileira notificação");
  assert.equal(queued[0].status, "pending_provider");
  const dashboard = await sec();
  const note = dashboard.body.notifications.find((item: any) => item.template === "appointment_cancelled");
  assert.equal(note.message, `Clínica clinica-alfa cancelou a consulta com Dra. Alfa de ${fmt(`${D1}T09:00`)}.`);
  assert.equal(note.recipient, "+5587999990000");
  assert.deepEqual(locks(firstId), [], "cancelamento libera os locks");
  const again = await sec({ action: "appointment_reschedule", id: firstId, startsAtLocal: `${D1}T11:00` });
  assert.equal(again.status, 409, "consulta cancelada não é remarcada");
}

// ── 8. Bloqueio de dia inteiro com rótulo ───────────────────────────────────
{
  const slots = async (date: string) => {
    const response = await publicGet({
      request: new Request(`https://neuroped.test/api/public-booking?action=slots&provider=dra-alfa&service=${serviceId}&date=${date}`),
      env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
    } as never);
    const body = await response.json() as any;
    assert.equal(body.bookingEnabled, true, JSON.stringify(body));
    return body.slots as Array<{ startsAtLocal: string }>;
  };
  assert.equal((await slots(D2)).length, 4, "antes do bloqueio o dia tem as 4 vagas da regra 08–12");

  const denied = await sec({ action: "create_day_block", date: D2, reason: "Feriado" });
  assert.equal(denied.status, 403, "recepção não configura bloqueios (mesma política de create_block)");
  const noLabel = await prof({ action: "create_day_block", date: D2, reason: "   " });
  assert.equal(noLabel.status, 400, "rótulo obrigatório");
  const badDate = await prof({ action: "create_day_block", date: "2026-02-30", reason: "Feriado" });
  assert.equal(badDate.status, 400, "data inexistente recusada");

  const blocked = await prof({ action: "create_day_block", date: D2, reason: "Feriado municipal" });
  assert.equal(blocked.status, 200, JSON.stringify(blocked.body));
  const row = raw.prepare(`SELECT * FROM booking_blocks WHERE reason = 'Feriado municipal'`).get() as Row;
  assert.equal(row.starts_at_local, `${D2}T00:00`);
  assert.equal(row.ends_at_local, `${D3}T00:00`, "cobre até 00:00 do dia seguinte");
  assert.equal(row.clinic_id, "clinic-alfa");
  assert.equal(row.provider_user_id, "prof-a");
  const dashboard = await prof();
  assert.equal(dashboard.body.blocks.some((item: any) => item.reason === "Feriado municipal"), true);
  const entry = audit("create_day_block").at(-1)!;
  assert.equal(entry.actor_user_id, "prof-a");
  assert.deepEqual(JSON.parse(entry.metadata_json), { status: "full_day" });

  assert.deepEqual(await slots(D2), [], "dia bloqueado sem vagas públicas");
  assert.equal((await slots(D3)).length, 4, "dia seguinte intacto");

  const onBlockedDay = await sec({ action: "create_appointment", serviceId, startsAtLocal: `${D2}T15:00`, patientName: "X" });
  assert.equal(onBlockedDay.status, 409, "nenhuma consulta nova no dia bloqueado");
  const second = raw.prepare(`SELECT id FROM appointments WHERE starts_at_local = ?`).get(`${D1}T16:00`) as Row;
  const moveInto = await sec({ action: "appointment_reschedule", id: second.id, startsAtLocal: `${D2}T23:00` });
  assert.equal(moveInto.status, 409, "remarcar para o dia bloqueado é recusado");

  const busyDay = await prof({ action: "create_day_block", date: D1, reason: "Feriado" });
  assert.equal(busyDay.status, 409, "dia com consulta ativa não pode ser bloqueado");
  assert.equal(busyDay.body.code, "SCHEDULE_CONFLICT");

  const crossClinic = await profB();
  assert.deepEqual(crossClinic.body.blocks, [], "bloqueio de dia inteiro não vaza para outra clínica");

  const removed = await prof({ action: "delete_block", id: row.id });
  assert.equal(removed.status, 200, "bloqueio de dia inteiro removível pelo mecanismo existente");
  assert.equal((await slots(D2)).length, 4);
}

// ── 9. Nada foi despachado: toda a caixa de saída segue manual/pendente ────
assert.ok(outbox().every((row) => row.channel === "manual" && row.status === "pending_provider"));

raw.close();
console.log("✓ agenda da equipe: remarcação com locks/auditoria/corrida, notificações pendentes ao criar/remarcar/cancelar e bloqueio de dia inteiro isolado por clínica");
