/**
 * tenant-rbac-membership-authority.test.ts — S10 (AUTHZ-P1-07, LTB-05,
 * AUTHZ-P1-04, OPS-04 — docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md).
 *
 * Antes deste ciclo conviviam dois eixos de papel: o middleware global vetava
 * TODA escrita pelo papel GLOBAL (`users.role`: admin/professional escrevem,
 * reader/operator não) antes de a membership da clínica ser consultada. Uma
 * secretária convidada como `assistant` (papel global `operator`) recebia 403
 * em tudo que não fosse `POST /api/operations` — e ali o middleware da agenda
 * exigia o escopo `clinical`, que exclui `assistant`; um `professional` global
 * com membership `financial` configurava a agenda da clínica; um `reader`
 * promovido a `professional` por convite continuava sem escrever.
 *
 * Agora a autoridade nas famílias multi-tenant (/api/live, /api/operations,
 * /api/tenants, /api/billing, /api/me) é a MEMBERSHIP. As rotas legadas
 * single-tenant (patients_demo e filhas) continuam vetadas pelo papel global.
 *
 * Harness real: db/schema.d1.sql + todas as migrações, JWT assinado com o
 * segredo de teste, sessão persistida em auth_refresh_sessions, e a cadeia
 * real `functions/api/_middleware.ts` → middleware da família → handler.
 * Nenhum dado real: tudo sintético.
 *
 * Rodar: node --import tsx tests/unit/tenant-rbac-membership-authority.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequest as globalMiddleware } from "../../functions/api/_middleware";
import { onRequest as liveMiddleware } from "../../functions/api/live/_middleware";
import { onRequest as operationsMiddleware } from "../../functions/api/operations/_middleware";
import { onRequestPost as createLivePatient } from "../../functions/api/live/patients/index";
import { onRequestGet as opsGet, onRequestPost as opsPost } from "../../functions/api/operations/index";
import { createSessionTokens } from "../../functions/api/auth/_sessions";
import { getUserById } from "../../functions/api/auth/_shared";

const SECRET = "segredo-de-teste-com-comprimento-suficiente-123456";

// ── Banco: bootstrap real (mesma política de operations-tenant-isolation.test.ts) ──
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
const now = new Date().toISOString();

const env = {
  DB: db,
  NEUROPED_JWT_SECRET: SECRET,
  ENVIRONMENT: "production",
  CLINICAL_LIVE_ENABLED: "true",
  CLINICAL_DATA_KEY: "production-readiness-data-key-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  CLINICAL_DATA_KEY_ID: "k-pr-2026-08-23",
  CLINICAL_INDEX_KEY: "production-readiness-index-key-9876543210-ZYXWVUTSRQPONMLKJIHGFEDCBA",
  OPERATIONAL_DATA_KEY: "chave-operacional-de-teste-com-32-caracteres!!",
};

// ── Cenário: Clínica Alfa com quatro contas, papéis globais deliberadamente
//    "errados" em relação à membership — é isso que o S10 precisa tolerar. ──
const ALFA = "clinic-alfa";
type Conta = { id: string; globalRole: string; membership: string | null };
const contas: Conta[] = [
  // dona da clínica com papel global professional (caso normal)
  { id: "dona-alfa", globalRole: "professional", membership: "owner" },
  // médico que entrou por convite quando ainda tinha conta global `operator`
  { id: "medico-operator-global", globalRole: "operator", membership: "professional" },
  // secretária convidada como assistant (accept.ts dá papel global operator)
  { id: "secretaria-alfa", globalRole: "operator", membership: "assistant" },
  // financeiro com papel global professional (signup aberto) e membership financial
  { id: "financeiro-alfa", globalRole: "professional", membership: "financial" },
  // conta professional global SEM membership em Alfa
  { id: "estranho", globalRole: "professional", membership: null },
];
for (const conta of contas) {
  raw.prepare(`INSERT INTO users (id, name, email, role, is_active, email_verified_at, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?)`)
    .run(conta.id, `Sintético ${conta.id}`, `${conta.id}@example.test`, conta.globalRole, now, now, now);
}
// Criar a clínica dispara trg_clinic_create_billing_trial (0015): trial válido.
raw.prepare(`INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, 'active', 'dona-alfa', ?, ?)`)
  .run(ALFA, ALFA, "Clínica Alfa", now, now);
raw.prepare(`UPDATE billing_subscriptions SET seats = 20 WHERE customer_id IN (SELECT id FROM billing_customers WHERE clinic_id = ?)`).run(ALFA);
for (const conta of contas) {
  if (!conta.membership) continue;
  raw.prepare(`INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)`)
    .run(ALFA, conta.id, conta.membership, now, now);
}

const tokens: Record<string, string> = {};
for (const conta of contas) {
  const row = await getUserById(db, conta.id);
  assert.ok(row, conta.id);
  tokens[conta.id] = (await createSessionTokens(db, row, SECRET)).accessToken;
}

let requestNumber = 0;
type Rota = "live-patients" | "operations" | "legacy-consultations";
const PATHS: Record<Rota, string> = {
  "live-patients": "/api/live/patients",
  operations: "/api/operations",
  "legacy-consultations": "/api/consultations",
};

/** Cadeia real: middleware global → middleware da família → handler. */
async function chamar(userId: string, rota: Rota, method: "GET" | "POST", body?: unknown) {
  const request = new Request(`https://neuroped.test${PATHS[rota]}`, {
    method,
    headers: {
      Authorization: `Bearer ${tokens[userId]}`,
      "Content-Type": "application/json",
      "X-Tenant-Id": ALFA,
      "CF-Connecting-IP": `203.0.${++requestNumber}.7`,
    },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  });
  const context: Record<string, unknown> = {
    request,
    env,
    params: {},
    data: {},
    waitUntil: () => undefined,
  };
  context.next = async () => {
    if (rota === "live-patients") {
      return liveMiddleware({ ...context, next: () => createLivePatient(context as never) } as never);
    }
    if (rota === "operations") {
      return operationsMiddleware({
        ...context,
        next: () => (method === "GET" ? opsGet(context as never) : opsPost(context as never)),
      } as never);
    }
    // Rota legada: se o middleware global deixar passar, este sentinela
    // denuncia (o handler legado real não interessa aqui).
    return new Response(JSON.stringify({ legacyReached: true }), { status: 200 });
  };
  return globalMiddleware(context as never);
}

