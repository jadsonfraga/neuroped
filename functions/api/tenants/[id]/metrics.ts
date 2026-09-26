import { getContextUser } from "../../auth/_authorization";
import { tenantError, tenantJson } from "../../tenant/_core";
import { rolesWithPermission } from "../../../../shared/permissions";
import type { ApiMetricsEnv } from "../../_observability";

interface Env extends ApiMetricsEnv { DB?: D1Database; }
interface MetricsRow { dau: number; wau: number; mau: number; events: number; daily_json: string; }
// Papéis vêm do catálogo congelado (identificadores fixos, nunca entrada do
// usuário); a allowlist é o que torna a interpolação segura.
const METRICS_ROLES_SQL = rolesWithPermission("organization.metrics.read").map((role) => `'${role}'`).join(", ");
const SQL = `WITH authorized AS (
  SELECT 1 AS allowed FROM clinic_memberships m JOIN clinics c ON c.id = m.clinic_id
  WHERE m.clinic_id = ? AND m.user_id = ? AND m.active = 1
    AND m.role IN (${METRICS_ROLES_SQL}) AND c.status = 'active'
), scoped AS (
  SELECT actor_user_id, substr(created_at, 1, 10) AS day FROM saas_audit_log
  WHERE clinic_id = ? AND created_at >= ? AND created_at < ?
    AND EXISTS (SELECT 1 FROM authorized)
)
SELECT
  (SELECT COUNT(DISTINCT actor_user_id) FROM scoped WHERE day = ?) AS dau,
  (SELECT COUNT(DISTINCT actor_user_id) FROM scoped WHERE day >= ?) AS wau,
  (SELECT COUNT(DISTINCT actor_user_id) FROM scoped) AS mau,
  (SELECT COUNT(*) FROM scoped) AS events,
  (SELECT json_group_array(json_object('day', day, 'actors', actors, 'events', events))
   FROM (SELECT day, COUNT(DISTINCT actor_user_id) AS actors, COUNT(*) AS events
         FROM scoped GROUP BY day ORDER BY day)) AS daily_json
FROM authorized LIMIT 1`;

function counter(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("METRICS_INVALID_AGGREGATE");
  }
  return value;
}

/** Real SQL aggregates; no event body, target identifier or user identifier is returned. */
export async function readTenantMetrics(db: D1Database, clinicId: string, userId: string, now = new Date()) {
  const day = (offset: number) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset)).toISOString().slice(0, 10);
  const start = day(-29), today = day(0), end = day(1);
  const row = await db.prepare(SQL).bind(clinicId, userId, clinicId, start, end, today, day(-6)).first<MetricsRow>();
  if (!row) return null;
  const parsed: unknown = JSON.parse(row.daily_json);
  if (!Array.isArray(parsed) || parsed.length > 30) throw new Error("METRICS_INVALID_AGGREGATE");
  const daily = parsed.map((item: unknown) => {
    if (!item || typeof item !== "object" || !("day" in item) || typeof item.day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(item.day)) {
      throw new Error("METRICS_INVALID_AGGREGATE");
    }
    const value = item as { day: string; actors: unknown; events: unknown };
    return { day: value.day, actors: counter(value.actors), events: counter(value.events) };
  });
  return {
    source: "saas_audit_log", window: { from: start, toExclusive: end, timezone: "UTC", currentDayPartial: true },
    auditedActorsToday: counter(row.dau), auditedActors7Days: counter(row.wau),
    auditedActors30Days: counter(row.mau), auditedEvents30Days: counter(row.events), daily,
    coverage: { auditedOperationsOnly: true, anonymousVisitorsCollected: false,
      fullProductDau: null, fullProductMau: null, retention: null },
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = getContextUser(context);
  if (!user) return tenantError("Nao autenticado.", "UNAUTHENTICATED", 401);
  const id = context.params.id;
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) {
    return tenantError("Recurso indisponivel.", "NOT_FOUND", 404);
  }
  if (new URL(context.request.url).search) return tenantError("Filtros nao suportados.", "INVALID_QUERY", 400);
  if (!context.env.DB) return tenantError("Metricas indisponiveis.", "METRICS_UNAVAILABLE", 503);
  try {
    const metrics = await readTenantMetrics(context.env.DB, id, user.id);
    if (!metrics) return tenantError("Recurso indisponivel.", "NOT_FOUND", 404);
    return tenantJson({ ...metrics, apiInstrumentationBindingPresent: Boolean(context.env.API_METRICS?.writeDataPoint) });
  } catch {
    return tenantError("Metricas temporariamente indisponiveis.", "METRICS_UNAVAILABLE", 503);
  }
};
