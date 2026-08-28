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
import { enforceTenantRateLimit } from "./_rate-limit";

const COMPONENTS = ["auth", "tenant", "keyring", "migration", "backup", "integration", "privacy", "frontend"] as const;
const SEVERITIES = ["low", "medium", "high", "critical"] as const;
const STATUSES = ["open", "acknowledged", "resolved"] as const;
const RESOLUTION_CODES = ["MITIGATION_APPLIED", "ROOT_CAUSE_CONFIRMED", "NO_IMPACT_CONFIRMED", "FALSE_POSITIVE"] as const;
type Component = (typeof COMPONENTS)[number];
type Severity = (typeof SEVERITIES)[number];
type IncidentStatus = (typeof STATUSES)[number];

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isAllowed<T extends readonly string[]>(value: unknown, choices: T): value is T[number] {
  return typeof value === "string" && (choices as readonly string[]).includes(value);
}

function clinicIdFrom(request: Request, body?: Record<string, unknown>): string {
  const url = new URL(request.url);
  return cleanText(body?.clinicId ?? url.searchParams.get("clinicId") ?? request.headers.get("x-clinic-id"), 80);
}

function safeMetadata(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const allowed = ["environment", "attempt", "source", "statusCode", "migration", "module"];
  const output: Record<string, string | number | boolean> = {};
  for (const key of allowed) {
    const candidate = (value as Record<string, unknown>)[key];
    if (typeof candidate === "string" && candidate.length <= 160) output[key] = candidate;
    if (typeof candidate === "number" && Number.isFinite(candidate)) output[key] = candidate;
    if (typeof candidate === "boolean") output[key] = candidate;
  }
  return output;
}

