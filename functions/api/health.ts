/**
 * GET /api/health — capacidade não-sensível do backend.
 * Nunca expõe material de chave; apenas presença e fase da criptografia.
 */

interface Env {
  DB?: D1Database;
  NEUROPED_JWT_SECRET?: string;
  CLINICAL_DATA_KEY?: string;
  CLINICAL_ENCRYPTION_STRICT?: string;
  OPERATIONAL_DATA_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  let dbStatus = "not_configured";
  let authSchemaReady: boolean | null = null;
  let clinicalPhase: string | null = null;
  let clinicalSchemaReady: boolean | null = null;

  if (env.DB) {
    try {
      await env.DB.prepare("SELECT 1").first();
      dbStatus = "ok";
      const sessionTable = await env.DB.prepare(
        "SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = 'auth_refresh_sessions' LIMIT 1",
      ).first<{ present: number }>();
      const authColumns = await env.DB.prepare(
        `SELECT COUNT(*) AS present FROM pragma_table_info('users')
          WHERE name IN ('password_hash','must_change_password','failed_login_attempts','locked_until','last_login_at')`,
      ).first<{ present: number }>();
      authSchemaReady = sessionTable?.present === 1 && Number(authColumns?.present) === 5;

      const cryptoStateTable = await env.DB.prepare(
        "SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = 'clinical_encryption_state' LIMIT 1",
      ).first<{ present: number }>();
      if (cryptoStateTable?.present === 1) {
        const state = await env.DB.prepare(
          "SELECT phase FROM clinical_encryption_state WHERE id = 1 LIMIT 1",
        ).first<{ phase: string }>();
        clinicalPhase = state?.phase ?? null;
      }
      const secureColumns = await env.DB.prepare(
        `SELECT COUNT(*) AS present FROM (
          SELECT name FROM pragma_table_info('patients_demo') WHERE name='secure_payload_encrypted'
          UNION ALL SELECT name FROM pragma_table_info('consultations_demo') WHERE name='secure_payload_encrypted'
          UNION ALL SELECT name FROM pragma_table_info('scale_results_demo') WHERE name='secure_payload_encrypted'
          UNION ALL SELECT name FROM pragma_table_info('documents_demo') WHERE name='secure_payload_encrypted'
          UNION ALL SELECT name FROM pragma_table_info('memory_notes') WHERE name='secure_payload_encrypted'
          UNION ALL SELECT name FROM pragma_table_info('clinical_events_demo') WHERE name='secure_payload_encrypted'
          UNION ALL SELECT name FROM pragma_table_info('conecta_events_demo') WHERE name='secure_payload_encrypted'
        )`,
      ).first<{ present: number }>();
      clinicalSchemaReady = Number(secureColumns?.present) === 7;
    } catch {
      dbStatus = "error";
    }
  }

  const clinicalConfigured = (env.CLINICAL_DATA_KEY?.trim().length ?? 0) >= 32;
  const clinicalStrict = env.CLINICAL_ENCRYPTION_STRICT === "true";
  const operationalConfigured = (env.OPERATIONAL_DATA_KEY?.trim().length ?? 0) >= 32;

  const response = {
    status: "ok",
    service: "neuroped-edj-api",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    environment: "cloudflare-pages",
    database: dbStatus,
    authentication: {
      required: Boolean(env.DB),
      configured: Boolean(env.DB) && authSchemaReady !== false && (env.NEUROPED_JWT_SECRET?.trim().length ?? 0) >= 32,
    },
    encryption: {
      clinicalConfigured,
      clinicalStrict,
      clinicalSchemaReady,
      clinicalPhase,
      operationalConfigured,
      readyForIdentifiableClinicalData:
        Boolean(env.DB) && dbStatus === "ok" && clinicalConfigured && clinicalStrict &&
        clinicalSchemaReady === true && clinicalPhase === "strict" && operationalConfigured,
    },
    semanticSearch: {
      status: "not_configured",
      note: "Vectorize/pgvector not yet configured. Clinical text search uses blind index when encryption is strict.",
    },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-cache", "X-Service": "neuroped-edj" },
  });
};
