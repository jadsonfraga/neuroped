/**
 * operations-multi-provider.test.ts — OPS-03, issue #1064, etapa B.
 *
 * Uma recepção (papel `operator`) atende mais de um profissional. O profissional
 * escolhido (`?provider=<id>`) é só um ALVO SOLICITADO: o servidor o valida contra
 * o vínculo ativo persistido, e cada requisição opera exatamente um par
 * (profissional, clínica). Encadeia o middleware REAL com o handler REAL sobre o
 * schema real (db/schema.d1.sql + todas as migrações), sem mocks de SQL. Também
 * chama o handler SOZINHO (caminho do Express, que não passa pelo middleware).
 * Dados 100% sintéticos.
 *
 * Cenário: clínica X (prof-1 "Um", prof-2 "Dois"), clínica Y (prof-3 "Três") e
 * clínica Z (prof-4, ninguém vinculado). A secretária `sec` tem membership
 * assistant em X e Y e vínculo ativo com prof-1, prof-2 e prof-3.
 *
 * Rodar: node --import tsx tests/unit/operations-multi-provider.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequest as opsMiddleware } from "../../functions/api/operations/_middleware";
import { onRequestGet as opsGet, onRequestPost as opsPost } from "../../functions/api/operations/index";

const OPERATIONAL_KEY = "chave-operacional-de-teste-com-32-caracteres!!";
const MAIL_ENV = {
  AUTH_PUBLIC_APP_URL: "https://neuroped.test",
  AUTH_RESEND_API_KEY: "re_test_key",
  AUTH_EMAIL_FROM: "NeuroPed <no-reply@neuroped.test>",
};

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

function insertUser(id: string, name: string, role: string, active = 1) {
  raw.prepare(
    `INSERT INTO users (id, name, email, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, name, `${id}@example.test`, role, active, now(), now());
}
function insertClinic(id: string, name: string, createdBy: string) {
  raw.prepare(
    `INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?, ?)`,
  ).run(id, id, name, createdBy, now(), now());
  // O trial automático traz poucos assentos; este teste usa vários membros.
  raw.prepare(
    `UPDATE billing_subscriptions SET seats = 10 WHERE customer_id IN (SELECT id FROM billing_customers WHERE clinic_id = ?)`,
  ).run(id);
}
function insertMembership(clinicId: string, userId: string, role: string, active = 1) {
  raw.prepare(
    `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(clinicId, userId, role, active, now(), now());
}
function linkStaff(providerId: string, staffId: string, active = 1) {
  raw.prepare(
    `INSERT INTO booking_staff_links (provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(providerId, staffId, active, providerId, now(), now());
}

insertUser("prof-1", "Profissional Um", "professional");
insertUser("prof-2", "Profissional Dois", "professional");
insertUser("prof-3", "Profissional Três", "professional");
insertUser("prof-4", "Profissional Quatro", "professional");
insertUser("prof-off", "Profissional Inativo", "professional", 0);
insertUser("sec", "Secretária", "operator");
insertUser("sec-legado", "Secretária Legada", "operator");
insertUser("sec-revogada", "Secretária Sem Membership", "operator");
insertClinic("clinic-x", "Clínica X", "prof-1");
insertClinic("clinic-y", "Clínica Y", "prof-3");
insertClinic("clinic-z", "Clínica Z", "prof-4");
insertMembership("clinic-x", "prof-1", "owner");
insertMembership("clinic-x", "prof-2", "professional");
insertMembership("clinic-y", "prof-3", "owner");
insertMembership("clinic-z", "prof-4", "owner");
insertMembership("clinic-x", "prof-off", "professional");
insertMembership("clinic-x", "sec", "assistant");
insertMembership("clinic-y", "sec", "assistant");
insertMembership("clinic-x", "sec-revogada", "assistant", 0);
// vínculos da recepção principal: três profissionais, duas clínicas
linkStaff("prof-1", "sec");
linkStaff("prof-2", "sec");
linkStaff("prof-3", "sec");
linkStaff("prof-off", "sec"); // profissional inativo: nunca é escolha válida
// recepção legada: um único vínculo e NENHUMA membership (pré AUTHZ-P1-06)
linkStaff("prof-1", "sec-legado");
// recepção com dois vínculos mas membership desativada
linkStaff("prof-1", "sec-revogada");
linkStaff("prof-2", "sec-revogada");

// O usuário autenticado real traz o nome do cadastro; o perfil público do
// profissional nasce com ele (ensureProviderProfile).
const authUser = (id: string, role: string) => ({
  id,
  email: `${id}@example.test`,
  name: (raw.prepare(`SELECT name FROM users WHERE id = ?`).get(id) as { name: string }).name,
  role,
  mustChangePassword: false,
});

interface CallResult {
  status: number;
  body: any;
  handlerRan: boolean;
}
async function call(
  userId: string,
  role: string,
  options: {
    query?: string;
    body?: Record<string, unknown>;
    tenantHeader?: string;
    direct?: boolean;
    env?: Record<string, unknown>;
  } = {},
): Promise<CallResult> {
  const method = options.body ? "POST" : "GET";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.tenantHeader) headers["X-Tenant-Id"] = options.tenantHeader;
  const context = {
    request: new Request(`https://neuroped.test/api/operations${options.query ?? ""}`, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    }),
    env: { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY, ...(options.env ?? {}) },
    data: { authUser: authUser(userId, role) },
  } as any;
  let handlerRan = false;
  const run = () => (method === "GET" ? opsGet(context) : opsPost(context));
  context.next = async () => {
    handlerRan = true;
    return run();
  };
  const response = options.direct ? await run() : await opsMiddleware(context);
  if (options.direct) handlerRan = true;
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null, handlerRan };
}

const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);
const at = (hour: string) => `${tomorrow}T${hour}`;

// Cada profissional prepara um serviço próprio.
const serviceOf: Record<string, string> = {};
for (const [id, name] of [["prof-1", "Consulta Um"], ["prof-2", "Consulta Dois"], ["prof-3", "Consulta Três"]] as const) {
  const created = await call(id, "professional", { body: { action: "create_service", name, durationMinutes: 60, priceCents: 40000 } });
  assert.equal(created.status, 200, `${id} cria serviço: ${JSON.stringify(created.body)}`);
  const dashboard = await call(id, "professional");
  serviceOf[id] = dashboard.body.services[0].id;
}

// ── 1. Mais de um profissional e nenhuma escolha: 409, nunca por acaso ─────
{
  const expected = [
    { id: "prof-2", name: "Profissional Dois" },
    { id: "prof-3", name: "Profissional Três" },
    { id: "prof-1", name: "Profissional Um" },
  ];
  const viaGate = await call("sec", "operator");
  assert.equal(viaGate.status, 409);
  assert.equal(viaGate.body.code, "PROVIDER_SELECTION_REQUIRED");
  assert.equal(viaGate.handlerRan, false, "o gate barra antes do handler");
  assert.deepEqual(viaGate.body.providers, expected, "só id e nome; profissional inativo não é escolha");
  assert.ok(!JSON.stringify(viaGate.body).includes("@example.test"), "nenhum e-mail na lista");

  const viaPost = await call("sec", "operator", { body: { action: "appointment_status", id: "x", status: "confirmed" } });
  assert.equal(viaPost.status, 409);
  assert.equal(viaPost.body.code, "PROVIDER_SELECTION_REQUIRED");
  assert.equal(viaPost.handlerRan, false);

  // Express: o handler roda sem o middleware e precisa decidir sozinho.
  const direct = await call("sec", "operator", { direct: true });
  assert.equal(direct.status, 409, "o handler sozinho também exige a escolha");
  assert.equal(direct.body.code, "PROVIDER_SELECTION_REQUIRED");
  assert.deepEqual(direct.body.providers, expected);
}

// ── 2. Escolha válida: a agenda do profissional escolhido, redigida ────────
{
  for (const [id, clinic, name] of [["prof-1", "clinic-x", "Consulta Um"], ["prof-2", "clinic-x", "Consulta Dois"], ["prof-3", "clinic-y", "Consulta Três"]] as const) {
    const result = await call("sec", "operator", { query: `?provider=${id}` });
    assert.equal(result.status, 200, `${id}: ${JSON.stringify(result.body)}`);
    assert.equal(result.handlerRan, true);
    assert.equal(result.body.access.providerUserId, id);
    assert.equal(result.body.access.clinicId, clinic, "a clínica é a do profissional escolhido");
    assert.equal(result.body.access.delegated, true);
    assert.equal(result.body.access.canConfigure, false);
    assert.deepEqual(result.body.access.availableProviders.map((p: any) => p.id).sort(), ["prof-1", "prof-2", "prof-3"]);
    assert.deepEqual(result.body.services.map((s: any) => s.name), [name], "só os serviços do profissional escolhido");
    assert.ok(result.body.services.every((s: any) => s.priceCents === null), "preço redigido para a recepção");
    assert.deepEqual(result.body.reviews, [], "sem reviews para a recepção");
    assert.deepEqual(result.body.staff, [], "sem equipe para a recepção");
  }
  const direct = await call("sec", "operator", { query: "?provider=prof-2", direct: true });
  assert.equal(direct.status, 200, "o handler sozinho aceita a escolha válida");
  assert.equal(direct.body.access.providerUserId, "prof-2");

  // O profissional não ganha a chave nem consegue "escolher" outra agenda.
  const own = await call("prof-1", "professional", { query: "?provider=prof-2" });
  assert.equal(own.status, 200);
  assert.equal(own.body.access.providerUserId, "prof-1", "pedido de outro profissional é ignorado");
  assert.equal(own.body.access.delegated, false);
  assert.equal("availableProviders" in own.body.access, false, "payload do profissional inalterado");
}

// ── 3. Indisponível: todos os motivos respondem IGUAL (anti-enumeração) ────
{
  raw.prepare(`INSERT INTO booking_staff_links (provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at) VALUES ('prof-4', 'sec-legado', 0, 'prof-4', ?, ?)`).run(now(), now());
  const cases: Array<[string, string]> = [
    ["profissional de outra clínica sem vínculo", "?provider=prof-4"],
    ["id inexistente", "?provider=fantasma-123"],
    ["profissional inativo com vínculo ativo", "?provider=prof-off"],
    ["o próprio operador como alvo", "?provider=sec"],
  ];
  const outcomes: CallResult[] = [];
  for (const [label, query] of cases) {
    const result = await call("sec", "operator", { query });
    assert.equal(result.status, 403, label);
    assert.equal(result.body.code, "PROVIDER_NOT_AVAILABLE", label);
    assert.equal(result.handlerRan, false, `${label}: o gate barra`);
    outcomes.push(result);
  }
  // vínculo suspenso (outra recepção, via handler sozinho) também é igual
  const suspended = await call("sec-legado", "operator", { query: "?provider=prof-4", direct: true });
  assert.equal(suspended.status, 403);
  outcomes.push(suspended);
  for (const outcome of outcomes) assert.deepEqual(outcome.body, outcomes[0].body, "corpo idêntico em todos os motivos");
}

// ── 4. O corpo da requisição NUNCA define o profissional ───────────────────
{
  const noQuery = await call("sec", "operator", { body: { action: "create_block", providerUserId: "prof-1", provider: "prof-1" } });
  assert.equal(noQuery.status, 409, "corpo com profissional não substitui a escolha");
  assert.equal(noQuery.body.code, "PROVIDER_SELECTION_REQUIRED");

  const created = await call("sec", "operator", {
    query: "?provider=prof-2",
    body: { action: "create_appointment", serviceId: serviceOf["prof-2"], startsAtLocal: at("08:00"), guardianName: "Resp Teste", guardianPhone: "+5587999990001", patientName: "Criança Teste", providerUserId: "prof-1", provider: "prof-1" },
  });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const row = raw.prepare(`SELECT provider_user_id, clinic_id FROM appointments WHERE starts_at_local = ?`).get(at("08:00")) as any;
  assert.equal(row.provider_user_id, "prof-2", "vale a query validada, não o corpo");
  assert.equal(row.clinic_id, "clinic-x");
}

// ── 5. Tenant forjado por cabeçalho ────────────────────────────────────────
{
  const forged = await call("sec", "operator", { query: "?provider=prof-1", tenantHeader: "clinic-y" });
  assert.equal(forged.status, 409, "X-Tenant-Id de clínica onde o profissional não é membro");
  assert.equal(forged.body.code, "BILLING_CLINIC_CONTEXT_REQUIRED");
  assert.equal(forged.handlerRan, false);
  const ok = await call("sec", "operator", { query: "?provider=prof-1", tenantHeader: "clinic-x" });
  assert.equal(ok.status, 200, "o cabeçalho que confere com o profissional passa");
}

// ── 6. Cada requisição é um par (profissional, clínica): billing isolado ───
{
  const trial = raw.prepare(`SELECT trial_ends_at FROM billing_customers WHERE clinic_id = 'clinic-y'`).get() as { trial_ends_at: string };
  raw.prepare(`UPDATE billing_customers SET trial_ends_at = '2000-01-01T00:00:00.000Z' WHERE clinic_id = 'clinic-y'`).run();
  const expired = await call("sec", "operator", { query: "?provider=prof-3" });
  assert.equal(expired.status, 402, "billing vencido da clínica Y bloqueia o prof-3");
  assert.equal(expired.handlerRan, false);
  assert.equal((await call("sec", "operator", { query: "?provider=prof-1" })).status, 200, "a clínica X segue ativa");
  raw.prepare(`UPDATE billing_customers SET trial_ends_at = ? WHERE clinic_id = 'clinic-y'`).run(trial.trial_ends_at);

  raw.prepare(`UPDATE clinics SET status = 'suspended' WHERE id = 'clinic-y'`).run();
  assert.equal((await call("sec", "operator", { query: "?provider=prof-3" })).status, 423, "clínica Y suspensa");
  assert.equal((await call("sec", "operator", { query: "?provider=prof-2" })).status, 200, "a clínica X segue ativa");
  raw.prepare(`UPDATE clinics SET status = 'active' WHERE id = 'clinic-y'`).run();
}

// ── 7. Membership assistant ativa a cada requisição (caminho com escolha) ──
{
  // vários vínculos + membership desativada: nada abre, nem com escolha
  const chosen = await call("sec-revogada", "operator", { query: "?provider=prof-1" });
  assert.equal(chosen.status, 403);
  assert.equal(chosen.body.code, "PROVIDER_NOT_AVAILABLE");
  const chosenDirect = await call("sec-revogada", "operator", { query: "?provider=prof-2", direct: true });
  assert.equal(chosenDirect.status, 403, "o handler sozinho também exige a membership");
  assert.equal((await call("sec-revogada", "operator")).body.code, "PROVIDER_SELECTION_REQUIRED", "sem escolha, segue pedindo a escolha");

  // vínculo ÚNICO legado, sem membership e sem escolha: comportamento histórico
  const legacy = await call("sec-legado", "operator");
  assert.equal(legacy.status, 200, "um único vínculo e nenhuma escolha: comportamento inalterado");
  assert.equal(legacy.body.access.providerUserId, "prof-1");
  // ...mas escolher explicitamente passa a exigir a membership.
  const legacyChosen = await call("sec-legado", "operator", { query: "?provider=prof-1" });
  assert.equal(legacyChosen.status, 403, "escolha explícita exige membership assistant ativa");
}

// ── 8. Operar o profissional escolhido: locks e dados isolados ─────────────
{
  const book = (provider: string, hour: string, who: string) =>
    call("sec", "operator", {
      query: `?provider=${provider}`,
      body: { action: "create_appointment", serviceId: serviceOf[provider], startsAtLocal: at(hour), guardianName: `Resp ${who}`, guardianPhone: "+5587999990002", patientName: `Criança ${who}` },
    });
  const first = await book("prof-1", "14:00", "A");
  assert.equal(first.status, 200, JSON.stringify(first.body));
  const second = await book("prof-2", "14:00", "B");
  assert.equal(second.status, 200, "o mesmo horário em outro profissional não conflita (locks por profissional)");
  const third = await book("prof-3", "14:00", "C");
  assert.equal(third.status, 200, "nem em outra clínica");
  const clash = await book("prof-1", "14:00", "D");
  assert.equal(clash.status, 409, "mesmo profissional, mesmo horário: conflito real");

  const idOf = (provider: string) =>
    (raw.prepare(`SELECT id FROM appointments WHERE provider_user_id = ? AND starts_at_local = ?`).get(provider, at("14:00")) as any).id as string;
  const apt2 = idOf("prof-2");

  // Id de outro profissional, operando o prof-1: não existe nesta agenda.
  // (A equipe cria a consulta já `confirmed`; check-in é transição válida a partir daí.)
  const wrongStatus = await call("sec", "operator", { query: "?provider=prof-1", body: { action: "appointment_status", id: apt2, status: "checked_in" } });
  assert.equal(wrongStatus.status, 404, "consulta de outro profissional não é encontrada");
  const wrongMove = await call("sec", "operator", { query: "?provider=prof-1", body: { action: "appointment_reschedule", id: apt2, startsAtLocal: at("16:00") } });
  assert.equal(wrongMove.status, 404);
  const unchanged = raw.prepare(`SELECT status, starts_at_local FROM appointments WHERE id = ?`).get(apt2) as any;
  assert.deepEqual({ ...unchanged }, { status: "confirmed", starts_at_local: at("14:00") }, "a consulta do prof-2 não foi tocada");

  // No profissional certo, as ações funcionam e ficam no profissional certo.
  const move = await call("sec", "operator", { query: "?provider=prof-2", body: { action: "appointment_reschedule", id: apt2, startsAtLocal: at("16:00") } });
  assert.equal(move.status, 200, JSON.stringify(move.body));
  const moved = raw.prepare(`SELECT provider_user_id, starts_at_local, status FROM appointments WHERE id = ?`).get(apt2) as any;
  assert.deepEqual({ ...moved }, { provider_user_id: "prof-2", starts_at_local: at("16:00"), status: "confirmed" });
  const cancel = await call("sec", "operator", { query: "?provider=prof-2", body: { action: "appointment_status", id: apt2, status: "cancelled" } });
  assert.equal(cancel.status, 200);
}

// ── 9. Auditoria: profissional escolhido + autor real ──────────────────────
{
  const rows = raw.prepare(
    `SELECT provider_user_id, actor_user_id, clinic_id FROM operations_audit_log WHERE action = 'create_appointment' AND actor_user_id = 'sec'`,
  ).all() as any[];
  assert.ok(rows.length >= 4, "ações da recepção foram auditadas");
  const clinicOf: Record<string, string> = { "prof-1": "clinic-x", "prof-2": "clinic-x", "prof-3": "clinic-y" };
  for (const row of rows) {
    assert.equal(row.actor_user_id, "sec", "o autor é a recepção");
    assert.equal(row.clinic_id, clinicOf[row.provider_user_id], "a clínica auditada é a do profissional escolhido");
  }
  assert.deepEqual([...new Set(rows.map((row) => row.provider_user_id))].sort(), ["prof-1", "prof-2", "prof-3"]);
  const statusAudit = raw.prepare(`SELECT provider_user_id FROM operations_audit_log WHERE action = 'appointment_status' AND actor_user_id = 'sec'`).all() as any[];
  assert.ok(statusAudit.every((row) => row.provider_user_id === "prof-2"), "ações no prof-2 auditadas no prof-2");
}

// ── 10. E-mail sai com o nome e a clínica do profissional da agenda ────────
{
  const realFetch = globalThis.fetch;
  const sent: Array<{ subject: string; text: string }> = [];
  globalThis.fetch = (async (url: unknown, init?: { body?: string }) => {
    if (String(url).startsWith("https://api.resend.com/emails")) {
      sent.push(JSON.parse(String(init?.body)));
      return new Response("{}", { status: 200 });
    }
    return realFetch(url as never, init as never);
  }) as typeof fetch;
  try {
    for (const [provider, hour] of [["prof-2", "17:00"], ["prof-3", "17:00"]] as const) {
      const result = await call("sec", "operator", {
        query: `?provider=${provider}`,
        env: MAIL_ENV,
        body: { action: "create_appointment", serviceId: serviceOf[provider], startsAtLocal: at(hour), guardianName: "Resp Email", guardianEmail: `familia.${provider}@example.test`, patientName: "Criança Email" },
      });
      assert.equal(result.status, 200, JSON.stringify(result.body));
    }
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(sent.length, 2, "um e-mail por consulta");
  const [dois, tres] = sent;
  assert.match(dois.subject, /Clínica X/);
  assert.match(dois.text, /Profissional Dois/);
  assert.ok(!dois.text.includes("Profissional Três") && !dois.text.includes("Profissional Um"), "nada de outro profissional no e-mail");
  assert.match(tres.subject, /Clínica Y/);
  assert.match(tres.text, /Profissional Três/);
  assert.ok(!tres.text.includes("Profissional Dois"), "nada de outro profissional no e-mail");
}

// ── 11. Revogação por vínculo: suspender um mantém os outros ───────────────
{
  const suspend = await call("prof-1", "professional", { body: { action: "staff_active", staffUserId: "sec", active: false } });
  assert.equal(suspend.status, 200, JSON.stringify(suspend.body));
  const links = raw.prepare(`SELECT provider_user_id, active FROM booking_staff_links WHERE staff_user_id = 'sec' ORDER BY provider_user_id`).all() as any[];
  assert.deepEqual(links.map((row) => `${row.provider_user_id}:${row.active}`), ["prof-1:0", "prof-2:1", "prof-3:1", "prof-off:1"], "só o vínculo do prof-1 mudou");

  assert.equal((await call("sec", "operator", { query: "?provider=prof-1" })).body.code, "PROVIDER_NOT_AVAILABLE", "vínculo suspenso é indisponível");
  assert.equal((await call("sec", "operator", { query: "?provider=prof-2" })).status, 200, "os outros seguem operando");
  const stillChoose = await call("sec", "operator");
  assert.equal(stillChoose.body.code, "PROVIDER_SELECTION_REQUIRED");
  assert.deepEqual(stillChoose.body.providers.map((p: any) => p.id), ["prof-2", "prof-3"]);

  // Um profissional só gerencia o PRÓPRIO vínculo: prof-2 não mexe no (prof-3, sec).
  await call("prof-2", "professional", { body: { action: "staff_active", staffUserId: "sec", active: false } });
  const after = raw.prepare(`SELECT provider_user_id, active FROM booking_staff_links WHERE staff_user_id = 'sec' ORDER BY provider_user_id`).all() as any[];
  assert.deepEqual(after.map((row) => `${row.provider_user_id}:${row.active}`), ["prof-1:0", "prof-2:0", "prof-3:1", "prof-off:1"], "prof-2 só alterou o vínculo dele");

  // Restando um único profissional válido, volta o caminho sem escolha.
  const single = await call("sec", "operator");
  assert.equal(single.status, 200, "um único profissional possível: sem escolha obrigatória");
  assert.equal(single.body.access.providerUserId, "prof-3");
  assert.equal(single.body.access.clinicId, "clinic-y");
}

console.log(
  "operations-multi-provider: escolha obrigatória com vários profissionais, alvo validado no vínculo persistido, motivos indistinguíveis, corpo ignorado, tenant e billing por par (profissional, clínica), membership a cada requisição com escolha, locks/auditoria/e-mail do profissional certo e revogação por vínculo OK",
);
