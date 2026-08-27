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
import { operationalBlindHash, sha256Hex } from "./_invite";
import {
  INTEGRATION_SCOPES,
  OPERATIONAL_INTEGRATIONS,
  integrationById,
  isIntegrationScope,
  type IntegrationId,
  type IntegrationScope,
  isValidIdempotencyKey,
} from "../../../shared/saas-operational";

const CONNECTION_STATUSES = ["draft", "connected", "paused", "revoked"] as const;
const ENVIRONMENTS = ["sandbox", "production"] as const;
type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
type IntegrationEnvironment = (typeof ENVIRONMENTS)[number];

interface IntegrationRow {
  id: string;
  clinic_id: string;
  integration_id: IntegrationId;
  environment: IntegrationEnvironment;
  status: ConnectionStatus;
  scopes_json: string;
  credential_ref: string | null;
  endpoint_hash: string | null;
  last_verified_at: string | null;
  version: number;
  updated_at: string;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function clinicIdFrom(request: Request, body?: Record<string, unknown>): string {
  const url = new URL(request.url);
  return cleanText(body?.clinicId ?? url.searchParams.get("clinicId") ?? request.headers.get("x-clinic-id"), 80);
}

function isOneOf<T extends readonly string[]>(list: T, value: string): value is T[number] {
  return (list as readonly string[]).includes(value);
}

function parseIso(value: unknown): string | null {
  const text = cleanText(value, 40);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function integrationToApi(row: IntegrationRow) {
  let scopes: string[] = [];
  try {
    const parsed = JSON.parse(row.scopes_json);
    if (Array.isArray(parsed)) scopes = parsed.filter((scope): scope is string => typeof scope === "string");
  } catch {
    scopes = [];
  }
  return {
    id: row.id,
    clinicId: row.clinic_id,
    integrationId: row.integration_id,
    environment: row.environment,
    status: row.status,
    scopes,
    credentialConfigured: Boolean(row.credential_ref),
    endpointConfigured: Boolean(row.endpoint_hash),
    lastVerifiedAt: row.last_verified_at,
    version: row.version,
    updatedAt: row.updated_at,
  };
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

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const clinicId = clinicIdFrom(context.request);
  const authorized = await authorize(context, clinicId);
  if ("error" in authorized) return authorized.error;
  try {
    const result = await authorized.db
      .prepare(
        `SELECT id, clinic_id, integration_id, environment, status, scopes_json,
                credential_ref, endpoint_hash, last_verified_at, version, updated_at
           FROM saas_integration_connections
          WHERE clinic_id = ?
          ORDER BY integration_id, environment`,
      )
      .bind(clinicId)
      .all<IntegrationRow>();
    return tenantJson({ clinicId, data: (result.results ?? []).map(integrationToApi), catalog: OPERATIONAL_INTEGRATIONS });
  } catch (error) {
    console.error("[saas.integrations.GET] failed", error);
    return tenantError("Não foi possível carregar as integrações.", "INTEGRATIONS_LOAD_FAILED", 500);
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
  const idempotencyKey = cleanText(context.request.headers.get("x-idempotency-key"), 128);
  if (!isValidIdempotencyKey(idempotencyKey)) return tenantError("X-Idempotency-Key é obrigatório e deve ter 16–128 caracteres seguros.", "IDEMPOTENCY_KEY_REQUIRED", 400);
  const requestHash = await sha256Hex(JSON.stringify({ clinicId, body }));
  try {
    const replay = await authorized.db.prepare(`SELECT request_hash, response_json FROM saas_integration_idempotency WHERE clinic_id = ? AND idempotency_key = ? LIMIT 1`).bind(clinicId, idempotencyKey).first<{ request_hash: string; response_json: string }>();
    if (replay) {
      if (replay.request_hash !== requestHash) return tenantError("A chave de idempotência já foi usada com outro payload.", "IDEMPOTENCY_KEY_REUSE", 409);
      return tenantJson(JSON.parse(replay.response_json));
    }
  } catch (error) {
    if (String(error).toLowerCase().includes("no such table")) return tenantError("Migration de idempotência não aplicada.", "INTEGRATION_IDEMPOTENCY_NOT_CONFIGURED", 503);
    throw error;
  }

  const integrationId = cleanText(body.integrationId, 40);
  const environment = cleanText(body.environment, 20);
  const status = cleanText(body.status, 20);
  const expectedVersion = Number(body.expectedVersion);
  const integration = integrationById(integrationId);
  const scopes = Array.isArray(body.scopes) ? body.scopes.filter((scope): scope is string => typeof scope === "string") : [];
  const credentialRef = cleanText(body.credentialRef, 255) || null;
  const endpoint = cleanText(body.endpoint, 2000);
  const lastVerifiedAt = parseIso(body.lastVerifiedAt);

  if (!integration || !isOneOf(ENVIRONMENTS, environment) || !isOneOf(CONNECTION_STATUSES, status) || !Number.isInteger(expectedVersion) || expectedVersion < 0 || !scopes.length || scopes.some((scope) => !isIntegrationScope(scope) || !integration.allowedScopes.includes(scope as IntegrationScope)) || scopes.some((scope) => !INTEGRATION_SCOPES.includes(scope as IntegrationScope))) {
    return tenantError("Conexão ou escopos de integração inválidos.", "VALIDATION_ERROR", 400);
  }
  if (status === "connected" && !credentialRef) return tenantError("Conexão ativa exige referência no secret manager.", "CREDENTIAL_REF_REQUIRED", 400);
  if (environment === "production" && status === "connected" && !lastVerifiedAt) return tenantError("Conexão de produção exige verificação recente.", "VERIFICATION_REQUIRED", 400);
  if (integration.handlesPhi && environment === "production" && !scopes.some((scope) => scope === "clinical.read" || scope === "clinical.write")) return tenantError("Integração clínica exige escopo clínico explícito.", "CLINICAL_SCOPE_REQUIRED", 400);
  if (integration.requiresSandbox && environment === "production") {
    const sandbox = await authorized.db.prepare(`SELECT status FROM saas_integration_connections WHERE clinic_id = ? AND integration_id = ? AND environment = 'sandbox' LIMIT 1`).bind(clinicId, integrationId).first<{ status: ConnectionStatus }>();
    if (sandbox?.status !== "connected") return tenantError("Conecte e verifique o sandbox antes da produção.", "SANDBOX_REQUIRED", 409);
  }
  const enabledModuleIds = new Set<string>();
  const enabledModules = await authorized.db.prepare(`SELECT module_id FROM saas_module_settings WHERE clinic_id = ? AND enabled = 1`).bind(clinicId).all<{ module_id: string }>();
  for (const row of enabledModules.results ?? []) enabledModuleIds.add(row.module_id);
  if (!integration.moduleIds.some((moduleId) => enabledModuleIds.has(moduleId))) return tenantError("Habilite o módulo correspondente antes de conectar a integração.", "MODULE_NOT_ENABLED", 409);

  const endpointHash = endpoint ? await operationalBlindHash(context.env, clinicId, `integration-endpoint:${integrationId}`, endpoint) : null;
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const responsePayload = { data: { clinicId, integrationId, environment, status, scopes, credentialConfigured: Boolean(credentialRef), endpointConfigured: Boolean(endpointHash), lastVerifiedAt, version: expectedVersion + 1, updatedAt: now } };
  try {
    const results = await authorized.db.batch([
      authorized.db
        .prepare(
          `INSERT INTO saas_integration_connections
             (id, clinic_id, integration_id, environment, status, scopes_json,
              credential_ref, endpoint_hash, last_verified_at, version,
              created_by_user_id, updated_by_user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(clinic_id, integration_id, environment) DO UPDATE SET
             status = excluded.status,
             scopes_json = excluded.scopes_json,
             credential_ref = excluded.credential_ref,
             endpoint_hash = excluded.endpoint_hash,
             last_verified_at = excluded.last_verified_at,
             version = saas_integration_connections.version + 1,
             updated_by_user_id = excluded.updated_by_user_id,
             updated_at = excluded.updated_at
           WHERE saas_integration_connections.version = ?`,
        )
        .bind(id, clinicId, integrationId, environment, status, JSON.stringify(scopes), credentialRef, endpointHash, lastVerifiedAt, expectedVersion + 1, authorized.user.id, authorized.user.id, now, now, expectedVersion),
      prepareSaasAudit(
        authorized.db,
        {
          clinicId,
          actorUserId: authorized.user.id,
          action: "saas_integration_connection_upsert",
          targetType: "integration_connection",
          targetId: `${integrationId}:${environment}`,
          metadata: { integrationId, environment, status, scopeCount: scopes.length, hasCredentialRef: Boolean(credentialRef), hasEndpoint: Boolean(endpointHash) },
        },
        true,
      ),
      authorized.db
        .prepare(`INSERT INTO saas_integration_idempotency(id, clinic_id, idempotency_key, request_hash, response_json, created_at) SELECT ?, ?, ?, ?, ?, ? WHERE changes() = 1`)
        .bind(crypto.randomUUID(), clinicId, idempotencyKey, requestHash, JSON.stringify(responsePayload), now),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1) return tenantError("Conexão mudou durante a atualização.", "INTEGRATION_STALE", 409);
    if ((results[1]?.meta?.changes ?? 0) !== 1) return tenantError("A conexão não pôde ser auditada.", "AUDIT_WRITE_FAILED", 500);
    if ((results[2]?.meta?.changes ?? 0) !== 1) return tenantError("A idempotência não pôde ser registrada.", "IDEMPOTENCY_WRITE_FAILED", 500);
    return tenantJson(responsePayload);
  } catch (error) {
    if (String(error).toLowerCase().includes("unique") && String(error).toLowerCase().includes("idempotency")) return tenantError("A chave de idempotência já está em processamento ou foi usada.", "IDEMPOTENCY_CONFLICT", 409);
    if (String(error).includes("SAAS_INTEGRATION_VERSION_CONFLICT")) return tenantError("Conexão mudou durante a atualização.", "INTEGRATION_STALE", 409);
    console.error("[saas.integrations.PUT] failed", error);
    return tenantError("Não foi possível salvar a integração.", "INTEGRATION_UPSERT_FAILED", 500);
  }
};
