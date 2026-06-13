/**
 * GET /api/audit-log  â€” lista entradas do log de auditoria (admin only)
 *
 * ParÃ¢metros:
 *  ?page=1&limit=50
 *  ?resource=patients
 *  ?action=login
 *  ?from=2025-01-01
 *  ?to=2025-12-31
 *
 * LGPD: Este endpoint expÃµe metadados de acesso (quem acessou o quÃª e quando).
 * Deve ser restrito a administradores. NÃ£o expÃµe conteÃºdo clÃ­nico.
 */

interface Env {
  DB?: D1Database;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, code: string, status: number): Response {
  return jsonResponse({ error: message, code }, status);
}

const DEMO_LOGS = [
  { id: "log-001", action: "auth.login.success", resource: "auth", resource_id: null, user_id: "demo-user", ip: "127.0.0.1", details: null, created_at: new Date("2025-05-08T09:00:00").toISOString() },
  { id: "log-002", action: "patients.list", resource: "patients", resource_id: null, user_id: "demo-user", ip: "127.0.0.1", details: null, created_at: new Date("2025-05-08T09:01:00").toISOString() },
  { id: "log-003", action: "scale.result.create", resource: "scale_results", resource_id: "scale-demo-001", user_id: "demo-user", ip: "127.0.0.1", details: '{"scale_id":"mchat"}', created_at: new Date("2025-05-08T09:05:00").toISOString() },
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));
  const resource = url.searchParams.get("resource")?.trim();
  const action = url.searchParams.get("action")?.trim();
  const from = url.searchParams.get("from")?.trim();
  const to = url.searchParams.get("to")?.trim();

  if (!env.DB) {
    return jsonResponse({
      data: DEMO_LOGS,
      total: DEMO_LOGS.length,
      page,
      limit,
      mode: "demo",
      note: "Log de auditoria simulado. Configure D1 para log real.",
    });
  }

  try {
    let sql = "SELECT id, action, resource, resource_id, user_id, ip, details, created_at FROM audit_logs WHERE 1=1";
    const binds: unknown[] = [];

    if (resource) { sql += " AND resource = ?"; binds.push(resource); }
    if (action) { sql += " AND action LIKE ?"; binds.push(`%${action}%`); }
    if (from) { sql += " AND created_at >= ?"; binds.push(from); }
    if (to) { sql += " AND created_at <= ?"; binds.push(to + "T23:59:59Z"); }

    // Count
    const countResult = await env.DB
      .prepare(sql.replace("SELECT id, action, resource, resource_id, user_id, ip, details, created_at", "SELECT COUNT(*) as total"))
      .bind(...binds)
      .first<{ total: number }>();

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    binds.push(limit, (page - 1) * limit);

    const rows = await env.DB.prepare(sql).bind(...binds).all();

    return jsonResponse({
      data: rows.results ?? [],
      total: countResult?.total ?? 0,
      page,
      limit,
      mode: "db",
    });
  } catch (err) {
    console.error("[audit-log.GET] DB error:", err);
    return errorResponse("Erro ao buscar log de auditoria.", "DB_ERROR", 500);
  }
};
