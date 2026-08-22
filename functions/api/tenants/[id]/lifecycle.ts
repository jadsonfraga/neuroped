import { getContextUser } from "../../auth/_authorization";
import {
  getClinicMembership,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";
import {
  canCancelTenantClosure,
  daysUntilRetention,
  effectiveTenantLifecycleStatus,
  isTenantClosureReasonCode,
  retentionDeadline,
  tenantAccessMode,
  type TenantLifecycleStatus,
} from "../../../../shared/tenantLifecycle";
import {
  cancelAsaasCheckout,
  cancelAsaasSubscription,
  type BillingProviderEnv,
} from "../../billing/_provider";

type Env = TenantEnv & BillingProviderEnv;

interface LifecycleRow {
  clinic_id: string;
  status: TenantLifecycleStatus;
  previous_clinic_status: "active" | "suspended" | "closed" | null;
  previous_billing_status: string | null;
  reason_code: string | null;
  requested_by_user_id: string | null;
  requested_at: string | null;
  retention_until: string | null;
  canceled_at: string | null;
  finalized_at: string | null;
  legal_hold: number;
  updated_at: string;
}

interface BillingRow {
  customer_id: string;
  provider: string;
  customer_status: string;
  trial_ends_at: string | null;
  provider_subscription_id: string | null;
  provider_checkout_id: string | null;
}

function clinicIdFrom(params: Record<string, string | string[]>): string {
  const raw = params.id;
  return String(Array.isArray(raw) ? raw[0] : (raw ?? "")).trim().slice(0, 80);
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function loadLifecycle(db: D1Database, clinicId: string): Promise<LifecycleRow | null> {
  return db.prepare(
    `SELECT clinic_id, status, previous_clinic_status, previous_billing_status,
            reason_code, requested_by_user_id, requested_at, retention_until,
            canceled_at, finalized_at, legal_hold, updated_at
       FROM tenant_lifecycle
      WHERE clinic_id = ? LIMIT 1`,
  ).bind(clinicId).first<LifecycleRow>();
}

async function loadBilling(db: D1Database, clinicId: string): Promise<BillingRow | null> {
  return db.prepare(
    `SELECT bc.id AS customer_id, bc.provider, bc.status AS customer_status,
            bc.trial_ends_at,
            bs.provider_subscription_id,
            (SELECT bpc.provider_checkout_id
               FROM billing_provider_checkouts bpc
              WHERE bpc.billing_customer_id = bc.id AND bpc.status = 'active'
              ORDER BY bpc.created_at DESC LIMIT 1) AS provider_checkout_id
       FROM billing_customers bc
       LEFT JOIN billing_subscriptions bs ON bs.customer_id = bc.id
      WHERE bc.clinic_id = ?
      ORDER BY CASE bs.status
        WHEN 'active' THEN 0 WHEN 'trial' THEN 1 WHEN 'past_due' THEN 2 ELSE 3 END,
        bs.updated_at DESC
      LIMIT 1`,
  ).bind(clinicId).first<BillingRow>();
}

function lifecyclePayload(row: LifecycleRow, clinicStatus: string, billing: BillingRow | null) {
  const snapshot = {
    status: row.status,
    requestedAt: row.requested_at,
    retentionUntil: row.retention_until,
    legalHold: row.legal_hold === 1,
  } as const;
  const effectiveStatus = effectiveTenantLifecycleStatus(snapshot);
  return {
    status: row.status,
    effectiveStatus,
    accessMode: tenantAccessMode(effectiveStatus),
    clinicStatus,
    reasonCode: row.reason_code,
    requestedAt: row.requested_at,
    retentionUntil: row.retention_until,
    retentionDaysRemaining: daysUntilRetention(row.retention_until),
    legalHold: row.legal_hold === 1,
    canCancel: canCancelTenantClosure(snapshot),
    canExport: clinicStatus !== "closed",
    purgeEligible: effectiveStatus === "purge_ready" && row.legal_hold !== 1,
    automaticPurge: false,
    billing: billing
      ? {
          provider: billing.provider,
          status: billing.customer_status,
          requiresReactivation: row.status === "active" && billing.customer_status === "pending",
        }
      : null,
  };
}

async function stopExternalBilling(env: Env, billing: BillingRow | null): Promise<Response | null> {
  if (!billing || billing.customer_status === "canceled") return null;
  const recurringState = ["active", "past_due"].includes(billing.customer_status);

  if (billing.provider === "asaas") {
    if (recurringState && !billing.provider_subscription_id) {
      return tenantError(
        "A recorrência ativa não possui identificador conciliado no provedor.",
        "BILLING_SUBSCRIPTION_ID_MISSING",
        409,
      );
    }
    try {
      if (billing.provider_subscription_id) {
        await cancelAsaasSubscription(env, billing.provider_subscription_id);
      }
      if (billing.provider_checkout_id) {
        await cancelAsaasCheckout(env, billing.provider_checkout_id);
      }
    } catch (error) {
      console.error("[tenant.lifecycle] provider cancellation", error);
      return tenantError(
        "Não foi possível interromper a recorrência no provedor. O encerramento não foi aplicado.",
        "BILLING_PROVIDER_CANCELLATION_FAILED",
        502,
      );
    }
    return null;
  }

  if (billing.provider === "none") return null;
  if (["active", "past_due", "trial"].includes(billing.customer_status)) {
    return tenantError(
      "Este provedor ainda não possui rotina de cancelamento validada para encerramento seguro.",
      "BILLING_PROVIDER_CANCELLATION_UNSUPPORTED",
      409,
    );
  }
  return null;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  const clinicId = clinicIdFrom(context.params as Record<string, string | string[]>);
  if (!clinicId) return tenantError("Clínica inválida.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !["owner", "clinic_admin"].includes(membership.role)) {
    return tenantError("Acesso ao ciclo de vida negado.", "TENANT_FORBIDDEN", 403);
  }

  let row: LifecycleRow | null;
  try {
    row = await loadLifecycle(db, clinicId);
  } catch (error) {
    console.error("[tenant.lifecycle.GET] schema", error);
    return tenantError("Lifecycle do tenant ainda não migrado.", "TENANT_LIFECYCLE_NOT_CONFIGURED", 503);
  }
  if (!row) return tenantError("Lifecycle do tenant não encontrado.", "TENANT_LIFECYCLE_NOT_FOUND", 409);
  const billing = await loadBilling(db, clinicId);
  return tenantJson(lifecyclePayload(row, membership.clinicStatus, billing));
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  const clinicId = clinicIdFrom(context.params as Record<string, string | string[]>);
  if (!clinicId) return tenantError("Clínica inválida.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || membership.role !== "owner") {
    return tenantError("Somente o titular da clínica pode alterar o encerramento.", "TENANT_OWNER_REQUIRED", 403);
  }

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

  const action = cleanText(body.action, 40);
  const row = await loadLifecycle(db, clinicId);
  if (!row) return tenantError("Lifecycle do tenant não encontrado.", "TENANT_LIFECYCLE_NOT_FOUND", 409);
  const billing = await loadBilling(db, clinicId);

  if (action === "request_closure") {
    if (membership.clinicStatus === "closed" || row.status === "closed") {
      return tenantError("A clínica já está encerrada.", "TENANT_ALREADY_CLOSED", 409);
    }
    if (row.status === "closure_requested") {
      return tenantJson({ ok: true, idempotent: true, ...lifecyclePayload(row, membership.clinicStatus, billing) });
    }

    const confirmSlug = cleanText(body.confirmSlug, 80);
    if (confirmSlug !== membership.clinicSlug) {
      return tenantError(
        "Confirmação inválida: informe exatamente o identificador da clínica.",
        "TENANT_CLOSURE_CONFIRMATION_MISMATCH",
        400,
      );
    }
    if (!isTenantClosureReasonCode(body.reasonCode)) {
      return tenantError("Motivo de encerramento inválido.", "TENANT_CLOSURE_REASON_INVALID", 400);
    }

    const providerError = await stopExternalBilling(context.env, billing);
    if (providerError) return providerError;

    const now = new Date();
    const nowIso = now.toISOString();
    const retentionUntil = retentionDeadline(now);
    const auditId = crypto.randomUUID();
    try {
      const results = await db.batch([
        db.prepare(
          `UPDATE tenant_lifecycle
              SET status = 'closure_requested', previous_clinic_status = ?,
                  previous_billing_status = ?, reason_code = ?, requested_by_user_id = ?,
                  requested_at = ?, retention_until = ?, canceled_at = NULL,
                  finalized_at = NULL, updated_at = ?
            WHERE clinic_id = ? AND status = 'active'`,
        ).bind(
          membership.clinicStatus,
          billing?.customer_status ?? null,
          body.reasonCode,
          user.id,
          nowIso,
          retentionUntil,
          nowIso,
          clinicId,
        ),
        db.prepare(
          `UPDATE clinics SET status = 'suspended', updated_at = ?
            WHERE id = ? AND status <> 'closed'`,
        ).bind(nowIso, clinicId),
        db.prepare(
          `UPDATE billing_customers
              SET status = CASE WHEN status = 'canceled' THEN 'canceled' ELSE 'suspended' END,
                  grace_ends_at = NULL, updated_at = ?
            WHERE clinic_id = ?`,
        ).bind(nowIso, clinicId),
        db.prepare(
          `UPDATE billing_provider_checkouts SET status = 'canceled', updated_at = ?
            WHERE billing_customer_id = ? AND status = 'active'`,
        ).bind(nowIso, billing?.customer_id ?? ""),
        db.prepare(
          `INSERT INTO saas_audit_log
            (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
           SELECT ?, ?, ?, 'tenant_closure_requested', 'clinic', ?, ?, ?
            WHERE EXISTS (
              SELECT 1 FROM tenant_lifecycle
               WHERE clinic_id = ? AND status = 'closure_requested' AND requested_at = ?
            )`,
        ).bind(
          auditId,
          clinicId,
          user.id,
          clinicId,
          JSON.stringify({ reasonCode: body.reasonCode, retentionDays: 30, billingRecurrenceCanceled: true }),
          nowIso,
          clinicId,
          nowIso,
        ),
      ]);
      if ((results[0]?.meta?.changes ?? 0) !== 1) {
        return tenantError("Lifecycle mudou durante a solicitação.", "TENANT_LIFECYCLE_STALE", 409);
      }
    } catch (error) {
      console.error("[tenant.lifecycle.POST] request closure", error);
      return tenantError(
        "A recorrência foi interrompida, mas o estado local não foi concluído. Repita a solicitação.",
        "TENANT_CLOSURE_PERSIST_FAILED",
        500,
      );
    }

    const updated = await loadLifecycle(db, clinicId);
    const updatedBilling = await loadBilling(db, clinicId);
    if (!updated) return tenantError("Lifecycle indisponível após atualização.", "TENANT_LIFECYCLE_INCONSISTENT", 500);
    return tenantJson({ ok: true, ...lifecyclePayload(updated, "suspended", updatedBilling) });
  }

  if (action === "cancel_closure") {
    const snapshot = {
      status: row.status,
      requestedAt: row.requested_at,
      retentionUntil: row.retention_until,
      legalHold: row.legal_hold === 1,
    } as const;
    if (!canCancelTenantClosure(snapshot)) {
      return tenantError(
        "O encerramento não pode mais ser cancelado por autoatendimento.",
        "TENANT_CLOSURE_CANCEL_WINDOW_ENDED",
        409,
      );
    }

    const nowIso = new Date().toISOString();
    const restoredClinicStatus = row.previous_clinic_status === "active" ? "active" : "suspended";
    const previousBillingStatus = row.previous_billing_status;
    const trialStillValid =
      previousBillingStatus === "trial"
      && Boolean(billing?.trial_ends_at)
      && Date.parse(billing?.trial_ends_at ?? "") > Date.now();
    const restoredBillingStatus = trialStillValid
      ? "trial"
      : previousBillingStatus === "canceled" || previousBillingStatus === "suspended"
        ? previousBillingStatus
        : "pending";
    const billingRequiresReactivation = restoredBillingStatus === "pending";

    try {
      const results = await db.batch([
        db.prepare(
          `UPDATE tenant_lifecycle
              SET status = 'active', previous_clinic_status = NULL,
                  previous_billing_status = NULL, reason_code = NULL,
                  requested_by_user_id = NULL, requested_at = NULL, retention_until = NULL,
                  canceled_at = ?, finalized_at = NULL, updated_at = ?
            WHERE clinic_id = ? AND status = 'closure_requested'
              AND julianday(retention_until) > julianday(?)`,
        ).bind(nowIso, nowIso, clinicId, nowIso),
        db.prepare(
          `UPDATE clinics SET status = ?, updated_at = ? WHERE id = ? AND status <> 'closed'`,
        ).bind(restoredClinicStatus, nowIso, clinicId),
        db.prepare(
          `UPDATE billing_customers
              SET status = ?, grace_ends_at = NULL, provider_checkout_id = NULL, updated_at = ?
            WHERE clinic_id = ? AND status <> 'canceled'`,
        ).bind(restoredBillingStatus, nowIso, clinicId),
        db.prepare(
          `UPDATE billing_subscriptions SET provider_checkout_id = NULL, updated_at = ?
            WHERE customer_id = ?`,
        ).bind(nowIso, billing?.customer_id ?? ""),
        db.prepare(
          `INSERT INTO saas_audit_log
            (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
           SELECT ?, ?, ?, 'tenant_closure_canceled', 'clinic', ?, ?, ?
            WHERE EXISTS (
              SELECT 1 FROM tenant_lifecycle
               WHERE clinic_id = ? AND status = 'active' AND canceled_at = ?
            )`,
        ).bind(
          crypto.randomUUID(),
          clinicId,
          user.id,
          clinicId,
          JSON.stringify({ billingRequiresReactivation }),
          nowIso,
          clinicId,
          nowIso,
        ),
      ]);
      if ((results[0]?.meta?.changes ?? 0) !== 1) {
        return tenantError("Janela de cancelamento expirou durante a operação.", "TENANT_LIFECYCLE_STALE", 409);
      }
    } catch (error) {
      console.error("[tenant.lifecycle.POST] cancel closure", error);
      return tenantError("Não foi possível cancelar o encerramento.", "TENANT_CLOSURE_CANCEL_FAILED", 500);
    }

    const updated = await loadLifecycle(db, clinicId);
    const updatedBilling = await loadBilling(db, clinicId);
    if (!updated) return tenantError("Lifecycle indisponível após atualização.", "TENANT_LIFECYCLE_INCONSISTENT", 500);
    return tenantJson({
      ok: true,
      billingRequiresReactivation,
      ...lifecyclePayload(updated, restoredClinicStatus, updatedBilling),
    });
  }

  return tenantError("Ação de lifecycle inválida.", "TENANT_LIFECYCLE_ACTION_INVALID", 400);
};
