/** GET /api/health — capacidades não sensíveis, sem dados clínicos nem inferência. */
import { clinicalLiveEnabled, type TenantEnv } from "./tenant/_core";
import { clinicalCryptoReady } from "./tenant/_crypto";
import { resolvePrivateArtifactStore, type ArtifactStoreEnv } from "./live/governance/_artifactStore";
interface Env extends TenantEnv, ArtifactStoreEnv {
  ENVIRONMENT?: string;
  NEUROPED_JWT_SECRET?: string;
  ESCUTA_ENABLED?: string;
  AI?: unknown;
}

async function lgpdExportSchemaReady(db: D1Database): Promise<boolean> {
  try {
    // Probe exatamente as colunas tocadas pelo runtime de exportação. WHERE 0
    // valida schema sem ler nenhuma linha nem conteúdo clínico.
    const probes = [
      `SELECT id, slug, name, legal_name, timezone, status, created_at, updated_at FROM clinics WHERE 0`,
      `SELECT clinic_id, user_id, role, active, invited_by_user_id, created_at, updated_at FROM clinic_memberships WHERE 0`,
      `SELECT clinic_id, id, primary_professional_user_id, profile_encrypted, encryption_version, status, merged_into_patient_id, created_at, updated_at FROM live_patients WHERE 0`,
      `SELECT clinic_id, id, patient_id, author_user_id, event_type, occurred_at, encounter_id, provenance_kind, provenance_source, payload_encrypted, encryption_version, supersedes_event_id, status, created_at FROM live_clinical_events WHERE 0`,
      `SELECT id, clinic_id, provider, status, billing_email, trial_ends_at, last_failed_at, canceled_at, grace_ends_at, created_at, updated_at FROM billing_customers WHERE 0`,
      `SELECT customer_id, plan_id, seats, status, anchored_at, current_period_starts_at, current_period_ends_at, canceled_at, cancel_reason, created_at, updated_at FROM billing_subscriptions WHERE 0`,
      `SELECT clinic_id, status, reason_code, requested_at, retention_until, canceled_at, finalized_at, legal_hold FROM tenant_lifecycle WHERE 0`,
      `SELECT id, clinic_id, patient_id, scope, status, artifact_key, completed_at, updated_at FROM live_export_requests WHERE 0`,
      `SELECT id, request_type, request_id, clinic_id, status, attempts, claimed_at, lease_until, worker_run_id, artifact_key, artifact_digest_sha256, artifact_byte_length, deleted_counts_json, failure_code, created_at, updated_at FROM live_lgpd_worker_jobs WHERE 0`,
      `SELECT id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json FROM saas_audit_log WHERE 0`,
    ];
    for (const sql of probes) await db.prepare(sql).first();
    const requiredLgpdTriggers = await db.prepare(`SELECT COUNT(*) AS present FROM sqlite_master WHERE type = 'trigger' AND name IN ('trg_lgpd_worker_export_request_tenant_insert','trg_lgpd_worker_delete_request_tenant_insert','trg_lgpd_worker_request_binding_immutable','trg_lgpd_worker_export_completed_evidence','trg_lgpd_worker_delete_completed_evidence','trg_live_export_completed_requires_worker','trg_live_delete_completed_requires_worker')`).first<{ present: number }>();
    return Number(requiredLgpdTriggers?.present) === 7;
  } catch {
    return false;
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const now = new Date().toISOString();
  let dbStatus = "not_configured";
  let authSchemaReady: boolean | null = null;
  let lgpdSchemaReady: boolean | null = null;
  if (env.DB) {
    try {
      await env.DB.prepare("SELECT 1").first();
      dbStatus = "ok";
      const sessionTable = await env.DB.prepare("SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = 'auth_refresh_sessions' LIMIT 1").first<{ present: number }>();
      const authColumns = await env.DB.prepare(`SELECT COUNT(*) AS present FROM pragma_table_info('users') WHERE name IN ('password_hash', 'must_change_password', 'failed_login_attempts', 'locked_until', 'last_login_at')`).first<{ present: number }>();
      authSchemaReady = sessionTable?.present === 1 && Number(authColumns?.present) === 5;
      lgpdSchemaReady = await lgpdExportSchemaReady(env.DB);
    } catch { dbStatus = "error"; }
  }
  const authConfigured = Boolean(env.DB) && authSchemaReady !== false && (env.NEUROPED_JWT_SECRET?.trim().length ?? 0) >= 32;
  const cryptoReady = clinicalCryptoReady(env);
  const coreRequired = (env.ENVIRONMENT ?? "").toLowerCase() === "production" || Boolean(env.DB);
  const coreReady = dbStatus === "ok" && authSchemaReady === true && authConfigured;
  const degraded = coreRequired && !coreReady;
  const storageBindingPresent = resolvePrivateArtifactStore(env) !== null;
  const blockers: string[] = [];
  if (!clinicalLiveEnabled(env)) blockers.push("CLINICAL_LIVE_DISABLED");
  if (coreRequired && dbStatus !== "ok") blockers.push("DATABASE_NOT_READY");
  if (coreRequired && authSchemaReady === false) blockers.push("AUTH_SCHEMA_NOT_READY");
  if (coreRequired && !authConfigured) blockers.push("AUTH_NOT_CONFIGURED");
  if (clinicalLiveEnabled(env) && !cryptoReady) blockers.push("CLINICAL_CRYPTO_NOT_READY");
  if (clinicalLiveEnabled(env) && lgpdSchemaReady === false) blockers.push("LGPD_SCHEMA_NOT_READY");
  if (!storageBindingPresent) blockers.push("LGPD_BUCKET_NOT_CONFIGURED");
  const response = {
    status: degraded ? "degraded" : "ok",
    readiness: {
      coreReady,
      clinicalCryptoConfigured: cryptoReady,
      lgpdSchemaReady,
      lgpdExport: {
        configured: clinicalLiveEnabled(env) && coreReady && cryptoReady && lgpdSchemaReady === true && storageBindingPresent,
        storageBindingPresent,
        executionVerified: false,
      },
      blockers,
    },
    service: "neuroped-edj-api",
    version: "2.0.0",
    timestamp: now,
    environment: "cloudflare-pages",
    database: dbStatus,
    authentication: {
      // Binding presente exige login inclusive durante indisponibilidade do banco.
      required: coreRequired,
      configured: authConfigured,
    },
    escuta: {
      enabled: env.ESCUTA_ENABLED === "true" && clinicalLiveEnabled(env),
      configured: dbStatus === "ok" && authConfigured && cryptoReady && Boolean(env.AI),
      clinicalCryptoConfigured: cryptoReady,
      nativeAiBinding: Boolean(env.AI),
      // Readiness não é prova de inferência: ela é aferida no gate sintético em nuvem.
      inferenceCheckedByHealth: false,
    },
    semanticSearch: {
      status: "not_configured",
      note: "Vectorize/pgvector not yet configured. Fallback to text search.",
    },
  };
  return new Response(JSON.stringify(response), {
    status: degraded ? 503 : 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Service": "neuroped-edj",
    },
  });
};
