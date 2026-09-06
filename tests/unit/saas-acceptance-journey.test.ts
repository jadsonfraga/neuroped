/**
 * Jornada de aceite do SaaS, ponta a ponta, sobre HANDLERS REAIS e MIGRAÇÕES
 * REAIS (schema.d1.sql + 0003/0007/0008/0009/0010/0012/0013/0014/0015/0019/0024):
 *
 * 1. Pessoa desconhecida cria conta (signup), CONFIRMA o e-mail e cria sua
 *    clínica — a confirmação é parte do caminho vendável, não um contorno;
 * 2. trial de 14 dias + 2 assentos + lifecycle nascem por trigger;
 * 3. entitlement/capabilities refletem o trial;
 * 4. convida um profissional (link /#/invite), que aceita criando conta;
 * 5. uma segunda pessoa cria clínica independente;
 * 6. ADVERSARIAL: a clínica B não lê, altera, enumera nem convida na clínica
 *    A por nenhum endpoint novo (tenants/:id, settings, members, invitations,
 *    billing/me com clinicId alheio);
 * 7. limite de assentos nega o terceiro membro.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { onRequestPost as signupPost } from "../../functions/api/auth/signup";
import { onRequestPost as verifyEmailPost } from "../../functions/api/auth/verify-email";
import { onRequestPost as tenantsPost } from "../../functions/api/tenants/index";
import {
  onRequestGet as tenantDetailGet,
  onRequestPatch as tenantDetailPatch,
} from "../../functions/api/tenants/[id]/index";
import { onRequestGet as membersGet } from "../../functions/api/tenants/[id]/members";
import {
  onRequestGet as invitationsGet,
  onRequestPost as invitationsPost,
} from "../../functions/api/billing/invitations";
import { onRequestPost as acceptPost } from "../../functions/api/billing/accept";
import { billingMe } from "../../functions/api/billing/me";

const SECRET = "acceptance-journey-jwt-secret-32chars!";
const APP_BASE_URL = "https://app.neuroped.test";
const STRONG_PASSWORD = "Senha-Fort3-Unica!";

function makeDb(raw: DatabaseSync) {
  const prepare = (sql: string) => {
    const make = (args: unknown[]) => ({
      async first<T>() {
        return (raw.prepare(sql).get(...(args as never[])) as T | undefined) ?? null;
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
  return {
    prepare,
    async batch(statements: Array<{ run(): Promise<unknown> }>) {
      raw.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        raw.exec("COMMIT");
        return results;
      } catch (error) {
        raw.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as D1Database;
}

const raw = new DatabaseSync(":memory:");
raw.exec("PRAGMA foreign_keys = ON;");
for (const file of [
  "db/schema.d1.sql",
  "db/migrations/0003_refresh_sessions.sql",
  "db/migrations/0007_operational_suite.sql",
  "db/migrations/0008_operational_hardening.sql",
  "db/migrations/0009_saas_phase1_foundation.sql",
  "db/migrations/0010_saas_phase1_hardening.sql",
  "db/migrations/0012_saas_billing_onboarding.sql",
  "db/migrations/0013_saas_billing_provider.sql",
  "db/migrations/0014_saas_tenant_lifecycle.sql",
  "db/migrations/0015_saas_billing_trial_seats_hardening.sql",
  "db/migrations/0019_saas_identity_settings.sql",
  "db/migrations/0024_email_verification.sql",
]) {
  raw.exec(readFileSync(file, "utf8"));
}
const db = makeDb(raw);
const env = {
  DB: db,
  NEUROPED_JWT_SECRET: SECRET,
  SAAS_SIGNUP_ENABLED: "true",
  APP_BASE_URL,
  // Entrega configurada para que o cadastro emita de fato o link de
  // confirmação: a jornada verifica o e-mail pelo caminho real, e não
  // marcando a coluna na unha.
  AUTH_PUBLIC_APP_URL: APP_BASE_URL,
  AUTH_RESEND_API_KEY: "re_synthetic_journey_key",
  AUTH_EMAIL_FROM: "NeuroPed <no-reply@neuroped.test>",
};

const sentEmails: Array<{ to: string[]; text: string }> = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url !== "https://api.resend.com/emails") return realFetch(input, init);
  sentEmails.push(JSON.parse(String(init?.body)) as { to: string[]; text: string });
  return new Response("{}", { status: 200 });
}) as typeof fetch;

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
}

function context(request: Request, user: SessionUser | null, params: Record<string, string> = {}) {
  return {
    env,
    request,
    params,
    data: user ? { authUser: user } : {},
    waitUntil: () => undefined,
    next: async () => new Response(null),
  } as unknown as Parameters<typeof signupPost>[0];
}

function jsonRequest(url: string, method: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function signup(name: string, email: string): Promise<SessionUser> {
  const response = await signupPost(
    context(jsonRequest("https://x.test/api/auth/signup", "POST", { name, email, password: STRONG_PASSWORD }), null),
  );
  assert.equal(response.status, 201, `signup de ${email}`);
  const body = (await response.json()) as {
    user: { id: string; email: string; name: string; role: string };
    emailVerificationRequired?: boolean;
  };
  assert.equal(
    body.emailVerificationRequired,
    true,
    `o cadastro de ${email} precisa exigir confirmação de e-mail`,
  );
  await confirmEmail(email);
  return { ...body.user, mustChangePassword: false };
}

/**
 * Confirma a posse do e-mail pelo caminho real: pega o token do link que o
 * cadastro enviou e troca pelo estado verificado. Marcar a coluna na unha
 * provaria menos — a jornada precisa passar pelo mesmo fluxo do cliente.
 */
