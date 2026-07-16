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
  if (env.DB) {
    try {
      await env.DB.prepare("SELECT 1").first();
      dbStatus = "ok";
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
      configured: Boolean(env.DB) && Boolean(env.NEUROPED_JWT_SECRET?.trim()),
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
