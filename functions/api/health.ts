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
  if (env.DB) {
    try {
      await env.DB.prepare("SELECT 1").first();
      dbStatus = "ok";
      const sessionTable = await env.DB.prepare("SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = 'auth_refresh_sessions' LIMIT 1").first<{ present: number }>();
      const authColumns = await env.DB.prepare(`SELECT COUNT(*) AS present FROM pragma_table_info('users') WHERE name IN ('password_hash', 'must_change_password', 'failed_login_attempts', 'locked_until', 'last_login_at')`).first<{ present: number }>();
      authSchemaReady = sessionTable?.present === 1 && Number(authColumns?.present) === 5;
    } catch { dbStatus = "error"; }
  }
  const authConfigured = Boolean(env.DB) && authSchemaReady !== false && (env.NEUROPED_JWT_SECRET?.trim().length ?? 0) >= 32;
  const cryptoReady = clinicalCryptoReady(env);
  const coreRequired = env.ENVIRONMENT === "production" || Boolean(env.DB);
  const coreReady = dbStatus === "ok" && authSchemaReady === true && authConfigured;
  const degraded = coreRequired && !coreReady;
  const storageBindingPresent = resolvePrivateArtifactStore(env) !== null;
  const blockers: string[] = [];
  if (coreRequired && dbStatus !== "ok") blockers.push("DATABASE_NOT_READY");
  if (coreRequired && authSchemaReady === false) blockers.push("AUTH_SCHEMA_NOT_READY");
  if (coreRequired && !authConfigured) blockers.push("AUTH_NOT_CONFIGURED");
  if (clinicalLiveEnabled(env) && !cryptoReady) blockers.push("CLINICAL_CRYPTO_NOT_READY");
  if (!storageBindingPresent) blockers.push("LGPD_BUCKET_NOT_CONFIGURED");
  const response = {
    status: degraded ? "degraded" : "ok",
    readiness: {
      coreReady,
      clinicalCryptoConfigured: cryptoReady,
      lgpdExport: {
        configured: coreReady && cryptoReady && storageBindingPresent,
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
