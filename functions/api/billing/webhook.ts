import { PAST_DUE_GRACE_DAYS } from "../../../shared/billing";
import {
  amountCentsFromWebhook,
  validateAsaasWebhook,
  webhookEventKey,
  webhookExternalReference,
  webhookProviderObjectId,
  type AsaasWebhookEvent,
  type BillingProviderEnv,
} from "./_provider";

interface Env extends BillingProviderEnv { DB?: D1Database; }

interface BillingContext {
  customer_id: string;
  customer_status: string;
  canceled_at: string | null;
  grace_ends_at: string | null;
  subscription_id: string;
  subscription_status: string;
  lifecycle_status: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function eventDate(value?: string): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
}

function plusDaysIso(base: Date, days: number): string {
  return new Date(base.getTime() + days * 86_400_000).toISOString();
}

function classify(eventName: string): "paid" | "past_due" | "refund" | "cancel" | "ignore" {
  if (["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "CHECKOUT_PAID"].includes(eventName)) return "paid";
  if (["PAYMENT_OVERDUE", "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED", "PAYMENT_REPROVED_BY_RISK_ANALYSIS"].includes(eventName)) return "past_due";
  if (["PAYMENT_REFUNDED", "PAYMENT_PARTIALLY_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED"].includes(eventName)) return "refund";
  if (["CHECKOUT_CANCELED", "CHECKOUT_EXPIRED", "PAYMENT_DELETED"].includes(eventName)) return "cancel";
  return "ignore";
}

function invoiceKind(kind: ReturnType<typeof classify>): string {
  if (kind === "paid") return "charge_paid";
  if (kind === "past_due") return "charge_failed";
  if (kind === "refund") return "charge_refunded";
  if (kind === "cancel") return "subscription_canceled";
  return "webhook_received";
}

async function activeSubscriptionContext(db: D1Database, customerId: string): Promise<BillingContext | null> {
  return db.prepare(
    `SELECT bc.id AS customer_id, bc.status AS customer_status,
            bc.canceled_at, bc.grace_ends_at,
            bs.id AS subscription_id, bs.status AS subscription_status,
            COALESCE(tl.status, 'active') AS lifecycle_status
       FROM billing_customers bc
       JOIN billing_subscriptions bs ON bs.customer_id = bc.id
       LEFT JOIN tenant_lifecycle tl ON tl.clinic_id = bc.clinic_id
      WHERE bc.id = ?
      ORDER BY CASE bs.status
        WHEN 'active' THEN 0 WHEN 'trial' THEN 1 WHEN 'past_due' THEN 2 ELSE 3 END,
        bs.updated_at DESC
      LIMIT 1`,
  ).bind(customerId).first<BillingContext>();
}

async function resolveContext(db: D1Database, event: AsaasWebhookEvent): Promise<BillingContext | null> {
  const externalReference = webhookExternalReference(event);
  if (externalReference) {
    const checkout = await db.prepare(
      `SELECT billing_customer_id
         FROM billing_provider_checkouts
        WHERE external_reference = ? OR provider_checkout_id = ?
        LIMIT 1`,
    ).bind(externalReference, event.checkout?.id ?? "").first<{ billing_customer_id: string }>();
    if (checkout) return activeSubscriptionContext(db, checkout.billing_customer_id);

    const parts = externalReference.split(":");
    if (parts.length >= 3 && parts[0] === "neuroped") {
      const direct = await activeSubscriptionContext(db, parts[1]);
      if (direct) return direct;
    }
  }

  const checkoutId = event.checkout?.id?.trim();
  if (checkoutId) {
    const row = await db.prepare(
      `SELECT billing_customer_id FROM billing_provider_checkouts
        WHERE provider_checkout_id = ? LIMIT 1`,
    ).bind(checkoutId).first<{ billing_customer_id: string }>();
    if (row) return activeSubscriptionContext(db, row.billing_customer_id);
  }
  return null;
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) return json({ error: "Billing DB indisponível.", code: "DB_REQUIRED" }, 503);

  try {
    if (!validateAsaasWebhook(request, env)) {
      return json({ error: "Webhook não autenticado.", code: "WEBHOOK_UNAUTHENTICATED" }, 401);
    }
  } catch (error) {
    console.error("[billing.webhook] auth config", error);
    return json({ error: "Webhook não configurado.", code: "WEBHOOK_NOT_CONFIGURED" }, 503);
  }

  let event: AsaasWebhookEvent;
  try {
    event = (await request.json()) as AsaasWebhookEvent;
  } catch {
    return json({ error: "Payload inválido.", code: "INVALID_JSON" }, 400);
  }

  const name = event.event?.trim() ?? "";
  let idempotencyKey: string;
  try {
    idempotencyKey = webhookEventKey(event);
  } catch {
    return json({ error: "Evento sem identificador.", code: "EVENT_ID_REQUIRED" }, 400);
  }

  const duplicate = await env.DB.prepare(
    `SELECT id FROM billing_invoice_events WHERE idempotency_key = ? LIMIT 1`,
  ).bind(idempotencyKey).first<{ id: string }>();
  if (duplicate) return json({ ok: true, duplicate: true });

  const billing = await resolveContext(env.DB, event);
  if (!billing) return json({ error: "Evento não conciliado.", code: "BILLING_CONTEXT_NOT_FOUND" }, 409);

  const occurredAt = eventDate(event.dateCreated);
  const eventInstant = new Date(occurredAt);
  const kind = classify(name);
  let nextStatus = billing.customer_status;
  let nextGrace = billing.grace_ends_at;
  let canceledAt = billing.canceled_at;
  const lifecycleLocked = billing.lifecycle_status === "closure_requested" || billing.lifecycle_status === "closed";

  // Webhooks tardios nunca reabrem cobrança/acesso enquanto o tenant está em
  // encerramento. O evento financeiro continua auditado, mas o customer fica
  // suspenso; uma eventual desistência exige reativação explícita.
  if (lifecycleLocked && billing.customer_status !== "canceled") {
    nextStatus = "suspended";
    nextGrace = null;
  } else if (billing.customer_status !== "canceled") {
    if (kind === "paid") {
      nextStatus = "active";
      nextGrace = null;
    } else if (kind === "past_due") {
      const existingGrace = billing.grace_ends_at ? new Date(billing.grace_ends_at) : null;
      if (billing.customer_status === "past_due" && existingGrace
        && Number.isFinite(existingGrace.getTime()) && eventInstant >= existingGrace) {
        nextStatus = "suspended";
        nextGrace = null;
      } else {
        nextStatus = "past_due";
        nextGrace = billing.grace_ends_at ?? plusDaysIso(eventInstant, PAST_DUE_GRACE_DAYS);
      }
    } else if (kind === "refund") {
      nextStatus = "suspended";
      nextGrace = null;
    } else if (kind === "cancel") {
      nextStatus = "canceled";
      nextGrace = null;
      canceledAt = occurredAt;
    }
  }

  const providerObjectId = webhookProviderObjectId(event);
  const checkoutStatus = kind === "paid"
    ? "paid"
    : kind === "cancel"
      ? (name === "CHECKOUT_EXPIRED" ? "expired" : "canceled")
      : null;
  const rawStatus = (event.payment?.status ?? event.checkout?.status ?? name) || null;

  const statements: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO billing_invoice_events
        (id, subscription_id, provider, provider_event_id, kind, amount_cents,
         status, idempotency_key, raw_status, occurred_at, metadata_json, created_at)
       VALUES (?, ?, 'asaas', ?, ?, ?, 'done', ?, ?, ?, ?, datetime('now'))`,
    ).bind(
      crypto.randomUUID(), billing.subscription_id, providerObjectId, invoiceKind(kind),
      amountCentsFromWebhook(event), idempotencyKey, rawStatus, occurredAt,
      JSON.stringify({ eventId: event.id ?? null, event: name }),
    ),
    env.DB.prepare(
      `UPDATE billing_customers
          SET status = ?, grace_ends_at = ?,
              last_failed_at = CASE WHEN ? = 'past_due' THEN ? ELSE last_failed_at END,
              canceled_at = ?, last_provider_event_at = ?, updated_at = datetime('now')
        WHERE id = ?
          AND (last_provider_event_at IS NULL OR julianday(last_provider_event_at) <= julianday(?))
          AND NOT (status = 'canceled' AND ? <> 'canceled')`,
    ).bind(
      nextStatus, nextGrace, nextStatus, occurredAt, canceledAt,
      occurredAt, billing.customer_id, occurredAt, nextStatus,
    ),
  ];

  if (checkoutStatus && event.checkout?.id) {
    statements.push(env.DB.prepare(
      `UPDATE billing_provider_checkouts SET status = ?, updated_at = datetime('now')
        WHERE provider_checkout_id = ?`,
    ).bind(checkoutStatus, event.checkout.id));
  }

  if (lifecycleLocked && kind !== "ignore") {
    statements.push(env.DB.prepare(
      `UPDATE billing_subscriptions
          SET last_provider_event_at = ?, updated_at = datetime('now')
        WHERE id = ?
          AND (last_provider_event_at IS NULL OR julianday(last_provider_event_at) <= julianday(?))`,
    ).bind(occurredAt, billing.subscription_id, occurredAt));
  } else if (kind === "paid") {
    statements.push(env.DB.prepare(
      `UPDATE billing_subscriptions
          SET status = 'active',
              seats = COALESCE((SELECT seats FROM billing_provider_checkouts
                WHERE billing_customer_id = ? AND status IN ('active','paid')
                ORDER BY created_at DESC LIMIT 1), seats),
              provider_subscription_id = COALESCE(?, provider_subscription_id),
              last_provider_event_at = ?, updated_at = datetime('now')
        WHERE id = ? AND status IN ('trial','active','past_due')
          AND (last_provider_event_at IS NULL OR julianday(last_provider_event_at) <= julianday(?))`,
    ).bind(billing.customer_id, event.payment?.subscription ?? null, occurredAt, billing.subscription_id, occurredAt));
  } else if (kind === "past_due") {
    statements.push(env.DB.prepare(
      `UPDATE billing_subscriptions SET status = 'past_due', last_provider_event_at = ?, updated_at = datetime('now')
        WHERE id = ? AND status IN ('trial','active','past_due')
          AND (last_provider_event_at IS NULL OR julianday(last_provider_event_at) <= julianday(?))`,
    ).bind(occurredAt, billing.subscription_id, occurredAt));
  } else if (kind === "refund") {
    statements.push(env.DB.prepare(
      `UPDATE billing_subscriptions SET status = 'expired', last_provider_event_at = ?, updated_at = datetime('now')
        WHERE id = ? AND status IN ('trial','active','past_due')
          AND (last_provider_event_at IS NULL OR julianday(last_provider_event_at) <= julianday(?))`,
    ).bind(occurredAt, billing.subscription_id, occurredAt));
  } else if (kind === "cancel") {
    statements.push(env.DB.prepare(
      `UPDATE billing_subscriptions
          SET status = 'canceled', canceled_at = COALESCE(canceled_at, ?),
              last_provider_event_at = ?, updated_at = datetime('now')
        WHERE id = ? AND status <> 'canceled'
          AND (last_provider_event_at IS NULL OR julianday(last_provider_event_at) <= julianday(?))`,
    ).bind(occurredAt, occurredAt, billing.subscription_id, occurredAt));
  }

  try {
    await env.DB.batch(statements);
  } catch (error) {
    const message = String(error);
    if (/UNIQUE|idempotency/i.test(message)) return json({ ok: true, duplicate: true });
    if (message.includes("BILLING_CANCELED_TERMINAL") || message.includes("BILLING_SUBSCRIPTION_CANCELED_TERMINAL")) {
      return json({ ok: true, ignored: "canceled_terminal" });
    }
    console.error("[billing.webhook] processing", error);
    return json({ error: "Falha no processamento.", code: "WEBHOOK_PROCESSING_FAILED" }, 500);
  }
  return json({ ok: true });
};
