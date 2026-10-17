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

function requireSecret(value: string | undefined, name: string, minLength = 16): string {
  const clean = value?.trim() ?? "";
  if (clean.length < minLength) throw new Error(`${name}_NOT_CONFIGURED`);
  return clean;
}

/**
 * Ambiente do provedor é explícito. Ausência não cai em sandbox: um checkout
 * sem `ASAAS_ENVIRONMENT` iria cobrar (ou parecer cobrar) no lugar errado.
 */
export function asaasEnvironmentName(env: BillingProviderEnv): "sandbox" | "production" {
  const mode = (env.ASAAS_ENVIRONMENT ?? "").trim().toLowerCase();
  if (!mode) throw new Error("ASAAS_ENVIRONMENT_NOT_CONFIGURED");
  if (mode === "production" || mode === "sandbox") return mode;
  throw new Error("ASAAS_ENVIRONMENT_INVALID");
}

export function asaasBaseUrl(env: BillingProviderEnv): string {
  return asaasEnvironmentName(env) === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
}

export const ASAAS_CONTRACT_DOES_NOT_PROVE = [
  "COBRANCA_REAL",
  "WEBHOOK_ORIGINADO_PELO_PROVEDOR",
  "ENTITLEMENT_PAGO",
  "RECEITA",
  "MRR",
  "CLIENTE_PAGANTE",
] as const;

export interface AsaasContractAssessment {
  status: "CONFIGURACAO_PRESENTE" | "BLOCKED_EXTERNAL";
  code: "ASAAS_CONTRACT_CONFIGURED" | "BLOCKED_EXTERNAL_ASAAS";
  missing: string[];
  environment: "sandbox" | "production" | null;
  doesNotProve: readonly string[];
}

function secretReady(value: string | undefined, minLength: number): boolean {
  return (value?.trim().length ?? 0) >= minLength;
}

function returnUrlReady(env: BillingProviderEnv): boolean {
  try {
    return checkoutReturnBaseUrl(env).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Contrato operacional do checkout. Presença de variável não é cobrança:
 * `doesNotProve` permanece mesmo quando o status é CONFIGURACAO_PRESENTE.
 * Nenhum valor de segredo entra no objeto.
 */
export function assessAsaasOperationalContract(env: BillingProviderEnv): AsaasContractAssessment {
  const missing: string[] = [];
  if (!secretReady(env.ASAAS_API_KEY, 16)) missing.push("ASAAS_API_KEY");
  if (!secretReady(env.ASAAS_WEBHOOK_TOKEN, 32)) missing.push("ASAAS_WEBHOOK_TOKEN");
  let environment: "sandbox" | "production" | null = null;
  try {
    environment = asaasEnvironmentName(env);
  } catch {
    missing.push("ASAAS_ENVIRONMENT");
  }
  if (!returnUrlReady(env)) missing.push("AUTH_PUBLIC_APP_URL");
  const ready = missing.length === 0;
  return {
    status: ready ? "CONFIGURACAO_PRESENTE" : "BLOCKED_EXTERNAL",
    code: ready ? "ASAAS_CONTRACT_CONFIGURED" : "BLOCKED_EXTERNAL_ASAAS",
    missing,
    environment: ready ? environment : null,
    doesNotProve: ASAAS_CONTRACT_DOES_NOT_PROVE,
  };
}

const CHECKOUT_CONFIG_ERRORS = new Set([
  "ASAAS_API_KEY_NOT_CONFIGURED",
  "ASAAS_WEBHOOK_TOKEN_NOT_CONFIGURED",
  "ASAAS_ENVIRONMENT_NOT_CONFIGURED",
  "ASAAS_ENVIRONMENT_INVALID",
  "APP_BASE_URL_NOT_CONFIGURED",
]);

export function checkoutUnavailableCode(
  error: unknown,
): "BILLING_BLOCKED_EXTERNAL" | "BILLING_PROVIDER_UNAVAILABLE" {
  const message = error instanceof Error ? error.message : "";
  return CHECKOUT_CONFIG_ERRORS.has(message)
    ? "BILLING_BLOCKED_EXTERNAL"
    : "BILLING_PROVIDER_UNAVAILABLE";
}

/** Recusa o checkout antes de qualquer chamada ao provedor. */
export function assertAsaasCheckoutContract(env: BillingProviderEnv): void {
  const assessment = assessAsaasOperationalContract(env);
  if (assessment.status === "CONFIGURACAO_PRESENTE") return;
  if (assessment.missing.includes("ASAAS_API_KEY")) throw new Error("ASAAS_API_KEY_NOT_CONFIGURED");
  if (assessment.missing.includes("ASAAS_WEBHOOK_TOKEN")) throw new Error("ASAAS_WEBHOOK_TOKEN_NOT_CONFIGURED");
  const rawEnvironment = (env.ASAAS_ENVIRONMENT ?? "").trim();
  if (assessment.missing.includes("ASAAS_ENVIRONMENT")) {
    throw new Error(rawEnvironment ? "ASAAS_ENVIRONMENT_INVALID" : "ASAAS_ENVIRONMENT_NOT_CONFIGURED");
  }
  throw new Error("APP_BASE_URL_NOT_CONFIGURED");
}

/**
 * Leitura da conta no provedor. Não cria checkout, cobrança nem assinatura.
 * O corpo da resposta pode conter nome e e-mail; só o status HTTP sai daqui.
 */
export async function probeAsaasAccount(
  env: BillingProviderEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<{ httpStatus: number; code: string }> {
  if (assessAsaasOperationalContract(env).status !== "CONFIGURACAO_PRESENTE") {
    return { httpStatus: 0, code: "BLOCKED_EXTERNAL_ASAAS" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetchImpl(`${asaasBaseUrl(env)}/myAccount`, {
      method: "GET",
      headers: {
        accept: "application/json",
        access_token: requireSecret(env.ASAAS_API_KEY, "ASAAS_API_KEY"),
      },
      signal: controller.signal,
    });
    await response.arrayBuffer();
    if (response.status === 200) return { httpStatus: 200, code: "ASAAS_ACCOUNT_READ_OK" };
    if (response.status === 401 || response.status === 403) {
      return { httpStatus: response.status, code: "BLOCKED_EXTERNAL_ASAAS_CREDENTIAL_REJECTED" };
    }
    return { httpStatus: response.status, code: `BLOCKED_EXTERNAL_ASAAS_PROBE_HTTP_${response.status}` };
  } catch {
    return { httpStatus: 0, code: "BLOCKED_EXTERNAL_ASAAS_PROBE_UNREACHABLE" };
  } finally {
    clearTimeout(timer);
  }
}

export function validateAsaasWebhook(request: Request, env: BillingProviderEnv): boolean {
  const expected = requireSecret(env.ASAAS_WEBHOOK_TOKEN, "ASAAS_WEBHOOK_TOKEN", 32);
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
  // Sem webhook autenticado o pagamento no provedor não vira entitlement.
  // A recusa acontece antes do POST /checkouts.
  assertAsaasCheckoutContract(env);

  const apiKey = requireSecret(env.ASAAS_API_KEY, "ASAAS_API_KEY");
  const baseUrl = asaasBaseUrl(env);
  const appBaseUrl = checkoutReturnBaseUrl(env);
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

  const response = await fetch(`${baseUrl}/checkouts`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      access_token: apiKey,
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
  const apiKey = requireSecret(env.ASAAS_API_KEY, "ASAAS_API_KEY");
  const response = await fetch(`${asaasBaseUrl(env)}${path}`, {
    method,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      access_token: apiKey,
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
