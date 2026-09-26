import { getContextUser } from "../../auth/_authorization";
import { boundedText } from "../../_request";
import { nextAuditIsoDay, parseAuditLogQuery } from "../../audit-log";
import {
  getClinicMembership,
  membershipHas,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";

/**
 * GET /api/tenants/:id/audit — trilha de auditoria DA CLÍNICA (`saas_audit_log`
 * filtrada por `clinic_id`), legível por quem detém `audit.read`.
 *
 * Diferença para `GET /api/audit-log`: aquela é a trilha de plataforma
 * (`audit_logs`), restrita ao admin global. Esta é a visão do tenant sobre
 * si mesmo: quem convidou, quem alterou papel, quem criou convite remoto —
 * metadados apenas. O predicado `clinic_id = ?` está no SQL final (contagem
 * e página), não só na autorização; linhas sem clínica (`clinic_id IS NULL`)
 * nunca aparecem, e clínica alheia ou inexistente responde o mesmo 403.
 *
 * Parâmetros (mesmo parser da trilha de plataforma):
 *  ?page=1&limit=50&resource=<target_type>&action=<trecho>&from=AAAA-MM-DD&to=AAAA-MM-DD
 */

interface AuditRow {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  actor_user_id: string;
  actor_name: string | null;
  metadata_json: string | null;
  created_at: string;
}

export interface TenantAuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  actorUserId: string;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function parseAuditMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  const clinicId = boundedText(context.params.id, 80);
  if (!db) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!clinicId) return tenantError("Clínica inválida.", "VALIDATION_ERROR", 400);

  const query = parseAuditLogQuery(new URL(context.request.url));
  if (!query.ok) return tenantError(query.message, "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipHas(membership, "audit.read")) {
    return tenantError("Acesso negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  }

  let where = " WHERE a.clinic_id = ?";
  const binds: unknown[] = [clinicId];
  if (query.resource) {
    where += " AND a.target_type = ?";
    binds.push(query.resource);
  }
  if (query.action) {
    where += " AND a.action LIKE ? ESCAPE '\\'";
    binds.push(`%${escapeLike(query.action)}%`);
  }
  if (query.from) {
    where += " AND a.created_at >= ?";
    binds.push(query.from);
  }
  if (query.to) {
    const toExclusive = nextAuditIsoDay(query.to);
    if (!toExclusive) return tenantError("Data final inválida.", "VALIDATION_ERROR", 400);
    where += " AND a.created_at < ?";
    binds.push(toExclusive);
  }

  try {
    const count = await db
      .prepare(`SELECT COUNT(*) AS total FROM saas_audit_log a${where}`)
      .bind(...binds)
      .first<{ total: number }>();
    const rows = await db
      .prepare(
        `SELECT a.id, a.action, a.target_type, a.target_id, a.actor_user_id,
                u.name AS actor_name, a.metadata_json, a.created_at
           FROM saas_audit_log a
           LEFT JOIN users u ON u.id = a.actor_user_id${where}
          ORDER BY a.created_at DESC, a.id DESC
          LIMIT ? OFFSET ?`,
      )
      .bind(...binds, query.limit, (query.page - 1) * query.limit)
      .all<AuditRow>();

    const data: TenantAuditEntry[] = (rows.results ?? []).map((row) => ({
      id: row.id,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      actorUserId: row.actor_user_id,
      actorName: row.actor_name,
      metadata: parseAuditMetadata(row.metadata_json),
      createdAt: row.created_at,
    }));

    return tenantJson({
      clinicId,
      data,
      total: count?.total ?? 0,
      page: query.page,
      limit: query.limit,
    });
  } catch (error) {
    console.error("[tenants/:id/audit.GET] DB error", error);
    return tenantError("Não foi possível ler a auditoria da clínica.", "DB_ERROR", 500);
  }
};
