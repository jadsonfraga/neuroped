import { fetchAsaasSubscriptionSnapshot, type BillingProviderEnv } from "./_provider";
import { appendAuditChain, safeOperationalError, workerAuthorized, type OperationalEnv } from "../live/_operational";
import { tenantError } from "../tenant/_core";

interface Env extends OperationalEnv, BillingProviderEnv {}

function json(data: unknown, status = 200): Response { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }); }

function internalStatus(status: string): string {
  const normalized = status.toUpperCase();
  if (["ACTIVE", "CONFIRMED", "RECEIVED"].includes(normalized)) return "active";
  if (["OVERDUE", "DUNNING"].includes(normalized)) return "past_due";
  if (["CANCELED", "DELETED"].includes(normalized)) return "canceled";
  if (["EXPIRED"].includes(normalized)) return "expired";
  return "unknown";
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!workerAuthorized(context.request, context.env)) return tenantError("Reconciliation worker não autorizado.", "WORKER_UNAUTHORIZED", 401);
  const db = context.env.DB; if (!db) return tenantError("Banco não configurado.", "DB_REQUIRED", 503);
  const actorUserId = (context.env as Env & { WORKER_ACTOR_USER_ID?: string }).WORKER_ACTOR_USER_ID?.trim();
  if (!actorUserId) return tenantError("Identidade do worker de billing não configurada.", "WORKER_ACTOR_NOT_CONFIGURED", 503);
  const runId = crypto.randomUUID(); const startedAt = new Date().toISOString();
  await db.prepare(`INSERT INTO billing_reconciliation_runs (id, provider, status, started_at) VALUES (?, 'asaas', 'running', ?)`).bind(runId, startedAt).run();
  let checked = 0; let matched = 0; let mismatches = 0; let reviewRequired = 0;
  try {
    const rows = await db.prepare(`SELECT bs.id AS subscription_id, bs.status AS internal_status, bs.provider_subscription_id, bc.clinic_id FROM billing_subscriptions bs JOIN billing_customers bc ON bc.id = bs.customer_id WHERE bs.provider_subscription_id IS NOT NULL AND bs.status IN ('trial','active','past_due') LIMIT 500`).all<{ subscription_id: string; internal_status: string; provider_subscription_id: string; clinic_id: string }>();
    for (const row of rows.results ?? []) {
      checked += 1; let result: "matched" | "mismatch" | "provider_unavailable" | "invalid_provider_response" = "matched"; let providerStatus: string | null = null; let failureCode: string | null = null;
      try {
        const snapshot = await fetchAsaasSubscriptionSnapshot(context.env, row.provider_subscription_id); providerStatus = snapshot.status; const expected = internalStatus(snapshot.status); if (expected === "unknown") { result = "invalid_provider_response"; failureCode = "PROVIDER_STATUS_UNMAPPED"; } else if (expected !== row.internal_status) { result = "mismatch"; mismatches += 1; } else matched += 1;
      } catch (error) { result = safeOperationalError(error).startsWith("ASAAS_RECONCILIATION_INVALID") ? "invalid_provider_response" : "provider_unavailable"; failureCode = safeOperationalError(error); }
      if (result !== "matched") reviewRequired += 1;
      await db.prepare(`INSERT INTO billing_reconciliation_items (id, run_id, clinic_id, subscription_id, provider_subscription_id, internal_status, provider_status, result, checked_at, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), runId, row.clinic_id, row.subscription_id, row.provider_subscription_id, row.internal_status, providerStatus, result, new Date().toISOString(), JSON.stringify({ failureCode, entitlementChanged: false })).run();
      if (result === "mismatch" || result === "provider_unavailable" || result === "invalid_provider_response") await appendAuditChain(db, { clinicId: row.clinic_id, actorUserId, action: "billing_reconciliation_review_required", targetType: "billing_subscription", targetId: row.subscription_id, result: "blocked", metadata: { result, failureCode, entitlementChanged: false } });
    }
    const finalStatus = reviewRequired > 0 ? "review_required" : "completed";
    await db.prepare(`UPDATE billing_reconciliation_runs SET status = ?, checked_count = ?, matched_count = ?, mismatch_count = ?, finished_at = ? WHERE id = ?`).bind(finalStatus, checked, matched, reviewRequired, new Date().toISOString(), runId).run();
    return json({ runId, status: finalStatus, checked, matched, mismatches: reviewRequired, entitlementChanged: false });
  } catch (error) {
    const code = safeOperationalError(error); await db.prepare(`UPDATE billing_reconciliation_runs SET status = 'failed', checked_count = ?, matched_count = ?, mismatch_count = ?, finished_at = ?, failure_code = ? WHERE id = ?`).bind(checked, matched, mismatches, new Date().toISOString(), code, runId).run(); return json({ runId, status: "failed", failureCode: code, entitlementChanged: false }, 500);
  }
};
