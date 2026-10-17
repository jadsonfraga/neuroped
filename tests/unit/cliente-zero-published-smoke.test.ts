/**
 * Smoke cliente-zero publicado — o script é exercitado contra o middleware
 * global, os middlewares de diretório e os handlers reais, sobre o schema D1 e
 * todas as migrações em SQLite. O "ambiente publicado" muda só pelo env.
 *
 * Prova que o smoke:
 *  - classifica cadastro, webhook e cobrança fechados como BLOCKED_EXTERNAL,
 *    sem criar conta nem chamar provedor;
 *  - lê onboarding e cobrança só do servidor (sem charge_paid, nunca VERIFIED);
 *  - recusa a identidade técnica E2E antes do login;
 *  - não vaza senha, token, e-mail do titular nem conteúdo clínico no relatório.
 *
 * Nenhum dado de paciente real: todo conteúdo clínico é sintético.
 *
 * Rodar: node --import tsx tests/unit/cliente-zero-published-smoke.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequest as globalMiddleware } from "../../functions/api/_middleware";
import { onRequest as liveMiddleware } from "../../functions/api/live/_middleware";
import { onRequest as tenantMiddleware } from "../../functions/api/tenants/[id]/_middleware";
import { onRequestGet as healthGet } from "../../functions/api/health";
import { onRequestPost as signupPost } from "../../functions/api/auth/signup";
import { onRequestPost as verifyEmailPost } from "../../functions/api/auth/verify-email";
import { onRequestPost as loginPost } from "../../functions/api/auth/login";
import { onRequestPost as webhookPost } from "../../functions/api/billing/webhook";
import { onRequestGet as tenantsGet, onRequestPost as tenantsPost } from "../../functions/api/tenants/index";
import { onRequestGet as onboardingGet } from "../../functions/api/tenants/[id]/onboarding";
import { onRequestGet as auditGet } from "../../functions/api/tenants/[id]/audit";
import { onRequestGet as exportGet } from "../../functions/api/tenants/[id]/export";
import { onRequestPost as lifecyclePost } from "../../functions/api/tenants/[id]/lifecycle";
import { onRequestPost as patientsPost } from "../../functions/api/live/patients/index";
import { onRequestPost as eventsPost } from "../../functions/api/live/events/index";
import { onRequestPost as documentsPost } from "../../functions/api/live/documents/index";
import { currentLegalVersions } from "../../shared/legal";
import {
  SYNTHETIC_GUARDIAN_NAME,
  SYNTHETIC_PATIENT_NAME,
  classifyBillingEvidence,
  runClienteZeroPublishedSmoke,
  smokeTarget,
  type SmokeReport,
} from "../../scripts/ops/cliente-zero-published-smoke";

const ORIGIN = "https://neuroped.test";
const SENHA = "Senha-Smoke-Sintetica1!";

// ── Banco: bootstrap real ───────────────────────────────────────────────────
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

const prepare = (sql: string) => {
  const make = (args: unknown[]) => ({
    async first<T>() {
      return (raw.prepare(sql).get(...(args as never[])) as T | undefined) ?? null;
    },
    async executeBatch() {
      const statement = raw.prepare(sql);
      if (statement.columns().length) return { success: true, results: statement.all(...(args as never[])), meta: {} };
      return this.run();
    },
    async run() {
      const info = raw.prepare(sql).run(...(args as never[]));
      return { meta: { changes: Number(info.changes) } };
    },
    async all<T>() {
      return { results: raw.prepare(sql).all(...(args as never[])) as T[] };
    },
  });
  return { bind: (...args: unknown[]) => make(args), ...make([]) };
};
const db = {
  prepare,
  async batch(statements: Array<{ executeBatch(): Promise<unknown> }>) {
    raw.exec("BEGIN");
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.executeBatch());
      raw.exec("COMMIT");
      return results;
    } catch (error) {
      raw.exec("ROLLBACK");
      throw error;
    }
  },
} as unknown as D1Database;

// ── Ambientes "publicados" ──────────────────────────────────────────────────
const BASE_ENV = {
  DB: db,
  ENVIRONMENT: "production",
  NEUROPED_JWT_SECRET: "smoke-cliente-zero-jwt-secret-32-chars!",
  NEUROPED_E2E_EMAIL: "e2e-tecnico@exemplo.test",
};
const FECHADO = { ...BASE_ENV };
const CADASTRO_SEM_EMAIL = { ...BASE_ENV, SAAS_SIGNUP_ENABLED: "true" };
const CONFIGURADO = {
  ...BASE_ENV,
  SAAS_SIGNUP_ENABLED: "true",
  APP_BASE_URL: ORIGIN,
  AUTH_PUBLIC_APP_URL: ORIGIN,
  AUTH_RESEND_API_KEY: "chave-resend-de-teste-nao-real",
  AUTH_EMAIL_FROM: "NeuroPed <no-reply@neuroped.test>",
  ASAAS_API_KEY: "asaas-chave-de-teste-nao-real",
  ASAAS_WEBHOOK_TOKEN: "token-webhook-de-teste-com-32-caracteres",
  ASAAS_ENVIRONMENT: "sandbox",
  CLINICAL_LIVE_ENABLED: "true",
  CLINICAL_DATA_KEY: "chave-clinica-de-teste-com-32-chars!",
  CLINICAL_INDEX_KEY: "chave-indice-de-teste-com-32-caracteres",
};
const LIVE_DESLIGADO = { ...CONFIGURADO, CLINICAL_LIVE_ENABLED: undefined };

// ── Provedores externos: interceptados e contados ───────────────────────────
const emails: Array<{ to: string[]; text: string }> = [];
let providerCalls = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url === "https://api.resend.com/emails") {
    providerCalls += 1;
    emails.push(JSON.parse(String(init?.body)));
    return new Response("{}", { status: 200 });
  }
  if (url.includes("asaas.com")) {
    providerCalls += 1;
    return new Response("{}", { status: 200 });
  }
  return realFetch(input, init);
}) as typeof fetch;

// ── Roteador: a mesma cadeia do Pages (middleware global → diretório → handler)
type Handler = (context: never) => Promise<Response> | Response;
type Route = { method: string; pattern: RegExp; handler: Handler; scope?: "live" | "tenant" };
const ROUTES: Route[] = [
  { method: "GET", pattern: /^\/api\/health$/, handler: healthGet as Handler },
  { method: "POST", pattern: /^\/api\/auth\/signup$/, handler: signupPost as Handler },
  { method: "POST", pattern: /^\/api\/auth\/login$/, handler: loginPost as Handler },
  { method: "POST", pattern: /^\/api\/billing\/webhook$/, handler: webhookPost as Handler },
  { method: "GET", pattern: /^\/api\/tenants$/, handler: tenantsGet as Handler },
  { method: "POST", pattern: /^\/api\/tenants$/, handler: tenantsPost as Handler },
  { method: "GET", pattern: /^\/api\/tenants\/([^/]+)\/onboarding$/, handler: onboardingGet as Handler, scope: "tenant" },
  { method: "GET", pattern: /^\/api\/tenants\/([^/]+)\/audit$/, handler: auditGet as Handler, scope: "tenant" },
  { method: "GET", pattern: /^\/api\/tenants\/([^/]+)\/export$/, handler: exportGet as Handler, scope: "tenant" },
  { method: "POST", pattern: /^\/api\/tenants\/([^/]+)\/lifecycle$/, handler: lifecyclePost as Handler, scope: "tenant" },
  { method: "POST", pattern: /^\/api\/live\/patients$/, handler: patientsPost as Handler, scope: "live" },
  { method: "POST", pattern: /^\/api\/live\/events$/, handler: eventsPost as Handler, scope: "live" },
  { method: "POST", pattern: /^\/api\/live\/documents$/, handler: documentsPost as Handler, scope: "live" },
];

const requested: string[] = [];
function publishedFetch(env: Record<string, unknown>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    assert.equal(url.origin, ORIGIN, "o smoke só fala com a origem configurada");
    requested.push(`${request.method} ${url.pathname}`);
    const route = ROUTES.find((r) => r.method === request.method && r.pattern.test(url.pathname));
    if (!route) return new Response(JSON.stringify({ code: "NOT_FOUND" }), { status: 404 });
    const id = route.pattern.exec(url.pathname)?.[1];
    const context = {
      request,
      env,
      params: id ? { id: decodeURIComponent(id) } : {},
      data: {} as Record<string, unknown>,
      waitUntil: () => undefined,
      next: async () => new Response(null),
    };
    const handler = () => route.handler(context as never);
    const scoped = route.scope === "live"
      ? () => liveMiddleware({ ...context, next: handler } as never)
      : route.scope === "tenant"
        ? () => tenantMiddleware({ ...context, next: handler } as never)
        : handler;
    context.next = scoped as never;
    return globalMiddleware(context as never);
  }) as typeof fetch;
}

const usuarios = () => (raw.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;

async function cadastrar(email: string, verificar: boolean): Promise<void> {
  const ctx = (request: Request) => ({
    env: CONFIGURADO, request, params: {}, data: {}, waitUntil: () => undefined, next: async () => new Response(null),
  }) as never;
  const resposta = await signupPost(ctx(new Request(`${ORIGIN}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Dra. Titular Sintética", email, password: SENHA, acceptedLegal: currentLegalVersions() }),
  })));
  assert.equal(resposta.status, 201, `cadastro sintético de ${email}`);
  if (!verificar) return;
  const mensagem = emails.findLast((e) => e.to.includes(email));
  const token = mensagem?.text.match(/verificar-email\?token=([0-9a-f]{64})/)?.[1];
  assert.ok(token, "link de verificação entregue ao interceptador");
  const confirmacao = await verifyEmailPost(ctx(new Request(`${ORIGIN}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })));
  assert.equal(confirmacao.status, 200);
}

const status = (report: SmokeReport) => Object.fromEntries(report.steps.map((s) => [s.id, `${s.status}:${s.code}`]));
const semSegredo = (report: SmokeReport, ...proibidos: string[]) => {
  const texto = JSON.stringify(report);
  for (const proibido of proibidos) assert.ok(!texto.includes(proibido), `relatório vazou: ${proibido}`);
};

// ═══ Origem e classificação de cobrança ═════════════════════════════════════
assert.throws(() => smokeTarget("http://neuroped.pages.dev"), /SMOKE_BASE_URL_MUST_BE_HTTPS/);
assert.equal(smokeTarget("https://user:senha@neuroped.pages.dev/x?y=1"), "https://neuroped.pages.dev");
assert.equal(smokeTarget("http://127.0.0.1:8788"), "http://127.0.0.1:8788");
assert.equal(classifyBillingEvidence("SERVER_CONFIRMED").status, "VERIFIED");
assert.deepEqual(
  [classifyBillingEvidence("AWAITING_PROVIDER_EVENT").code, classifyBillingEvidence("BLOCKED_EXTERNAL").code],
  ["AWAITING_PROVIDER_EVENT", "BLOCKED_EXTERNAL_ASAAS"],
);
assert.equal(classifyBillingEvidence(undefined).status, "FAILED");

// ═══ 1. Instalação fechada, sem titular: só sondas, nada criado ═════════════
{
  const antes = usuarios();
  providerCalls = 0;
  const report = await runClienteZeroPublishedSmoke({ baseUrl: ORIGIN, fetchImpl: publishedFetch(FECHADO), owner: null });
  const s = status(report);
  assert.equal(s.api_health, "VERIFIED:HEALTH_OK");
  assert.match(report.steps[0].detail, /CLINICAL_LIVE_DISABLED/, "bloqueios do /api/health são relatados");
  assert.equal(s.signup_gate, "BLOCKED_EXTERNAL:SIGNUP_DISABLED");
  assert.equal(s.billing_webhook_gate, "BLOCKED_EXTERNAL:BLOCKED_EXTERNAL_ASAAS");
  assert.equal(s.owner_login, "NOT_RUN:OWNER_CREDENTIALS_ABSENT");
  assert.equal(s.document, "NOT_RUN:DEPENDS_ON_OWNER_LOGIN");
  assert.equal(report.verdict, "BLOCKED_EXTERNAL");
  assert.equal(report.exitCode, 2);
  assert.ok(report.doesNotProve.includes("PAGAMENTO_REAL"));
  assert.ok(report.doesNotProve.includes("RECEITA"));
  assert.equal(usuarios(), antes, "a sonda de cadastro não cria conta");
  assert.equal(providerCalls, 0, "nenhuma chamada a Asaas ou Resend");
}

// ═══ 2. Cadastro aberto sem e-mail: bloqueio do Resend ══════════════════════
{
  const report = await runClienteZeroPublishedSmoke({ baseUrl: ORIGIN, fetchImpl: publishedFetch(CADASTRO_SEM_EMAIL) });
  assert.equal(status(report).signup_gate, "BLOCKED_EXTERNAL:BLOCKED_EXTERNAL_RESEND");
}

// ═══ 3. Identidade técnica E2E: recusada antes do login ═════════════════════
{
  requested.length = 0;
  const report = await runClienteZeroPublishedSmoke({
    baseUrl: ORIGIN,
    fetchImpl: publishedFetch(CONFIGURADO),
    owner: { email: "E2E-Tecnico@exemplo.test", password: SENHA },
    reservedEmails: [BASE_ENV.NEUROPED_E2E_EMAIL],
  });
  assert.equal(status(report).owner_login, "FAILED:OWNER_IS_RESERVED_E2E_IDENTITY");
  assert.ok(!requested.includes("POST /api/auth/login"), "nenhum login com a identidade reservada");
  assert.equal(report.exitCode, 1);
}

// ═══ 4. Titular sem e-mail verificado: sem bypass, sem clínica ══════════════
{
  await cadastrar("nao-verificada@exemplo.test", false);
  const report = await runClienteZeroPublishedSmoke({
    baseUrl: ORIGIN,
    fetchImpl: publishedFetch(CONFIGURADO),
    owner: { email: "nao-verificada@exemplo.test", password: SENHA },
    writeSynthetic: true,
  });
  const s = status(report);
  assert.equal(s.owner_login, "VERIFIED:OWNER_SESSION");
  assert.equal(s.clinic, "BLOCKED_EXTERNAL:EMAIL_VERIFICATION_REQUIRED");
  assert.equal(s.email_verified, "BLOCKED_EXTERNAL:BLOCKED_EXTERNAL_RESEND");
  assert.equal(s.patient, "NOT_RUN:DEPENDS_ON_CLINIC");
  const verificado = raw.prepare("SELECT email_verified_at FROM users WHERE email = ?").get("nao-verificada@exemplo.test") as { email_verified_at: string | null };
  assert.equal(verificado.email_verified_at, null, "o smoke nunca marca e-mail como verificado");
  assert.equal((raw.prepare("SELECT COUNT(*) AS n FROM clinics").get() as { n: number }).n, 0);
}

// ═══ 5. Ambiente configurado, titular verificado: jornada completa ══════════
await cadastrar("titular-smoke@exemplo.test", true);
const titular = { email: "titular-smoke@exemplo.test", password: SENHA };
{
  const antes = usuarios();
  providerCalls = 0;
  const report = await runClienteZeroPublishedSmoke({
    baseUrl: ORIGIN,
    fetchImpl: publishedFetch(CONFIGURADO),
    owner: titular,
    reservedEmails: [BASE_ENV.NEUROPED_E2E_EMAIL],
    writeSynthetic: true,
    closeClinic: true,
  });
  const s = status(report);
  assert.deepEqual(s, {
    api_health: "VERIFIED:HEALTH_OK",
    signup_gate: "VERIFIED:SIGNUP_OPEN",
    billing_webhook_gate: "VERIFIED:WEBHOOK_REJECTS_UNAUTHENTICATED",
    owner_login: "VERIFIED:OWNER_SESSION",
    clinic: "VERIFIED:SMOKE_CLINIC_CREATED",
    email_verified: "VERIFIED:SERVER_EMAIL_VERIFIED_AT",
    plan: "VERIFIED:PLAN_PERSISTED",
    billing: "BLOCKED_EXTERNAL:AWAITING_PROVIDER_EVENT",
    membership: "VERIFIED:OWNER_MEMBERSHIP",
    first_member: "NOT_RUN:INVITE_REQUIRES_RECIPIENT_INBOX",
    patient: "VERIFIED:SYNTHETIC_PATIENT_CREATED",
    consultation: "VERIFIED:SYNTHETIC_ENCOUNTER_CREATED",
    document: "VERIFIED:SYNTHETIC_DRAFT_CREATED",
    audit: "VERIFIED:AUDIT_METADATA_ONLY",
    export: "VERIFIED:EXPORT_COMPLETE_WITH_DIGEST",
    onboarding_server: "VERIFIED:ONBOARDING_SERVER_COMPUTED",
    closure: "VERIFIED:CLOSURE_REQUESTED",
  });
  assert.equal(report.verdict, "BLOCKED_EXTERNAL", "sem charge_paid a venda não está comprovada");
  assert.equal(report.exitCode, 2);
  assert.deepEqual(report.billingEvidence, { status: "AWAITING_PROVIDER_EVENT", environment: "sandbox" });
  assert.equal(report.onboarding?.milestones.billing_configured, "pending");
  assert.equal(report.onboarding?.milestones.first_document, "completed");
  assert.equal(report.clinic?.reused, false);
  assert.ok(typeof report.clinicToFirstDocumentMs === "number");

  // Efeitos persistidos: só o que a jornada sintética deveria criar.
  assert.equal(usuarios(), antes, "a sonda de cadastro aberta não cria conta");
  assert.equal(providerCalls, 0, "o smoke não cria checkout nem envia e-mail");
  assert.equal((raw.prepare("SELECT COUNT(*) AS n FROM billing_provider_checkouts").get() as { n: number }).n, 0);
  assert.equal(
    (raw.prepare("SELECT COUNT(*) AS n FROM billing_invoice_events WHERE kind = 'charge_paid'").get() as { n: number }).n,
    0,
    "nenhum pagamento é presumido",
  );
  const paciente = raw.prepare("SELECT profile_encrypted FROM live_patients").get() as { profile_encrypted: string };
  assert.doesNotMatch(paciente.profile_encrypted, new RegExp(SYNTHETIC_PATIENT_NAME), "perfil cifrado no banco");
  const documento = raw.prepare("SELECT status FROM live_documents").get() as { status: string };
  assert.equal(documento.status, "draft", "o documento nunca é finalizado pelo smoke");
  const clinica = raw.prepare("SELECT status FROM clinics WHERE name LIKE 'Clínica Sintética Smoke%'").get() as { status: string };
  assert.equal(clinica.status, "suspended", "encerramento pedido suspende a clínica sintética");

  semSegredo(report, titular.email, SENHA, SYNTHETIC_PATIENT_NAME, SYNTHETIC_GUARDIAN_NAME, "Bearer", "accessToken");
}

// ═══ 6. Sem --close-clinic: a clínica sintética é reaproveitada ═════════════
{
  const primeira = await runClienteZeroPublishedSmoke({ baseUrl: ORIGIN, fetchImpl: publishedFetch(CONFIGURADO), owner: titular });
  assert.equal(status(primeira).clinic, "VERIFIED:SMOKE_CLINIC_CREATED", "clínica encerrada não é reaproveitada");
  assert.equal(status(primeira).patient, "NOT_RUN:SYNTHETIC_WRITES_NOT_REQUESTED");
  assert.equal(status(primeira).closure, "NOT_RUN:CLOSURE_NOT_REQUESTED");
  const segunda = await runClienteZeroPublishedSmoke({ baseUrl: ORIGIN, fetchImpl: publishedFetch(CONFIGURADO), owner: titular });
  assert.equal(status(segunda).clinic, "VERIFIED:SMOKE_CLINIC_REUSED");
  assert.equal(
    (raw.prepare("SELECT COUNT(*) AS n FROM clinics WHERE name LIKE 'Clínica Sintética Smoke%' AND status = 'active'").get() as { n: number }).n,
    1,
  );
}

// ═══ 7. Camada clínica desligada: bloqueio declarado, não falha ═════════════
{
  const report = await runClienteZeroPublishedSmoke({
    baseUrl: ORIGIN,
    fetchImpl: publishedFetch(LIVE_DESLIGADO),
    owner: titular,
    writeSynthetic: true,
  });
  const s = status(report);
  assert.equal(s.patient, "BLOCKED_EXTERNAL:CLINICAL_LIVE_DISABLED");
  assert.equal(s.document, "NOT_RUN:DEPENDS_ON_PATIENT");
  assert.equal(report.verdict, "BLOCKED_EXTERNAL", JSON.stringify(s));
}

globalThis.fetch = realFetch;
console.log("✓ smoke cliente-zero publicado: sondas sem efeito, onboarding e cobrança lidos do servidor, sem bypass nem vazamento");