async function authorize(context: Parameters<PagesFunction<TenantEnv>>[0], clinicId: string) {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return { error: tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503) } as const;
  if (!user) return { error: tenantError("Não autenticado.", "UNAUTHENTICATED", 401) } as const;
  if (!clinicId) return { error: tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400) } as const;
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) return { error: tenantError("Acesso administrativo negado para esta clínica.", "TENANT_FORBIDDEN", 403) } as const;
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "admin");
  if (billingError) return { error: billingError } as const;
  return { db, user } as const;
}

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const requestId = cleanText(context.request.headers.get("x-request-id"), 96) || crypto.randomUUID();
  const body = await context.request.json<Record<string, unknown>>().catch(() => ({}));
  const clinicId = clinicIdFrom(context.request, body);
  const authorized = await authorize(context, clinicId);
  if ("error" in authorized) return authorized.error;
  const rateLimitError = await enforceTenantRateLimit(authorized.db, clinicId, "saas:incidents:write", 30, 60);
  if (rateLimitError) return rateLimitError;
  const component = body.component;
  const code = cleanText(body.code, 80).toUpperCase();
  const severity = body.severity;
  const status = body.status ?? "open";
  const correlationId = cleanText(body.correlationId ?? requestId, 96);
  if (!isAllowed(component, COMPONENTS) || !/^[A-Z0-9][A-Z0-9_:-]{2,79}$/.test(code) || !isAllowed(severity, SEVERITIES) || !isAllowed(status, STATUSES) || correlationId.length < 8) {
    return tenantError("Evento de incidente inválido; use componente, código, severidade e correlação controlados.", "INCIDENT_EVENT_INVALID", 400);
  }
  const id = crypto.randomUUID();
  const metadata = safeMetadata(body.metadata);
  try {
    const results = await authorized.db.batch([
      authorized.db.prepare(`INSERT INTO saas_incident_events(id, clinic_id, component, code, severity, status, correlation_id, metadata_json, actor_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, clinicId, component, code, severity, status, correlationId, JSON.stringify(metadata), authorized.user.id),
      prepareSaasAudit(authorized.db, { clinicId, actorUserId: authorized.user.id, action: "saas_incident_event_created", targetType: "incident_event", targetId: id, metadata: { component, code, severity, status, correlationId } }, true),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1 || (results[1]?.meta?.changes ?? 0) !== 1) return tenantError("O incidente não pôde ser registrado e auditado.", "INCIDENT_WRITE_FAILED", 500);
    return tenantJson({ data: { id, clinicId, component, code, severity, status, correlationId, metadata, redacted: true, payloadStored: false, requestId } }, 201);
  } catch (error) {
    console.error("[saas.incidents.POST] failed", { requestId, error });
    return tenantError("Não foi possível registrar o incidente.", "INCIDENT_WRITE_FAILED", 500);
  }
};

function isTransitionAllowed(current: IncidentStatus, next: IncidentStatus): boolean {
  return (current === "open" && next === "acknowledged") || (current === "acknowledged" && next === "resolved");
}

function isResolutionCode(value: unknown): value is (typeof RESOLUTION_CODES)[number] {
  return typeof value === "string" && (RESOLUTION_CODES as readonly string[]).includes(value);
}

export const onRequestPatch: PagesFunction<TenantEnv> = async (context) => {
  const requestId = cleanText(context.request.headers.get("x-request-id"), 96) || crypto.randomUUID();
  const body = await context.request.json<Record<string, unknown>>().catch(() => ({}));
  const clinicId = clinicIdFrom(context.request, body);
  const authorized = await authorize(context, clinicId);
  if ("error" in authorized) return authorized.error;
  const rateLimitError = await enforceTenantRateLimit(authorized.db, clinicId, "saas:incidents:write", 30, 60);
  if (rateLimitError) return rateLimitError;
  const incidentId = cleanText(body.incidentId, 80);
  const nextStatus = body.nextStatus;
  const resolutionCode = body.resolutionCode;
  if (!incidentId || !isAllowed(nextStatus, STATUSES)) return tenantError("Transição de incidente inválida.", "INCIDENT_TRANSITION_INVALID", 400);
  const current = await authorized.db
    .prepare(`SELECT id, clinic_id, component, code, severity, status, correlation_id FROM saas_incident_events WHERE id = ? AND clinic_id = ? LIMIT 1`)
    .bind(incidentId, clinicId)
    .first<{ id: string; clinic_id: string; component: Component; code: string; severity: Severity; status: IncidentStatus; correlation_id: string }>();
  if (!current) return tenantError("Incidente não encontrado neste tenant.", "INCIDENT_NOT_FOUND", 404);
  if (!isTransitionAllowed(current.status, nextStatus)) return tenantError("Transição de status não permitida.", "INCIDENT_TRANSITION_INVALID", 409);
  if (nextStatus === "resolved" && !isResolutionCode(resolutionCode)) return tenantError("Resolvido exige código de resolução allowlist.", "INCIDENT_RESOLUTION_REQUIRED", 400);
  const id = crypto.randomUUID();
  const metadata = safeMetadata({ source: "incident-transition", resolutionCode, supersedesIncidentId: current.id });
  try {
    const results = await authorized.db.batch([
      authorized.db.prepare(`INSERT INTO saas_incident_events(id, clinic_id, component, code, severity, status, correlation_id, metadata_json, actor_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, clinicId, current.component, current.code, current.severity, nextStatus, current.correlation_id, JSON.stringify(metadata), authorized.user.id),
      prepareSaasAudit(authorized.db, { clinicId, actorUserId: authorized.user.id, action: "saas_incident_event_transitioned", targetType: "incident_event", targetId: current.id, metadata: { nextStatus, resolutionCode: typeof resolutionCode === "string" ? resolutionCode : null, correlationId: current.correlation_id } }, true),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1 || (results[1]?.meta?.changes ?? 0) !== 1) return tenantError("A transição não pôde ser registrada e auditada.", "INCIDENT_TRANSITION_FAILED", 500);
    return tenantJson({ data: { id, clinicId, component: current.component, code: current.code, severity: current.severity, status: nextStatus, correlationId: current.correlation_id, metadata, redacted: true, payloadStored: false, requestId } });
  } catch (error) {
    console.error("[saas.incidents.PATCH] failed", { requestId, error });
    return tenantError("Não foi possível registrar a transição do incidente.", "INCIDENT_TRANSITION_FAILED", 500);
  }
};

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const requestId = cleanText(context.request.headers.get("x-request-id"), 96) || crypto.randomUUID();
  const clinicId = clinicIdFrom(context.request);
  const authorized = await authorize(context, clinicId);
  if ("error" in authorized) return authorized.error;
  const rows = await authorized.db
    .prepare(`SELECT id, component, code, severity, status, correlation_id, metadata_json, created_at FROM saas_incident_events WHERE clinic_id = ? ORDER BY created_at DESC LIMIT 200`)
    .bind(clinicId)
    .all<{ id: string; component: Component; code: string; severity: Severity; status: IncidentStatus; correlation_id: string; metadata_json: string; created_at: string }>();
  const latestByCorrelation = new Map<string, { id: string; clinicId: string; component: Component; code: string; severity: Severity; status: IncidentStatus; correlationId: string; metadata: Record<string, string | number | boolean>; createdAt: string; redacted: true; payloadStored: false }>();
  for (const row of rows.results ?? []) {
    if (latestByCorrelation.has(row.correlation_id)) continue;
    const parsed: unknown = (() => {
      try { return JSON.parse(row.metadata_json || "{}"); } catch { return {}; }
    })();
    latestByCorrelation.set(row.correlation_id, { id: row.id, clinicId, component: row.component, code: row.code, severity: row.severity, status: row.status, correlationId: row.correlation_id, metadata: safeMetadata(parsed), createdAt: row.created_at, redacted: true, payloadStored: false });
  }
  return tenantJson({ requestId, clinicId, redacted: true, payloadsExposed: false, data: Array.from(latestByCorrelation.values()).slice(0, 50) });
};
