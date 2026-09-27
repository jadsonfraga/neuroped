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
import { assertPublicBookingClinicIsolation } from "./public-booking-clinic-regressions";

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
      // SAVEPOINT mantém o batch atômico e permite checkpoints externos da fixture.
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

// ── 6. S13: `?clinic=<slug>` desambigua sem inferir clínica ─────────────────
// prof-p segue com DUAS memberships ativas (mesmo cenário do item 5). Antes
// (item 5), qualquer link público para ele falhava fechado por ambiguidade.
// Agora, um link que já declara `clinic=<slug da clínica>` deve CONFIRMAR a
// membership exatamente naquela clínica (resolveProviderClinicBySlug), nunca
// inferir pela contagem total de memberships — e continuar recusando quando
// a clínica pedida não tem o profissional como membro ativo, não existe, ou
// está suspensa.
{
  const profileRow = raw.prepare(`SELECT slug FROM booking_provider_profiles WHERE user_id = 'prof-p'`).get() as { slug: string };
  await opsPost(asB({ action: "create_service", name: "Consulta B", durationMinutes: 45 }) as never);

  const profileA = await (await publicGet({
    request: new Request(`https://neuroped.test/api/public-booking?provider=${profileRow.slug}&clinic=clinica-a`),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
  } as never)).json() as any;
  assert.deepEqual(
    profileA.services.map((s: any) => s.name),
    ["Consulta A"],
    "S13: ?clinic=clinica-a deve mostrar só os serviços de A, mesmo com membership ambígua",
  );

  const profileB = await (await publicGet({
    request: new Request(`https://neuroped.test/api/public-booking?provider=${profileRow.slug}&clinic=clinica-b`),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
  } as never)).json() as any;
  assert.deepEqual(
    profileB.services.map((s: any) => s.name),
    ["Consulta B"],
    "S13: ?clinic=clinica-b deve mostrar só os serviços de B — nunca misturar com A",
  );

  const slotsB = await (await publicGet({
    request: new Request(
      `https://neuroped.test/api/public-booking?action=slots&provider=${profileRow.slug}&clinic=clinica-b&service=${(raw.prepare(`SELECT id FROM booking_services WHERE clinic_id = 'clinic-b' LIMIT 1`).get() as { id: string }).id}&date=2026-10-07`,
    ),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
  } as never)).json() as any;
  assert.equal(slotsB.bookingEnabled, true, "S13: clínica confirmada por slug deve habilitar horários públicos");

  const directoryA = await (await publicGet({
    request: new Request("https://neuroped.test/api/public-booking?action=providers&clinic=clinica-a"),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
  } as never)).json() as any;
  assert.deepEqual(
    directoryA.providers.map((p: any) => p.slug),
    [profileRow.slug],
    "S13: diretório com ?clinic= deve listar o profissional mesmo com membership ambígua no total",
  );

  // Clínica existente e ativa, mas onde prof-p NÃO é membro: falha fechado,
  // nunca cai de volta para tentar inferir pela única membership global
  // (que nem existe aqui — é isso que faz este caso valer a pena).
  insertClinic("clinic-c", "clinica-c", "prof-p");
  const profileForeignClinic = await publicGet({
    request: new Request(`https://neuroped.test/api/public-booking?provider=${profileRow.slug}&clinic=clinica-c`),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
  } as never);
  assert.equal(
    await profileForeignClinic.json(),
    null,
    "S13: clínica sem membership ativa do profissional deve recusar, nunca inferir outra",
  );

  // Slug de clínica inexistente: mesma recusa.
  const profileGhostClinic = await publicGet({
    request: new Request(`https://neuroped.test/api/public-booking?provider=${profileRow.slug}&clinic=nao-existe`),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
  } as never);
  assert.equal(await profileGhostClinic.json(), null, "S13: slug de clínica inexistente deve recusar");

  // Clínica onde o profissional é membro ativo, mas a clínica está suspensa:
  // mesma recusa (mesma disciplina de S14 para links públicos).
  insertClinic("clinic-d", "clinica-d", "prof-p");
  raw.prepare(`UPDATE clinics SET status = 'suspended' WHERE id = 'clinic-d'`).run();
  insertMembership("clinic-d", "prof-p", "professional");
  const profileSuspendedClinic = await publicGet({
    request: new Request(`https://neuroped.test/api/public-booking?provider=${profileRow.slug}&clinic=clinica-d`),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
  } as never);
  assert.equal(
    await profileSuspendedClinic.json(),
    null,
    "S13: clínica suspensa deve recusar mesmo com membership ativa do profissional",
  );

  // Sem `clinic`, o comportamento antigo (item 5) continua intacto: ambiguidade
  // total ainda falha fechado, mesmo agora com 4 memberships ativas.
  const profileNoClinicParam = await publicGet({
    request: new Request(`https://neuroped.test/api/public-booking?provider=${profileRow.slug}`),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
  } as never);
  assert.equal(
    await profileNoClinicParam.json(),
    null,
    "S13: sem ?clinic=, ambiguidade total continua falhando fechado (compatibilidade com links antigos)",
  );
}

