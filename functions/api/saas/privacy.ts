import { getContextUser } from "../auth/_authorization";
import { requireBillingEntitlement } from "../billing/_guard";
import {
  getClinicMembership,
  membershipCanManage,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../tenant/_core";
import { operationalBlindHash } from "./_invite";

const DATA_CLASSES = ["health", "identity", "operational", "credentials", "editorial"] as const;
const REQUEST_TYPES = ["access", "correction", "portability", "deletion", "restriction", "objection"] as const;
const REQUEST_STATUSES = ["open", "verified", "in_progress", "completed", "rejected", "canceled"] as const;
const SUBJECT_TYPES = ["account", "patient", "guardian", "other"] as const;

type DataClass = (typeof DATA_CLASSES)[number];
type RequestType = (typeof REQUEST_TYPES)[number];
type RequestStatus = (typeof REQUEST_STATUSES)[number];
type SubjectType = (typeof SUBJECT_TYPES)[number];

interface PrivacyRequestRow {
  id: string;
  clinic_id: string;
  request_type: RequestType;
  subject_type: SubjectType;
  subject_reference_hash: string;
  status: RequestStatus;
  due_at: string | null;
  verified_at: string | null;
  completed_at: string | null;
  completed_by_user_id: string | null;
  resolution_code: string | null;
  created_at: string;
  updated_at: string;
}

interface RetentionPolicyRow {
  id: string;
  clinic_id: string;
  data_class: DataClass;
  retention_days: number;
  purge_mode: "archive" | "anonymize" | "delete";
  legal_hold: number;
  enabled: number;
  version: number;
  updated_by_user_id: string | null;
  updated_at: string;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function clinicIdFrom(request: Request, body?: Record<string, unknown>): string {
  const url = new URL(request.url);
  return cleanText(
    body?.clinicId ?? url.searchParams.get("clinicId") ?? request.headers.get("x-tenant-id") ?? request.headers.get("x-clinic-id"),
    80,
  );
}

function isOneOf<T extends readonly string[]>(list: T, value: string): value is T[number] {
  return (list as readonly string[]).includes(value);
}

function parseInteger(value: unknown, min: number, max: number): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function parseIso(value: unknown): string | null {
  const text = cleanText(value, 40);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function authorize(
  context: Parameters<PagesFunction<TenantEnv>>[0],
  clinicId: string,
) {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return { error: tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503) } as const;
  if (!user) return { error: tenantError("Não autenticado.", "UNAUTHENTICATED", 401) } as const;
  if (!clinicId) return { error: tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400) } as const;
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return { error: tenantError("Acesso administrativo negado para esta clínica.", "TENANT_FORBIDDEN", 403) } as const;
  }
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "admin");
  if (billingError) return { error: billingError } as const;
  return { db, user } as const;
}

