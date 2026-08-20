import { COMMERCIAL_PLAN, normalizeSeatQuantity } from "../../../shared/billing";
import { getContextUser } from "../auth/_authorization";
import {
  getClinicMembership,
  membershipCanManage,
  prepareSaasAudit,
  tenantError,
  tenantJson,
} from "../tenant/_core";
import {
  activeMemberCount,
  getBillingAccount,
  pendingInvitationCount,
  type BillingEnv,
} from "./_core";
import {
  assertCommercialPrice,
  canonicalAppUrl,
  stripeGet,
  stripePost,
} from "./_stripe";

interface CheckoutSession {
  id: string;
  url: string | null;
  status?: "open" | "complete" | "expired";
  expires_at?: number;
}

const CHECKOUT_LEASE_SECONDS = 35 * 60;

function isFuture(value: string | null, nowMs: number): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed > nowMs;
}

async function releaseCheckoutLease(
  db: D1Database,
  clinicId: string,
  attemptId: string,
): Promise<void> {
  await db.prepare(
    `UPDATE billing_accounts
        SET checkout_attempt_id = NULL, checkout_seat_quantity = NULL,
            checkout_locked_until = NULL
      WHERE clinic_id = ? AND checkout_attempt_id = ?`,
  ).bind(clinicId, attemptId).run();
}

