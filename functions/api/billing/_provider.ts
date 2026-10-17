import { CANONICAL_PRICE_CENTS } from "../../../shared/billing";

export interface BillingProviderEnv {
  ASAAS_API_KEY?: string;
  ASAAS_WEBHOOK_TOKEN?: string;
  ASAAS_ENVIRONMENT?: string;
  APP_BASE_URL?: string;
  AUTH_PUBLIC_APP_URL?: string;
}

export interface AsaasCheckout {
  id: string;
  link: string;
  status: string;
  externalReference?: string;
}

export interface AsaasWebhookEvent {
  id?: string;
  event?: string;
  dateCreated?: string;
  checkout?: {
    id?: string;
    externalReference?: string;
    status?: string;
  };
  payment?: {
    id?: string;
    externalReference?: string;
    status?: string;
    value?: number;
    subscription?: string;
  };
  // Presente nos eventos SUBSCRIPTION_* (sem checkout/payment associado). É a
  // única origem confiável de cancelamento terminal via webhook — ver
  // functions/api/billing/webhook.ts classify().
  subscription?: {
    id?: string;
    status?: string;
  };
}

export const ASAAS_USER_AGENT = "NeuroPed/saas";

const ASAAS_CONTRACT_CODES = new Set([
  "ASAAS_API_KEY_NOT_CONFIGURED",
  "ASAAS_WEBHOOK_TOKEN_NOT_CONFIGURED",
  "ASAAS_WEBHOOK_TOKEN_INVALID",
  "ASAAS_ENVIRONMENT_NOT_CONFIGURED",
  "ASAAS_ENVIRONMENT_INVALID",
  "ASAAS_API_KEY_ENVIRONMENT_MISMATCH",
  "APP_BASE_URL_NOT_CONFIGURED",
  "APP_BASE_URL_INSECURE",
]);

export type AsaasEnvironment = "sandbox" | "production";

export interface AsaasOperationalReport {
  pronto: boolean;
  code: string;
  blockedExternal: boolean;
  ambiente: AsaasEnvironment | null;
  host: string | null;
  /** Este relatório nunca observa pagamento. O literal não muda. */
  cobrancaExterna: "BLOCKED_EXTERNAL";
  cobrancaComprovada: false;
  receitaCentavos: 0;
}

function requireSecret(value: string | undefined, name: string, minLength = 16): string {
  const clean = value?.trim() ?? "";
  if (clean.length < minLength) throw new Error(`${name}_NOT_CONFIGURED`);
  return clean;
}

/**
 * Token do webhook Asaas: 32–255 caracteres, sem espaço, e nunca a própria
 * API key. Ausência e formato inválido falham fechado — não há default.
 */
function requireWebhookToken(value: string | undefined): string {
  const clean = value?.trim() ?? "";
  if (clean.length < 32) throw new Error("ASAAS_WEBHOOK_TOKEN_NOT_CONFIGURED");
  if (clean.length > 255 || /\s/.test(clean) || clean.startsWith("$aact_")) {
    throw new Error("ASAAS_WEBHOOK_TOKEN_INVALID");
  }
  return clean;
}

export function readAsaasEnvironment(env: BillingProviderEnv): AsaasEnvironment {
  const mode = (env.ASAAS_ENVIRONMENT ?? "").trim().toLowerCase();
  if (!mode) throw new Error("ASAAS_ENVIRONMENT_NOT_CONFIGURED");
  if (mode === "sandbox" || mode === "production") return mode;
  throw new Error("ASAAS_ENVIRONMENT_INVALID");
}

export function asaasBaseUrl(env: BillingProviderEnv): string {
  return readAsaasEnvironment(env) === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
}

/**
 * Produção só aceita chave `$aact_prod_`. Sandbox recusa chave de produção.
 * Chave sem prefixo documentado continua aceita só em sandbox: a suíte local
 * usa chave sintética e chaves antigas do painel não trazem o prefixo. Em
 * produção isso é falha fechada — não há como provar que a chave é de produção.
 */
function assertKeyMatchesEnvironment(environment: AsaasEnvironment, apiKey: string): void {
  const productionKey = apiKey.startsWith("$aact_prod_");
  const sandboxKey = apiKey.startsWith("$aact_hmlg_");
  if (environment === "production") {
    if (!productionKey) throw new Error("ASAAS_API_KEY_ENVIRONMENT_MISMATCH");
    return;
  }
  if (productionKey && !sandboxKey) throw new Error("ASAAS_API_KEY_ENVIRONMENT_MISMATCH");
}

export function assertAsaasOutboundContract(env: BillingProviderEnv): {
  environment: AsaasEnvironment;
  baseUrl: string;
  apiKey: string;
} {
  const environment = readAsaasEnvironment(env);
  const apiKey = requireSecret(env.ASAAS_API_KEY, "ASAAS_API_KEY");
  requireWebhookToken(env.ASAAS_WEBHOOK_TOKEN);
  assertKeyMatchesEnvironment(environment, apiKey);
  return { environment, baseUrl: asaasBaseUrl(env), apiKey };
}

