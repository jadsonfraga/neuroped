import { COMMERCIAL_PLAN, normalizeSeatQuantity } from "../../../shared/billing";
import { tenantError, tenantJson } from "../tenant/_core";
import type { BillingEnv } from "./_core";
import {
  mapStripeStatus,
  sha256,
  stripeGet,
  verifyStripeSignature,
} from "./_stripe";

const MAX_WEBHOOK_BYTES = 256_000;

interface StripeSubscription {
  id?: string;
  customer?: string;
  status?: string;
  current_period_end?: number;
  trial_end?: number | null;
  cancel_at_period_end?: boolean;
  metadata?: Record<string, string | undefined>;
  items?: {
    data?: Array<{
      quantity?: number;
      current_period_end?: number;
      price?: string | { id?: string };
    }>;
  };
}

interface StripeCheckoutSession {
  subscription?: string | StripeSubscription | null;
}

interface StripeEvent {
  id?: string;
  type?: string;
  created?: number;
  data?: { object?: StripeSubscription | StripeCheckoutSession };
}

function isoFromUnix(value: number | null | undefined): string | null {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) return null;
  return new Date(Number(value) * 1_000).toISOString();
}

function subscriptionPeriodEnd(subscription: StripeSubscription): string | null {
  const itemPeriods = subscription.items?.data
    ?.map((item) => item.current_period_end)
    .filter((value): value is number => Number.isSafeInteger(value)) ?? [];
  const end = Number.isSafeInteger(subscription.current_period_end)
    ? subscription.current_period_end
    : itemPeriods.length > 0
      ? Math.max(...itemPeriods)
      : null;
  return isoFromUnix(end);
}

async function subscriptionFromEvent(
  env: BillingEnv,
  event: StripeEvent,
): Promise<StripeSubscription | null> {
  const object = event.data?.object;
  if (event.type?.startsWith("customer.subscription.")) {
    const eventSubscription = (object ?? null) as StripeSubscription | null;
    // Eventos distintos podem ter o mesmo segundo em `created`. Para evitar que
    // uma entrega atrasada restaure estado antigo, reconciliamos com o snapshot
    // atual do provedor. O evento de cancelamento usa o próprio payload, pois a
    // assinatura encerrada pode deixar de ser recuperável em algumas contas.
    if (eventSubscription?.id && event.type !== "customer.subscription.deleted") {
      return stripeGet<StripeSubscription>(
        env,
        `/subscriptions/${encodeURIComponent(eventSubscription.id)}`,
      );
    }
    return eventSubscription;
  }
  if (event.type === "checkout.session.completed") {
    const subscription = (object as StripeCheckoutSession | undefined)?.subscription;
    if (subscription && typeof subscription === "object") return subscription;
    if (typeof subscription === "string" && subscription) {
      return stripeGet<StripeSubscription>(env, `/subscriptions/${encodeURIComponent(subscription)}`);
    }
  }
  return null;
}

async function recordIgnoredEvent(
  db: D1Database,
  event: StripeEvent,
  payloadHash: string,
): Promise<void> {
  await db.prepare(
    `INSERT OR IGNORE INTO billing_events
      (id, provider, provider_event_id, event_type, clinic_id, payload_sha256,
       provider_created_at, processed_at)
     VALUES (?, 'stripe', ?, ?, NULL, ?, ?, ?)`,
  ).bind(
    crypto.randomUUID(),
    event.id,
    event.type,
    payloadHash,
    event.created,
    new Date().toISOString(),
  ).run();
}

