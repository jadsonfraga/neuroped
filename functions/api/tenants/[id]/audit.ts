/**
 * GET /api/tenants/:id/audit — lista a própria trilha de auditoria SaaS
 * (saas_audit_log) da clínica.
 *
 * AUTHZ-P1-10 (ciclo 4, 2026-09-26 —
 * docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md): nenhuma rota expunha a
 * trilha de auditoria SaaS para owner/clinic_admin — só o admin global lia
 * `audit_logs` (legado, sem tenant), e `metrics.ts` só expõe contagens
 * agregadas, nunca os eventos em si. Uma clínica não tinha como responder
 * "quem fez o quê" sobre a própria operação.
 *
 * Guard idêntico ao já usado em metrics.ts/export.ts: membership ativa com
 * papel de gestor (owner/clinic_admin) numa clínica ativa — mesma consulta,
 * mesmo 404 genérico ("Recurso indisponível") para clínica inexistente,
 * usuário sem membership, papel insuficiente ou clínica suspensa/encerrada,
 * sem distinguir qual caso é (anti-enumeração).
 */
import { getContextUser } from "../../auth/_authorization";
import { tenantError, tenantJson } from "../../tenant/_core";

interface Env {
  DB?: D1Database;
}

interface AuditRow {
  id: string;
  actor_user_id: string;
  actor_name: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata_json: string | null;
  created_at: string;
}

function positiveInteger(value: string | null, fallback: number, maximum: number): number {
  if (value === null || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = getContextUser(context);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  const id = context.params.id;
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) {
    return tenantError("Recurso indisponível.", "NOT_FOUND", 404);
  }
  if (!context.env.DB) {
    return tenantError("Auditoria indisponível sem banco persistente.", "DB_REQUIRED", 503);
  }

  const url = new URL(context.request.url);
  const page = positiveInteger(url.searchParams.get("page"), 1, 1_000_000);
  const limit = positiveInteger(url.searchParams.get("limit"), 50, 100);

  try {
    const authorized = await context.env.DB.prepare(
      `SELECT 1 FROM clinic_memberships m
         JOIN clinics c ON c.id = m.clinic_id
        WHERE m.clinic_id = ? AND m.user_id = ? AND m.active = 1
          AND m.role IN ('owner', 'clinic_admin') AND c.status = 'active'
        LIMIT 1`,
    )
      .bind(id, user.id)
      .first();
    if (!authorized) return tenantError("Recurso indisponível.", "NOT_FOUND", 404);

    const countRow = await context.env.DB.prepare(
      `SELECT COUNT(*) AS total FROM saas_audit_log WHERE clinic_id = ?`,
    )
      .bind(id)
      .first<{ total: number }>();

    const rows = await context.env.DB.prepare(
      `SELECT a.id, a.actor_user_id, u.name AS actor_name, a.action, a.target_type,
              a.target_id, a.metadata_json, a.created_at
         FROM saas_audit_log a
         LEFT JOIN users u ON u.id = a.actor_user_id
        WHERE a.clinic_id = ?
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?`,
    )
      .bind(id, limit, (page - 1) * limit)
      .all<AuditRow>();

    const data = (rows.results ?? []).map((row) => ({
      id: row.id,
      actorUserId: row.actor_user_id,
      actorName: row.actor_name ?? "Usuário",
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      metadata: (() => {
        try {
          return row.metadata_json ? JSON.parse(row.metadata_json) : null;
        } catch {
          return null;
        }
      })(),
      createdAt: row.created_at,
    }));

    return tenantJson({ data, total: countRow?.total ?? 0, page, limit });
  } catch (error) {
    console.error("[tenants/:id/audit.GET]", error);
    return tenantError("Não foi possível carregar a auditoria agora.", "AUDIT_LOAD_FAILED", 500);
  }
};
