/** GET /api/billing/me — snapshot live do entitlement do usuário logado. */
import type { Env, PublicUser } from "../auth/_shared";
import { getContextUser } from "../auth/_authorization";
import { tenantJson, tenantError } from "../tenant/_core";
import { evaluateEntitlement, type BillingScope } from "../../../server/lib/billingEntitlement";
import { remainingTrialDays } from "../../../shared/billing";
import { resolveEffectiveEntitlements } from "../../../shared/entitlements";

interface SnapshotRow {
  user_id: string;
  clinic_id: string;
  membership_role: string;
  plan_id: string | null;
  subscription_status: string | null;
  subscription_seats: number | null;
  trial_active: number;
  is_active: number;
  trial_ends_at: string | null;
  customer_status: string | null;
  grace_ends_at: string | null;
  clinic_status: string | null;
  active_members: number | null;
}

export interface BillingEnv extends Env {
  DB?: D1Database;
}

const BILLING_SCOPES = new Set<BillingScope>(["clinical", "finance", "admin", "export"]);

function scopeFromRequest(request: Request): BillingScope | null {
  const raw = (new URL(request.url).searchParams.get("scope") ?? "clinical").trim();
  return BILLING_SCOPES.has(raw as BillingScope) ? (raw as BillingScope) : null;
}

/**
 * O snapshot precisa refletir a MESMA clínica e as MESMAS colunas que o guard
 * (`requireBillingEntitlement`) usa para decidir acesso — inclusive
 * `clinics.status` e o filtro de assinaturas vivas — senão a tela de plano
 * reporta um estado que o servidor nega. `clinicId` explícito atende usuários
 * com múltiplas clínicas; sem ele, mantém a resolução por membership única.
 */
export async function billingMe(
  env: BillingEnv,
  user: PublicUser,
  scope: BillingScope,
  clinicId?: string,
): Promise<Response> {
  const db = env?.DB ?? null;
  if (!db) return tenantError("Backend de billing indisponível neste ambiente.", "BILLING_UNAVAILABLE", 503);

  const clinicFilter = clinicId ? "AND cm.clinic_id = ?" : "";
  const binds: unknown[] = clinicId ? [user.id, clinicId] : [user.id];
  const row = await db.prepare(
    `SELECT cm.user_id, cm.clinic_id, cm.role AS membership_role,
            bs.plan_id, bs.status AS subscription_status, bs.seats AS subscription_seats,
            CASE
              WHEN bc.status = 'trial' AND bc.trial_ends_at IS NOT NULL
               AND julianday(bc.trial_ends_at) > julianday('now') THEN 1
              ELSE 0
            END AS trial_active,
            cm.active AS is_active,
            bc.trial_ends_at, bc.status AS customer_status, bc.grace_ends_at,
            c.status AS clinic_status,
            (SELECT COUNT(*) FROM clinic_memberships m2
              WHERE m2.clinic_id = cm.clinic_id AND m2.active = 1) AS active_members
       FROM clinic_memberships cm
       JOIN clinics c ON c.id = cm.clinic_id
       LEFT JOIN billing_customers bc ON bc.clinic_id = cm.clinic_id
       LEFT JOIN billing_subscriptions bs ON bs.customer_id = bc.id
        AND bs.status IN ('trial','active','past_due','canceled','expired')
      WHERE cm.user_id = ? AND cm.active = 1 ${clinicFilter}
      ORDER BY cm.created_at ASC,
               CASE bs.status WHEN 'active' THEN 0 WHEN 'trial' THEN 1 WHEN 'past_due' THEN 2 ELSE 3 END,
               bs.updated_at DESC
      LIMIT 1`,
  ).bind(...binds).first<SnapshotRow>();

  const result = evaluateEntitlement(row, scope);
  const billingActive = Boolean(result.isActive && !result.isSuspended);
  const entitlements = resolveEffectiveEntitlements({
    planId: result.planId,
    subscriptionSeats: row?.subscription_seats ?? null,
    billingActive,
  });

  return tenantJson({
    user: { id: user.id, email: user.email, name: user.name },
    membership: row ? { clinicId: row.clinic_id, role: row.membership_role } : null,
    clinicStatus: row?.clinic_status ?? null,
    entitlement: {
      planId: result.planId,
      subscriptionStatus: result.subscriptionStatus,
      trialActive: result.trialActive,
      trialEndsAt: row?.trial_ends_at ?? null,
      trialDaysRemaining: result.trialActive ? remainingTrialDays(row?.trial_ends_at ?? null) : 0,
      isActive: result.isActive,
      isPastDue: result.isPastDue,
      isSuspended: result.isSuspended,
      deniedReason: result.deniedReason,
    },
    seats: {
      contracted: row?.subscription_seats ?? null,
      activeMembers: row?.active_members ?? null,
    },
    capabilities: entitlements,
  });
}

export const onRequestGet: PagesFunction<BillingEnv> = async (context) => {
  const user = getContextUser(context);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  const scope = scopeFromRequest(context.request);
  if (!scope) return tenantError("Escopo de billing inválido.", "BILLING_SCOPE_INVALID", 400);

  const clinicId = (new URL(context.request.url).searchParams.get("clinicId") ?? "").trim().slice(0, 80);
  return billingMe(context.env, user, scope, clinicId || undefined);
};
