import { evaluateEntitlement, denialResponse } from "../../../server/lib/billingEntitlement";
import type { EntitlementScope } from "../../../shared/billing";

export async function requireBillingEntitlement(
  db: D1Database,
  userId: string,
  clinicId: string,
  scope: EntitlementScope,
): Promise<Response | null> {
  const decision = await evaluateEntitlement(db, userId, clinicId, scope);
  return decision.allowed ? null : denialResponse(decision);
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
  if (explicit) return explicit;

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

export async function publicClinicBillingAllowed(
  db: D1Database,
  providerUserId: string,
): Promise<boolean> {
  const row = await db.prepare(
    `SELECT bc.status
       FROM clinic_memberships cm
       JOIN billing_customers bc ON bc.clinic_id = cm.clinic_id
      WHERE cm.user_id = ? AND cm.active = 1
        AND bc.status IN ('trial','active')
      ORDER BY CASE bc.status WHEN 'active' THEN 0 ELSE 1 END
      LIMIT 1`,
  ).bind(providerUserId).first<{ status: string }>();
  return Boolean(row);
}
