import { AGENDA_CLOUD_WORKSPACE_ID } from "../../../shared/agenda-cloud";
import {
  canAccessOperationalAgendaAudit,
  getContextUser,
} from "../auth/_authorization";
import { ensureAgendaDemoSchema } from "./_schema";

interface Env {
  DB?: D1Database;
}

interface AuditRow {
  id: string;
  user_id: string | null;
  action: string;
  summary: string;
  created_at: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  if (!env.DB) return json({ error: "Agenda remota indisponível.", code: "STORAGE_UNAVAILABLE" }, 503);
  const user = getContextUser(context);
  if (!user) return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401);
  if (!canAccessOperationalAgendaAudit(user)) {
    return json({ error: "Perfil sem acesso à auditoria da agenda.", code: "FORBIDDEN" }, 403);
  }

  const rawLimit = Number(new URL(request.url).searchParams.get("limit") ?? 30);
  const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, Math.round(rawLimit))) : 30;

  try {
    await ensureAgendaDemoSchema(env.DB);
    const result = await env.DB
      .prepare(
        `SELECT id, user_id, action, summary, created_at
           FROM agenda_audit_demo
          WHERE workspace_id = ? AND is_demo = 1
          ORDER BY created_at DESC
          LIMIT ?`,
      )
      .bind(AGENDA_CLOUD_WORKSPACE_ID, limit)
      .all<AuditRow>();
    const data = (result.results ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      summary: row.summary,
      createdAt: row.created_at,
    }));
    return json({ data, total: data.length, mode: "demo-cloud" });
  } catch (cause) {
    console.error("[agenda.audit.GET]", cause);
    return json({ error: "Não foi possível carregar auditoria da agenda.", code: "DB_ERROR" }, 500);
  }
};