export const onRequestPost: PagesFunction<BillingEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco comercial não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  const clinicId = typeof body.clinicId === "string" ? body.clinicId.trim().slice(0, 80) : "";
  const seats = normalizeSeatQuantity(body.seats);
  if (!clinicId || seats === null) {
    return tenantError("clinicId e quantidade válida de assentos são obrigatórios.", "VALIDATION_ERROR", 400);
  }

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return tenantError("Apenas gestores podem contratar ou alterar o plano.", "TENANT_FORBIDDEN", 403);
  }
  const [members, pendingInvitations] = await Promise.all([
    activeMemberCount(db, clinicId),
    pendingInvitationCount(db, clinicId),
  ]);
  if (seats < members + pendingInvitations) {
    return tenantError("A quantidade de assentos não pode ser menor que a equipe ativa e os convites pendentes.", "SEAT_BELOW_USAGE", 409);
  }
  const account = await getBillingAccount(db, clinicId);
  if (!account) return tenantError("Conta comercial não encontrada.", "BILLING_ACCOUNT_MISSING", 409);
  if (account.provider_subscription_id && ["active", "trialing", "past_due"].includes(account.status)) {
    return tenantError("A clínica já possui assinatura. Use o portal de cobrança.", "SUBSCRIPTION_ALREADY_EXISTS", 409);
  }

  const secret = context.env.STRIPE_SECRET_KEY?.trim();
  const priceId = context.env.STRIPE_PRICE_ID?.trim();
  if (!secret || !priceId) {
    return tenantError("Cobrança Stripe ainda não configurada.", "BILLING_NOT_CONFIGURED", 503);
  }

  let checkoutAttemptId: string | null = null;
  let providerSessionCreated = false;
  try {
    // Impede que um Price ID trocado cobre valor/moeda/periodicidade divergentes
    // do plano apresentado na UI.
    await assertCommercialPrice(context.env);

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    if (isFuture(account.checkout_locked_until, nowMs)) {
      if (account.checkout_seat_quantity !== seats) {
        return tenantError(
          "Já existe um checkout em andamento com outra quantidade de assentos.",
          "CHECKOUT_ALREADY_PENDING",
          409,
        );
      }
      if (!account.provider_checkout_session_id) {
        return tenantError("Checkout em preparação. Tente novamente em instantes.", "CHECKOUT_IN_PROGRESS", 409);
      }
      const existingSession = await stripeGet<CheckoutSession>(
        context.env,
        `/checkout/sessions/${encodeURIComponent(account.provider_checkout_session_id)}`,
      );
      if (existingSession.status === "open" && existingSession.url) {
        return tenantJson({ url: existingSession.url, reused: true });
      }
      if (existingSession.status === "complete") {
        return tenantError(
          "Pagamento recebido e aguardando reconciliação do provedor.",
          "CHECKOUT_RECONCILIATION_PENDING",
          409,
        );
      }
      if (existingSession.status !== "expired") {
        return tenantError("Checkout anterior ainda está sendo finalizado.", "CHECKOUT_IN_PROGRESS", 409);
      }
      await db.prepare(
        `UPDATE billing_accounts
            SET checkout_attempt_id = NULL, checkout_seat_quantity = NULL,
                checkout_locked_until = NULL
          WHERE clinic_id = ? AND provider_checkout_session_id = ?`,
      ).bind(clinicId, account.provider_checkout_session_id).run();
    }

    checkoutAttemptId = crypto.randomUUID();
    const checkoutExpiresAt = Math.floor(nowMs / 1_000) + CHECKOUT_LEASE_SECONDS;
    const checkoutLockedUntil = new Date(checkoutExpiresAt * 1_000).toISOString();
    const acquired = await db.prepare(
      `UPDATE billing_accounts
          SET checkout_attempt_id = ?, checkout_seat_quantity = ?,
              checkout_locked_until = ?, updated_at = ?
        WHERE clinic_id = ?
          AND (checkout_locked_until IS NULL OR datetime(checkout_locked_until) <= datetime(?))
          AND NOT (
            provider_subscription_id IS NOT NULL
            AND status IN ('active','trialing','past_due')
          )
          AND ? >= (
            (SELECT COUNT(*) FROM clinic_memberships m
              WHERE m.clinic_id = billing_accounts.clinic_id AND m.active = 1)
            +
            (SELECT COUNT(*) FROM clinic_invitations i
              WHERE i.clinic_id = billing_accounts.clinic_id
                AND i.accepted_at IS NULL AND i.revoked_at IS NULL
                AND datetime(i.expires_at) > datetime(?))
          )`,
    ).bind(
      checkoutAttemptId,
      seats,
      checkoutLockedUntil,
      nowIso,
      clinicId,
      nowIso,
      seats,
      nowIso,
    ).run();
    if (Number(acquired.meta?.changes ?? 0) !== 1) {
      return tenantError(
        "Outro checkout começou ou a utilização de assentos mudou. Atualize e tente novamente.",
        "CHECKOUT_STATE_CHANGED",
        409,
      );
    }

    // Se uma lease anterior expirou, a sessão remota correspondente precisa
    // estar expirada antes de abrirmos outra. Isso elimina sobreposição mesmo
    // quando o relógio local e o provedor diferem por alguns segundos.
    if (account.provider_checkout_session_id) {
      const previousSession = await stripeGet<CheckoutSession>(
        context.env,
        `/checkout/sessions/${encodeURIComponent(account.provider_checkout_session_id)}`,
      );
      if (previousSession.status === "complete") {
        return tenantError(
          "Pagamento recebido e aguardando reconciliação do provedor.",
          "CHECKOUT_RECONCILIATION_PENDING",
          409,
        );
      }
      if (previousSession.status === "open") {
        await stripePost(
          context.env,
          `/checkout/sessions/${encodeURIComponent(account.provider_checkout_session_id)}/expire`,
          new URLSearchParams(),
          `checkout-expire:${account.provider_checkout_session_id}`,
        );
      } else if (previousSession.status !== "expired") {
        throw new Error("STRIPE_CHECKOUT_INVALID_RESPONSE");
      }
    }

    const appUrl = canonicalAppUrl(context.env);
    const values = new URLSearchParams({
      mode: "subscription",
      success_url: `${appUrl}/#/plano-equipe?checkout=success`,
      cancel_url: `${appUrl}/#/plano-equipe?checkout=cancelled`,
      client_reference_id: clinicId,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": String(seats),
      "metadata[clinic_id]": clinicId,
      "metadata[plan_code]": COMMERCIAL_PLAN.code,
      "metadata[seat_quantity]": String(seats),
      "subscription_data[metadata][clinic_id]": clinicId,
      "subscription_data[metadata][plan_code]": COMMERCIAL_PLAN.code,
      "subscription_data[metadata][seat_quantity]": String(seats),
      locale: "pt-BR",
      billing_address_collection: "required",
      allow_promotion_codes: "true",
      expires_at: String(checkoutExpiresAt),
    });
    if (account.provider_customer_id) values.set("customer", account.provider_customer_id);
    else values.set("customer_email", user.email);

    const session = await stripePost<CheckoutSession>(
      context.env,
      "/checkout/sessions",
      values,
      `checkout:${clinicId}:${checkoutAttemptId}`,
    );
    providerSessionCreated = true;
    if (!session.id || !session.url) throw new Error("STRIPE_CHECKOUT_INVALID_RESPONSE");
    const persisted = await db.batch([
      db.prepare(
        `UPDATE billing_accounts
            SET provider_checkout_session_id = ?, checkout_locked_until = ?, updated_at = ?
          WHERE clinic_id = ? AND checkout_attempt_id = ?`,
      ).bind(session.id, checkoutLockedUntil, new Date().toISOString(), clinicId, checkoutAttemptId),
      prepareSaasAudit(db, {
        clinicId,
        actorUserId: user.id,
        action: "billing_checkout_created",
        targetType: "billing_account",
        targetId: clinicId,
        metadata: { seats, planCode: COMMERCIAL_PLAN.code },
      }, true),
    ]);
    if (persisted.some((result) => Number(result.meta?.changes ?? 0) !== 1)) {
      throw new Error("CHECKOUT_PERSISTENCE_FAILED");
    }
    return tenantJson({ url: session.url }, 201);
  } catch (error) {
    if (checkoutAttemptId && !providerSessionCreated) {
      try {
        await releaseCheckoutLease(db, clinicId, checkoutAttemptId);
      } catch (releaseError) {
        console.error("[billing.checkout] lease release failed", releaseError);
      }
    }
    const code = error instanceof Error ? error.message : "STRIPE_API_ERROR";
    console.error("[billing.checkout] provider error", code);
    if (code === "STRIPE_PRICE_CONTRACT_MISMATCH") {
      return tenantError("O preço configurado diverge do plano NeuroPed de R$ 99 por assento/mês.", code, 503);
    }
    return tenantError("Não foi possível iniciar a contratação.", "BILLING_PROVIDER_UNAVAILABLE", 502);
  }
};