async function confirmEmail(email: string): Promise<void> {
  const message = sentEmails.findLast((sent) => sent.to.includes(email));
  assert.ok(message, `o cadastro de ${email} precisa ter enviado o link de confirmação`);
  const match = message.text.match(/verificar-email\?token=([0-9a-f]{64})/);
  assert.ok(match, `o e-mail para ${email} precisa conter o token de confirmação`);

  const response = await verifyEmailPost(
    context(jsonRequest("https://x.test/api/auth/verify-email", "POST", { token: match[1] }), null),
  );
  assert.equal(response.status, 200, `confirmação de e-mail de ${email}`);
}

async function createClinic(user: SessionUser, name: string): Promise<string> {
  const response = await tenantsPost(
    context(jsonRequest("https://x.test/api/tenants", "POST", { name }), user) as never,
  );
  assert.equal(response.status, 201, `criação da clínica ${name}`);
  return ((await response.json()) as { id: string }).id;
}

// ── 1-2. Pessoa desconhecida → conta → clínica → trial por trigger ─────────
const ownerA = await signup("Dra. Alice Prado", "alice@a.test");
assert.equal(ownerA.role, "professional");
const clinicA = await createClinic(ownerA, "Clínica Alice");

const customer = raw
  .prepare("SELECT status, trial_ends_at FROM billing_customers WHERE clinic_id = ?")
  .get(clinicA) as { status: string; trial_ends_at: string };
assert.equal(customer.status, "trial", "clínica nova nasce em trial (trigger)");
const subscription = raw
  .prepare(
    `SELECT bs.seats, bs.status FROM billing_subscriptions bs
      JOIN billing_customers bc ON bc.id = bs.customer_id WHERE bc.clinic_id = ?`,
  )
  .get(clinicA) as { seats: number; status: string };
assert.equal(subscription.seats, 2, "trial nasce com 2 assentos");
assert.ok(
  raw.prepare("SELECT status FROM tenant_lifecycle WHERE clinic_id = ?").get(clinicA),
  "lifecycle nasce junto do tenant",
);

// ── 3. Entitlement/capabilities refletem o trial ────────────────────────────
{
  const response = await billingMe(env as never, ownerA, "clinical", clinicA);
  const body = (await response.json()) as {
    entitlement: { trialActive: boolean; trialDaysRemaining: number; isActive: boolean };
    seats: { contracted: number; activeMembers: number };
    capabilities: { canUseClinicalCore: boolean; billingActive: boolean };
  };
  assert.equal(body.entitlement.trialActive, true);
  assert.ok(body.entitlement.trialDaysRemaining >= 13, "trial de 14 dias reportado");
  assert.equal(body.entitlement.isActive, true);
  assert.equal(body.seats.contracted, 2);
  assert.equal(body.seats.activeMembers, 1);
  assert.equal(body.capabilities.canUseClinicalCore, true, "capabilities centrais ligadas no trial");
}