// O wrapper de batch não pode perder a atomicidade ao aceitar checkpoints da fixture.
{
  const probe = new DatabaseSync(":memory:");
  try {
    probe.exec("CREATE TABLE fixture_atomicity (id TEXT PRIMARY KEY)");
    const probeDb = makeDb(probe);
    await probeDb.batch([probeDb.prepare("INSERT INTO fixture_atomicity VALUES ('stable')")]);
    probe.exec("SAVEPOINT outer_fixture");
    await probeDb.batch([probeDb.prepare("INSERT INTO fixture_atomicity VALUES ('nested')")]);
    await assert.rejects(
      probeDb.batch([
        probeDb.prepare("INSERT INTO fixture_atomicity VALUES ('rollback-required')"),
        probeDb.prepare("INSERT INTO fixture_atomicity VALUES ('stable')"),
      ]),
      /UNIQUE constraint failed/,
    );
    assert.deepEqual(
      probe.prepare("SELECT id FROM fixture_atomicity ORDER BY id").all().map((row) => row.id),
      ["nested", "stable"],
      "batch falho reverte sua escrita e preserva as anteriores",
    );
    probe.exec("ROLLBACK TO outer_fixture; RELEASE outer_fixture");
    assert.deepEqual(
      probe.prepare("SELECT id FROM fixture_atomicity ORDER BY id").all().map((row) => row.id),
      ["stable"],
      "checkpoint externo desfaz a fixture sem perder o commit prévio",
    );
  } finally { probe.close(); }
}