export const onRequestPost: PagesFunction<BillingEnv> = async (context) => {
  const db = context.env.DB;
  if (!db) return tenantError("Banco comercial não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  const rawBody = await context.request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BYTES) {
    return tenantError("Webhook excede o tamanho permitido.", "PAYLOAD_TOO_LARGE", 413);
  }
  if (!(await verifyStripeSignature(
    rawBody,
    context.request.headers.get("Stripe-Signature"),
    context.env.STRIPE_WEBHOOK_SECRET,
  ))) {
    return tenantError("Assinatura do webhook inválida.", "INVALID_WEBHOOK_SIGNATURE", 400);
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return tenantError("Webhook JSON inválido.", "INVALID_JSON", 400);
  }
  if (
    !event.id || event.id.length > 160
    || !event.type || event.type.length > 160
    || !Number.isSafeInteger(event.created)
  ) {
    return tenantError("Evento Stripe inválido.", "INVALID_WEBHOOK_EVENT", 400);
  }
  const payloadHash = await sha256(rawBody);
  const configuredPriceId = context.env.STRIPE_PRICE_ID?.trim();
  if (!configuredPriceId) {
    return tenantError("Preço comercial não configurado.", "BILLING_NOT_CONFIGURED", 503);
  }

  let subscription: StripeSubscription | null;
  try {
    subscription = await subscriptionFromEvent(context.env, event);
  } catch (error) {
    console.error("[billing.webhook] subscription retrieval failed", error instanceof Error ? error.message : error);
    return tenantError("Não foi possível reconciliar a assinatura.", "BILLING_PROVIDER_UNAVAILABLE", 502);
  }
  if (!subscription) {
    await recordIgnoredEvent(db, event, payloadHash);
    return tenantJson({ received: true, applied: false });
  }

  const clinicId = subscription.metadata?.clinic_id?.trim().slice(0, 80) ?? "";
  const planCode = subscription.metadata?.plan_code;
  const items = subscription.items?.data ?? [];
  const item = items.length === 1 ? items[0] : undefined;
  const itemPriceId = typeof item?.price === "string" ? item.price : item?.price?.id;
  const seats = normalizeSeatQuantity(item?.quantity);
  const priceContractValid = (
    planCode === COMMERCIAL_PLAN.code
    && itemPriceId === configuredPriceId
    && seats !== null
  );
  const customerId = typeof subscription.customer === "string" ? subscription.customer : "";
  if (
    !clinicId
    || !subscription.id || !customerId || !subscription.status
  ) {
    await recordIgnoredEvent(db, event, payloadHash);
    console.error("[billing.webhook] evento sem metadata comercial canônica", event.id);
    return tenantJson({ received: true, applied: false });
  }

  const now = new Date().toISOString();
  // Uma troca manual de Price, múltiplos itens ou quantidade inválida nunca
  // mantém escrita por acidente. O evento é auditado, mas o entitlement falha
  // fechado até o contrato canônico ser restaurado.
  const status = priceContractValid ? mapStripeStatus(subscription.status) : "suspended";
  const trialEnd = isoFromUnix(subscription.trial_end);
  const currentPeriodEnd = subscriptionPeriodEnd(subscription);
  try {
    const results = await db.batch([
      db.prepare(
        `INSERT OR IGNORE INTO billing_events
          (id, provider, provider_event_id, event_type, clinic_id, payload_sha256,
           provider_created_at, processed_at)
         VALUES (?, 'stripe', ?, ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(), event.id, event.type, clinicId, payloadHash, event.created, now,
      ),
      db.prepare(
        `UPDATE billing_accounts
            SET status = ?, seat_quantity = COALESCE(?, seat_quantity), provider = 'stripe',
                provider_customer_id = ?, provider_subscription_id = ?,
                provider_checkout_session_id = NULL, checkout_attempt_id = NULL,
                checkout_seat_quantity = NULL, checkout_locked_until = NULL,
                trial_ends_at = COALESCE(?, trial_ends_at), current_period_end = ?,
                cancel_at_period_end = ?, provider_event_created_at = ?, updated_at = ?
          WHERE clinic_id = ? AND plan_code = ? AND changes() = 1
            AND (provider_event_created_at IS NULL OR provider_event_created_at <= ?)`,
      ).bind(
        status,
        priceContractValid ? seats : null,
        customerId,
        subscription.id,
        trialEnd,
        currentPeriodEnd,
        subscription.cancel_at_period_end ? 1 : 0,
        event.created,
        now,
        clinicId,
        COMMERCIAL_PLAN.code,
        event.created,
      ),
      db.prepare(
        `INSERT INTO saas_audit_log
          (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
         SELECT ?, ?, c.created_by_user_id, 'billing_subscription_reconciled',
                'billing_account', ?, ?, ?
           FROM clinics c
          WHERE c.id = ? AND changes() = 1`,
      ).bind(
        crypto.randomUUID(),
        clinicId,
        clinicId,
        JSON.stringify({
          eventType: event.type,
          status,
          seats: priceContractValid ? seats : null,
          priceContractValid,
          providerPriceId: itemPriceId ?? null,
        }),
        now,
        clinicId,
      ),
    ]);
    const applied = Number(results[1]?.meta?.changes ?? 0) === 1;
    return tenantJson({ received: true, applied });
  } catch (error) {
    console.error("[billing.webhook] database reconciliation failed", error instanceof Error ? error.message : error);
    return tenantError("Falha ao reconciliar cobrança.", "DB_ERROR", 500);
  }
};
