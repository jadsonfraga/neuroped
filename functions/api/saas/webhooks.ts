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
import { integrationById } from "../../../shared/saas-operational";

const EVENT_TYPES = ["saas.module.updated", "saas.invite.updated", "saas.privacy.updated", "saas.integration.updated"] as const;
type EventType = (typeof EVENT_TYPES)[number];

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isEventType(value: unknown): value is EventType {
  return typeof value === "string" && (EVENT_TYPES as readonly string[]).includes(value);
}

function isSha256(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

function clinicIdFrom(request: Request, body?: Record<string, unknown>): string {
  const url = new URL(request.url);
  return cleanText(body?.clinicId ?? url.searchParams.get("clinicId") ?? request.headers.get("x-clinic-id"), 80);
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
  const body = await context.request.json<Record<string, unknown>>().catch(() => ({}));
  const clinicId = clinicIdFrom(context.request, body);
  const authorized = await authorize(context, clinicId);
  if ("error" in authorized) return authorized.error;
  const integration = integrationById("webhooks");
  const integrationEnvironment = cleanText(body.environment, 16);
  const deliveryId = cleanText(body.deliveryId ?? context.request.headers.get("x-webhook-delivery-id"), 128);
  const eventType = body.eventType;
  const payloadDigest = cleanText(body.payloadDigestSha256, 64).toLowerCase();
  if (!integration || !isEventType(eventType) || !["sandbox", "production"].includes(integrationEnvironment) || !deliveryId || !isSha256(payloadDigest)) {
    return tenantError("Envelope de webhook inválido; envie somente metadados redigidos.", "WEBHOOK_ENVELOPE_INVALID", 400);
  }
  const existing = await authorized.db
    .prepare(`SELECT id, event_type, environment, payload_digest_sha256, signature, status, response_code, attempt_count, created_at FROM saas_webhook_deliveries WHERE clinic_id = ? AND integration_id = 'webhooks' AND delivery_id = ? LIMIT 1`)
    .bind(clinicId, deliveryId)
    .first<{ id: string; event_type: EventType; environment: string; payload_digest_sha256: string; signature: string; status: string; response_code: number | null; attempt_count: number; created_at: string }>();
  if (existing) {
    if (existing.event_type !== eventType || existing.environment !== integrationEnvironment || existing.payload_digest_sha256 !== payloadDigest) return tenantError("Delivery ID já foi usado com envelope divergente.", "WEBHOOK_DELIVERY_REUSE", 409);
    return tenantJson({ data: { clinicId, integrationId: "webhooks", deliveryId, status: "replayed", signaturePrefix: existing.signature.slice(0, 16), replayed: true, createdAt: existing.created_at } });
  }
  const connection = await authorized.db
    .prepare(`SELECT status, scopes_json FROM saas_integration_connections WHERE clinic_id = ? AND integration_id = 'webhooks' AND environment = ? LIMIT 1`)
    .bind(clinicId, integrationEnvironment)
    .first<{ status: string; scopes_json: string }>();
  let scopes: string[] = [];
  try {
    const parsed = JSON.parse(connection?.scopes_json ?? "[]");
    if (Array.isArray(parsed)) scopes = parsed.filter((scope): scope is string => typeof scope === "string");
  } catch {
    scopes = [];
  }
  if (!connection || connection.status !== "connected") return tenantError("Integração de webhooks não está conectada neste ambiente.", "WEBHOOK_INTEGRATION_NOT_CONNECTED", 409);
  if (!scopes.includes("webhook.send")) return tenantError("A integração não possui o escopo webhook.send.", "WEBHOOK_SCOPE_REQUIRED", 403);
  const moduleEnabled = await authorized.db
    .prepare(`SELECT 1 AS enabled FROM saas_module_settings WHERE clinic_id = ? AND module_id = 'developer' AND enabled = 1 LIMIT 1`)
    .bind(clinicId)
    .first<{ enabled: number }>();
  if (!moduleEnabled) return tenantError("Habilite a aba Developer API antes de registrar webhooks.", "MODULE_NOT_ENABLED", 409);
  const timestamp = new Date().toISOString();
  const signature = await operationalBlindHash(context.env, clinicId, "webhook-signature", `${deliveryId}|${eventType}|${integrationEnvironment}|${payloadDigest}`);
  const id = crypto.randomUUID();
  try {
    const results = await authorized.db.batch([
      authorized.db.prepare(`INSERT INTO saas_webhook_deliveries(id, clinic_id, integration_id, environment, delivery_id, event_type, payload_digest_sha256, signature, status, attempt_count, created_at) VALUES (?, ?, 'webhooks', ?, ?, ?, ?, ?, 'queued', 0, ?)`)
        .bind(id, clinicId, integrationEnvironment, deliveryId, eventType, payloadDigest, signature, timestamp),
      prepareSaasAudit(authorized.db, { clinicId, actorUserId: authorized.user.id, action: "saas_webhook_delivery_queued", targetType: "webhook_delivery", targetId: deliveryId, metadata: { integrationId: "webhooks", environment: integrationEnvironment, eventType, payloadDigestPrefix: payloadDigest.slice(0, 12), signaturePrefix: signature.slice(0, 12) } }, true),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1 || (results[1]?.meta?.changes ?? 0) !== 1) return tenantError("A entrega não pôde ser registrada e auditada.", "WEBHOOK_WRITE_FAILED", 500);
    return tenantJson({ data: { clinicId, integrationId: "webhooks", deliveryId, eventType, environment: integrationEnvironment, status: "queued", signaturePrefix: signature.slice(0, 16), replayed: false, createdAt: timestamp, payloadStored: false } }, 201);
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) return tenantError("Delivery ID já está em processamento.", "WEBHOOK_DELIVERY_REUSE", 409);
    console.error("[saas.webhooks.POST] failed", error);
    return tenantError("Não foi possível registrar o webhook.", "WEBHOOK_WRITE_FAILED", 500);
  }
};

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const clinicId = clinicIdFrom(context.request);
  const authorized = await authorize(context, clinicId);
  if ("error" in authorized) return authorized.error;
  const rows = await authorized.db
    .prepare(`SELECT delivery_id, event_type, environment, status, response_code, attempt_count, created_at FROM saas_webhook_deliveries WHERE clinic_id = ? ORDER BY created_at DESC LIMIT 50`)
    .bind(clinicId)
    .all<{ delivery_id: string; event_type: string; environment: string; status: string; response_code: number | null; attempt_count: number; created_at: string }>();
  return tenantJson({ data: (rows.results ?? []).map((row) => ({ clinicId, integrationId: "webhooks", deliveryId: row.delivery_id, eventType: row.event_type, environment: row.environment, status: row.status, responseCode: row.response_code, attemptCount: row.attempt_count, createdAt: row.created_at, payloadStored: false })) });
};