async function corpo(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

const paciente = { clinicId: ALFA, name: "Paciente Sintético", birthDate: "2019-04-05" };

// ── 1. Médico com papel global `operator` e membership `professional`: escreve
//       paciente LIVE (antes: 403 FORBIDDEN do middleware global). ──────────
{
  const response = await chamar("medico-operator-global", "live-patients", "POST", paciente);
  assert.equal(response.status, 201, `membership professional manda: ${JSON.stringify(await response.clone().json())}`);
  const contagem = raw.prepare(`SELECT COUNT(*) AS n FROM live_patients WHERE clinic_id = ?`).get(ALFA) as { n: number };
  assert.equal(contagem.n, 1, "paciente LIVE realmente persistido");
}
console.log("✓ papel global operator + membership professional escreve em /api/live/patients (S10)");

// ── 2. Secretária (`assistant`, global operator): NUNCA escreve clínica LIVE,
//       mas opera a agenda depois de vinculada; sem vínculo, STAFF_LINK_REQUIRED. ──
{
  const clinico = await chamar("secretaria-alfa", "live-patients", "POST", paciente);
  assert.equal(clinico.status, 403, "assistant não escreve dado clínico");
  assert.equal((await corpo(clinico)).code, "ENTITLEMENT_ROLE_NOT_ALLOWED");

  const semVinculo = await chamar("secretaria-alfa", "operations", "GET");
  assert.equal(semVinculo.status, 403);
  assert.equal((await corpo(semVinculo)).code, "STAFF_LINK_REQUIRED", "assistant sem vínculo é orientada, não vetada pelo papel global");

  // A dona vincula a secretária (staff_link exige membership assistant na MESMA clínica).
  const vinculo = await chamar("dona-alfa", "operations", "POST", { action: "staff_link", email: "secretaria-alfa@example.test" });
  assert.equal(vinculo.status, 200, `vínculo: ${JSON.stringify(await vinculo.clone().json())}`);
  const servico = await chamar("dona-alfa", "operations", "POST", { action: "create_service", name: "Consulta", durationMinutes: 30 });
  assert.equal(servico.status, 200);
  const serviceId = ((await corpo(servico)) as { service?: { id: string } }).service?.id
    ?? (raw.prepare(`SELECT id FROM booking_services WHERE clinic_id = ? LIMIT 1`).get(ALFA) as { id: string }).id;

  const painel = await chamar("secretaria-alfa", "operations", "GET");
  assert.equal(painel.status, 200, `assistant vinculada lê a agenda: ${JSON.stringify(await painel.clone().json()).slice(0, 200)}`);
  const acesso = ((await corpo(painel)) as { access: { delegated: boolean; canConfigure: boolean; actorRole: string; providerUserId: string } }).access;
  assert.equal(acesso.delegated, true);
  assert.equal(acesso.canConfigure, false, "assistant opera, não configura");
  assert.equal(acesso.actorRole, "assistant", "papel exposto é o de membership, não o global");
  assert.equal(acesso.providerUserId, "dona-alfa");

  const marcada = await chamar("secretaria-alfa", "operations", "POST", {
    action: "create_appointment", serviceId, startsAtLocal: "2031-03-10T09:00", guardianName: "Responsável Sintético",
  });
  assert.equal(marcada.status, 200, `assistant marca consulta: ${JSON.stringify(await marcada.clone().json())}`);
  const configurar = await chamar("secretaria-alfa", "operations", "POST", { action: "create_service", name: "Indevido", durationMinutes: 30 });
  assert.equal(configurar.status, 403, "assistant não configura serviços");
}
console.log("✓ assistant: 403 em clínica LIVE, opera a agenda vinculada, não configura (S10/AUTHZ-P1-04)");

// ── 3. Financeiro com papel global `professional`: o papel global NÃO dá
//       escrita clínica nem agenda — só a membership decide. ─────────────
{
  const clinico = await chamar("financeiro-alfa", "live-patients", "POST", paciente);
  assert.equal(clinico.status, 403, "financial não escreve dado clínico mesmo com papel global professional");
  const agenda = await chamar("financeiro-alfa", "operations", "GET");
  assert.equal(agenda.status, 403, "financial não opera a agenda");
  assert.equal((await corpo(agenda)).code, "ENTITLEMENT_ROLE_NOT_ALLOWED");
  const contagem = raw.prepare(`SELECT COUNT(*) AS n FROM live_patients WHERE clinic_id = ?`).get(ALFA) as { n: number };
  assert.equal(contagem.n, 1, "nenhuma escrita indevida");
}
console.log("✓ papel global professional + membership financial não escreve clínica nem agenda (OPS-04/LEG-13)");

// ── 4. Conta sem membership em Alfa: header X-Tenant-Id não autoriza nada. ──
{
  const clinico = await chamar("estranho", "live-patients", "POST", paciente);
  assert.equal(clinico.status, 409, "sem membership, o contexto de clínica não resolve");
  assert.equal((await corpo(clinico)).code, "BILLING_CLINIC_CONTEXT_REQUIRED");
  const agenda = await chamar("estranho", "operations", "GET");
  assert.equal(agenda.status, 409);
}
console.log("✓ conta sem membership não alcança Alfa por header");

// ── 5. Rotas legadas single-tenant continuam decididas pelo papel global:
//       `operator` global nunca escreve em /api/consultations, mesmo sendo
//       professional por membership (o legado não tem clinic_id). ─────────
{
  const legado = await chamar("medico-operator-global", "legacy-consultations", "POST", {});
  assert.equal(legado.status, 403, "legado sem tenant continua fechado para papel global operator");
  assert.equal((await corpo(legado)).code, "FORBIDDEN");
  const legadoDona = await chamar("dona-alfa", "legacy-consultations", "POST", {});
  assert.equal(legadoDona.status, 200, "sentinela: papel global professional ainda passa pelo middleware no legado");
}
console.log("✓ legado single-tenant preserva o gate por papel global (sem regressão)");

console.log("✓ S10: membership é a autoridade nas famílias multi-tenant; papel global só decide o legado");
