import {
  COMMERCIAL_PLAN,
  resolveCommercialEntitlement,
  type BillingStatus,
  type CommercialEntitlement,
} from "../../../shared/billing";
import { tenantError, type TenantEnv } from "../tenant/_core";

export interface BillingEnv extends TenantEnv {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_ID?: string;
  CANONICAL_APP_URL?: string;
}

export interface BillingAccountRow {
  clinic_id: string;
  plan_code: string;
  status: BillingStatus;
  seat_quantity: number;
  provider: "stripe";
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  provider_checkout_session_id: string | null;
  checkout_attempt_id: string | null;
  checkout_seat_quantity: number | null;
  checkout_locked_until: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
  provider_event_created_at: number | null;
  created_at: string;
  updated_at: string;
}

export interface BillingEntitlementResult {
  account: BillingAccountRow | null;
  activeMembers: number;
  pendingInvitations: number;
  entitlement: CommercialEntitlement;
}

export function stripeBillingConfigured(env: BillingEnv): boolean {
  return Boolean(
    env.STRIPE_SECRET_KEY?.trim()
    && env.STRIPE_WEBHOOK_SECRET?.trim()
    && env.STRIPE_PRICE_ID?.trim(),
  );
}

export async function activeMemberCount(db: D1Database, clinicId: string): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS total FROM clinic_memberships WHERE clinic_id = ? AND active = 1")
    .bind(clinicId)
    .first<{ total: number }>();
  return Math.max(0, Number(row?.total ?? 0));
}

export async function pendingInvitationCount(db: D1Database, clinicId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS total FROM clinic_invitations
        WHERE clinic_id = ? AND accepted_at IS NULL AND revoked_at IS NULL
          AND datetime(expires_at) > datetime('now')`,
    )
    .bind(clinicId)
    .first<{ total: number }>();
  return Math.max(0, Number(row?.total ?? 0));
}

export async function getBillingAccount(
  db: D1Database,
  clinicId: string,
): Promise<BillingAccountRow | null> {
  return db
    .prepare(
      `SELECT clinic_id, plan_code, status, seat_quantity, provider,
              provider_customer_id, provider_subscription_id,
              provider_checkout_session_id, checkout_attempt_id,
              checkout_seat_quantity, checkout_locked_until, trial_ends_at,
              current_period_end, cancel_at_period_end, provider_event_created_at,
              created_at, updated_at
         FROM billing_accounts
        WHERE clinic_id = ?
        LIMIT 1`,
    )
    .bind(clinicId)
    .first<BillingAccountRow>();
}

export async function getCommercialEntitlement(
  db: D1Database,
  clinicId: string,
): Promise<BillingEntitlementResult> {
  const [account, activeMembers, pendingInvitations] = await Promise.all([
    getBillingAccount(db, clinicId),
    activeMemberCount(db, clinicId),
    pendingInvitationCount(db, clinicId),
  ]);
  return {
    account,
    activeMembers,
    pendingInvitations,
    entitlement: resolveCommercialEntitlement(
      account
        ? {
            status: account.status,
            seatQuantity: account.seat_quantity,
            trialEndsAt: account.trial_ends_at,
            currentPeriodEnd: account.current_period_end,
          }
        : null,
      activeMembers,
    ),
  };
}

export function commercialAccessError(result: BillingEntitlementResult): Response {
  const message = result.entitlement.reason === "SEAT_LIMIT_EXCEEDED"
    ? "A equipe ativa excede os assentos contratados. Ajuste o plano antes de gravar novos dados."
    : result.entitlement.reason === "TRIAL_EXPIRED"
      ? "O período de avaliação terminou. Ative o plano para continuar gravando."
      : "O plano da clínica não permite novas gravações neste momento.";
  return tenantError(message, result.entitlement.reason ?? "PAYMENT_REQUIRED", 402);
}

export function publicBillingAccount(
  result: BillingEntitlementResult,
  env: BillingEnv,
) {
  const account = result.account;
  return {
    plan: COMMERCIAL_PLAN,
    billingConfigured: stripeBillingConfigured(env),
    account: account
      ? {
          clinicId: account.clinic_id,
          planCode: account.plan_code,
          status: account.status,
          seatQuantity: account.seat_quantity,
          trialEndsAt: account.trial_ends_at,
          currentPeriodEnd: account.current_period_end,
          cancelAtPeriodEnd: Boolean(account.cancel_at_period_end),
          customerPortalAvailable: Boolean(account.provider_customer_id && env.STRIPE_SECRET_KEY?.trim()),
          createdAt: account.created_at,
          updatedAt: account.updated_at,
        }
      : null,
    usage: {
      activeMembers: result.activeMembers,
      pendingInvitations: result.pendingInvitations,
      remainingSeats: account
        ? Math.max(0, account.seat_quantity - result.activeMembers - result.pendingInvitations)
        : 0,
    },
    access: result.entitlement,
  };
}
