import { evaluateEntitlement, type BillingScope } from "../../../server/lib/billingEntitlement";

interface LiveEntitlementRow {
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

async function loadLiveEntitlement(
  db: D1Database,
  userId: string,
  clinicId: string,
): Promise<LiveEntitlementRow | null> {
  return db.prepare(
    `SELECT cm.user_id, cm.clinic_id, cm.role AS membership_role,
            bs.plan_id,
            bs.status AS subscription_status,
            CASE
              WHEN bc.status = 'trial'
               AND bc.trial_ends_at IS NOT NULL
               AND julianday(bc.trial_ends_at) > julianday('now') THEN 1
              ELSE 0
            END AS trial_active,
            cm.active AS is_active,
            bc.trial_ends_at,
            bc.status AS customer_status,
            bc.grace_ends_at
       FROM clinic_memberships cm
       LEFT JOIN billing_customers bc ON bc.clinic_id = cm.clinic_id
       LEFT JOIN billing_subscriptions bs
         ON bs.customer_id = bc.id
        AND bs.status IN ('trial','active','past_due','canceled','expired')
      WHERE cm.user_id = ? AND cm.clinic_id = ?
      ORDER BY CASE bs.status
        WHEN 'active' THEN 0 WHEN 'trial' THEN 1 WHEN 'past_due' THEN 2 ELSE 3 END,
        bs.updated_at DESC
      LIMIT 1`,
  ).bind(userId, clinicId).first<LiveEntitlementRow>();
}

export async function requireBillingEntitlement(
  db: D1Database,
  userId: string,
  clinicId: string,
  scope: BillingScope,
): Promise<Response | null> {
  const row = await loadLiveEntitlement(db, userId, clinicId);
  const decision = evaluateEntitlement(row, scope);
  if (decision.deniedReason === null) return null;
  if (decision.deniedReason === "ENTITLEMENT_PAST_DUE" && !decision.isSuspended) return null;

  const billingDenial = decision.deniedReason === "ENTITLEMENT_NO_SUBSCRIPTION"
    || decision.deniedReason === "ENTITLEMENT_SUSPENDED";
  return new Response(JSON.stringify({
    error: "Acesso indisponível para o entitlement atual.",
    code: decision.deniedReason,
    entitlement: {
      isPastDue: decision.isPastDue,
      isSuspended: decision.isSuspended,
      trialActive: decision.trialActive,
    },
  }), {
    status: billingDenial ? 402 : 403,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function resolveBillingClinicId(
  db: D1Database,
  userId: string,
  request: Request,
): Promise<string | null> {
  const explicit = (
    request.headers.get("x-tenant-id")
    ?? request.headers.get("x-clinic-id")
    ?? ""
  ).trim().slice(0, 80);

  if (explicit) {
    const membership = await db.prepare(
      `SELECT clinic_id
         FROM clinic_memberships
        WHERE user_id = ? AND clinic_id = ? AND active = 1
        LIMIT 1`,
    ).bind(userId, explicit).first<{ clinic_id: string }>();
    return membership?.clinic_id ?? null;
  }

  const rows = await db.prepare(
    `SELECT clinic_id
       FROM clinic_memberships
      WHERE user_id = ? AND active = 1
      ORDER BY created_at ASC
      LIMIT 2`,
  ).bind(userId).all<{ clinic_id: string }>();

  const memberships = rows.results ?? [];
  return memberships.length === 1 ? memberships[0].clinic_id : null;
}