function requestToApi(row: PrivacyRequestRow) {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    requestType: row.request_type,
    subjectType: row.subject_type,
    subjectReferenceHash: row.subject_reference_hash,
    status: row.status,
    dueAt: row.due_at,
    verifiedAt: row.verified_at,
    completedAt: row.completed_at,
    completedByUserId: row.completed_by_user_id,
    resolutionCode: row.resolution_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function retentionToApi(row: RetentionPolicyRow) {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    dataClass: row.data_class,
    retentionDays: row.retention_days,
    purgeMode: row.purge_mode,
    legalHold: Boolean(row.legal_hold),
    enabled: Boolean(row.enabled),
    version: row.version,
    updatedAt: row.updated_at,
  };
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const clinicId = clinicIdFrom(context.request);
  const authorized = await authorize(context, clinicId);
  if ("error" in authorized) return authorized.error;
  const url = new URL(context.request.url);
  const mode = cleanText(url.searchParams.get("mode"), 20) || "all";
  if (!isOneOf(["all", "requests", "retention"] as const, mode)) return tenantError("mode inválido.", "VALIDATION_ERROR", 400);

  try {
    const payload: Record<string, unknown> = { clinicId };
    if (mode === "all" || mode === "requests") {
      const requests = await authorized.db
        .prepare(
          `SELECT id, clinic_id, request_type, subject_type, subject_reference_hash,
                  status, due_at, verified_at, completed_at, completed_by_user_id,
                  resolution_code, created_at, updated_at
             FROM saas_privacy_requests
            WHERE clinic_id = ?
            ORDER BY CASE WHEN status IN ('open','verified','in_progress') THEN 0 ELSE 1 END,
                     COALESCE(due_at, '9999-12-31') ASC, created_at DESC
            LIMIT 200`,
        )
        .bind(clinicId)
        .all<PrivacyRequestRow>();
      payload.requests = (requests.results ?? []).map(requestToApi);
    }
    if (mode === "all" || mode === "retention") {
      const policies = await authorized.db
        .prepare(
          `SELECT id, clinic_id, data_class, retention_days, purge_mode,
                  legal_hold, enabled, version, updated_by_user_id, updated_at
             FROM saas_retention_policies
            WHERE clinic_id = ?
            ORDER BY data_class`,
        )
        .bind(clinicId)
        .all<RetentionPolicyRow>();
      payload.retention = (policies.results ?? []).map(retentionToApi);
    }
    return tenantJson(payload);
  } catch (error) {
    console.error("[saas.privacy.GET] failed", error);
    return tenantError("Não foi possível carregar a governança de privacidade.", "PRIVACY_LOAD_FAILED", 500);
  }
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  const clinicId = clinicIdFrom(context.request, body);
  const authorized = await authorize(context, clinicId);
  if ("error" in authorized) return authorized.error;

  const requestType = cleanText(body.requestType, 20);
  const subjectType = cleanText(body.subjectType, 20);
  const subjectReference = cleanText(body.subjectReference, 320);
  const dueAt = parseIso(body.dueAt);
  if (!isOneOf(REQUEST_TYPES, requestType) || !isOneOf(SUBJECT_TYPES, subjectType) || subjectReference.length < 2) {
    return tenantError("Tipo, sujeito ou referência do titular inválidos.", "VALIDATION_ERROR", 400);
  }
  const subjectReferenceHash = await operationalBlindHash(context.env, clinicId, `privacy-subject:${subjectType}`, subjectReference.toLocaleLowerCase("pt-BR"));
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    const results = await authorized.db.batch([
      authorized.db
        .prepare(
          `INSERT INTO saas_privacy_requests
             (id, clinic_id, request_type, subject_type, subject_reference_hash,
              status, due_at, created_by_user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)`,
        )
        .bind(id, clinicId, requestType, subjectType, subjectReferenceHash, dueAt, authorized.user.id, now, now),
      prepareSaasAudit(
        authorized.db,
        {
          clinicId,
          actorUserId: authorized.user.id,
          action: "saas_privacy_request_create",
          targetType: "privacy_request",
          targetId: id,
          metadata: { requestType, subjectType, hasDueAt: Boolean(dueAt) },
        },
        true,
      ),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1 || (results[1]?.meta?.changes ?? 0) !== 1) return tenantError("O pedido não pôde ser auditado.", "AUDIT_WRITE_FAILED", 500);
    return tenantJson({ data: { id, clinicId, requestType, subjectType, subjectReferenceHash, status: "open", dueAt, createdAt: now, updatedAt: now } }, 201);
  } catch (error) {
    console.error("[saas.privacy.POST] request failed", error);
    return tenantError("Não foi possível registrar o pedido do titular.", "PRIVACY_REQUEST_CREATE_FAILED", 500);
  }
};

