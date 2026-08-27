import { clinicalCryptoReady } from "./tenant/_crypto";

interface Env {
  DB?: D1Database;
  NEUROPED_JWT_SECRET?: string;
  CLINICAL_DATA_KEY?: string;
  CLINICAL_DATA_KEY_ID?: string;
  CLINICAL_DATA_KEY_PREVIOUS?: string;
  CLINICAL_DATA_KEY_PREVIOUS_ID?: string;
  CLINICAL_INDEX_KEY?: string;
  CLINICAL_PDF_BUCKET?: R2Bucket;
  CLINICAL_ARTIFACT_BUCKET?: R2Bucket;
  BUILD_SHA?: string;
  FRONTEND_CANONICAL_URL?: string;
  BACKEND_CANONICAL_URL?: string;
  MIGRATION_EXPECTED?: string;
}

const REQUIRED_TABLES = [
  "auth_refresh_sessions",
  "clinics",
  "live_patients",
  "live_documents",
  "live_document_versions",
  "live_pdf_archives",
  "live_audit_chain",
  "live_clinical_drafts",
  "family_portal_invites",
  "live_previsit_submissions",
  "live_epilepsy_safety_plans",
  "live_export_requests",
  "live_deletion_requests",
] as const;

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const now = new Date().toISOString();
  let dbStatus = "not_configured";
  let authSchemaReady: boolean | null = null;
  let requiredTables: string[] = [];
  let migrationStatus = "not_configured";
  if (env.DB) {
    try {
      await env.DB.prepare("SELECT 1").first();
      dbStatus = "ok";
      const sessionTable = await env.DB.prepare("SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = 'auth_refresh_sessions' LIMIT 1").first<{ present: number }>();
      const authColumns = await env.DB.prepare(`SELECT COUNT(*) AS present FROM pragma_table_info('users') WHERE name IN ('password_hash','must_change_password','failed_login_attempts','locked_until','last_login_at')`).first<{ present: number }>();
      authSchemaReady = sessionTable?.present === 1 && Number(authColumns?.present) === 5;
      const tableRows = await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${REQUIRED_TABLES.map(() => "?").join(",")})`).bind(...REQUIRED_TABLES).all<{ name: string }>();
      requiredTables = (tableRows.results ?? []).map((row) => row.name);
      migrationStatus = REQUIRED_TABLES.every((name) => requiredTables.includes(name)) ? "ok" : "drift";
    } catch {
      dbStatus = "error";
      migrationStatus = "error";
    }
  }
  let storageStatus = "not_configured";
  const bucket = env.CLINICAL_PDF_BUCKET ?? env.CLINICAL_ARTIFACT_BUCKET;
  if (bucket) {
    try { await bucket.head("__neuroped_health_probe_never_written__"); storageStatus = "ok"; } catch { storageStatus = "error"; }
  }
  const response = {
    status: dbStatus === "error" || migrationStatus === "drift" ? "degraded" : "ok",
    service: "neuroped-edj-api",
    version: "2.0.0",
    buildSha: env.BUILD_SHA ?? "unknown",
    timestamp: now,
    environment: "cloudflare-pages",
    frontendCanonical: env.FRONTEND_CANONICAL_URL ?? "unknown",
    backendCanonical: env.BACKEND_CANONICAL_URL ?? "unknown",
    database: dbStatus,
    migrations: { status: migrationStatus, expected: env.MIGRATION_EXPECTED ?? "0016_clinical_operational_hardening", requiredTablesPresent: requiredTables.length, requiredTablesTotal: REQUIRED_TABLES.length },
    objectStorage: { status: storageStatus, configured: Boolean(bucket), provider: bucket ? "private-r2-compatible" : "not_configured" },
    clinicalCrypto: { configured: clinicalCryptoReady(env) },
    authentication: { required: Boolean(env.DB), schemaReady: authSchemaReady, configured: Boolean(env.DB) && authSchemaReady !== false && (env.NEUROPED_JWT_SECRET?.trim().length ?? 0) >= 32 },
    tenantAware: true,
    secretsExposed: false,
  };
  return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-cache", "X-Service": "neuroped-edj" } });
};