export function asaasContractFailureCode(error: unknown): string | null {
  const code = error instanceof Error ? error.message : "";
  return ASAAS_CONTRACT_CODES.has(code) ? code : null;
}

/** Relatório operacional sem segredo, sem cobrança e sem receita. */
export function describeAsaasOperationalContract(env: BillingProviderEnv): AsaasOperationalReport {
  const blocked = (code: string, ambiente: AsaasEnvironment | null, host: string | null): AsaasOperationalReport => ({
    pronto: false,
    code,
    blockedExternal: true,
    ambiente,
    host,
    cobrancaExterna: "BLOCKED_EXTERNAL",
    cobrancaComprovada: false,
    receitaCentavos: 0,
  });
  let ambiente: AsaasEnvironment;
  try {
    ambiente = readAsaasEnvironment(env);
  } catch (error) {
    const code = asaasContractFailureCode(error);
    return blocked(code ?? "ASAAS_ENVIRONMENT_INVALID", null, null);
  }
  try {
    const target = assertAsaasOutboundContract(env);
    assertCheckoutReturnUrl(env, target.environment);
    return {
      pronto: true,
      code: "ASAAS_CONTRACT_READY",
      blockedExternal: false,
      ambiente: target.environment,
      host: new URL(target.baseUrl).host,
      cobrancaExterna: "BLOCKED_EXTERNAL",
      cobrancaComprovada: false,
      receitaCentavos: 0,
    };
  } catch (error) {
    const code = asaasContractFailureCode(error);
    const host = ambiente === "production" ? "api.asaas.com" : ambiente === "sandbox" ? "api-sandbox.asaas.com" : null;
    return blocked(code ?? "ASAAS_CONTRACT_INVALID", ambiente, code ? host : null);
  }
}

/**
 * Leitura da conta no provedor. Não cria checkout, cobrança nem cliente.
 * Sucesso da leitura não é pagamento.
 */
export async function probeAsaasReadOnly(
  env: BillingProviderEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; httpStatus: number | null; code: string }> {
  const target = assertAsaasOutboundContract(env);
  assertCheckoutReturnUrl(env, target.environment);
  try {
    const response = await fetchImpl(`${target.baseUrl}/customers?limit=1`, {
      method: "GET",
      headers: {
        accept: "application/json",
        access_token: target.apiKey,
        "user-agent": ASAAS_USER_AGENT,
      },
    });
    await response.arrayBuffer();
    if (response.ok) return { ok: true, httpStatus: response.status, code: "ASAAS_READ_PROBE_OK" };
    if (response.status === 401 || response.status === 403) {
      return { ok: false, httpStatus: response.status, code: "ASAAS_CREDENTIAL_REJECTED" };
    }
    return { ok: false, httpStatus: response.status, code: "ASAAS_READ_PROBE_FAILED" };
  } catch {
    return { ok: false, httpStatus: null, code: "BLOCKED_EXTERNAL_ASAAS_UNREACHABLE" };
  }
}

