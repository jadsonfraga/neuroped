/**
 * Ciclo 2: envio por e-mail da caixa de saída operacional (notification_outbox)
 * pelo transporte Resend existente (functions/api/auth/_mailTransport.ts).
 *
 * Harness real: db/schema.d1.sql + todas as migrações (inclui 0031), middleware
 * e handlers reais de /api/operations e /api/public-booking. Só o `fetch` do
 * Resend é substituído, para provar os três estados:
 *   - não configurado → manual/pending_provider intacto, nenhuma chamada;
 *   - enviado        → delivered/email, 1 tentativa;
 *   - falha          → tentativas contadas, `failed` no limite, sem laço.
 * Também prova texto pt-BR em America/Sao_Paulo, nome da clínica/profissional,
 * link público sem token e que nenhum destinatário aparece em log.
 *
 * Rodar: node --import tsx tests/unit/operations-notification-email.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequest as opsMiddleware } from "../../functions/api/operations/_middleware";
import { onRequestGet as opsGet, onRequestPost as opsPost } from "../../functions/api/operations/index";
import { onRequestPost as publicPost } from "../../functions/api/public-booking";
import {
  MAX_EMAIL_ATTEMPTS,
  formatPatientDateTime as fmt,
} from "../../functions/api/operations/_notificationDelivery";

// ── Captura de logs: nenhum destinatário pode aparecer ────────────────────
const logged: string[] = [];
for (const level of ["log", "info", "warn", "error", "debug"] as const) {
  const original = console[level].bind(console);
  console[level] = (...args: unknown[]) => {
    logged.push(args.map((item) => (item instanceof Error ? `${item.name}: ${item.message}` : typeof item === "string" ? item : JSON.stringify(item))).join(" "));
    if (level !== "error") original(...args);
  };
}

// ── 0. Formatação de data para a família ─────────────────────────────────
assert.equal(fmt("2026-10-02T14:00"), "sexta-feira, 02/10 às 14h00");
assert.equal(fmt("2026-10-03T09:05", "America/Recife"), "sábado, 03/10 às 09h05");
assert.equal(fmt("2026-10-02T13:00", "America/Manaus"), "sexta-feira, 02/10 às 14h00", "agenda em Manaus é mostrada no horário de Brasília");
assert.equal(fmt("2026-12-31T23:30", "America/Manaus"), "sexta-feira, 01/01 às 00h30");
assert.equal(fmt("inválido"), "inválido", "entrada inválida não some da mensagem");

// ── Banco real ────────────────────────────────────────────────────────────
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
const columns = (raw.prepare(`SELECT name FROM pragma_table_info('notification_outbox')`).all() as Array<{ name: string }>).map((row) => row.name);
for (const column of ["attempts", "last_attempt_at", "last_error"]) assert.ok(columns.includes(column), `0031 adiciona ${column}`);

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

const MAIL_ENV = {
  AUTH_PUBLIC_APP_URL: "https://app.neuroped.test/",
  AUTH_RESEND_API_KEY: "re_teste_sintetico",
  AUTH_EMAIL_FROM: "NeuroPed <agenda@neuroped.test>",
};
let mailEnv: Record<string, string> = {};
const env = () => ({ DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY, ...mailEnv });

// ── Fetch do Resend simulado ──────────────────────────────────────────────
type Sent = { url: string; headers: Record<string, string>; body: any };
const sent: Sent[] = [];
let resendMode: "ok" | "fail" | "throw" = "ok";
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  if (!url.startsWith("https://api.resend.com/")) return realFetch(input as never, init);
  sent.push({ url, headers: Object.fromEntries(new Headers(init?.headers).entries()), body: JSON.parse(String(init?.body)) });
  if (resendMode === "throw") throw new TypeError("network down");
  if (resendMode === "fail") return new Response(JSON.stringify({ message: "rejeitado" }), { status: 500 });
  return new Response(JSON.stringify({ id: "re_msg_1" }), { status: 200 });
}) as typeof fetch;

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
const sec = (body?: Record<string, unknown>) => call("sec-a", "operator", body);
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
const outboxFor = (appointmentId: string) =>
  raw.prepare(`SELECT * FROM notification_outbox WHERE appointment_id = ? ORDER BY created_at, rowid`).all(appointmentId) as Row[];
const lastOutbox = () => raw.prepare(`SELECT * FROM notification_outbox ORDER BY created_at DESC, rowid DESC LIMIT 1`).get() as Row;
const appointmentAt = (local: string) => (raw.prepare(`SELECT id FROM appointments WHERE starts_at_local = ?`).get(local) as Row).id as string;
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

// ── 1. NÃO CONFIGURADO: comportamento manual exatamente como antes ───────
{
  mailEnv = {};
  const created = await sec({
    action: "create_appointment", serviceId, startsAtLocal: `${D}T09:00`,
    guardianName: "Resp Manual", guardianEmail: "manual.familia@example.test", guardianPhone: "+5511999990001", patientName: "Criança Manual",
  });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const [row] = outboxFor(appointmentAt(`${D}T09:00`));
  assert.equal(row.channel, "manual");
  assert.equal(row.status, "pending_provider");
  assert.equal(row.attempts, 0, "sem transporte nenhuma tentativa é registrada");
  assert.equal(row.last_attempt_at, null);
  assert.equal(row.last_error, null);
  assert.equal(sent.length, 0, "sem transporte nenhuma chamada ao Resend");
  assert.equal(created.body.emailDelivery.active, false, "a Comunicação mostra envio manual");
  const note = created.body.notifications.find((item: any) => item.id === row.id);
  assert.equal(note.message, `Clínica Alfa agendou uma consulta com Dra. Alfa para ${fmt(`${D}T09:00`)}.`);
  assert.equal(note.recipient, "+5511999990001", "destinatário manual continua visível para a equipe");
  assert.equal(note.attempts, 0);
  const retry = await sec({ action: "notification_retry_email", id: row.id });
  assert.equal(retry.status, 409);
  assert.equal(retry.body.code, "EMAIL_NOT_CONFIGURED");
  // Chave sem remetente ou URL não liga o envio (fail-closed do transporte).
  mailEnv = { AUTH_RESEND_API_KEY: "re_x" };
  assert.equal((await sec()).body.emailDelivery.active, false);
}

// ── 2. CONFIGURADO + Resend OK: equipe cria → enviado ────────────────────
let sentApptId: string;
{
  mailEnv = { ...MAIL_ENV };
  resendMode = "ok";
  const before = sent.length;
  const created = await sec({
    action: "create_appointment", serviceId, startsAtLocal: `${D}T10:00`,
    guardianName: "Resp Email", guardianEmail: "familia.email@example.test", guardianPhone: "+5511999990002", patientName: "Criança Email",
  });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  sentApptId = appointmentAt(`${D}T10:00`);
  const [row] = outboxFor(sentApptId);
  assert.equal(row.status, "delivered");
  assert.equal(row.channel, "email");
  assert.equal(row.attempts, 1);
  assert.equal(row.last_error, null);
  assert.ok(row.last_attempt_at);
  assert.equal(sent.length, before + 1);
  const mail = sent.at(-1)!;
  assert.equal(mail.url, "https://api.resend.com/emails");
  assert.equal(mail.headers.authorization, "Bearer re_teste_sintetico");
  assert.deepEqual(mail.body.to, ["familia.email@example.test"], "vai para o e-mail do responsável, não para o telefone");
  assert.equal(mail.body.from, "NeuroPed <agenda@neuroped.test>");
  assert.equal(mail.body.subject, "Consulta agendada — Clínica Alfa");
  assert.ok(mail.body.text.startsWith(`Clínica Alfa agendou uma consulta com Dra. Alfa para ${fmt(`${D}T10:00`)}.`), mail.body.text);
  assert.doesNotMatch(mail.body.text, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "sem ISO cru no texto");
  assert.equal(created.body.emailDelivery.active, true);
  const note = created.body.notifications.find((item: any) => item.id === row.id);
  assert.equal(note.status, "delivered");
  assert.equal(note.attempts, 1);
  assert.equal(note.emailEligible, true);
  assert.ok(!String(row.recipient_encrypted).includes("familia.email"), "destinatário continua cifrado em repouso");
  const again = await sec({ action: "notification_retry_email", id: row.id });
  assert.equal(again.status, 409, "mensagem já entregue não é reenviada");
  assert.equal(sent.length, before + 1);
}

// Remarcação e cancelamento pela equipe; confirmação; status fora do escopo.
{
  const before = sent.length;
  const moved = await sec({ action: "appointment_reschedule", id: sentApptId, startsAtLocal: `${D}T15:00` });
  assert.equal(moved.status, 200, JSON.stringify(moved.body));
  const reschedule = outboxFor(sentApptId).find((row) => row.template === "appointment_rescheduled")!;
  assert.equal(reschedule.status, "delivered");
  assert.equal(sent.at(-1)!.body.subject, "Consulta remarcada — Clínica Alfa");
  assert.ok(sent.at(-1)!.body.text.includes(`de ${fmt(`${D}T10:00`)} para ${fmt(`${D}T15:00`)}`));

  const checkin = await sec({ action: "appointment_status", id: sentApptId, status: "checked_in" });
  assert.equal(checkin.status, 200);
  const checkinRow = outboxFor(sentApptId).find((row) => row.template === "appointment_checked_in")!;
  assert.equal(checkinRow.status, "pending_provider", "check-in não vai por e-mail");
  assert.equal(checkinRow.attempts, 0);
  assert.equal(sent.length, before + 1);

  const cancelled = await sec({ action: "appointment_status", id: sentApptId, status: "cancelled" });
  assert.equal(cancelled.status, 200);
  const cancelRow = outboxFor(sentApptId).find((row) => row.template === "appointment_cancelled")!;
  assert.equal(cancelRow.status, "delivered");
  assert.equal(sent.at(-1)!.body.subject, "Consulta cancelada — Clínica Alfa");
  assert.ok(sent.at(-1)!.body.text.includes(`Clínica Alfa cancelou a consulta com Dra. Alfa de ${fmt(`${D}T15:00`)}.`));
}

// ── 3. Fluxo do paciente: solicitação, remarcação, confirmação, cancelamento ─
{
  const before = sent.length;
  const booked = await pub({
    action: "book", provider: "dra-alfa", clinic: "clinica-alfa", serviceId, startsAtLocal: `${D}T11:00`,
    guardianName: "Resp Público", guardianEmail: "publico@example.test", guardianPhone: "11999998888",
    patientName: "Criança Pública", privacyAccepted: true,
  });
  assert.equal(booked.status, 201, JSON.stringify(booked.body));
  const token = booked.body.bookingToken as string;
  const apptId = booked.body.appointmentId as string;
  const [requested] = outboxFor(apptId);
  assert.equal(requested.template, "booking_requested");
  assert.equal(requested.status, "delivered");
  const mail = sent.at(-1)!;
  assert.equal(sent.length, before + 1);
  assert.deepEqual(mail.body.to, ["publico@example.test"]);
  assert.equal(mail.body.subject, "Solicitação de consulta recebida — Clínica Alfa");
  assert.ok(mail.body.text.includes(`com Dra. Alfa (Clínica Alfa) para ${fmt(`${D}T11:00`)}`), mail.body.text);
  assert.ok(mail.body.text.includes("https://app.neuroped.test/#/agendar?provider=dra-alfa&clinic=clinica-alfa"), "link da página pública de gestão");
  assert.ok(!mail.body.text.includes(token), "o código da reserva nunca vai no e-mail");

  const rescheduled = await pub({ action: "reschedule", token, startsAtLocal: `${D}T16:00` });
  assert.equal(rescheduled.status, 200, JSON.stringify(rescheduled.body));
  assert.equal(outboxFor(apptId).find((row) => row.template === "booking_rescheduled")!.status, "delivered");
  assert.equal(sent.at(-1)!.body.subject, "Remarcação solicitada — Clínica Alfa");
  assert.ok(sent.at(-1)!.body.text.includes(fmt(`${D}T16:00`)));

  const confirmed = await prof({ action: "appointment_status", id: apptId, status: "confirmed" });
  assert.equal(confirmed.status, 200);
  assert.equal(outboxFor(apptId).find((row) => row.template === "appointment_confirmed")!.status, "delivered");
  assert.equal(sent.at(-1)!.body.subject, "Consulta confirmada — Clínica Alfa");
  assert.ok(sent.at(-1)!.body.text.startsWith(`Sua consulta com Dra. Alfa (Clínica Alfa) de ${fmt(`${D}T16:00`)} está confirmada.`));

  const cancelled = await pub({ action: "cancel", token });
  assert.equal(cancelled.status, 200, JSON.stringify(cancelled.body));
  assert.equal(outboxFor(apptId).find((row) => row.template === "booking_cancelled")!.status, "delivered");
  assert.equal(sent.at(-1)!.body.subject, "Reserva cancelada — Clínica Alfa");
  assert.equal(sent.length, before + 4);
}

// ── 4. Sem e-mail do responsável: continua manual ─────────────────────────
{
  const before = sent.length;
  const created = await sec({
    action: "create_appointment", serviceId, startsAtLocal: `${D}T12:00`,
    guardianName: "Só Telefone", guardianPhone: "+5511999990003", patientName: "Criança Telefone",
  });
  assert.equal(created.status, 200);
  const [row] = outboxFor(appointmentAt(`${D}T12:00`));
  assert.equal(row.status, "pending_provider");
  assert.equal(row.channel, "manual");
  assert.equal(row.attempts, 0);
  assert.equal(sent.length, before);
  assert.equal(created.body.notifications.find((item: any) => item.id === row.id).emailEligible, false, "sem e-mail a UI não oferece envio por e-mail");
  const retry = await sec({ action: "notification_retry_email", id: row.id });
  assert.equal(retry.status, 409);
  assert.equal(retry.body.code, "NO_EMAIL");
  assert.equal((raw.prepare(`SELECT attempts FROM notification_outbox WHERE id = ?`).get(row.id) as Row).attempts, 0);
}

// ── 5. FALHA do Resend: tentativas contadas, limite, sem laço ─────────────
{
  resendMode = "fail";
  const before = sent.length;
  const created = await sec({
    action: "create_appointment", serviceId, startsAtLocal: `${D}T13:00`,
    guardianName: "Resp Falha", guardianEmail: "falha.familia@example.test", patientName: "Criança Falha",
  });
  assert.equal(created.status, 200, "falha de e-mail não derruba o agendamento");
  const id = outboxFor(appointmentAt(`${D}T13:00`))[0].id as string;
  const state = () => raw.prepare(`SELECT status, channel, attempts, last_error FROM notification_outbox WHERE id = ?`).get(id) as Row;
  assert.deepEqual({ ...state() }, { status: "pending_provider", channel: "manual", attempts: 1, last_error: "provider_error" });
  assert.equal(sent.length, before + 1);

  const tooSoon = await sec({ action: "notification_retry_email", id });
  assert.equal(tooSoon.status, 409, "reenvio imediato é barrado pela janela de 1 minuto");
  assert.equal(tooSoon.body.code, "NOT_ELIGIBLE");
  assert.equal(sent.length, before + 1);

  const age = () => raw.prepare(`UPDATE notification_outbox SET last_attempt_at = ? WHERE id = ?`).run(new Date(Date.now() - 120_000).toISOString(), id);
  resendMode = "throw";
  age();
  const second = await sec({ action: "notification_retry_email", id });
  assert.equal(second.status, 200);
  assert.deepEqual({ ...state() }, { status: "pending_provider", channel: "manual", attempts: 2, last_error: "provider_error" }, "erro de rede também conta tentativa");
  const note = second.body.notifications.find((item: any) => item.id === id);
  assert.equal(note.attempts, 2);
  assert.equal(note.lastError, "provider_error");

  resendMode = "fail";
  age();
  const third = await sec({ action: "notification_retry_email", id });
  assert.equal(third.status, 200);
  assert.equal(MAX_EMAIL_ATTEMPTS, 3);
  assert.deepEqual({ ...state() }, { status: "failed", channel: "manual", attempts: 3, last_error: "provider_error" }, "na última tentativa vira failed");

  age();
  const fourth = await sec({ action: "notification_retry_email", id });
  assert.equal(fourth.status, 409, "não tenta para sempre");
  assert.equal(sent.length, before + 3);

  const audit = raw.prepare(`SELECT metadata_json FROM operations_audit_log WHERE action = 'notification_retry_email' ORDER BY created_at, rowid`).all() as Row[];
  assert.deepEqual(audit.map((row) => JSON.parse(row.metadata_json).status), ["retry_pending", "failed"], "reenvio auditado com o resultado");

  // Depois da falha, a equipe ainda pode enviar manualmente.
  const manual = await sec({ action: "notification_status", id, status: "manual_sent" });
  assert.equal(manual.status, 200);
  assert.equal(state().status, "manual_sent");

  // Recuperação: falhou na criação, reenvio com Resend de volta entrega.
  resendMode = "fail";
  await sec({
    action: "create_appointment", serviceId, startsAtLocal: `${D}T14:00`,
    guardianName: "Resp Recupera", guardianEmail: "recupera.familia@example.test", patientName: "Criança Recupera",
  });
  const recoverId = outboxFor(appointmentAt(`${D}T14:00`))[0].id as string;
  raw.prepare(`UPDATE notification_outbox SET last_attempt_at = ? WHERE id = ?`).run(new Date(Date.now() - 120_000).toISOString(), recoverId);
  resendMode = "ok";
  const recovered = await sec({ action: "notification_retry_email", id: recoverId });
  assert.equal(recovered.status, 200);
  const recoveredRow = raw.prepare(`SELECT status, channel, attempts, last_error FROM notification_outbox WHERE id = ?`).get(recoverId) as Row;
  assert.deepEqual({ ...recoveredRow }, { status: "delivered", channel: "email", attempts: 2, last_error: null });
}

// ── 6. Isolamento: outra clínica não reenvia mensagem alheia ──────────────
{
  raw.prepare(`INSERT INTO users (id,name,email,role,is_active,created_at,updated_at) VALUES ('prof-b','Profissional Beta','prof-b@example.test','professional',1,?,?)`).run(now(), now());
  raw.prepare(`INSERT INTO clinics (id,slug,name,status,created_by_user_id,created_at,updated_at) VALUES ('clinic-beta','clinica-beta','Clínica Beta','active','prof-b',?,?)`).run(now(), now());
  raw.prepare(`INSERT INTO clinic_memberships (clinic_id,user_id,role,active,created_at,updated_at) VALUES ('clinic-beta','prof-b','owner',1,?,?)`).run(now(), now());
  const foreign = lastOutbox().id as string;
  const attempt = await call("prof-b", "professional", { action: "notification_retry_email", id: foreign });
  assert.equal(attempt.status, 404);
}

// ── 7. Nenhum destinatário em log ─────────────────────────────────────────
{
  const joined = logged.join("\n");
  for (const secret of ["manual.familia@", "familia.email@", "publico@example", "falha.familia@", "recupera.familia@", "5511999990", "11999998888"]) {
    assert.ok(!joined.includes(secret), `log não pode conter destinatário (${secret})`);
  }
  assert.ok(joined.includes("[mail] delivery failed"), "a falha é logada só com status");
}

globalThis.fetch = realFetch;
console.log(`operations-notification-email: não configurado manual, enviado, falha com limite de ${MAX_EMAIL_ATTEMPTS} tentativas, fluxo público e da equipe, pt-BR/Brasília e logs sem destinatário OK`);
