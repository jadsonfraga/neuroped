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
      const requiredLgpdTables = await env.DB.prepare(`SELECT COUNT(*) AS present FROM sqlite_master WHERE type = 'table' AND name IN ('clinics','clinic_memberships','live_patients','live_clinical_events','billing_customers','billing_subscriptions','tenant_lifecycle','live_export_requests','live_lgpd_worker_jobs','saas_audit_log')`).first<{ present: number }>();
      const exportColumns = await env.DB.prepare(`SELECT COUNT(*) AS present FROM pragma_table_info('live_export_requests') WHERE name IN ('id','clinic_id','patient_id','scope','status','artifact_key','completed_at','updated_at')`).first<{ present: number }>();
      const workerColumns = await env.DB.prepare(`SELECT COUNT(*) AS present FROM pragma_table_info('live_lgpd_worker_jobs') WHERE name IN ('request_type','request_id','clinic_id','status','attempts','claimed_at','lease_until','worker_run_id','artifact_key','artifact_digest_sha256','artifact_byte_length','failure_code')`).first<{ present: number }>();
      lgpdSchemaReady = Number(requiredLgpdTables?.present) === 10
        && Number(exportColumns?.present) === 8
        && Number(workerColumns?.present) === 12;
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