// ── 4. Convite → aceite cria conta e membership ─────────────────────────────
const inviteToken = await (async () => {
  const response = await invitationsPost(
    context(
      jsonRequest("https://x.test/api/billing/invitations", "POST", {
        clinicId: clinicA,
        email: "bruno@a.test",
        role: "professional",
        action: "create",
      }),
      ownerA,
    ) as never,
  );
  assert.equal(response.status, 201, "gestora convida com assento livre");
    // Com transporte configurado o servidor NÃO devolve o link ao convidante:
    // o token vai por e-mail a quem precisa provar posse do endereço. A jornada
    // lê o link do e-mail entregue, que é o caminho real do convidado.
    const body = (await response.json()) as { delivery: string; invitationUrl?: string };
    assert.equal(body.delivery, "email", "com entrega configurada o convite sai por e-mail");
    assert.equal(body.invitationUrl, undefined, "o link do convite não pode voltar ao convidante");
    const message = sentEmails.findLast((sent) => sent.to.includes("bruno@a.test"));
    assert.ok(message, "o convite precisa ter sido enviado por e-mail");
    assert.match(message.text, /\/#\/invite\?token=/, "link do convite aponta para a rota real do SPA");
    const token = decodeURIComponent(message.text.match(/invite\?token=([^\s]+)/)?.[1] ?? "");
    assert.ok(token.length >= 32);
    return token;
})();
{
  const response = await acceptPost(
    context(
      jsonRequest("https://x.test/api/billing/accept", "POST", {
        token: inviteToken,
        name: "Dr. Bruno Reis",
        password: "SenhaConvite1!",
      }),
      null,
    ) as never,
  );
  assert.equal(response.status, 201, "aceite anônimo cria a conta do convidado");
  const body = (await response.json()) as { accountCreated: boolean; role: string; clinicId: string };
  assert.equal(body.accountCreated, true);
  assert.equal(body.role, "professional");
  assert.equal(body.clinicId, clinicA);
}
{
  const response = await membersGet(
    context(new Request(`https://x.test/api/tenants/${clinicA}/members`), ownerA, { id: clinicA }) as never,
  );
  assert.equal(response.status, 200);
  const body = (await response.json()) as { data: Array<{ email: string; role: string }> };
  assert.equal(body.data.length, 2, "equipe mostra os dois membros");
}

// ── 5. Segunda clínica independente ─────────────────────────────────────────
const ownerB = await signup("Dr. Caio Nunes", "caio@b.test");
const clinicB = await createClinic(ownerB, "Clínica Caio");
assert.notEqual(clinicA, clinicB);

// ── 6. ADVERSARIAL: B não alcança NADA da clínica A ─────────────────────────
{
  const detail = await tenantDetailGet(
    context(new Request(`https://x.test/api/tenants/${clinicA}`), ownerB, { id: clinicA }) as never,
  );
  assert.equal(detail.status, 403, "B não lê o tenant A");

  const patch = await tenantDetailPatch(
    context(jsonRequest(`https://x.test/api/tenants/${clinicA}`, "PATCH", { name: "Tomada hostil" }), ownerB, {
      id: clinicA,
    }) as never,
  );
  assert.equal(patch.status, 403, "B não altera o tenant A");
  const intact = raw.prepare("SELECT name FROM clinics WHERE id = ?").get(clinicA) as { name: string };
  assert.equal(intact.name, "Clínica Alice");

  const members = await membersGet(
    context(new Request(`https://x.test/api/tenants/${clinicA}/members`), ownerB, { id: clinicA }) as never,
  );
  assert.notEqual(members.status, 200, "B não enumera a equipe de A");

  const invitations = await invitationsGet(
    context(new Request(`https://x.test/api/billing/invitations?clinicId=${clinicA}`), ownerB) as never,
  );
  assert.notEqual(invitations.status, 200, "B não lista convites de A");

  const hostileInvite = await invitationsPost(
    context(
      jsonRequest("https://x.test/api/billing/invitations", "POST", {
        clinicId: clinicA,
        email: "intruso@b.test",
        role: "clinic_admin",
        action: "create",
      }),
      ownerB,
    ) as never,
  );
  assert.notEqual(hostileInvite.status, 201, "B não injeta convite na clínica A");

  const spoofedBilling = await billingMe(env as never, ownerB, "clinical", clinicA);
  const spoofedBody = (await spoofedBilling.json()) as { membership: unknown; clinicStatus: unknown };
  assert.equal(spoofedBody.membership, null, "billing/me com clinicId alheio não revela membership");
  assert.equal(spoofedBody.clinicStatus, null, "nem sequer o status da clínica alheia vaza");
}

// ── 6b. Papel sem gestão não convida nem edita o próprio tenant ─────────────
{
  const invitedRow = raw.prepare("SELECT id, name, email, role FROM users WHERE email = 'bruno@a.test'").get() as {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  const invited: SessionUser = { ...invitedRow, mustChangePassword: false };
  const inviteAsMember = await invitationsPost(
    context(
      jsonRequest("https://x.test/api/billing/invitations", "POST", {
        clinicId: clinicA,
        email: "outra@a.test",
        role: "professional",
        action: "create",
      }),
      invited,
    ) as never,
  );
  assert.notEqual(inviteAsMember.status, 201, "professional sem gestão não convida");

  const patchAsMember = await tenantDetailPatch(
    context(jsonRequest(`https://x.test/api/tenants/${clinicA}`, "PATCH", { name: "x" }), invited, {
      id: clinicA,
    }) as never,
  );
  assert.equal(patchAsMember.status, 403, "professional sem gestão não edita o tenant");
}

// ── 7. Limite de assentos nega o 3º membro ──────────────────────────────────
{
  const response = await invitationsPost(
    context(
      jsonRequest("https://x.test/api/billing/invitations", "POST", {
        clinicId: clinicA,
        email: "terceiro@a.test",
        role: "professional",
        action: "create",
      }),
      ownerA,
    ) as never,
  );
  assert.equal(response.status, 409, "sem assento livre o convite é negado");
  const body = (await response.json()) as { code: string };
  assert.equal(body.code, "SEAT_LIMIT_REACHED");
}

// ── 8. Achado da revisão adversarial (03/09): sem o opt-in do operador, o ──
// aceite anônimo NÃO cria identidade de login nova — o token do convite fica
// com o convidante e, sem verificação de e-mail, ele poderia registrar uma
// conta com o e-mail de um terceiro (impersonação + bloqueio do cadastro).
{
  const inviteB = await invitationsPost(
    context(
      jsonRequest("https://x.test/api/billing/invitations", "POST", {
        clinicId: clinicB,
        email: "vitima@hospital.test",
        role: "professional",
        action: "create",
      }),
      ownerB,
    ) as never,
  );
  assert.equal(inviteB.status, 201);
  // Mesmo aqui o link vem do e-mail: é assim que a vítima o receberia, e é
  // justamente por isso que o convidante não consegue usá-lo em nome dela.
  const inviteBMessage = sentEmails.findLast((sent) => sent.to.includes("vitima@hospital.test"));
  assert.ok(inviteBMessage, "o convite precisa ter sido enviado à pessoa convidada");
  const tokenB = decodeURIComponent(
    inviteBMessage.text.match(/invite\?token=([^\s]+)/)?.[1] ?? "",
  );
  assert.ok(tokenB.length >= 32);

  const closedEnv = { ...env, SAAS_SIGNUP_ENABLED: undefined };
  const closedAccept = await acceptPost({
    env: closedEnv,
    request: jsonRequest("https://x.test/api/billing/accept", "POST", {
      token: tokenB,
      name: "Dr. Impostor",
      password: "SenhaImpostor1!",
    }),
    params: {},
    data: {},
    waitUntil: () => undefined,
    next: async () => new Response(null),
  } as never);
  assert.equal(closedAccept.status, 503, "sem opt-in do operador, aceite anônimo não cria conta");
  assert.equal(
    ((await closedAccept.json()) as { code: string }).code,
    "INVITE_ACCOUNT_CREATION_DISABLED",
  );
  assert.equal(
    raw.prepare("SELECT COUNT(*) AS n FROM users WHERE email = 'vitima@hospital.test'").get()!.n,
    0,
    "nenhuma identidade de login nasce para o e-mail convidado sem o funil habilitado",
  );

  // Com o funil habilitado (go-live consciente do operador), o mesmo convite
  // volta a funcionar — a trava não quebra o fluxo legítimo.
  const openAccept = await acceptPost(
    context(
      jsonRequest("https://x.test/api/billing/accept", "POST", {
        token: tokenB,
        name: "Dra. Convidada Real",
        password: "SenhaConvite2!",
      }),
      null,
    ) as never,
  );
  assert.equal(openAccept.status, 201, "com SAAS_SIGNUP_ENABLED o aceite anônimo segue funcionando");
}

console.log(
  "✓ jornada SaaS de aceite: signup → clínica+trial → convite/aceite → segunda clínica isolada; adversarial multitenant, teto de assentos e trava de conta-via-convite aprovados",
);
