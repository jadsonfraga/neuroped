import { getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import {
  clinicalLiveEnabled,
  getClinicMembership,
  membershipCanManage,
  membershipCanReadClinical,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";
import {
  clinicalCryptoReady,
  encryptClinicalJson,
} from "../../tenant/_crypto";

const REQUEST_STATUSES = new Set(["requested", "approved", "processing", "completed", "rejected"]);
const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const MAX_REASON_BYTES = 20_000;

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function requireLiveConfiguration(env: TenantEnv): Response | null {
  if (!clinicalLiveEnabled(env)) {
    return tenantError("Clinical Core LIVE permanece bloqueado.", "CLINICAL_LIVE_DISABLED", 503);
  }
  if (!clinicalCryptoReady(env)) {
    return tenantError("Keyring clínico dedicado não configurado.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  }
  return null;
}

async function patientBelongsToClinic(db: D1Database, clinicId: string, patientId: string): Promise<boolean> {
  const row = await db
    .prepare(`SELECT id FROM live_patients WHERE id = ? AND clinic_id = ? LIMIT 1`)
    .bind(patientId, clinicId)
    .first<{ id: string }>();
  return Boolean(row);
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;

  const url = new URL(context.request.url);
  const clinicId = cleanText(url.searchParams.get("clinicId"), 80);
  const status = cleanText(url.searchParams.get("status"), 20);
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  if (status && !REQUEST_STATUSES.has(status)) return tenantError("status inválido.", "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanReadClinical(membership)) {
    return tenantError("Acesso à governança clínica negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  const billingReadError = await requireBillingEntitlement(db, user.id, clinicId, "export");
  if (billingReadError) return billingReadError;

  const policy = await db
    .prepare(
      `SELECT id, clinic_id, retention_days, auto_delete_enabled,
              configured_by_user_id, created_at, updated_at
         FROM live_retention_policies
        WHERE clinic_id = ? LIMIT 1`,
    )
    .bind(clinicId)
    .first();
  const statusClause = status ? " AND status = ?" : "";
  const bindings = status ? [clinicId, status] : [clinicId];
  const [exports, deletions] = await Promise.all([
    db
      .prepare(
        `SELECT id, clinic_id, requested_by_user_id, patient_id, scope, status,
                artifact_key, requested_at, completed_at, updated_at
           FROM live_export_requests
          WHERE clinic_id = ?${statusClause}
          ORDER BY requested_at DESC LIMIT 100`,
      )
      .bind(...bindings)
      .all(),
    db
      .prepare(
        `SELECT id, clinic_id, requested_by_user_id, patient_id, scope, status,
                requested_at, completed_at, updated_at
           FROM live_deletion_requests
          WHERE clinic_id = ?${statusClause}
          ORDER BY requested_at DESC LIMIT 100`,
      )
      .bind(...bindings)
      .all(),
  ]);

  return tenantJson({
    policy: policy
      ? {
          id: policy.id,
          clinicId: policy.clinic_id,
          retentionDays: policy.retention_days,
          autoDeleteEnabled: Boolean(policy.auto_delete_enabled),
          configuredByUserId: policy.configured_by_user_id,
          createdAt: policy.created_at,
          updatedAt: policy.updated_at,
        }
      : null,
    exports: exports.results ?? [],
    deletions: deletions.results ?? [],
    workflow: ["requested", "approved", "processing", "completed", "rejected"],
    physicalDeletionAutomatic: false,
  });
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;

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

  const clinicId = cleanText(body.clinicId, 80);
  const requestType = cleanText(body.requestType, 20);
  const scope = cleanText(body.scope, 20);
  const patientId = cleanText(body.patientId, 120) || null;
  if (!clinicId || !["export", "delete", "policy"].includes(requestType)) {
    return tenantError("clinicId e requestType válidos são obrigatórios.", "VALIDATION_ERROR", 400);
  }

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership) return tenantError("Membership ativa não encontrada.", "TENANT_FORBIDDEN", 403);

  if (requestType === "policy") {
    if (!membershipCanManage(membership)) {
      return tenantError("Somente gestores podem alterar a retenção da clínica.", "TENANT_FORBIDDEN", 403);
    }
    const billingAdminError = await requireBillingEntitlement(db, user.id, clinicId, "admin");
    if (billingAdminError) return billingAdminError;
    const retentionDays = body.retentionDays;
    const autoDeleteEnabled = body.autoDeleteEnabled === true;
    if (!Number.isInteger(retentionDays) || Number(retentionDays) < 0 || Number(retentionDays) > 36_500) {
      return tenantError("retentionDays deve ser um inteiro entre 0 e 36.500.", "VALIDATION_ERROR", 400);
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      const results = await db.batch([
        db
          .prepare(
            `INSERT INTO live_retention_policies
              (id, clinic_id, retention_days, auto_delete_enabled, configured_by_user_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(clinic_id) DO UPDATE SET
               retention_days = excluded.retention_days,
               auto_delete_enabled = excluded.auto_delete_enabled,
               configured_by_user_id = excluded.configured_by_user_id,
               updated_at = excluded.updated_at`,
          )
          .bind(id, clinicId, Number(retentionDays), autoDeleteEnabled ? 1 : 0, user.id, now, now),
        prepareSaasAudit(
          db,
          {
            clinicId,
            actorUserId: user.id,
            action: "live_retention_policy_upsert",
            targetType: "retention_policy",
            targetId: clinicId,
            metadata: { retentionDays: Number(retentionDays), autoDeleteEnabled },
          },
          true,
        ),
      ]);
      if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) {
        return tenantError("A política de retençao mudou durante a operação.", "POLICY_STALE", 409);
      }
    } catch {
      console.error("[live.governance.POST policy] DB_ERROR");
      return tenantError("Não foi possível salvar a política de retenção.", "DB_ERROR", 500);
    }
    return tenantJson(
      {
        id,
        clinicId,
        retentionDays: Number(retentionDays),
        autoDeleteEnabled,
        configuredByUserId: user.id,
        updatedAt: now,
        physicalDeletionAutomatic: false,
      },
      201,
    );
  }

  if (!(scope === "clinic" || scope === "patient")) {
    return tenantError("scope deve ser clinic ou patient.", "VALIDATION_ERROR", 400);
  }
  if (scope === "patient" && (!patientId || !OPAQUE_ID.test(patientId))) {
    return tenantError("patientId opaco é obrigatório para escopo patient.", "VALIDATION_ERROR", 400);
  }
  if (scope === "clinic" && patientId) {
    return tenantError("patientId não pode ser enviado no escopo clinic.", "VALIDATION_ERROR", 400);
  }
  if (patientId && !(await patientBelongsToClinic(db, clinicId, patientId))) {
    return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  }

  if (requestType === "delete" && !membershipCanManage(membership)) {
    return tenantError("Somente gestores podem solicitar eliminação controlada.", "TENANT_FORBIDDEN", 403);
  }
  if (requestType === "export" && !membershipCanReadClinical(membership)) {
    return tenantError("Acesso à exportação clínica negado.", "TENANT_FORBIDDEN", 403);
  }
  const billingRequestError = await requireBillingEntitlement(
    db,
    user.id,
    clinicId,
    requestType === "delete" ? "admin" : "export",
  );
  if (billingRequestError) return billingRequestError;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const reason = cleanText(body.reason, 10_000);
  let reasonEncrypted: string | null = null;
  if (requestType === "delete" && reason) {
    if (new TextEncoder().encode(reason).byteLength > MAX_REASON_BYTES) {
      return tenantError("reason excede 20 KB.", "PAYLOAD_TOO_LARGE", 413);
    }
    reasonEncrypted = await encryptClinicalJson(context.env, clinicId, `deletion-request:${id}`, { reason });
  }

  try {
    const mutation = requestType === "export"
      ? db
          .prepare(
            `INSERT INTO live_export_requests
              (id, clinic_id, requested_by_user_id, patient_id, scope, status, requested_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'requested', ?, ?)`,
          )
          .bind(id, clinicId, user.id, patientId, scope, now, now)
      : db
          .prepare(
            `INSERT INTO live_deletion_requests
              (id, clinic_id, requested_by_user_id, patient_id, scope, status, reason_encrypted, requested_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'requested', ?, ?, ?)`,
          )
          .bind(id, clinicId, user.id, patientId, scope, reasonEncrypted, now, now);
    const results = await db.batch([
      mutation,
      prepareSaasAudit(
        db,
        {
          clinicId,
          actorUserId: user.id,
          action: requestType === "export" ? "live_export_request_create" : "live_deletion_request_create",
          targetType: requestType === "export" ? "export_request" : "deletion_request",
          targetId: id,
          metadata: { scope },
        },
        true,
      ),
    ]);
    if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) {
      return tenantError("A solicitação não foi persistida.", "DB_ERROR", 500);
    }
  } catch {
    console.error("[live.governance.POST request] DB_ERROR");
    return tenantError("Não foi possível criar a solicitação.", "DB_ERROR", 500);
  }

  return tenantJson(
    {
      id,
      clinicId,
      patientId,
      scope,
      requestType,
      status: "requested",
      requestedByUserId: user.id,
      requestedAt: now,
      physicalDeletionAutomatic: false,
    },
    201,
  );
};

const ALLOWED_TRANSITIONS: Record<string, Set<string>> = {
  requested: new Set(["approved", "rejected"]),
  approved: new Set(["processing", "rejected"]),
  processing: new Set(["rejected"]),
  completed: new Set(),
  rejected: new Set(),
};

export const onRequestPatch: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;

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

  const clinicId = cleanText(body.clinicId, 80);
  const requestType = cleanText(body.requestType, 20);
  const requestId = cleanText(body.requestId, 120);
  const nextStatus = cleanText(body.status, 20);
  if (nextStatus === "completed") {
    return tenantError("Somente o worker operacional pode concluir solicitações.", "WORKER_COMPLETION_REQUIRED", 403);
  }
  if (!clinicId || !requestId || !["export", "delete"].includes(requestType) || !REQUEST_STATUSES.has(nextStatus)) {
    return tenantError("clinicId, requestId, requestType e status válidos são obrigatórios.", "VALIDATION_ERROR", 400);
  }
  if (!OPAQUE_ID.test(requestId)) return tenantError("requestId inválido.", "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return tenantError("Somente gestores podem alterar o workflow de governança.", "TENANT_FORBIDDEN", 403);
  }
  const billingWorkflowError = await requireBillingEntitlement(
    db,
    user.id,
    clinicId,
    requestType === "delete" ? "admin" : "export",
  );
  if (billingWorkflowError) return billingWorkflowError;

  const table = requestType === "export" ? "live_export_requests" : "live_deletion_requests";
  const current = await db
    .prepare(`SELECT id, status FROM ${table} WHERE id = ? AND clinic_id = ? LIMIT 1`)
    .bind(requestId, clinicId)
    .first<{ id: string; status: string }>();
  if (!current) return tenantError("Solicitação não encontrada nesta clínica.", "REQUEST_NOT_FOUND", 404);
  if (!ALLOWED_TRANSITIONS[current.status]?.has(nextStatus)) {
    return tenantError("Transição de workflow inválida.", "INVALID_WORKFLOW_TRANSITION", 409);
  }

  const now = new Date().toISOString();
  try {
    const results = await db.batch([
      db
        .prepare(
          `UPDATE ${table}
              SET status = ?,           completed_at = CASE WHEN ? = 'completed' THEN ? ELSE completed_at END,
                  failure_code = CASE WHEN ? = 'rejected' THEN COALESCE(failure_code, 'REJECTED_BY_ADMIN') ELSE failure_code END,
                  updated_at = ?
            WHERE id = ? AND clinic_id = ? AND status = ?`,
        )
        .bind(nextStatus, nextStatus, now, nextStatus, now, requestId, clinicId, current.status),
      prepareSaasAudit(
        db,
        {
          clinicId,
          actorUserId: user.id,
          action: requestType === "export" ? "live_export_request_status" : "live_deletion_request_status",
          targetType: requestType === "export" ? "export_request" : "deletion_request",
          targetId: requestId,
          metadata: { from: current.status, to: nextStatus },
        },
        true,
      ),
    ]);
    if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) {
      return tenantError("A solicitação mudou durante a operação.", "REQUEST_STALE", 409);
    }
  } catch {
    console.error("[live.governance.PATCH] DB_ERROR");
    return tenantError("Não foi possível alterar o workflow.", "DB_ERROR", 500);
  }

  return tenantJson({
    id: requestId,
    clinicId,
    requestType,
    status: nextStatus,
    completedAt: nextStatus === "completed" ? now : null,
    physicalDeletionAutomatic: false,
  });
};
