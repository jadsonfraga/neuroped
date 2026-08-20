/**
 * GET /api/billing/me — snapshot de entitlement do usuário logado.
 *
 * O frontend apenas reflete; não há nenhuma decisão de acesso aqui.
 * A validação de escopo para recursos pagos ocorre em
 * `server/lib/billingEntitlement.ts` (Express) e nas functions live/tenant.
 */
import type { Env } from "../auth/_shared";
import type { PublicUser } from "../auth/_shared";
import { tenantJson, tenantError, getClinicMembership } from "../tenant/_core";
import { evaluateEntitlement, type BillingScope } from "../../../server/lib/billingEntitlement";

interface SnapshotRow {
  user_id: string;
  clinic_id: string;
  membership_role: string;
  plan_id: string | null;
  subscription_status: string | null;
  trial_active: number;
  is_active: number;
  trial_ends_at: string | null;
  customer_status: string | null;
}

export interface BillingEnv extends Env {
  DB?: D1Database;
}

function requireEnvDb(env: BillingEnv): D1Database | null {
  return env?.DB ?? null;
}

export async function billingMe(env: BillingEnv, user: PublicUser, scope: BillingScope): Promise<Response> {
  const db = requireEnvDb(env);
  if (!db) return tenantError("Backend de billing indisponível neste ambiente.", "BILLING_UNAVAILABLE", 503);

  const rows = await db
    .prepare(
      `SELECT be.user_id, be.clinic_id, be.membership_role, be.plan_id,
              be.subscription_status, be.trial_active, be.is_active,
              bc.trial_ends_at, bc.status AS customer_status
         FROM billing_entitlements be
         JOIN billing_customers bc ON bc.clinic_id = be.clinic_id
        WHERE be.user_id = ? AND be.is_active = 1
        LIMIT 1`,
    )
    .bind(user.id)
    .all<SnapshotRow>();

  const row = rows.results?.[0];
  const result = evaluateEntitlement(row, scope);

  return tenantJson({
    user: { id: user.id, email: user.email, name: user.name },
    membership: row
      ? { clinicId: row.clinic_id, role: row.membership_role }
      : null,
    entitlement: {
      planId: result.planId,
      subscriptionStatus: result.subscriptionStatus,
      trialActive: result.trialActive,
      trialEndsAt: row?.trial_ends_at ?? null,
      isActive: result.isActive,
      isPastDue: result.isPastDue,
      isSuspended: result.isSuspended,
      deniedReason: result.deniedReason,
    },
  });
}
