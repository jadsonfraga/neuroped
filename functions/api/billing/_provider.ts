import { CANONICAL_PRICE_CENTS } from "../../../shared/billing";

export interface BillingProviderEnv {
  ASAAS_API_KEY?: string;
  ASAAS_WEBHOOK_TOKEN?: string;
  ASAAS_ENVIRONMENT?: string;
  APP_BASE_URL?: string;
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
}

function requireSecret(value: string | undefined, name: string, minLength = 16): string {
  const clean = value?.trim() ?? "";
  if (clean.length < minLength) throw new Error(`${name}_NOT_CONFIGURED`);
  return clean;
}

export function asaasBaseUrl(env: BillingProviderEnv): string {
  const mode = (env.ASAAS_ENVIRONMENT ?? "sandbox").trim().toLowerCase();
  if (mode === "production") return "https://api.asaas.com/v3";
  if (mode === "sandbox") return "https://api-sandbox.asaas.com/v3";
  throw new Error("ASAAS_ENVIRONMENT_INVALID");
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

  const apiKey = requireSecret(env.ASAAS_API_KEY, "ASAAS_API_KEY");
  const baseUrl = asaasBaseUrl(env);
  const appBaseUrl = new URL(requireSecret(env.APP_BASE_URL, "APP_BASE_URL", 8));
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
    callback: {
      successUrl: `${callbackBase}/billing/success`,
      cancelUrl: `${callbackBase}/billing/cancel`,
      expiredUrl: `${callbackBase}/billing/expired`,
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
