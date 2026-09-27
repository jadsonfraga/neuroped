/**
 * AUTHZ-P1-04 (docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md): a recepção
 * delegada (papel global `operator`, vinculada a um profissional em
 * `booking_staff_links`) nunca alcançava a agenda. O handler de
 * `functions/api/operations/index.ts` foi desenhado para herdar a clínica do
 * PROFISSIONAL responsável, mas `functions/api/operations/_middleware.ts`
 * resolvia clínica e entitlement pelo ATOR — e a secretária não tem
 * membership clínica, então toda chamada morria em 409
 * BILLING_CLINIC_CONTEXT_REQUIRED antes do handler.
 *
 * Este teste encadeia o middleware real com o handler real, sobre o schema
 * real (db/schema.d1.sql + todas as migrações), sem mocks de SQL:
 *   1. secretária vinculada a profissional de clínica ativa → 200, agenda
 *      redigida (sem configuração, sem valores, sem equipe);
 *   2. a mesma secretária escreve (check-in operacional) → 200;
 *   3. secretária sem vínculo ativo → 403 STAFF_LINK_REQUIRED, handler não roda;
 *   4. clínica do profissional suspensa (encerramento) → 423, handler não roda;
 *   5. billing do profissional vencido → 402, handler não roda;
 *   6. header X-Tenant-Id apontando para clínica onde o profissional NÃO é
 *      membro → 409, handler não roda (o header é alvo, nunca autoridade);
 *   7. controle: o profissional continua passando pelo mesmo gate.
 *
 * Rodar: node --import tsx tests/unit/operations-delegated-staff-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequest as opsMiddleware } from "../../functions/api/operations/_middleware";
import { onRequestGet as opsGet, onRequestPost as opsPost } from "../../functions/api/operations/index";

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
      database.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        database.exec("COMMIT");
        return results;
      } catch (error) {
        database.exec("ROLLBACK");
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

function linkStaff(providerId: string, staffId: string, active = 1) {
  raw.prepare(
    `INSERT INTO booking_staff_links
       (provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(providerId, staffId, active, providerId, now(), now());
}

// Cenário sintético. Criar a clínica dispara o trial de 14 dias
// (0015_saas_billing_trial_seats_hardening.sql), suficiente para o
// entitlement "clinical" do profissional.
insertUser("prof-a", "Profissional Alfa", "professional");
insertUser("prof-b", "Profissional Beta", "professional");
insertUser("sec-a", "Secretária Alfa", "operator");
insertUser("sec-sem-vinculo", "Secretária Sem Vínculo", "operator");
insertClinic("clinic-alfa", "clinica-alfa", "prof-a");
insertClinic("clinic-beta", "clinica-beta", "prof-b");
insertMembership("clinic-alfa", "prof-a", "owner");
insertMembership("clinic-beta", "prof-b", "owner");
linkStaff("prof-a", "sec-a");

function authUser(id: string, role: string) {
  return { id, email: `${id}@example.test`, name: id, role, mustChangePassword: false };
}

interface CallResult {
  status: number;
  body: any;
  handlerRan: boolean;
}

async function call(
  userId: string,
  role: string,
  options: { method?: "GET" | "POST"; body?: Record<string, unknown>; tenantHeader?: string } = {},
): Promise<CallResult> {
  const method = options.method ?? (options.body ? "POST" : "GET");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.tenantHeader) headers["X-Tenant-Id"] = options.tenantHeader;
  const context = {
    request: new Request("https://neuroped.test/api/operations", {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    }),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
    data: { authUser: authUser(userId, role) },
  } as any;
  let handlerRan = false;
  context.next = async () => {
    handlerRan = true;
    return method === "GET" ? opsGet(context) : opsPost(context);
  };
  const response = await opsMiddleware(context);
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null, handlerRan };
}

// Profissional prepara a agenda: serviço + uma consulta manual.
{
  const service = await call("prof-a", "professional", {
    body: { action: "create_service", name: "Consulta inicial", durationMinutes: 60, priceCents: 45000 },
  });
  assert.equal(service.status, 200, `profissional cria serviço: ${JSON.stringify(service.body)}`);
}

const dashboardProf = await call("prof-a", "professional");
assert.equal(dashboardProf.status, 200, "controle: profissional passa pelo gate");
const serviceId = dashboardProf.body.services[0].id as string;

{
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);
  const created = await call("prof-a", "professional", {
    body: {
      action: "create_appointment",
      serviceId,
      startsAtLocal: `${tomorrow}T10:00`,
      guardianName: "Responsável Sintético",
      guardianPhone: "+5587999990000",
      patientName: "Criança Sintética",
    },
  });
  assert.equal(created.status, 200, `profissional agenda consulta: ${JSON.stringify(created.body)}`);
}

// 1. Secretária vinculada lê a agenda do profissional (antes: 409).
const dashboardSec = await call("sec-a", "operator");
assert.equal(
  dashboardSec.status,
  200,
  `secretária vinculada deve ler a agenda: ${dashboardSec.status} ${JSON.stringify(dashboardSec.body)}`,
);
assert.equal(dashboardSec.handlerRan, true);
assert.equal(dashboardSec.body.access.delegated, true);
assert.equal(dashboardSec.body.access.canConfigure, false);
assert.equal(dashboardSec.body.access.clinicId, "clinic-alfa");
assert.deepEqual(dashboardSec.body.staff, [], "secretária não vê a equipe");
assert.ok(dashboardSec.body.appointments.length >= 1, "secretária vê a consulta agendada");
for (const appointment of dashboardSec.body.appointments) {
  assert.equal(appointment.amountCents, null, "valor redigido para a recepção");
  assert.equal(appointment.paymentMethod, null, "forma de pagamento redigida para a recepção");
}

// 2. Secretária executa ação operacional (check-in).
{
  const appointmentId = dashboardSec.body.appointments[0].id as string;
  const checkIn = await call("sec-a", "operator", {
    body: { action: "appointment_status", id: appointmentId, status: "checked_in" },
  });
  assert.equal(checkIn.status, 200, `secretária faz check-in: ${JSON.stringify(checkIn.body)}`);
  // ...mas não configura a agenda.
  const configure = await call("sec-a", "operator", {
    body: { action: "create_service", name: "Serviço indevido", durationMinutes: 30 },
  });
  assert.equal(configure.status, 403, "secretária não configura serviços");
}

// 3. Sem vínculo ativo: 403 no gate, handler não roda.
{
  const denied = await call("sec-sem-vinculo", "operator");
  assert.equal(denied.status, 403);
  assert.equal(denied.body.code, "STAFF_LINK_REQUIRED");
  assert.equal(denied.handlerRan, false);
}

// 6. Header apontando para clínica onde o profissional responsável não é
//    membro: fail-closed antes do handler.
{
  const foreign = await call("sec-a", "operator", { tenantHeader: "clinic-beta" });
  assert.equal(foreign.status, 409);
  assert.equal(foreign.body.code, "BILLING_CLINIC_CONTEXT_REQUIRED");
  assert.equal(foreign.handlerRan, false);
}

// 5. Billing vencido: o trial acaba e não há assinatura → 402 também para a secretária.
{
  const snapshot = raw.prepare(
    `SELECT trial_ends_at FROM billing_customers WHERE clinic_id = ?`,
  ).get("clinic-alfa") as { trial_ends_at: string } | undefined;
  assert.ok(snapshot, "trial automático da clínica Alfa existe");
  raw.prepare(
    `UPDATE billing_customers SET trial_ends_at = ? WHERE clinic_id = ?`,
  ).run("2000-01-01T00:00:00.000Z", "clinic-alfa");
  const expired = await call("sec-a", "operator");
  assert.equal(expired.status, 402, `billing vencido bloqueia a recepção: ${JSON.stringify(expired.body)}`);
  assert.equal(expired.handlerRan, false);
  raw.prepare(
    `UPDATE billing_customers SET trial_ends_at = ? WHERE clinic_id = ?`,
  ).run(snapshot.trial_ends_at, "clinic-alfa");
  assert.equal((await call("sec-a", "operator")).status, 200, "restaurado o trial, a recepção volta");
}

// 4. Clínica em encerramento (suspensa): 423 para a secretária.
{
  raw.prepare(`UPDATE clinics SET status = 'suspended' WHERE id = ?`).run("clinic-alfa");
  const suspended = await call("sec-a", "operator");
  assert.equal(suspended.status, 423);
  assert.equal(suspended.handlerRan, false);
  raw.prepare(`UPDATE clinics SET status = 'active' WHERE id = ?`).run("clinic-alfa");
}

// 7. Controle: vínculo desativado corta o acesso imediatamente.
{
  raw.prepare(`UPDATE booking_staff_links SET active = 0 WHERE staff_user_id = ?`).run("sec-a");
  const revoked = await call("sec-a", "operator");
  assert.equal(revoked.status, 403);
  assert.equal(revoked.body.code, "STAFF_LINK_REQUIRED");
  assert.equal(revoked.handlerRan, false);
}

console.log("operations-delegated-staff-gate: ok");
