/** GET /api/billing/me — snapshot live do entitlement do usuário logado. */
import type { Env, PublicUser } from "../auth/_shared";
import { getContextUser } from "../auth/_authorization";
import { tenantJson, tenantError } from "../tenant/_core";
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
  grace_ends_at: string | null;
}

export interface BillingEnv extends Env {
  DB?: D1Database;
}

const BILLING_SCOPES = new Set<BillingScope>(["clinical", "finance", "admin", "export"]);

function scopeFromRequest(request: Request): BillingScope | null {
  const raw = (new URL(request.url).searchParams.get("scope") ?? "clinical").trim();
  return BILLING_SCOPES.has(raw as BillingScope) ? (raw as BillingScope) : null;
}

function clinicIdFromRequest(request: Request): string | null {
  const raw = (new URL(request.url).searchParams.get("clinicId") ?? "").trim();
  return raw ? raw.slice(0, 80) : null;
}

async function resolveClinicId(
  db: D1Database,
  userId: string,
  requestedClinicId: string | null,
): Promise<{ clinicId: string | null; ambiguous: boolean; forbidden: boolean }> {
  if (requestedClinicId) {
    const membership = await db
      .prepare(
        `SELECT clinic_id
           FROM clinic_memberships
          WHERE user_id = ? AND clinic_id = ? AND active = 1
          LIMIT 1`,
      )
      .bind(userId, requestedClinicId)
      .first<{ clinic_id: string }>();
    return {
      clinicId: membership?.clinic_id ?? null,
      ambiguous: false,
      forbidden: !membership,
    };
  }

  const memberships = await db
    .prepare(
      `SELECT clinic_id
         FROM clinic_memberships
        WHERE user_id = ? AND active = 1
        ORDER BY created_at ASC
        LIMIT 2`,
    )
    .bind(userId)
    .all<{ clinic_id: string }>();
  const rows = memberships.results ?? [];
  return {
    clinicId: rows[0]?.clinic_id ?? null,
    ambiguous: rows.length > 1,
    forbidden: false,
  };
}

async function billingRow(
  db: D1Database,
  userId: string,
  clinicId: string,
): Promise<SnapshotRow | null> {
  return db
    .prepare(
      `SELECT cm.user_id, cm.clinic_id, cm.role AS membership_role,
              bs.plan_id, bs.status AS subscription_status,
              CASE
                WHEN bc.status = 'trial' AND bc.trial_ends_at IS NOT NULL
                 AND julianday(bc.trial_ends_at) > julianday('now') THEN 1
                ELSE 0
              END AS trial_active,
              cm.active AS is_active,
              bc.trial_ends_at, bc.status AS customer_status, bc.grace_ends_at
         FROM clinic_memberships cm
         LEFT JOIN billing_customers bc ON bc.clinic_id = cm.clinic_id
         LEFT JOIN billing_subscriptions bs ON bs.customer_id = bc.id
        WHERE cm.user_id = ? AND cm.clinic_id = ? AND cm.active = 1
        ORDER BY CASE bs.status WHEN 'active' THEN 0 WHEN 'trial' THEN 1 WHEN 'past_due' THEN 2 ELSE 3 END,
                 bs.updated_at DESC
        LIMIT 1`,
    )
    .bind(userId, clinicId)
    .first<SnapshotRow>();
}

export async function billingMe(
  env: BillingEnv,
  user: PublicUser,
  scope: BillingScope,
  requestedClinicId: string | null = null,
): Promise<Response> {
  const db = env?.DB ?? null;
  if (!db) return tenantError("Backend de billing indisponível neste ambiente.", "BILLING_UNAVAILABLE", 503);

  const resolved = await resolveClinicId(db, user.id, requestedClinicId);
  if (resolved.forbidden) {
    // Não diferencia clinic inexistente de clinic sem membership: evita enumeração cross-tenant.
    return tenantError("Acesso à clínica não autorizado.", "TENANT_FORBIDDEN", 403);
  }
  if (resolved.ambiguous) {
    return tenantError(
      "Selecione a clínica para consultar o plano e os limites aplicáveis.",
      "TENANT_REQUIRED",
      409,
    );
  }

  const row = resolved.clinicId ? await billingRow(db, user.id, resolved.clinicId) : null;
  const result = evaluateEntitlement(row, scope);
  return tenantJson({
    user: { id: user.id, email: user.email, name: user.name },
    membership: row ? { clinicId: row.clinic_id, role: row.membership_role } : null,
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

export const onRequestGet: PagesFunction<BillingEnv> = async (context) => {
  const user = getContextUser(context);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  const scope = scopeFromRequest(context.request);
  if (!scope) return tenantError("Escopo de billing inválido.", "BILLING_SCOPE_INVALID", 400);

  return billingMe(context.env, user, scope, clinicIdFromRequest(context.request));
};
