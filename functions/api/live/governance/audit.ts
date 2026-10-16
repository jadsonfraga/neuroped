/**
 * Trilha de auditoria consultável da clínica (LGPD art. 37; CFM 2.454/2026 Anexo III, I e VIII).
 * Une saas_audit_log e family_portal_audit_log, SEMPRE filtradas por clinic_id. Só gestores.
 * Não expõe conteúdo clínico: metadados já são gravados só com enums/flags/ids opacos.
 */
import { getContextUser } from "../../auth/_authorization";
import { isMissingExportTable } from "../../tenant/_exportPayload";
import { getClinicMembership, membershipCanManage, writeSaasAudit, tenantError, tenantJson, type TenantEnv } from "../../tenant/_core";

type Entry = {
  source: "clinic" | "family_portal";
  id: string;
  at: string;
  action: string;
  actorUserId: string | null;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, string | number | boolean | null>;
};

function safeMetadata(json: string | null): Entry["metadata"] {
  if (!json) return {};
  try {
    const v = JSON.parse(json);
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const out: Entry["metadata"] = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (val === null || ["string", "number", "boolean"].includes(typeof val)) out[k] = typeof val === "string" ? val.slice(0, 120) : (val as never);
    }
    return out;
  } catch {
    return {};
  }
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = { test: (v: string) => DAY_RE.test(v) && Number.isFinite(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v };

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const url = new URL(context.request.url);
  const clinicId = (url.searchParams.get("clinicId") ?? "").trim().slice(0, 80);
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  const source = url.searchParams.get("source") ?? "all";
  if (!["all", "clinic", "family_portal"].includes(source)) return tenantError("source inválido.", "VALIDATION_ERROR", 400);
  const action = (url.searchParams.get("action") ?? "").trim();
  if (action.length > 80 || !/^[a-z0-9_.-]*$/i.test(action)) return tenantError("Filtro de ação inválido.", "VALIDATION_ERROR", 400);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  if ((from && !DAY.test(from)) || (to && !DAY.test(to)) || (from && to && from > to)) return tenantError("Intervalo de datas inválido.", "VALIDATION_ERROR", 400);
  const limitRaw = Number(url.searchParams.get("limit") ?? 50);
  const limit = Number.isInteger(limitRaw) && limitRaw >= 1 ? Math.min(limitRaw, 100) : 50;

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) return tenantError("Somente gestores consultam a trilha de auditoria.", "TENANT_FORBIDDEN", 403);

  const where = (col: string, actionCol: string) => {
    let sql = `WHERE clinic_id = ?`;
    const binds: unknown[] = [clinicId];
    if (action) { sql += ` AND ${actionCol} LIKE ?`; binds.push(`%${action}%`); }
    if (from) { sql += ` AND ${col} >= ?`; binds.push(from); }
    if (to) { sql += ` AND ${col} < date(?, '+1 day')`; binds.push(to); }
    return { sql, binds };
  };

  const entries: Entry[] = [];
  try {
    if (source === "all" || source === "clinic") {
      const w = where("created_at", "action");
      const r = await db
        .prepare(`SELECT id, created_at, action, actor_user_id, target_type, target_id, metadata_json FROM saas_audit_log ${w.sql} ORDER BY created_at DESC LIMIT ?`)
        .bind(...w.binds, limit)
        .all<{ id: string; created_at: string; action: string; actor_user_id: string; target_type: string; target_id: string | null; metadata_json: string | null }>();
      for (const x of r.results ?? []) {
        entries.push({ source: "clinic", id: x.id, at: x.created_at, action: x.action, actorUserId: x.actor_user_id, targetType: x.target_type, targetId: x.target_id, metadata: safeMetadata(x.metadata_json) });
      }
    }
    if (source === "all" || source === "family_portal") {
      const w = where("created_at", "action");
      try {
        const r = await db
          .prepare(`SELECT id, created_at, action, share_id, consent_version FROM family_portal_audit_log ${w.sql} ORDER BY created_at DESC LIMIT ?`)
          .bind(...w.binds, limit)
          .all<{ id: string; created_at: string; action: string; share_id: string; consent_version: string | null }>();
        for (const x of r.results ?? []) {
          entries.push({ source: "family_portal", id: x.id, at: x.created_at, action: x.action, actorUserId: null, targetType: "family_portal_share", targetId: x.share_id, metadata: x.consent_version ? { consentVersion: x.consent_version } : {} });
        }
      } catch (error) {
        if (!isMissingExportTable(error, "family_portal_audit_log")) throw error;
      }
    }
  } catch (error) {
    console.error("[live.governance.audit.GET] DB error", error);
    return tenantError("Não foi possível consultar a trilha.", "DB_ERROR", 500);
  }
  entries.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  const page = entries.slice(0, limit);
  // A consulta à trilha também deixa rastro (best-effort; nunca falha a leitura).
  context.waitUntil?.(
    writeSaasAudit(db, { clinicId, actorUserId: user.id, action: "audit_trail_read", targetType: "audit_trail", metadata: { source, action: action || null, from: from || null, to: to || null } }).catch(() => undefined),
  );
  return tenantJson({ data: page, count: page.length, limit });
};
