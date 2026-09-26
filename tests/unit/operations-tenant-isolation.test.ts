/**
 * OPS-01/OPS-02 (ciclo 4 da espiral SaaS, 2026-09-26 —
 * docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md): a agenda/operações
 * escopava só por `provider_user_id`. Um profissional membro de duas
 * clínicas via a agenda inteira — serviços, regras, consultas com PHI
 * decifrada, lista de espera, avaliações, notificações e auditoria — de
 * uma clínica no contexto da outra.
 *
 * Este teste roda sobre o schema real (db/schema.d1.sql + todas as
 * migrações, incluindo 0029_operations_clinic_scope.sql) e os handlers reais
 * de functions/api/operations e functions/api/public-booking — sem mocks de
 * SQL. Duas clínicas o tempo todo: CLINICA_A e CLINICA_B, um único
 * profissional membro de ambas, para provar que uma nunca alcança a outra.
 *
 * Rodar: node --import tsx tests/unit/operations-tenant-isolation.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequestGet as opsGet, onRequestPost as opsPost } from "../../functions/api/operations/index";
import {
  onRequestGet as publicGet,
  onRequestPost as publicPost,
} from "../../functions/api/public-booking";

const OPERATIONAL_KEY = "chave-operacional-de-teste-com-32-caracteres!!";

// ── Banco: bootstrap real (mesma política de tests/unit/cliente-zero-journey.test.ts) ──
const raw = new DatabaseSync(":memory:");
raw.exec("PRAGMA foreign_keys = OFF;");
raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
const superadas: string[] = [];
for (const nome of readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort()) {
  try {
    raw.exec(readFileSync(`db/migrations/${nome}`, "utf8"));
  } catch (erro) {
    assert.match(String(erro), /duplicate column name/i, `migração ${nome}: ${String(erro)}`);
    superadas.push(nome);
  }
}
assert.deepEqual(superadas, ["0001_users_auth.sql", "0002_patient_ownership.sql"]);
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

// ── Cenário: um profissional, duas clínicas ─────────────────────────────────
// Criar a clínica já dispara trg_clinic_create_billing_trial
// (0015_saas_billing_trial_seats_hardening.sql): trial de 14 dias, 2
// assentos, plano saas-professional — suficiente para passar o entitlement
// "clinical" sem inserção manual de billing.
insertUser("prof-p", "Profissional Compartilhado", "professional");
insertClinic("clinic-a", "clinica-a", "prof-p");
insertClinic("clinic-b", "clinica-b", "prof-p");
insertMembership("clinic-a", "prof-p", "professional");
insertMembership("clinic-b", "prof-p", "professional");

function authUser(id: string, role: string, name: string) {
  return { id, email: `${id}@example.test`, name, role, mustChangePassword: false };
}

function contextFor(clinicId: string, userId = "prof-p", role = "professional", name = "Profissional Compartilhado") {
  return (body?: Record<string, unknown>, method: "GET" | "POST" = body ? "POST" : "GET") => ({
    request: new Request("https://neuroped.test/api/operations", {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Id": clinicId,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
    data: { authUser: authUser(userId, role, name) },
  });
}

const asA = contextFor("clinic-a");
const asB = contextFor("clinic-b");

// ── 1. Serviço criado em A não aparece no dashboard de B ────────────────────
{
  const created = await opsPost(asA({ action: "create_service", name: "Consulta A", durationMinutes: 60 }) as never);
  assert.equal(created.status, 200, "criação de serviço em A deve ter sucesso");

  const dashboardB = await (await opsGet(asB() as never)).json() as any;
  assert.deepEqual(
    dashboardB.services.map((s: any) => s.name),
    [],
    "OPS-01: serviço da clínica A não pode aparecer no dashboard da clínica B",
  );

  const dashboardA = await (await opsGet(asA() as never)).json() as any;
  assert.deepEqual(dashboardA.services.map((s: any) => s.name), ["Consulta A"]);
}

// ── 2. Regra de disponibilidade e bloqueio de A não vazam para B ────────────
{
  await opsPost(asA({ action: "create_rule", weekday: 1, startMinute: 480, endMinute: 720, slotMinutes: 30 }) as never);
  await opsPost(asA({ action: "create_block", startsAtLocal: "2026-10-05T08:00", endsAtLocal: "2026-10-05T09:00", reason: "Feriado A" }) as never);

  const dashboardB = await (await opsGet(asB() as never)).json() as any;
  assert.deepEqual(dashboardB.rules, [], "OPS-01: regra de disponibilidade de A não pode aparecer em B");
  assert.deepEqual(dashboardB.blocks, [], "OPS-01: bloqueio de A não pode aparecer em B");
}

// ── 3. Consulta criada em A é invisível e imutável a partir de B ────────────
{
  const dashboardA = await (await opsGet(asA() as never)).json() as any;
  const serviceId = dashboardA.services[0].id;
  const createAppt = await opsPost(asA({
    action: "create_appointment",
    serviceId,
    startsAtLocal: "2026-10-06T10:00",
    guardianName: "Responsável A",
    guardianPhone: "11988887777",
    patientName: "Paciente A",
  }) as never);
  assert.equal(createAppt.status, 200);

  const dashboardAAfter = await (await opsGet(asA() as never)).json() as any;
  const appointmentIdA = dashboardAAfter.appointments[0].id;
  assert.equal(dashboardAAfter.appointments[0].guardianName, "Responsável A");

  const dashboardB = await (await opsGet(asB() as never)).json() as any;
  assert.deepEqual(
    dashboardB.appointments,
    [],
    "OPS-01: consulta com PHI da clínica A não pode aparecer no dashboard da clínica B",
  );

  // Ação cross-tenant direta: tentar mudar o status da consulta de A a partir
  // do contexto B precisa falhar como se a consulta não existisse. A consulta
  // já nasce 'confirmed' (create_appointment); 'checked_in' é uma transição
  // válida a partir daí.
  const cross = await opsPost(asB({ action: "appointment_status", id: appointmentIdA, status: "checked_in" }) as never);
  assert.equal(cross.status, 404, "OPS-01: transição de status de consulta de outra clínica deve ser 404, não 200");

  // A partir do contexto correto, a mesma ação funciona.
  const correct = await opsPost(asA({ action: "appointment_status", id: appointmentIdA, status: "checked_in" }) as never);
  assert.equal(correct.status, 200);
}

// ── 4. Auditoria de operações é isolada por clínica ─────────────────────────
{
  const dashboardA = await (await opsGet(asA() as never)).json() as any;
  const dashboardB = await (await opsGet(asB() as never)).json() as any;
  assert.ok(dashboardA.audit.length > 0, "clínica A deve ter trilha de auditoria própria");
  assert.ok(
    dashboardA.audit.every((entry: any) => !String(entry.action).includes("clinic-b")),
    "auditoria de A não pode conter metadados de B",
  );
  // A trilha de B é vazia porque nenhuma ação foi tomada nela até aqui.
  assert.deepEqual(dashboardB.audit, []);
}

// ── 5. Diretório público não pode misturar profissional com clínica ambígua ─
// prof-p tem DUAS memberships ativas: nem o perfil público nem os horários
// podem ser servidos sem saber a qual clínica pertencem (fail-closed, nunca
// mistura clinic_id=null com dado de uma das duas).
{
  await opsPost(asA({
    action: "upsert_profile",
    displayName: "Dr. Compartilhado",
    specialty: "Neuropediatria",
    timezone: "America/Recife",
    bookingEnabled: true,
  }) as never);
  const profileRow = raw.prepare(`SELECT slug FROM booking_provider_profiles WHERE user_id = 'prof-p'`).get() as { slug: string };

  const publicProfileResponse = await publicGet({
    request: new Request(`https://neuroped.test/api/public-booking?provider=${profileRow.slug}`),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
  } as never);
  const publicProfileBody = await publicProfileResponse.json();
  assert.equal(
    publicProfileBody,
    null,
    "OPS-02: profissional com clínica ambígua não pode expor perfil público de nenhuma das duas",
  );

  const slotsResponse = await publicGet({
    request: new Request(`https://neuroped.test/api/public-booking?action=slots&provider=${profileRow.slug}&date=2026-10-06`),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
  } as never);
  const slotsBody = await slotsResponse.json() as any;
  assert.equal(slotsBody.bookingEnabled, false, "OPS-02: horários públicos indisponíveis para clínica ambígua");

  const providersResponse = await publicGet({
    request: new Request("https://neuroped.test/api/public-booking?action=providers"),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
  } as never);
  const providersBody = await providersResponse.json() as any;
  assert.deepEqual(
    providersBody.providers,
    [],
    "OPS-02: diretório público não pode listar profissional com clínica ambígua",
  );

  const bookAttempt = await publicPost({
    request: new Request("https://neuroped.test/api/public-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "book",
        provider: profileRow.slug,
        serviceId: "qualquer",
        startsAtLocal: "2026-10-06T10:00",
        guardianName: "Família Pública",
        guardianPhone: "11999998888",
        patientName: "Criança",
        privacyAccepted: true,
      }),
    }),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
  } as never);
  assert.equal(bookAttempt.status, 409, "OPS-02: agendamento público recusado sem clínica única resolvida");
}

raw.close();
console.log("✓ operações: agenda, PHI de consultas, auditoria e diretório público isolados por clínica (OPS-01/OPS-02)");
