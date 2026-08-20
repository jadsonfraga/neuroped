import { getContextUser } from "../auth/_authorization";
import { CANONICAL_PRICE_CENTS } from "../../../shared/billing";
import { getClinicMembership, membershipCanManage, tenantError, tenantJson } from "../tenant/_core";
import {
  checkoutExternalReference,
  createAsaasRecurringCheckout,
  type BillingProviderEnv,
} from "./_provider";

interface Env extends BillingProviderEnv {
  DB?: D1Database;
}

function cleanClinicId(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Billing indisponível.", "BILLING_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }

  const clinicId = cleanClinicId(body.clinicId);
  const seats = Number(body.seats);
  if (!clinicId || !Number.isInteger(seats) || seats < 1 || seats > 500) {
    return tenantError("clinicId e quantidade de assentos válidos são obrigatórios.", "VALIDATION_ERROR", 400);
  }

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return tenantError("Apenas gestores da clínica podem iniciar checkout.", "TENANT_FORBIDDEN", 403);
  }

  const activeMembers = await db
    .prepare(`SELECT COUNT(*) AS total FROM clinic_memberships WHERE clinic_id = ? AND active = 1`)
    .bind(clinicId)
    .first<{ total: number }>();
  if (seats < Number(activeMembers?.total ?? 0)) {
    return tenantError(
      "O plano não pode ter menos assentos que membros ativos.",
      "SEAT_COUNT_BELOW_ACTIVE_MEMBERS",
      409,
    );
  }

  const customer = await db.prepare(
    `SELECT bc.id, bc.status, bc.canceled_at, bc.trial_ends_at,
            bs.id AS subscription_id, bs.current_period_ends_at
       FROM billing_customers bc
       LEFT JOIN billing_subscriptions bs
         ON bs.customer_id = bc.id
        AND bs.status IN ('trial','active','past_due')
      WHERE bc.clinic_id = ?
      ORDER BY bs.updated_at DESC
      LIMIT 1`,
  ).bind(clinicId).first<{
    id: string;
    status: string;
    canceled_at: string | null;
    trial_ends_at: string | null;
    subscription_id: string | null;
    current_period_ends_at: string | null;
  }>();

  if (!customer) return tenantError("Perfil de cobrança não encontrado.", "BILLING_PROFILE_NOT_FOUND", 409);
  if (customer.status === "canceled") {
    return tenantError(
      "Assinatura cancelada exige reativação explícita.",
      "BILLING_CANCELED_REQUIRES_REACTIVATION",
      409,
    );
  }

  const externalReference = checkoutExternalReference(customer.id);
  let providerCheckout;
  try {
    providerCheckout = await createAsaasRecurringCheckout(context.env, {
      externalReference,
      seats,
      trialEndsAt: customer.status === "trial"
        ? (customer.trial_ends_at ?? customer.current_period_ends_at)
        : null,
      customer: { name: user.name, email: user.email ?? "" },
    });
  } catch (error) {
    console.error("[billing.checkout] provider error", error);
    return tenantError("Checkout temporariamente indisponível.", "BILLING_PROVIDER_UNAVAILABLE", 503);
  }

  const checkoutId = crypto.randomUUID();
  try {
    await db.batch([
      db.prepare(
        `INSERT INTO billing_provider_checkouts
          (id, billing_customer_id, provider, provider_checkout_id, external_reference,
           seats, amount_cents, status, created_at, updated_at)
         VALUES (?, ?, 'asaas', ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`,
      ).bind(
        checkoutId,
        customer.id,
        providerCheckout.id,
        externalReference,
        seats,
        CANONICAL_PRICE_CENTS * seats,
      ),
      db.prepare(
        `UPDATE billing_customers
            SET provider = 'asaas', provider_checkout_id = ?, updated_at = datetime('now')
          WHERE id = ?`,
      ).bind(providerCheckout.id, customer.id),
      db.prepare(
        `UPDATE billing_subscriptions
            SET provider_checkout_id = ?, updated_at = datetime('now')
          WHERE id = ?`,
      ).bind(providerCheckout.id, customer.subscription_id ?? ""),
    ]);
  } catch (error) {
    console.error("[billing.checkout] persistence error", error);
    return tenantError("Checkout criado, mas não conciliado localmente.", "CHECKOUT_PERSIST_FAILED", 500);
  }

  return tenantJson({
    checkoutId,
    provider: "asaas",
    providerCheckoutId: providerCheckout.id,
    url: providerCheckout.link,
    seats,
    monthlyPriceCents: CANONICAL_PRICE_CENTS * seats,
    currency: "BRL",
  }, 201);
};
