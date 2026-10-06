/**
 * Relatório financeiro da agenda por período, com CSV.
 *
 * Harness real: db/schema.d1.sql + todas as migrações, middleware e handler
 * reais de functions/api/operations (GET ?resource=financial_report). Sem mocks
 * de SQL. Cobre: totais por período (borda inclusiva), agrupamento por forma de
 * pagamento e por serviço, validação do período, recusa à recepção, isolamento
 * entre clínicas, forma de pagamento validada (com o legado `manual`), CSV
 * (BOM, separador, decimal, injeção de fórmula) e trilha da exportação sem PII.
 *
 * Rodar: node --import tsx tests/unit/operations-financial-report.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequest as opsMiddleware } from "../../functions/api/operations/_middleware";
import { onRequestGet as opsGet, onRequestPost as opsPost } from "../../functions/api/operations/index";
import { csvCell, csvMoney } from "../../functions/api/operations/_financialReport";
import { parseMoneyInput, periodError, presetPeriod, financialReportUrl } from "../../client/src/lib/financialPeriod";

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
}
function insertMembership(clinicId: string, userId: string, role: string) {
  raw.prepare(
    `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)`,
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
  `INSERT INTO booking_staff_links (provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at)
   VALUES ('prof-a', 'sec-a', 1, 'prof-a', ?, ?)`,
).run(now(), now());

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
  // `Response.text()` remove o BOM; o navegador baixa os bytes (blob) com ele.
  const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(await response.arrayBuffer());
  const isJson = (response.headers.get("content-type") ?? "").includes("application/json");
  return { status: response.status, headers: response.headers, text, body: isJson && text ? JSON.parse(text) : null };
}
const post = (userId: string, role: string, body: Record<string, unknown>) => call(userId, role, { body });
const report = (userId: string, role: string, from: string, to: string, format?: "csv") =>
  call(userId, role, { query: `resource=financial_report&from=${from}&to=${to}${format ? `&format=${format}` : ""}` });

type Row = Record<string, any>;
const idAt = (startsAtLocal: string) =>
  (raw.prepare(`SELECT id FROM appointments WHERE starts_at_local = ?`).get(startsAtLocal) as Row).id as string;

// ── Preparação: dois serviços, consultas em março (borda 01 e 31) e fora ────
for (const service of [
  { name: "Consulta", durationMinutes: 60, priceCents: 80000 },
  { name: "Retorno", durationMinutes: 30, priceCents: 40000 },
]) {
  const created = await post("prof-a", "professional", { action: "create_service", ...service });
  assert.equal(created.status, 200, JSON.stringify(created.body));
}
const consulta = (raw.prepare(`SELECT id FROM booking_services WHERE name = 'Consulta' AND clinic_id = 'clinic-alfa'`).get() as Row).id;
const retorno = (raw.prepare(`SELECT id FROM booking_services WHERE name = 'Retorno' AND clinic_id = 'clinic-alfa'`).get() as Row).id;

const seeds: Array<[string, string, string]> = [
  ["2031-03-01T00:00", consulta, "Ana Sintética"], // borda inicial
  ["2031-03-10T09:00", consulta, "=HYPERLINK(\"http://x\")"], // nome hostil
  ["2031-03-10T11:00", retorno, "Clara Sintética"],
  ["2031-03-15T09:00", consulta, "Davi Sintético"],
  ["2031-03-20T09:00", consulta, "Eva Sintética"],
  ["2031-03-25T09:00", retorno, "Fábio Sintético"],
  ["2031-03-31T23:00", retorno, "Gabi Sintética"], // borda final
  ["2031-04-01T00:00", consulta, "Fora do Período"], // dia seguinte ao fim
  ["2031-02-28T23:30", retorno, "Fora Antes"],
];
for (const [startsAtLocal, serviceId, patientName] of seeds) {
  const created = await post("prof-a", "professional", {
    action: "create_appointment",
    serviceId,
    startsAtLocal,
    patientName,
    guardianName: `Resp. ${patientName.slice(0, 10)}`,
  });
  assert.equal(created.status, 200, `${startsAtLocal}: ${JSON.stringify(created.body)}`);
}

// Pagamentos e estados.
const pay = (startsAtLocal: string, paymentStatus: string, paymentMethod: string | null, amountCents?: number | null) =>
  post("prof-a", "professional", { action: "appointment_payment", id: idAt(startsAtLocal), paymentStatus, paymentMethod, amountCents });

assert.equal((await pay("2031-03-01T00:00", "paid", "pix")).status, 200);
assert.equal((await pay("2031-03-10T09:00", "paid", "cash", 75000)).status, 200, "valor ajustado no pagamento");
assert.equal((await pay("2031-03-10T11:00", "paid", "pix")).status, 200);
assert.equal((await pay("2031-03-15T09:00", "refunded", "credit_card")).status, 200);
assert.equal((await pay("2031-03-25T09:00", "waived", null)).status, 200);
assert.equal((await pay("2031-04-01T00:00", "paid", "pix")).status, 200, "fora do período, mas pago");

// Forma de pagamento: lista fechada + legado `manual`.
{
  const invalid = await pay("2031-03-31T23:00", "paid", "cheque-voador");
  assert.equal(invalid.status, 400, "forma fora da lista é recusada");
  assert.equal(invalid.body.code, "VALIDATION_ERROR");
  const legacy = await pay("2031-03-31T23:00", "paid", "manual");
  assert.equal(legacy.status, 200, "o valor gravado pela tela antiga continua aceito");
  const entry = raw.prepare(`SELECT metadata_json FROM operations_audit_log WHERE action = 'appointment_payment' ORDER BY created_at DESC, rowid DESC LIMIT 1`).get() as Row;
  assert.deepEqual(JSON.parse(entry.metadata_json), { paymentStatus: "paid", paymentMethod: "manual" }, "auditoria guarda a forma, nunca valores ou nomes");
}

// Estados: 20/03 falta, 15/03 cancelada (estornada), 10/03 09h concluída.
{
  const id20 = idAt("2031-03-20T09:00");
  assert.equal((await post("prof-a", "professional", { action: "appointment_status", id: id20, status: "no_show" })).status, 200);
  const id15 = idAt("2031-03-15T09:00");
  assert.equal((await post("prof-a", "professional", { action: "appointment_status", id: id15, status: "cancelled" })).status, 200);
  const id10 = idAt("2031-03-10T09:00");
  for (const status of ["checked_in", "in_care", "completed"]) {
    assert.equal((await post("prof-a", "professional", { action: "appointment_status", id: id10, status })).status, 200, status);
  }
}

// ── 1. Totais do período (bordas inclusivas, fora do período excluído) ──────
{
  const result = await report("prof-a", "professional", "2031-03-01", "2031-03-31");
  assert.equal(result.status, 200, result.text);
  const body = result.body;
  assert.deepEqual(body.period, { from: "2031-03-01", to: "2031-03-31", basis: "appointment_date" });
  assert.equal(body.rows.length, 7, "01/03 00:00 e 31/03 23:00 entram; 28/02 e 01/04 não");
  assert.equal(body.truncated, false);
  assert.deepEqual(body.summary, {
    appointments: 7,
    attended: 5, // 7 − falta − cancelada
    completed: 1,
    cancelled: 1,
    noShow: 1,
    // 01/03 800 + 10/03 750 + 10/03 400 + 25/03 400 + 31/03 400
    expectedCents: 80000 + 75000 + 40000 + 40000 + 40000,
    // pagos: 01/03 pix 800 + 10/03 dinheiro 750 + 10/03 pix 400 + 31/03 manual 400
    paidCents: 80000 + 75000 + 40000 + 40000,
    pendingCents: 0,
    refundedCents: 80000,
    waivedCount: 1,
    noAmountCount: 0,
  });
  assert.deepEqual(
    body.byPaymentMethod.map((g: any) => [g.key, g.label, g.count, g.cents]),
    [
      ["pix", "Pix", 2, 120000],
      ["cash", "Dinheiro", 1, 75000],
      ["manual", "Não detalhada (registro anterior)", 1, 40000],
    ],
  );
  assert.deepEqual(
    body.byService.map((g: any) => [g.label, g.count, g.cents]),
    [
      ["Consulta", 2, 155000],
      ["Retorno", 3, 80000],
    ],
    "por serviço: só consultas não canceladas/faltas; recebido só das pagas",
  );
  const hostile = body.rows.find((r: any) => r.startsAtLocal === "2031-03-10T09:00");
  assert.equal(hostile.patientName, "=HYPERLINK(\"http://x\")", "JSON devolve o nome decifrado como está");
  assert.equal(hostile.paymentMethod, "cash");
}

// ── 2. Pendente conta em "a receber"; consulta sem valor é sinalizada ───────
{
  const pendingDay = await report("prof-a", "professional", "2031-03-20", "2031-03-31");
  // 20/03 falta (não conta), 25/03 cortesia, 31/03 pago.
  assert.equal(pendingDay.body.summary.pendingCents, 0);
  const created = await post("prof-a", "professional", { action: "create_appointment", serviceId: retorno, startsAtLocal: "2031-03-28T10:00", patientName: "Hugo" });
  assert.equal(created.status, 200);
  const noValue = await pay("2031-03-28T10:00", "pending", null, null);
  assert.equal(noValue.status, 200);
  raw.prepare(`UPDATE appointments SET amount_cents = NULL WHERE starts_at_local = '2031-03-28T10:00'`).run();
  const created2 = await post("prof-a", "professional", { action: "create_appointment", serviceId: consulta, startsAtLocal: "2031-03-29T10:00", patientName: "Íris" });
  assert.equal(created2.status, 200);
  const after = await report("prof-a", "professional", "2031-03-20", "2031-03-31");
  assert.equal(after.body.summary.pendingCents, 80000, "consulta pendente com valor entra em a receber");
  assert.equal(after.body.summary.noAmountCount, 1, "consulta sem valor registrado é contada à parte");
}

// ── 3. Período inválido ─────────────────────────────────────────────────────
for (const [from, to, code] of [
  ["2031-03-31", "2031-03-01", "VALIDATION_ERROR"],
  ["2031-02-30", "2031-03-01", "VALIDATION_ERROR"],
  ["", "2031-03-01", "VALIDATION_ERROR"],
  ["2030-01-01", "2031-01-02", "PERIOD_TOO_LONG"],
] as const) {
  const result = await report("prof-a", "professional", from, to);
  assert.equal(result.status, 400, `${from}..${to}`);
  assert.equal(result.body.code, code, `${from}..${to}`);
}
assert.equal((await report("prof-a", "professional", "2031-03-01", "2032-02-29")).status, 200, "exatamente 366 dias é aceito");
assert.equal((await report("prof-a", "professional", "2031-03-01", "2032-03-01")).body.code, "PERIOD_TOO_LONG", "367 dias não");

// ── 4. Recepção não recebe o financeiro ─────────────────────────────────────
{
  const denied = await report("sec-a", "operator", "2031-03-01", "2031-03-31");
  assert.equal(denied.status, 403);
  assert.equal(denied.body.code, "FORBIDDEN");
  const deniedCsv = await report("sec-a", "operator", "2031-03-01", "2031-03-31", "csv");
  assert.equal(deniedCsv.status, 403, "nem o CSV");
  const dashboard = await call("sec-a", "operator");
  assert.equal(dashboard.status, 200, "o painel da recepção segue funcionando");
  assert.ok(dashboard.body.appointments.every((a: any) => a.paymentMethod === null && a.amountCents === null), "painel da recepção segue redigido");
}

// ── 5. Isolamento: outra clínica não vê nada ────────────────────────────────
{
  const other = await report("prof-b", "professional", "2031-03-01", "2031-03-31");
  assert.equal(other.status, 200);
  assert.equal(other.body.rows.length, 0, "relatório de outra clínica não vaza consultas");
  assert.equal(other.body.summary.paidCents, 0);
}

// ── 6. CSV: formato, injeção de fórmula, trilha sem PII ─────────────────────
{
  const before = (raw.prepare(`SELECT COUNT(*) AS n FROM operations_audit_log WHERE action = 'financial_report_export'`).get() as Row).n;
  assert.equal(before, 0, "consultar o JSON não registra exportação");
  const csv = await report("prof-a", "professional", "2031-03-01", "2031-03-31", "csv");
  assert.equal(csv.status, 200, csv.text);
  assert.match(csv.headers.get("content-type") ?? "", /^text\/csv; charset=utf-8/);
  assert.equal(csv.headers.get("content-disposition"), 'attachment; filename="financeiro-2031-03-01_a_2031-03-31.csv"');
  assert.equal(csv.headers.get("cache-control"), "no-store");
  assert.ok(csv.text.startsWith("\uFEFF"), "BOM UTF-8 para o Excel em pt-BR");
  const lines = csv.text.slice(1).trimEnd().split("\r\n");
  assert.equal(lines[0], '"Data";"Hora";"Paciente";"Responsável";"Serviço";"Situação da consulta";"Valor (R$)";"Pagamento";"Forma de pagamento"');
  assert.equal(lines.length, 1 + 9, "cabeçalho + 9 consultas de março (7 + 2 criadas no passo 2)");
  assert.equal(lines[1], '"01/03/2031";"00:00";"Ana Sintética";"Resp. Ana Sintét";"Consulta";"confirmada";"800,00";"pago";"Pix"');
  const hostile = lines.find((line) => line.includes("HYPERLINK"))!;
  assert.ok(hostile.includes(`"'=HYPERLINK(""http://x"")"`), `fórmula neutralizada e aspas dobradas: ${hostile}`);
  assert.ok(hostile.includes('"750,00";"pago";"Dinheiro"'));
  const refunded = lines.find((line) => line.startsWith('"15/03/2031"'))!;
  assert.ok(refunded.endsWith('"cancelada";"800,00";"estornado";""'), `forma só aparece quando pago: ${refunded}`);
  const audits = raw.prepare(`SELECT * FROM operations_audit_log WHERE action = 'financial_report_export'`).all() as Row[];
  assert.equal(audits.length, 1, "exportação registrada uma vez");
  assert.equal(audits[0].actor_user_id, "prof-a");
  assert.equal(audits[0].clinic_id, "clinic-alfa");
  assert.equal(audits[0].target_id, "2031-03-01_2031-03-31");
  assert.deepEqual(JSON.parse(audits[0].metadata_json), { count: 9 }, "trilha só com a contagem");
  assert.ok(!JSON.stringify(audits[0]).includes("Sintética"), "nenhum nome na trilha");
}

// ── 7. Funções puras ────────────────────────────────────────────────────────
assert.equal(csvMoney(80000), "800,00");
assert.equal(csvMoney(5), "0,05");
assert.equal(csvMoney(null), "");
assert.equal(csvCell("+55 87 9999"), `"'+55 87 9999"`);
assert.equal(csvCell("-1"), `"'-1"`);
assert.equal(csvCell("@cmd"), `"'@cmd"`);
assert.equal(csvCell("Ana"), `"Ana"`);
assert.equal(csvCell(null), `""`);
assert.deepEqual(presetPeriod("this_month", "2031-02-14"), { from: "2031-02-01", to: "2031-02-28" });
assert.deepEqual(presetPeriod("this_month", "2032-02-14"), { from: "2032-02-01", to: "2032-02-29" }, "bissexto");
assert.deepEqual(presetPeriod("last_month", "2031-01-10"), { from: "2030-12-01", to: "2030-12-31" }, "virada de ano");
assert.deepEqual(presetPeriod("last_30", "2031-03-10"), { from: "2031-02-09", to: "2031-03-10" });
assert.equal(periodError({ from: "2031-03-01", to: "2031-03-31" }), null);
assert.match(periodError({ from: "2031-03-31", to: "2031-03-01" }) ?? "", /anterior/);
assert.match(periodError({ from: "2030-01-01", to: "2031-01-02" }) ?? "", /366/);
assert.equal(parseMoneyInput("150"), 15000);
assert.equal(parseMoneyInput("150,5"), 15050);
assert.equal(parseMoneyInput("1.500,00"), 150000);
assert.equal(parseMoneyInput("150.50"), 15050);
assert.equal(parseMoneyInput("R$ 80,00"), 8000);
assert.equal(parseMoneyInput(""), null);
assert.equal(parseMoneyInput("abc"), undefined);
assert.equal(parseMoneyInput("-10"), undefined);
assert.equal(
  financialReportUrl({ from: "2031-03-01", to: "2031-03-31" }, "csv"),
  "/api/operations?resource=financial_report&from=2031-03-01&to=2031-03-31&format=csv",
);

raw.close();
console.log("✓ relatório financeiro: totais por período com bordas, por forma e serviço, período validado, recepção recusada, isolamento por clínica, forma de pagamento validada e CSV seguro com trilha sem PII");
