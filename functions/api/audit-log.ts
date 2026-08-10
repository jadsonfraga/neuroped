/**
 * GET /api/audit-log — lista entradas do log de auditoria (admin only)
 *
 * Parâmetros:
 *  ?page=1&limit=50
 *  ?resource=patients
 *  ?action=login
 *  ?from=2025-01-01
 *  ?to=2025-12-31
 *
 * LGPD: Este endpoint expõe metadados de acesso (quem acessou o quê e quando).
 * Deve ser restrito a administradores. Não expõe conteúdo clínico.
 */

interface Env {
  DB?: D1Database;
}

import {
  canReadAuditLog,
  getContextUser,
} from "./auth/_authorization";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, code: string, status: number): Response {
  return jsonResponse({ error: message, code }, status);
}

function positiveInteger(value: string | null, fallback: number, maximum: number): number {
  if (value === null || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

function isRealIsoDay(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function nextAuditIsoDay(value: string): string | null {
  if (!isRealIsoDay(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function parseAuditLogQuery(url: URL):
  | { ok: true; page: number; limit: number; resource?: string; action?: string; from?: string; to?: string }
  | { ok: false; message: string } {
  const page = positiveInteger(url.searchParams.get("page"), 1, 1_000_000);
  const limit = positiveInteger(url.searchParams.get("limit"), 50, 100);
  const resource = url.searchParams.get("resource")?.trim() || undefined;
  const action = url.searchParams.get("action")?.trim() || undefined;
  const from = url.searchParams.get("from")?.trim() || undefined;
  const to = url.searchParams.get("to")?.trim() || undefined;

  if ((resource?.length ?? 0) > 120 || (action?.length ?? 0) > 160) {
    return { ok: false, message: "Filtro textual excede o limite permitido." };
  }
  if (from && !isRealIsoDay(from)) return { ok: false, message: "Data inicial inválida." };
  if (to && !isRealIsoDay(to)) return { ok: false, message: "Data final inválida." };
  if (from && to && from > to) return { ok: false, message: "Intervalo de datas inválido." };

  return { ok: true, page, limit, resource, action, from, to };
}


export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const query = parseAuditLogQuery(url);
  if (!query.ok) return errorResponse(query.message, "VALIDATION_ERROR", 400);
  const { page, limit, resource, action, from, to } = query;

  // Log de auditoria nunca deve degradar para dados fictícios. Sem o banco que
  // sustenta autenticação e trilha real, a superfície administrativa falha fechada.
  if (!env.DB) {
    return errorResponse("Log de auditoria indisponível sem banco persistente.", "DB_REQUIRED", 503);
  }

  try {
    const user = getContextUser(context);
    if (!user) return errorResponse("Não autenticado.", "UNAUTHENTICATED", 401);
    if (!canReadAuditLog(user)) {
      return errorResponse("Acesso restrito ao administrador.", "FORBIDDEN", 403);
    }

    let sql = "SELECT id, action, resource, resource_id, user_id, ip, details, created_at FROM audit_logs WHERE 1=1";
    const binds: unknown[] = [];

    if (resource) { sql += " AND resource = ?"; binds.push(resource); }
    if (action) { sql += " AND action LIKE ?"; binds.push(`%${action}%`); }
    if (from) { sql += " AND created_at >= ?"; binds.push(from); }
    if (to) {
      const toExclusive = nextAuditIsoDay(to);
      if (!toExclusive) return errorResponse("Data final inválida.", "VALIDATION_ERROR", 400);
      sql += " AND created_at < ?";
      binds.push(toExclusive);
    }

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