export function validateAsaasWebhook(request: Request, env: BillingProviderEnv): boolean {
  const expected = requireWebhookToken(env.ASAAS_WEBHOOK_TOKEN);
  const received = request.headers.get("asaas-access-token")?.trim() ?? "";
  if (received.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Base pública dos retornos do checkout. `AUTH_PUBLIC_APP_URL` é a variável
 * que convites, e-mails e o verificador de go-live já exigem; `APP_BASE_URL`
 * continua aceita (e tem precedência) por compatibilidade. Antes, só
 * `APP_BASE_URL` valia: com o Asaas configurado e o go-live dizendo "cobrança
 * pronta", todo checkout falhava com "temporariamente indisponível".
 */
export function checkoutReturnBaseUrl(env: BillingProviderEnv): URL {
  const raw = env.APP_BASE_URL?.trim() || env.AUTH_PUBLIC_APP_URL?.trim() || "";
  return new URL(requireSecret(raw, "APP_BASE_URL", 8));
}

function assertCheckoutReturnUrl(env: BillingProviderEnv, environment: AsaasEnvironment): URL {
  const url = checkoutReturnBaseUrl(env);
  if (environment === "production" && url.protocol !== "https:") {
    throw new Error("APP_BASE_URL_INSECURE");
  }
  return url;
}

export function checkoutExternalReference(customerId: string): string {
  return `neuroped:${customerId}:${crypto.randomUUID()}`;
}

function isoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function createAsaasRecurringCheckout(
  env: BillingProviderEnv,
  params: {
    externalReference: string;
    seats: number;
    trialEndsAt?: string | null;
    customer?: { name?: string | null; email?: string | null };
  },
): Promise<AsaasCheckout> {
  if (!Number.isInteger(params.seats) || params.seats < 1) throw new Error("INVALID_SEAT_COUNT");

  const target = assertAsaasOutboundContract(env);
  const appBaseUrl = assertCheckoutReturnUrl(env, target.environment);
  const now = new Date();
  const requestedDue = params.trialEndsAt ? new Date(params.trialEndsAt) : now;
  const nextDueDate =
    Number.isFinite(requestedDue.getTime()) && requestedDue.getTime() > now.getTime()
      ? isoDateOnly(requestedDue)
      : isoDateOnly(now);

  const callbackBase = appBaseUrl.toString().replace(/\/+$/, "");
  const payload: Record<string, unknown> = {
    billingTypes: ["PIX", "CREDIT_CARD"],
    chargeTypes: ["RECURRENT"],
    minutesToExpire: 60,
    externalReference: params.externalReference,
    // O SPA roteia por hash: /#/billing/retorno é a rota real. As URLs de
    // caminho anteriores caíam no fallback do SPA e abriam a home, sem
    // qualquer confirmação de pagamento para o usuário.
    callback: {
      successUrl: `${callbackBase}/#/billing/retorno?status=success`,
      cancelUrl: `${callbackBase}/#/billing/retorno?status=cancel`,
      expiredUrl: `${callbackBase}/#/billing/retorno?status=expired`,
    },
    items: [{
      name: "NeuroPed SaaS — assento mensal",
      description: "Assinatura mensal NeuroPed SaaS",
      quantity: params.seats,
      value: CANONICAL_PRICE_CENTS / 100,
    }],
    subscription: { cycle: "MONTHLY", nextDueDate },
  };

  const name = params.customer?.name?.trim();
  const email = params.customer?.email?.trim().toLowerCase();
  if (name || email) {
    payload.customerData = {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
    };
  }

  const response = await fetch(`${target.baseUrl}/checkouts`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      access_token: target.apiKey,
      "user-agent": ASAAS_USER_AGENT,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok || !parsed || typeof parsed !== "object") {
    // Respostas do provedor podem ecoar customerData (nome/e-mail). Logs de
    // produção registram somente metadados não clínicos e não identificáveis.
    console.error("[billing.asaas.checkout] provider_failure", { status: response.status });
    throw new Error(`ASAAS_CHECKOUT_FAILED_${response.status}`);
  }

  const data = parsed as Record<string, unknown>;
  const id = typeof data.id === "string" ? data.id : "";
  const link =
    typeof data.link === "string" && data.link
      ? data.link
      : id
        ? `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(id)}`
        : "";
  if (!id || !link) throw new Error("ASAAS_CHECKOUT_INVALID_RESPONSE");

  return {
    id,
    link,
    status: typeof data.status === "string" ? data.status : "ACTIVE",
    externalReference:
      typeof data.externalReference === "string" ? data.externalReference : params.externalReference,
  };
}

export function webhookEventKey(event: AsaasWebhookEvent): string {
  const id = event.id?.trim();
  if (!id) throw new Error("ASAAS_EVENT_ID_REQUIRED");
  return `asaas:${id}`;
}

export function webhookExternalReference(event: AsaasWebhookEvent): string | null {
  return event.checkout?.externalReference?.trim()
    || event.payment?.externalReference?.trim()
    || null;
}

export function webhookProviderObjectId(event: AsaasWebhookEvent): string | null {
  return event.payment?.id?.trim() || event.checkout?.id?.trim() || null;
}

export function amountCentsFromWebhook(event: AsaasWebhookEvent): number {
  const value = event.payment?.value;
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value * 100)
    : 0;
}

async function asaasLifecycleRequest(
  env: BillingProviderEnv,
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: Record<string, unknown>,
  allowNotFound = false,
): Promise<void> {
  const target = assertAsaasOutboundContract(env);
  const response = await fetch(`${target.baseUrl}${path}`, {
    method,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      access_token: target.apiKey,
      "user-agent": ASAAS_USER_AGENT,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.ok || (allowNotFound && response.status === 404)) return;
  // `path` contém IDs do provedor e a resposta pode conter customerData. Não
  // serializar nenhum dos dois em log; status + método bastam para observação.
  console.error("[billing.asaas.lifecycle] provider_failure", {
    method,
    status: response.status,
  });
  throw new Error(`ASAAS_LIFECYCLE_FAILED_${response.status}`);
}

/**
 * Encerra a recorrência no Asaas. A remoção impede novas cobranças e remove as
 * cobranças pendentes/vencidas vinculadas à recorrência. 404 é aceito como
 * idempotência para o caso de retry depois de o provedor já ter removido o ID.
 */
export async function cancelAsaasSubscription(
  env: BillingProviderEnv,
  providerSubscriptionId: string,
): Promise<void> {
  const id = providerSubscriptionId.trim();
  if (!id) throw new Error("ASAAS_SUBSCRIPTION_ID_REQUIRED");
  await asaasLifecycleRequest(
    env,
    `/subscriptions/${encodeURIComponent(id)}`,
    "DELETE",
    undefined,
    true,
  );
}

/** Cancela um checkout ainda aberto; 404 é idempotente porque o link pode ter expirado. */
export async function cancelAsaasCheckout(
  env: BillingProviderEnv,
  providerCheckoutId: string,
): Promise<void> {
  const id = providerCheckoutId.trim();
  if (!id) return;
  await asaasLifecycleRequest(
    env,
    `/checkouts/${encodeURIComponent(id)}/cancel`,
    "POST",
    undefined,
    true,
  );
}
