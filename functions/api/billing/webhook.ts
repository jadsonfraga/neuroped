import {
  BillingCustomerStatus,
  SAAS_PAST_DUE_GRACE_DAYS,
} from "../../../shared/billing";
import {
  amountCentsFromWebhook,
  validateAsaasWebhook,
  webhookEventKey,
  webhookExternalReference,
  webhookProviderObjectId,
  type AsaasWebhookEvent,
  type BillingProviderEnv,
} from "./_provider";

interface Env extends BillingProviderEnv {
  DB?: D1Database;
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
  if (["PAYMENT_OVERDUE", "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED", "PAYMENT_REPROVED_BY_RISK_ANALYSIS"].includes(eventName)) {
    return "past_due";
  }
  if (["PAYMENT_REFUNDED", "PAYMENT_PARTIALLY_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED"].includes(eventName)) {
    return "refund";
  }
  if (["CHECKOUT_CANCELED", "CHECKOUT_EXPIRED", "PAYMENT_DELETED"].includes(eventName)) return "cancel";
  return "ignore";
}

async function resolveCustomer(
  db: D1Database,
  event: AsaasWebhookEvent,
): Promise<{ id: string; status: string; canceled_at: string | null } | null> {
  const externalReference = webhookExternalReference(event);
  if (externalReference) {
    const checkout = await db
      .prepare(
        `SELECT bc.id, bc.status, bc.canceled_at
           FROM billing_provider_checkouts pc
           JOIN billing_customers bc ON bc.id = pc.billing_customer_id
          WHERE pc.external_reference = ? OR pc.provider_checkout_id = ?
          LIMIT 1`,
      )
      .bind(externalReference, event.checkout?.id ?? "")
      .first<{ id: string; status: string; canceled_at: string | null }>();
    if (checkout) return checkout;

    const parts = externalReference.split(":");
    if (parts.length >= 3 && parts[0] === "neuroped") {
      const direct = await db
        .prepare(`SELECT id, status, canceled_at FROM billing_customers WHERE id = ? LIMIT 1`)
        .bind(parts[1])
        .first<{ id: string; status: string; canceled_at: string | null }>();
      if (direct) return direct;
    }
  }

  const providerObjectId = webhookProviderObjectId(event);
  if (!providerObjectId) return null;
  return db
    .prepare(
      `SELECT id, status, canceled_at
         FROM billing_customers
        WHERE provider_customer_id = ?
           OR provider_checkout_id = ?
        LIMIT 1`,
    )
    .bind(providerObjectId, providerObjectId)
    .first<{ id: string; status: string; canceled_at: string | null }>();
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
    event = await request.json<AsaasWebhookEvent>();
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

  const customer = await resolveCustomer(env.DB, event);
  if (!customer) {
    return json({ error: "Evento não conciliado.", code: "BILLING_CUSTOMER_NOT_FOUND" }, 409);
  }

  const duplicate = await env.DB
    .prepare(`SELECT id FROM billing_invoice_events WHERE idempotency_key = ? LIMIT 1`)
    .bind(idempotencyKey)
    .first<{ id: string }>();
  if (duplicate) return json({ ok: true, duplicate: true });

  const occurredAt = eventDate(event.dateCreated);
  const eventInstant = new Date(occurredAt);
  const kind = classify(name);

  let nextStatus = customer.status;
  let graceEndsAt: string | null | undefined = undefined;
  let canceledAt: string | null | undefined = undefined;

  if (customer.status !== BillingCustomerStatus.Canceled) {
    if (kind === "paid") {
      nextStatus = BillingCustomerStatus.Active;
      graceEndsAt = null;
    } else if (kind === "past_due") {
      nextStatus = BillingCustomerStatus.PastDue;
      graceEndsAt = plusDaysIso(eventInstant, SAAS_PAST_DUE_GRACE_DAYS);
    } else if (kind === "refund") {
      nextStatus = BillingCustomerStatus.Suspended;
      graceEndsAt = null;
    } else if (kind === "cancel") {
      nextStatus = BillingCustomerStatus.Canceled;
      graceEndsAt = null;
      canceledAt = occurredAt;
    }
  }

  const providerObjectId = webhookProviderObjectId(event);
  const eventId = crypto.randomUUID();
  const checkoutStatus =
    kind === "paid" ? "paid" : kind === "cancel" ? (name === "CHECKOUT_EXPIRED" ? "expired" : "canceled") : null;

  try {
    const statements: D1PreparedStatement[] = [
      env.DB.prepare(
        `INSERT INTO billing_invoice_events
          (id, billing_customer_id, provider, provider_invoice_id, idempotency_key,
           kind, amount_cents, currency, raw_status, occurred_at, received_at, metadata_json)
         VALUES (?, ?, 'asaas', ?, ?, ?, ?, 'BRL', ?, ?, datetime('now'), ?)`,
      ).bind(
        eventId,
        customer.id,
        providerObjectId,
        idempotencyKey,
        name || "UNKNOWN",
        amountCentsFromWebhook(event),
        event.payment?.status ?? event.checkout?.status ?? null,
        occurredAt,
        JSON.stringify({ eventId: event.id ?? null }),
      ),
      env.DB.prepare(
        `UPDATE billing_customers
            SET status = ?,
                grace_ends_at = CASE WHEN ? IS NULL THEN NULL ELSE ? END,
                canceled_at = COALESCE(?, canceled_at),
                last_provider_event_at = ?,
                updated_at = datetime('now')
          WHERE id = ?
            AND (last_provider_event_at IS NULL OR julianday(last_provider_event_at) <= julianday(?))
            AND NOT (status = 'canceled' AND ? <> 'canceled')`,
      ).bind(
        nextStatus,
        graceEndsAt ?? null,
        graceEndsAt ?? null,
        canceledAt ?? null,
        occurredAt,
        customer.id,
        occurredAt,
        nextStatus,
      ),
    ];

    if (checkoutStatus && event.checkout?.id) {
      statements.push(
        env.DB.prepare(
          `UPDATE billing_provider_checkouts
              SET status = ?, updated_at = datetime('now')
            WHERE provider_checkout_id = ?`,
        ).bind(checkoutStatus, event.checkout.id),
      );
    }

    if (kind === "paid") {
      statements.push(
        env.DB.prepare(
          `UPDATE billing_subscriptions
              SET status = 'active',
                  seats = COALESCE(
                    (SELECT seats FROM billing_provider_checkouts
                      WHERE billing_customer_id = ?
                        AND status IN ('active','paid')
                      ORDER BY created_at DESC LIMIT 1),
                    seats
                  ),
                  last_provider_event_at = ?,
                  updated_at = datetime('now')
            WHERE billing_customer_id = ?
              AND status IN ('trialing','active','past_due','paused')`,
        ).bind(customer.id, occurredAt, customer.id),
      );
    } else if (kind === "past_due") {
      statements.push(
        env.DB.prepare(
          `UPDATE billing_subscriptions SET status = 'past_due', last_provider_event_at = ?, updated_at = datetime('now')
            WHERE billing_customer_id = ? AND status IN ('trialing','active','past_due','paused')`,
        ).bind(occurredAt, customer.id),
      );
    } else if (kind === "refund") {
      statements.push(
        env.DB.prepare(
          `UPDATE billing_subscriptions SET status = 'paused', last_provider_event_at = ?, updated_at = datetime('now')
            WHERE billing_customer_id = ? AND status IN ('trialing','active','past_due','paused')`,
        ).bind(occurredAt, customer.id),
      );
    } else if (kind === "cancel") {
      statements.push(
        env.DB.prepare(
          `UPDATE billing_subscriptions
              SET status = 'canceled', canceled_at = COALESCE(canceled_at, ?),
                  last_provider_event_at = ?, updated_at = datetime('now')
            WHERE billing_customer_id = ? AND status <> 'canceled'`,
        ).bind(occurredAt, occurredAt, customer.id),
      );
    }

    await env.DB.batch(statements);
  } catch (error) {
    const message = String(error);
    if (/UNIQUE|idempotency/i.test(message)) return json({ ok: true, duplicate: true });
    if (message.includes("BILLING_CANCELED_TERMINAL")) {
      return json({ ok: true, ignored: "canceled_terminal" });
    }
    console.error("[billing.webhook] processing", error);
    return json({ error: "Falha no processamento.", code: "WEBHOOK_PROCESSING_FAILED" }, 500);
  }

  return json({ ok: true });
};
