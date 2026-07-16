/**
 * GET /api/health
 * Cloudflare Pages Function — Health check do backend
 * Retorna status do sistema, versão e timestamp.
 */

interface Env {
  DB?: D1Database;
  NEUROPED_JWT_SECRET?: string;
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
      const sessionTable = await env.DB
        .prepare(
          "SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = 'auth_refresh_sessions' LIMIT 1",
        )
        .first<{ present: number }>();
      const authColumns = await env.DB
        .prepare(
          `SELECT COUNT(*) AS present
             FROM pragma_table_info('users')
            WHERE name IN (
              'password_hash', 'must_change_password', 'failed_login_attempts',
              'locked_until', 'last_login_at'
            )`,
        )
        .first<{ present: number }>();
      authSchemaReady =
        sessionTable?.present === 1 && Number(authColumns?.present) === 5;
    } catch {
      dbStatus = "error";
    }
  }

  const response = {
    status: "ok",
    service: "neuroped-edj-api",
    version: "2.0.0",
    timestamp: now,
    environment: "cloudflare-pages",
    database: dbStatus,
    authentication: {
      // A presença do binding já significa que esta instalação pode conter
      // dados clínicos. Mesmo com o banco temporariamente indisponível, o
      // cliente deve falhar fechado e continuar exigindo login.
      required: Boolean(env.DB),
      configured:
        Boolean(env.DB) &&
        authSchemaReady !== false &&
        (env.NEUROPED_JWT_SECRET?.trim().length ?? 0) >= 32,
    },
    semanticSearch: {
      status: "not_configured",
      note: "Vectorize/pgvector not yet configured. Fallback to text search.",
    },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Service": "neuroped-edj",
    },
  });
};