export const onRequestPatch: PagesFunction<TenantEnv> = async (context) => {
  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  const clinicId = clinicIdFrom(context.request, body);
  const authorized = await authorize(context, clinicId);
  if ("error" in authorized) return authorized.error;

  const requestId = cleanText(body.requestId, 80);
  const nextStatus = cleanText(body.status, 20);
  const resolutionCode = cleanText(body.resolutionCode, 80) || null;
  if (!requestId || !isOneOf(REQUEST_STATUSES, nextStatus)) return tenantError("Pedido ou status inválido.", "VALIDATION_ERROR", 400);

  const allowedTransitions: Record<RequestStatus, RequestStatus[]> = {
    open: ["verified", "in_progress", "rejected", "canceled"],
    verified: ["in_progress", "rejected", "canceled"],
    in_progress: ["completed", "rejected", "canceled"],
    completed: [],
    rejected: [],
    canceled: [],
  };
  const current = await authorized.db
    .prepare(`SELECT status FROM saas_privacy_requests WHERE id = ? AND clinic_id = ? LIMIT 1`)
    .bind(requestId, clinicId)
    .first<{ status: RequestStatus }>();
  if (!current) return tenantError("Pedido não encontrado nesta clínica.", "PRIVACY_REQUEST_NOT_FOUND", 404);
  if (!allowedTransitions[current.status].includes(nextStatus)) return tenantError("Transição de privacidade não permitida.", "PRIVACY_REQUEST_TRANSITION_INVALID", 409);
  if (nextStatus === "completed" && !resolutionCode) return tenantError("Conclusão exige resolutionCode controlado.", "RESOLUTION_REQUIRED", 400);

  const now = new Date().toISOString();
  const verifiedAt = nextStatus === "verified" ? now : null;
  const completedAt = nextStatus === "completed" ? now : null;
  try {
    const results = await authorized.db.batch([
      authorized.db
        .prepare(
          `UPDATE saas_privacy_requests
              SET status = ?, verified_at = COALESCE(?, verified_at),
                  completed_at = COALESCE(?, completed_at),
                  completed_by_user_id = CASE WHEN ? = 'completed' THEN ? ELSE completed_by_user_id END,
                  resolution_code = COALESCE(?, resolution_code), updated_at = ?
            WHERE id = ? AND clinic_id = ? AND status = ?`,
        )
        .bind(nextStatus, verifiedAt, completedAt, nextStatus, authorized.user.id, resolutionCode, now, requestId, clinicId, current.status),
      prepareSaasAudit(
        authorized.db,
        {
          clinicId,
          actorUserId: authorized.user.id,
          action: "saas_privacy_request_transition",
          targetType: "privacy_request",
          targetId: requestId,
          metadata: { from: current.status, to: nextStatus, resolutionCode },
        },
        true,
      ),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1 || (results[1]?.meta?.changes ?? 0) !== 1) return tenantError("Pedido mudou durante a atualização.", "PRIVACY_REQUEST_STALE", 409);
    return tenantJson({ data: { requestId, clinicId, status: nextStatus, updatedAt: now } });
  } catch (error) {
    console.error("[saas.privacy.PATCH] request transition failed", error);
    return tenantError("Não foi possível atualizar o pedido do titular.", "PRIVACY_REQUEST_UPDATE_FAILED", 500);
  }
};

export const onRequestPut: PagesFunction<TenantEnv> = async (context) => {
  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  const clinicId = clinicIdFrom(context.request, body);
  const authorized = await authorize(context, clinicId);
  if ("error" in authorized) return authorized.error;

  const dataClass = cleanText(body.dataClass, 20);
  const purgeMode = cleanText(body.purgeMode, 20);
  const retentionDays = parseInteger(body.retentionDays, 0, 36500);
  const expectedVersion = parseInteger(body.expectedVersion, 0, 2_000_000_000);
  if (!isOneOf(DATA_CLASSES, dataClass) || !isOneOf(["archive", "anonymize", "delete"] as const, purgeMode) || retentionDays === null || expectedVersion === null || typeof body.legalHold !== "boolean" || typeof body.enabled !== "boolean") {
    return tenantError("Política de retenção inválida.", "VALIDATION_ERROR", 400);
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    const results = await authorized.db.batch([
      authorized.db
        .prepare(
          `INSERT INTO saas_retention_policies
             (id, clinic_id, data_class, retention_days, purge_mode, legal_hold,
              enabled, version, updated_by_user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(clinic_id, data_class) DO UPDATE SET
             retention_days = excluded.retention_days,
             purge_mode = excluded.purge_mode,
             legal_hold = excluded.legal_hold,
             enabled = excluded.enabled,
             version = saas_retention_policies.version + 1,
             updated_by_user_id = excluded.updated_by_user_id,
             updated_at = excluded.updated_at
           WHERE saas_retention_policies.version = ?`,
        )
        .bind(id, clinicId, dataClass, retentionDays, purgeMode, body.legalHold ? 1 : 0, body.enabled ? 1 : 0, expectedVersion + 1, authorized.user.id, now, now, expectedVersion),
      prepareSaasAudit(
        authorized.db,
        {
          clinicId,
          actorUserId: authorized.user.id,
          action: "saas_retention_policy_update",
          targetType: "retention_policy",
          targetId: dataClass,
          metadata: { dataClass, retentionDays, purgeMode, legalHold: body.legalHold, enabled: body.enabled, expectedVersion },
        },
        true,
      ),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1) return tenantError("Política mudou durante a atualização.", "RETENTION_POLICY_STALE", 409);
    if ((results[1]?.meta?.changes ?? 0) !== 1) return tenantError("A política não pôde ser auditada.", "AUDIT_WRITE_FAILED", 500);
    return tenantJson({ data: { clinicId, dataClass, retentionDays, purgeMode, legalHold: body.legalHold, enabled: body.enabled, version: expectedVersion + 1, updatedAt: now } });
  } catch (error) {
    if (String(error).includes("SAAS_RETENTION_POLICY_VERSION_CONFLICT")) return tenantError("Política mudou durante a atualização.", "RETENTION_POLICY_STALE", 409);
    console.error("[saas.privacy.PUT] retention update failed", error);
    return tenantError("Não foi possível salvar a política de retenção.", "RETENTION_POLICY_UPDATE_FAILED", 500);
  }
};
