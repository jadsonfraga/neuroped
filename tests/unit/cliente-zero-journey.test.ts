/**
 * CLIENTE ZERO — a jornada comercial inteira, sobre handlers reais e o schema
 * real (db/schema.d1.sql + todas as migrações, pela mesma política de
 * bootstrap travada em schema-bootstrap-contract).
 *
 * Por que este teste existe separado da jornada de aceite: aquela prova que o
 * produto ACEITA um cliente (cadastro, clínica, convite, isolamento). Esta
 * prova que ele o ATENDE do começo ao fim — descobrir preço, pagar de verdade
 * pelo webhook do provedor, operar clinicamente, exercer direitos LGPD,
 * trocar senha, cancelar e encerrar. É a diferença entre "arquitetura existe"
 * e "vendável".
 *
 * Duas clínicas o tempo todo: CLINICA_AZUL faz a jornada; CLINICA_VERMELHA
 * existe para provar, em cada superfície nova, que AZUL não a alcança.
 *
 * Nenhum dado de paciente real: todo conteúdo clínico aqui é sintético.
 *
 * Rodar: node --import tsx tests/unit/cliente-zero-journey.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequestPost as signupPost } from "../../functions/api/auth/signup";
import { onRequestPost as verifyEmailPost } from "../../functions/api/auth/verify-email";
import { onRequestPost as changePasswordPost } from "../../functions/api/auth/change-password";
import { onRequestPost as tenantsPost } from "../../functions/api/tenants/index";
import { onRequestPost as invitationsPost } from "../../functions/api/billing/invitations";
import { onRequestPost as acceptPost } from "../../functions/api/billing/accept";
import { onRequestPost as membersPost } from "../../functions/api/tenants/[id]/members";
import { onRequestPost as checkoutPost } from "../../functions/api/billing/checkout";
import { onRequestPost as webhookPost } from "../../functions/api/billing/webhook";
import { onRequestGet as exportGet } from "../../functions/api/tenants/[id]/export";
import { onRequestPost as lifecyclePost } from "../../functions/api/tenants/[id]/lifecycle";
import { onRequestPost as patientsPost } from "../../functions/api/live/patients/index";
import { onRequestPost as governancePost } from "../../functions/api/live/governance/index";
import { billingMe } from "../../functions/api/billing/me";
import { CANONICAL_PRICE_CENTS } from "../../shared/billing";

const SECRET = "cliente-zero-jwt-secret-com-32-chars!";
const APP_BASE_URL = "https://app.neuroped.test";
const SENHA = "Senha-Cliente-Zero1!";

// ── Banco: bootstrap real ───────────────────────────────────────────────────
const raw = new DatabaseSync(":memory:");
raw.exec("PRAGMA foreign_keys = OFF;");
raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
const superadas: string[] = [];
for (const nome of readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort()) {
  try {
    raw.exec(readFileSync(`db/migrations/${nome}`, "utf8"));
  } catch (erro) {
    // Só sobreposição com o schema base é tolerada — a política está travada
    // em tests/unit/schema-bootstrap-contract.test.mjs.
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

const env = {
  DB: db,
  NEUROPED_JWT_SECRET: SECRET,
  SAAS_SIGNUP_ENABLED: "true",
  APP_BASE_URL,
  AUTH_PUBLIC_APP_URL: APP_BASE_URL,
  AUTH_RESEND_API_KEY: "chave-de-teste-nao-real",
  AUTH_EMAIL_FROM: "NeuroPed <no-reply@neuroped.test>",
  ASAAS_API_KEY: "asaas-chave-de-teste-nao-real",
  ASAAS_WEBHOOK_TOKEN: "token-webhook-de-teste-com-32-caracteres",
  ASAAS_ENVIRONMENT: "sandbox",
  CLINICAL_LIVE_ENABLED: "true",
  CLINICAL_DATA_KEY: "chave-clinica-de-teste-com-32-chars!",
  CLINICAL_INDEX_KEY: "chave-indice-de-teste-com-32-caracteres",
};

// ── Provedores externos, interceptados ──────────────────────────────────────
const emails: Array<{ to: string[]; subject: string; text: string }> = [];
let checkoutSeq = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url === "https://api.resend.com/emails") {
    emails.push(JSON.parse(String(init?.body)));
    return new Response("{}", { status: 200 });
  }
  if (url.includes("api-sandbox.asaas.com") && url.endsWith("/checkouts")) {
    checkoutSeq += 1;
    const id = `checkout-sandbox-${checkoutSeq}`;
    return new Response(
      JSON.stringify({ id, link: `https://sandbox.asaas.com/c/${id}`, status: "ACTIVE" }),
      { status: 200 },
    );
  }
  if (url.includes("api-sandbox.asaas.com")) {
    // Cancelamento de recorrência/checkout no provedor. 200 basta: o handler
    // só distingue sucesso de falha.
    return new Response("{}", { status: 200 });
  }
  return realFetch(input, init);
}) as typeof fetch;

interface Sessao {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
}

function ctx(request: Request, user: Sessao | null, params: Record<string, string> = {}) {
  return {
    env,
    request,
    params,
    data: user ? { authUser: user } : {},
    waitUntil: () => undefined,
    next: async () => new Response(null),
  } as never;
}
const req = (url: string, method: string, body?: unknown) =>
  new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const linkDoEmail = (destinatario: string, padrao: RegExp): string => {
  const mensagem = emails.findLast((e) => e.to.includes(destinatario));
  assert.ok(mensagem, `nenhum e-mail entregue a ${destinatario}`);
  const achado = mensagem.text.match(padrao);
  assert.ok(achado, `e-mail para ${destinatario} sem o link esperado`);
  return decodeURIComponent(achado[1]);
};

// ═══ 1-5. Visitante → conta → confirmação de posse do e-mail ════════════════
async function cadastrar(nome: string, email: string): Promise<Sessao> {
  const resposta = await signupPost(
    ctx(req("https://x.test/api/auth/signup", "POST", { name: nome, email, password: SENHA }), null),
  );
  assert.equal(resposta.status, 201, `cadastro de ${email}`);
  const corpo = (await resposta.json()) as {
    user: { id: string; email: string; name: string; role: string };
    emailVerificationRequired?: boolean;
  };
  assert.equal(corpo.emailVerificationRequired, true, "cadastro exige confirmação de posse");

  const token = linkDoEmail(email, /verificar-email\?token=([0-9a-f]{64})/);
  const confirmacao = await verifyEmailPost(
    ctx(req("https://x.test/api/auth/verify-email", "POST", { token }), null),
  );
  assert.equal(confirmacao.status, 200, `confirmação de ${email}`);
  return { ...corpo.user, mustChangePassword: false };
}

const azul = await cadastrar("Dra. Ana Duarte", "ana@azul.test");
const vermelha = await cadastrar("Dr. Rui Vasques", "rui@vermelha.test");

// ═══ 6-7. Cria clínica (o gate de e-mail confirmado deixa passar) ═══════════
async function criarClinica(dono: Sessao, nome: string): Promise<string> {
  const resposta = await tenantsPost(ctx(req("https://x.test/api/tenants", "POST", { name: nome }), dono));
  assert.equal(resposta.status, 201, `criação de ${nome}`);
  return ((await resposta.json()) as { id: string }).id;
}
const CLINICA_AZUL = await criarClinica(azul, "Clínica Azul");
const CLINICA_VERMELHA = await criarClinica(vermelha, "Clínica Vermelha");
assert.notEqual(CLINICA_AZUL, CLINICA_VERMELHA);

// ═══ 8-11. Escolhe plano → checkout → pagamento → entitlement ══════════════
const checkout = await (async () => {
  const resposta = await checkoutPost(
    ctx(req("https://x.test/api/billing/checkout", "POST", { clinicId: CLINICA_AZUL, seats: 2 }), azul),
  );
  assert.equal(resposta.status, 201, "gestora inicia checkout");
  const corpo = (await resposta.json()) as {
    providerCheckoutId: string;
    url: string;
    monthlyPriceCents: number;
  };
  assert.equal(
    corpo.monthlyPriceCents,
    CANONICAL_PRICE_CENTS * 2,
    "o preço cobrado vem do domínio, não da requisição",
  );
  assert.match(corpo.url, /^https:\/\/sandbox\.asaas\.com\//);
  return corpo;
})();

const referenciaExterna = (
  raw
    .prepare("SELECT external_reference FROM billing_provider_checkouts WHERE provider_checkout_id = ?")
    .get(checkout.providerCheckoutId) as { external_reference: string }
).external_reference;

async function entregarWebhook(evento: unknown, token = env.ASAAS_WEBHOOK_TOKEN) {
  return webhookPost({
    env,
    request: new Request("https://x.test/api/billing/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json", "asaas-access-token": token },
      body: JSON.stringify(evento),
    }),
    params: {},
    data: {},
    waitUntil: () => undefined,
    next: async () => new Response(null),
  } as never);
}

// Webhook sem o token do provedor não move dinheiro nenhum.
{
  const forjado = await entregarWebhook(
    {
      id: "evt-forjado",
      event: "PAYMENT_CONFIRMED",
      checkout: { id: checkout.providerCheckoutId, externalReference: referenciaExterna },
    },
    "token-errado-mas-com-tamanho-suficiente",
  );
  assert.equal(forjado.status, 401, "webhook sem token válido é recusado");
}

// Pagamento real.
{
  const pago = await entregarWebhook({
    id: "evt-pagamento-azul",
    event: "PAYMENT_CONFIRMED",
    dateCreated: "2026-09-05 12:00:00",
    payment: { id: "pay-azul", value: (CANONICAL_PRICE_CENTS * 2) / 100, subscription: "sub-azul" },
    checkout: { id: checkout.providerCheckoutId, externalReference: referenciaExterna, status: "PAID" },
  });
  assert.equal(pago.status, 200, "webhook autenticado é aceito");

  // Reentrega do MESMO evento não cobra nem altera nada duas vezes.
  const duplicado = await entregarWebhook({
    id: "evt-pagamento-azul",
    event: "PAYMENT_CONFIRMED",
    checkout: { id: checkout.providerCheckoutId, externalReference: referenciaExterna },
  });
  assert.equal(((await duplicado.json()) as { duplicate?: boolean }).duplicate, true, "evento repetido é idempotente");
}

{
  const cliente = raw
    .prepare("SELECT status FROM billing_customers WHERE clinic_id = ?")
    .get(CLINICA_AZUL) as { status: string };
  assert.equal(cliente.status, "active", "pagamento confirmado ativa o customer");

  const resposta = await billingMe(env as never, azul, "clinical", CLINICA_AZUL);
  const corpo = (await resposta.json()) as {
    entitlement: { isActive: boolean };
    seats: { contracted: number };
    capabilities: { canUseClinicalCore: boolean };
  };
  assert.equal(corpo.entitlement.isActive, true, "entitlement ativo depois do pagamento");
  assert.equal(corpo.seats.contracted, 2, "assentos vêm do checkout persistido, não do payload");
  assert.equal(corpo.capabilities.canUseClinicalCore, true);
}

// A clínica VERMELHA não foi tocada por nada disso.
{
  const cliente = raw
    .prepare("SELECT status FROM billing_customers WHERE clinic_id = ?")
    .get(CLINICA_VERMELHA) as { status: string };
  assert.equal(cliente.status, "trial", "o pagamento de AZUL não altera a cobrança de VERMELHA");
}

// ═══ 12-15. Equipe: convite por e-mail → aceite → mudança de papel ══════════
const convidada = await (async () => {
  const resposta = await invitationsPost(
    ctx(
      req("https://x.test/api/billing/invitations", "POST", {
        clinicId: CLINICA_AZUL,
        email: "bia@azul.test",
        role: "professional",
        action: "create",
      }),
      azul,
    ),
  );
  assert.equal(resposta.status, 201, "convite criado com assento livre");
  const corpo = (await resposta.json()) as { delivery: string; invitationUrl?: string };
  assert.equal(corpo.delivery, "email", "o convite sai por e-mail");
  assert.equal(corpo.invitationUrl, undefined, "o link não volta ao convidante");

  const token = linkDoEmail("bia@azul.test", /invite\?token=([^\s]+)/);
  const aceite = await acceptPost(
    ctx(
      req("https://x.test/api/billing/accept", "POST", {
        token,
        name: "Dra. Bia Correia",
        password: "Senha-Convidada1!",
      }),
      null,
    ),
  );
  assert.equal(aceite.status, 201, "aceite cria a conta da convidada");
  const dados = (await aceite.json()) as { accountCreated: boolean; clinicId: string };
  assert.equal(dados.accountCreated, true);
  assert.equal(dados.clinicId, CLINICA_AZUL);

  const linha = raw
    .prepare("SELECT id, name, email, role FROM users WHERE email = 'bia@azul.test'")
    .get() as { id: string; name: string; email: string; role: string };
  return { ...linha, mustChangePassword: false } as Sessao;
})();

// Owner promove a convidada a administradora da clínica.
{
  const resposta = await membersPost(
    ctx(
      req(`https://x.test/api/tenants/${CLINICA_AZUL}/members`, "POST", {
        email: "bia@azul.test",
        role: "clinic_admin",
      }),
      azul,
      { id: CLINICA_AZUL },
    ),
  );
  assert.equal(resposta.status, 201, "owner altera o papel de um membro sem consumir assento");
  const papel = raw
    .prepare("SELECT role FROM clinic_memberships WHERE clinic_id = ? AND user_id = ?")
    .get(CLINICA_AZUL, convidada.id) as { role: string };
  assert.equal(papel.role, "clinic_admin");
}

// A dona da VERMELHA não convida, não promove e não lê a equipe da AZUL.
{
  const convite = await invitationsPost(
    ctx(
      req("https://x.test/api/billing/invitations", "POST", {
        clinicId: CLINICA_AZUL,
        email: "intrusa@vermelha.test",
        role: "clinic_admin",
        action: "create",
      }),
      vermelha,
    ),
  );
  assert.notEqual(convite.status, 201, "VERMELHA não injeta convite em AZUL");

  const promocao = await membersPost(
    ctx(
      req(`https://x.test/api/tenants/${CLINICA_AZUL}/members`, "POST", {
        email: "rui@vermelha.test",
        role: "owner",
      }),
      vermelha,
      { id: CLINICA_AZUL },
    ),
  );
  assert.notEqual(promocao.status, 200, "VERMELHA não se promove dentro de AZUL");
}

// ═══ 16-18. Operação clínica sintética + trilha de auditoria ════════════════
const pacienteSintetico = await (async () => {
  const resposta = await patientsPost(
    ctx(
      req("https://x.test/api/live/patients", "POST", {
        clinicId: CLINICA_AZUL,
        name: "Paciente Sintético de Ensaio",
        birthDate: "2020-03-15",
        guardianName: "Responsável Sintético",
        notes: "Registro sintético criado por teste automatizado. Não é pessoa real.",
      }),
      azul,
    ),
  );
  assert.equal(resposta.status, 201, "clínica paga cria paciente");
  return ((await resposta.json()) as { id: string }).id;
})();

// O conteúdo clínico não pode estar legível no banco.
{
  const linha = raw
    .prepare("SELECT profile_encrypted, encryption_version FROM live_patients WHERE id = ?")
    .get(pacienteSintetico) as { profile_encrypted: string; encryption_version: string };
  assert.doesNotMatch(
    linha.profile_encrypted,
    /Paciente Sintético|Responsável Sintético/,
    "o perfil clínico não pode ficar em claro no banco",
  );
  assert.ok(linha.encryption_version.length > 0, "a linha registra a versão de chave usada");
}

// A operação gerou trilha de auditoria com escopo do tenant certo.
{
  const auditoria = raw
    .prepare(
      `SELECT clinic_id, actor_user_id, metadata_json FROM saas_audit_log
        WHERE action = 'live_patient_create' AND target_id = ?`,
    )
    .get(pacienteSintetico) as { clinic_id: string; actor_user_id: string; metadata_json: string | null };
  assert.equal(auditoria.clinic_id, CLINICA_AZUL);
  assert.equal(auditoria.actor_user_id, azul.id);
  assert.doesNotMatch(
    String(auditoria.metadata_json ?? ""),
    /Paciente Sintético|Responsável Sintético/,
    "a auditoria é metadata-only: nenhum conteúdo clínico nos metadados",
  );
}

// VERMELHA não escreve nem enxerga paciente na AZUL.
{
  const escrita = await patientsPost(
    ctx(
      req("https://x.test/api/live/patients", "POST", {
        clinicId: CLINICA_AZUL,
        name: "Invasão",
        birthDate: "2019-01-01",
      }),
      vermelha,
    ),
  );
  assert.equal(escrita.status, 403, "VERMELHA não escreve dado clínico em AZUL");
}

// ═══ 19-20. Direitos LGPD: exportação e pedido de eliminação ════════════════
{
  const resposta = await exportGet(
    ctx(new Request(`https://x.test/api/tenants/${CLINICA_AZUL}/export`), azul, { id: CLINICA_AZUL }),
  );
  assert.equal(resposta.status, 200, "gestora exporta o tenant");
  const digest = resposta.headers.get("X-NeuroPed-Export-Digest");
  assert.match(String(digest), /^[a-f0-9]{64}$/, "a exportação vem com digest verificável");
  const corpo = (await resposta.json()) as {
    manifest?: { complete?: boolean; digestSha256?: string; counts?: { patients?: number } };
    data?: { patients?: unknown[] };
  };
  assert.equal(corpo.manifest?.complete, true, "a exportação se declara completa");
  assert.equal(corpo.manifest?.digestSha256, digest, "o digest do cabeçalho bate com o do manifesto");
  assert.equal(corpo.manifest?.counts?.patients, 1, "o manifesto conta o paciente da clínica");
  assert.equal(corpo.data?.patients?.length, 1, "a exportação inclui o paciente da clínica");

  const alheia = await exportGet(
    ctx(new Request(`https://x.test/api/tenants/${CLINICA_AZUL}/export`), vermelha, { id: CLINICA_AZUL }),
  );
  assert.equal(alheia.status, 403, "VERMELHA não exporta o tenant de AZUL");
}

const pedidoEliminacao = await (async () => {
  const resposta = await governancePost(
    ctx(
      req("https://x.test/api/live/governance", "POST", {
        clinicId: CLINICA_AZUL,
        requestType: "delete",
        scope: "patient",
        patientId: pacienteSintetico,
        reason: "Pedido sintético de titular, exercido em ensaio automatizado.",
      }),
      azul,
    ),
  );
  assert.equal(resposta.status, 201, "titular solicita eliminação");
  const corpo = (await resposta.json()) as { id: string; status: string };
  assert.equal(corpo.status, "requested");
  return corpo.id;
})();

// O motivo da eliminação também é cifrado — ele é relato do titular.
{
  const linha = raw
    .prepare("SELECT reason_encrypted FROM live_deletion_requests WHERE id = ?")
    .get(pedidoEliminacao) as { reason_encrypted: string | null };
  assert.ok(linha.reason_encrypted, "o motivo é persistido");
  assert.doesNotMatch(
    linha.reason_encrypted!,
    /Pedido sintético de titular/,
    "o motivo do titular não pode ficar em claro",
  );
}

// ═══ 21-22. Troca de senha revoga as sessões antigas ════════════════════════
{
  const antes = raw
    .prepare("SELECT COUNT(*) AS total FROM auth_refresh_sessions WHERE user_id = ? AND revoked_at IS NULL")
    .get(azul.id) as { total: number };
  assert.ok(antes.total >= 1, "existe sessão ativa antes da troca");

  const resposta = await changePasswordPost(
    ctx(
      req("https://x.test/api/auth/change-password", "POST", {
        currentPassword: SENHA,
        newPassword: "Senha-Cliente-Zero2!",
      }),
      azul,
    ),
  );
  assert.equal(resposta.status, 200, "troca de senha aceita");

  const revogadas = raw
    .prepare(
      `SELECT COUNT(*) AS total FROM auth_refresh_sessions
        WHERE user_id = ? AND revoke_reason = 'password_changed'`,
    )
    .get(azul.id) as { total: number };
  assert.ok(revogadas.total >= 1, "as sessões anteriores são revogadas na troca de senha");
}

// ═══ 23-25. Cancelamento e encerramento do tenant ══════════════════════════
{
  const slugAzul = (
    raw.prepare("SELECT slug FROM clinics WHERE id = ?").get(CLINICA_AZUL) as { slug: string }
  ).slug;

  const alheio = await lifecyclePost(
    ctx(
      req(`https://x.test/api/tenants/${CLINICA_AZUL}/lifecycle`, "POST", {
        action: "request_closure",
        reasonCode: "customer_request",
        confirmSlug: slugAzul,
      }),
      vermelha,
      { id: CLINICA_AZUL },
    ),
  );
  assert.equal(alheio.status, 403, "só o titular encerra a própria clínica");

  // Encerrar exige digitar o identificador da clínica: encerramento não pode
  // acontecer por clique acidental.
  const semConfirmacao = await lifecyclePost(
    ctx(
      req(`https://x.test/api/tenants/${CLINICA_AZUL}/lifecycle`, "POST", {
        action: "request_closure",
        reasonCode: "customer_request",
      }),
      azul,
      { id: CLINICA_AZUL },
    ),
  );
  assert.equal(semConfirmacao.status, 400, "sem confirmação explícita, o encerramento não acontece");

  const resposta = await lifecyclePost(
    ctx(
      req(`https://x.test/api/tenants/${CLINICA_AZUL}/lifecycle`, "POST", {
        action: "request_closure",
        reasonCode: "customer_request",
        confirmSlug: slugAzul,
      }),
      azul,
      { id: CLINICA_AZUL },
    ),
  );
  assert.equal(resposta.status, 200, "titular solicita encerramento");

  const ciclo = raw
    .prepare("SELECT status, retention_until FROM tenant_lifecycle WHERE clinic_id = ?")
    .get(CLINICA_AZUL) as { status: string; retention_until: string | null };
  assert.equal(ciclo.status, "closure_requested");
  assert.ok(ciclo.retention_until, "a retenção é materializada no pedido de encerramento");
}

// Webhook tardio NÃO reabre acesso de uma clínica em encerramento.
{
  const tardio = await entregarWebhook({
    id: "evt-tardio-azul",
    event: "PAYMENT_CONFIRMED",
    dateCreated: "2026-09-06 12:00:00",
    payment: { id: "pay-tardio", value: (CANONICAL_PRICE_CENTS * 2) / 100 },
    checkout: { id: checkout.providerCheckoutId, externalReference: referenciaExterna },
  });
  assert.equal(tardio.status, 200, "o evento tardio é auditado");
  const cliente = raw
    .prepare("SELECT status FROM billing_customers WHERE clinic_id = ?")
    .get(CLINICA_AZUL) as { status: string };
  assert.equal(cliente.status, "suspended", "pagamento tardio não reabre acesso durante o encerramento");
}

// ═══ 26. Durante o encerramento, exportar continua possível ════════════════
{
  const resposta = await exportGet(
    ctx(new Request(`https://x.test/api/tenants/${CLINICA_AZUL}/export`), azul, { id: CLINICA_AZUL }),
  );
  assert.equal(
    resposta.status,
    200,
    "o titular não pode perder os próprios dados por ter pedido encerramento",
  );
}

// ═══ 27. VERMELHA permanece intacta e operante ═════════════════════════════
{
  const ciclo = raw
    .prepare("SELECT status FROM tenant_lifecycle WHERE clinic_id = ?")
    .get(CLINICA_VERMELHA) as { status: string };
  assert.equal(ciclo.status, "active", "o encerramento de AZUL não toca VERMELHA");

  const pacientesVermelha = raw
    .prepare("SELECT COUNT(*) AS total FROM live_patients WHERE clinic_id = ?")
    .get(CLINICA_VERMELHA) as { total: number };
  assert.equal(pacientesVermelha.total, 0, "nenhum dado vazou de AZUL para VERMELHA");
}

globalThis.fetch = realFetch;

console.log(
  "✅ CLIENTE ZERO: conta confirmada → clínica → checkout → pagamento real por webhook → entitlement → equipe por e-mail → papel → paciente cifrado → auditoria metadata-only → exportação com digest → pedido de eliminação → troca de senha revogando sessões → encerramento com retenção → webhook tardio sem reabrir acesso. CLINICA_VERMELHA intacta em todas as superfícies.",
);