// ── 7. S13-R1: diretório exige serviço público NA MESMA clínica ────────────
// Fixture independente; nenhuma associação do legado ou dado real é alterado.
{
  insertUser("directory-prof", "Profissional Sintético do Diretório", "professional");
  insertClinic("directory-a", "directory-alpha", "directory-prof");
  insertClinic("directory-b", "directory-beta", "directory-prof");
  insertMembership("directory-a", "directory-prof", "professional");
  insertMembership("directory-b", "directory-prof", "professional");
  raw.prepare(
    `INSERT INTO booking_provider_profiles
      (user_id, slug, display_name, specialty, booking_enabled)
     VALUES ('directory-prof', 'directory-synthetic', 'Profissional Sintético', 'Teste', 1)`,
  ).run();
  raw.prepare(
    `INSERT INTO booking_services
      (id, provider_user_id, clinic_id, name, duration_minutes, active, public_visible)
     VALUES ('directory-sa', 'directory-prof', 'directory-a', 'Serviço A', 60, 1, 1),
            ('directory-sb', 'directory-prof', 'directory-b', 'Serviço B', 60, 1, 1)`,
  ).run();

  const directory = async (clinicSlug: string | null, database = db) => {
    const url = new URL("https://neuroped.test/api/public-booking?action=providers");
    if (clinicSlug !== null) url.searchParams.set("clinic", clinicSlug);
    const response = await publicGet({
      request: new Request(url),
      env: { DB: database, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY },
    } as never);
    assert.equal(response.status, 200, "S13-R1: diretório responde normalmente, sem ocultar erro SQL como sucesso");
    const body = await response.json() as { providers: Array<{ slug: string }> };
    // O diretório sem slug pode listar outros profissionais elegíveis da fixture.
    return body.providers.filter((provider) => provider.slug === "directory-synthetic");
  };
  const scenarios: Array<{ name: string; sql: string; expected: Array<[string | null, number]> }> = [
    { name: "duas clínicas válidas exigem slug", sql: "", expected: [["directory-alpha", 1], ["directory-beta", 1], [null, 0]] },
    { name: "serviço somente em B não habilita A", sql: "DELETE FROM booking_services WHERE id = 'directory-sa'", expected: [["directory-alpha", 0], ["directory-beta", 1]] },
    { name: "serviço somente em A não habilita B", sql: "DELETE FROM booking_services WHERE id = 'directory-sb'", expected: [["directory-beta", 0], ["directory-alpha", 1]] },
    { name: "serviço privado em A não empresta B", sql: "UPDATE booking_services SET public_visible = 0 WHERE id = 'directory-sa'", expected: [["directory-alpha", 0], ["directory-beta", 1]] },
    { name: "serviço inativo em A não empresta B", sql: "UPDATE booking_services SET active = 0 WHERE id = 'directory-sa'", expected: [["directory-alpha", 0], ["directory-beta", 1]] },
    { name: "membership revogada impede clínica explícita", sql: "UPDATE clinic_memberships SET active = 0 WHERE clinic_id = 'directory-a'", expected: [["directory-alpha", 0], ["directory-beta", 1], [null, 1]] },
    { name: "link antigo não empresta serviço de vínculo revogado", sql: "UPDATE clinic_memberships SET active = 0 WHERE clinic_id = 'directory-b'; DELETE FROM booking_services WHERE id = 'directory-sa'", expected: [[null, 0], ["directory-alpha", 0], ["directory-beta", 0]] },
    { name: "serviço sem clínica não é fallback", sql: "UPDATE clinic_memberships SET active = 0 WHERE clinic_id = 'directory-b'; UPDATE booking_services SET clinic_id = NULL WHERE provider_user_id = 'directory-prof'", expected: [[null, 0], ["directory-alpha", 0], ["directory-beta", 0]] },
    { name: "clínica única suspensa não aparece no link antigo", sql: "UPDATE clinic_memberships SET active = 0 WHERE clinic_id = 'directory-b'; UPDATE clinics SET status = 'suspended' WHERE id = 'directory-a'", expected: [[null, 0], ["directory-alpha", 0]] },
    { name: "clínica única encerrada não aparece no link antigo", sql: "UPDATE clinic_memberships SET active = 0 WHERE clinic_id = 'directory-b'; UPDATE clinics SET status = 'closed' WHERE id = 'directory-a'", expected: [[null, 0], ["directory-alpha", 0]] },
    { name: "slug desconhecido ou parecido com SQL não amplia escopo", sql: "", expected: [["directory-ghost", 0], ["directory-alpha' OR 1=1 --", 0]] },
    { name: "dois serviços não duplicam profissional", sql: "INSERT INTO booking_services (id, provider_user_id, clinic_id, name, duration_minutes) VALUES ('directory-sa2', 'directory-prof', 'directory-a', 'Outro serviço A', 30)", expected: [["directory-alpha", 1]] },
    { name: "sem membership não há fallback", sql: "UPDATE clinic_memberships SET active = 0 WHERE user_id = 'directory-prof'", expected: [[null, 0], ["directory-alpha", 0]] },
    { name: "agendamento desligado continua oculto", sql: "UPDATE booking_provider_profiles SET booking_enabled = 0 WHERE user_id = 'directory-prof'", expected: [["directory-alpha", 0], ["directory-beta", 0], [null, 0]] },
  ];
  for (const scenario of scenarios) {
    raw.exec("SAVEPOINT directory_case");
    try {
      if (scenario.sql) raw.exec(scenario.sql);
      for (const [clinicSlug, count] of scenario.expected) {
        const before = raw.prepare("SELECT total_changes() AS n").get() as { n: number };
        const providers = await directory(clinicSlug);
        assert.equal(providers.length, count, `S13-R1: ${scenario.name}; clínica=${clinicSlug}`);
        const after = raw.prepare("SELECT total_changes() AS n").get() as { n: number };
        assert.equal(after.n, before.n, "S13-R1: consulta do diretório não altera dados");
      }
    } finally {
      raw.exec("ROLLBACK TO directory_case; RELEASE directory_case");
    }
  }

  // Revogar depois de entrar no handler, imediatamente antes do SELECT final,
  // não pode reaproveitar uma decisão de membership anterior à consulta.
  raw.exec("SAVEPOINT directory_race");
  try {
    let injected = false;
    const racingDb = {
      ...db,
      prepare(sql: string) {
        if (sql.includes("FROM booking_provider_profiles p")) {
          injected = true;
          raw.prepare("UPDATE clinic_memberships SET active = 0 WHERE clinic_id = 'directory-a'").run();
        }
        return db.prepare(sql);
      },
    } as D1Database;
    assert.equal((await directory("directory-alpha", racingDb)).length, 0, "S13-R1: revogação antes do SQL final recusa");
    assert.equal(injected, true, "S13-R1: a corrida foi realmente injetada no SELECT do diretório");
    assert.equal((await directory("directory-beta")).length, 1, "S13-R1: revogação em A não interfere em B");
  } finally {
    raw.exec("ROLLBACK TO directory_race; RELEASE directory_race");
  }
  console.log("✓ S13-R1: 15 cenários de diretório/clínica, incluindo revogação no SELECT final e links legados");
}

await assertPublicBookingClinicIsolation(raw, db, OPERATIONAL_KEY);

raw.close();
console.log("✓ operações: agenda, PHI de consultas, auditoria e diretório público isolados por clínica (OPS-01/OPS-02); link público desambiguado por clínica sem inferência (S13)");
