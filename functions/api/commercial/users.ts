import { getContextUser } from "../auth/_authorization";
import {
  getClinicMembership, membershipCanManage, prepareSaasAudit, tenantError, tenantJson,
} from "../tenant/_core";
import { commercialContractError, getCommercialLicenseSnapshot } from "./_core";

interface CommercialUsersEnv { DB?: D1Database; }
interface SeatRow {
  user_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  membership_active: number;
  seat_status: "active" | "revoked" | null;
}
function cleanId(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

/** Gestão por owner/clinic_admin ativo da própria unidade, nunca por papel global. */
async function resolveManagerContext(db: D1Database, clinicId: string, context: { data?: unknown }) {
  const user = getContextUser(context);
  if (!user) return { ok: false as const, response: tenantError("Não autenticado.", "UNAUTHENTICATED", 401) };
  if (!clinicId) return { ok: false as const, response: tenantError("clinicId é obrigatório.", "COMMERCIAL_CLINIC_REQUIRED", 400) };
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return { ok: false as const, response: tenantError("Somente a gestão da unidade administra os usuários da licença.", "COMMERCIAL_MANAGER_REQUIRED", 403) };
  }
  const snapshot = await getCommercialLicenseSnapshot(db, clinicId);
  const contractError = commercialContractError(snapshot);
  if (contractError) return { ok: false as const, response: contractError };
  if (!snapshot) return { ok: false as const, response: tenantError("Esta unidade não possui licença comercial.", "COMMERCIAL_LICENSE_MISSING", 403) };
  return { ok: true as const, user, membership, snapshot };
}

/**
 * Lista candidatos ativos E assentos ainda ocupados por ex-membros.
 * Não ocultar alocações que continuam consumindo o limite contratual. O gestor
 * pode revogá-las; um vínculo inativo nunca vira candidato a nova concessão.
 */
export const onRequestGet: PagesFunction<CommercialUsersEnv> = async (context) => {
  const db = context.env.DB;
  if (!db) return tenantError("Camada comercial indisponível.", "COMMERCIAL_DB_UNAVAILABLE", 503);
  const clinicId = (new URL(context.request.url).searchParams.get("clinicId") ?? "").trim().slice(0, 80);
  const resolved = await resolveManagerContext(db, clinicId, context);
  if (!resolved.ok) return resolved.response;
  const { snapshot } = resolved;
  const rows = await db.prepare(
    `SELECT u.id AS user_id, u.name, u.email, m.role,
            COALESCE(m.active, 0) AS membership_active, clu.status AS seat_status
       FROM users u
       LEFT JOIN clinic_memberships m ON m.user_id = u.id AND m.clinic_id = ?
       LEFT JOIN commercial_license_users clu ON clu.user_id = u.id AND clu.license_id = ?
      WHERE m.active = 1 OR clu.status = 'active'
      ORDER BY u.name COLLATE NOCASE`,
  ).bind(clinicId, snapshot.licenseId).all<SeatRow>();
  const members = (rows.results ?? []).map((row) => ({
    userId: row.user_id,
    name: row.name,
    email: row.email,
    // A UI existente já exibe role ao lado do membro; a saída não fica invisível.
    role: Number(row.membership_active) === 1 ? row.role ?? "member" : "vínculo inativo — revogar assento",
    membershipActive: Number(row.membership_active) === 1,
    authorized: row.seat_status === "active",
  }));
  return tenantJson({
    licenseId: snapshot.licenseId, licenseStatus: snapshot.status,
    maxAuthorizedUsers: snapshot.maxAuthorizedUsers,
    authorizedUsers: members.filter((member) => member.authorized).length,
    members,
  });
};

/** Concede assento exclusivamente a um membro ativo; o banco impõe o limite. */
export const onRequestPost: PagesFunction<CommercialUsersEnv> = async (context) => {
  const db = context.env.DB;
  if (!db) return tenantError("Camada comercial indisponível.", "COMMERCIAL_DB_UNAVAILABLE", 503);
  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    body = parsed as Record<string, unknown>;
  } catch { return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400); }
  const clinicId = cleanId(body.clinicId);
  const targetUserId = cleanId(body.userId);
  const resolved = await resolveManagerContext(db, clinicId, context);
  if (!resolved.ok) return resolved.response;
  if (!targetUserId) return tenantError("userId é obrigatório.", "COMMERCIAL_USER_REQUIRED", 400);
  const { user, snapshot } = resolved;
  const target = await db.prepare(
    `SELECT clu.status AS seat_status FROM clinic_memberships m
       LEFT JOIN commercial_license_users clu ON clu.license_id = ? AND clu.user_id = m.user_id
      WHERE m.clinic_id = ? AND m.user_id = ? AND m.active = 1 LIMIT 1`,
  ).bind(snapshot.licenseId, clinicId, targetUserId).first<{ seat_status: "active" | "revoked" | null }>();
  if (!target) return tenantError("O usuário precisa ser membro ativo da unidade.", "COMMERCIAL_AUTHORIZED_USER_NOT_MEMBER", 409);
  if (target.seat_status === "active") return tenantJson({ licenseId: snapshot.licenseId, userId: targetUserId, authorized: true });
  if (snapshot.authorizedUsers >= snapshot.maxAuthorizedUsers) {
    return tenantError(`A licença permite no máximo ${snapshot.maxAuthorizedUsers} usuários autorizados.`, "COMMERCIAL_AUTHORIZED_USER_LIMIT_REACHED", 409);
  }
  const grant = target.seat_status === "revoked"
    ? db.prepare(`UPDATE commercial_license_users SET status = 'active', revoked_at = NULL,
          authorized_by_user_id = ?, authorized_at = datetime('now')
        WHERE license_id = ? AND user_id = ? AND status = 'revoked'`).bind(user.id, snapshot.licenseId, targetUserId)
    : db.prepare(`INSERT INTO commercial_license_users (license_id, user_id, status, authorized_by_user_id)
        VALUES (?, ?, 'active', ?)`).bind(snapshot.licenseId, targetUserId, user.id);
  try {
    const [grantResult] = await db.batch([
      grant,
      db.prepare(`INSERT INTO commercial_usage_events (id, clinic_id, license_id, actor_user_id, kind)
        SELECT ?, ?, ?, ?, 'authorized_user_added' WHERE changes() = 1`).bind(crypto.randomUUID(), clinicId, snapshot.licenseId, user.id),
      prepareSaasAudit(db, {
        clinicId, actorUserId: user.id, action: "commercial_authorized_user_added",
        targetType: "commercial_license_user", targetId: targetUserId, metadata: { licenseId: snapshot.licenseId },
      }, true),
    ]);
    if (!grantResult.meta?.changes) return tenantError("Não foi possível autorizar o usuário.", "COMMERCIAL_AUTHORIZE_FAILED", 409);
  } catch (error) {
    console.error("[commercial.users] authorize error", error);
    return tenantError("Não foi possível autorizar o usuário.", "COMMERCIAL_AUTHORIZE_FAILED", 409);
  }
  return tenantJson({ licenseId: snapshot.licenseId, userId: targetUserId, authorized: true });
};

/** Revoga inclusive assento de ex-membro. O último assento é protegido pelo D1. */
export const onRequestDelete: PagesFunction<CommercialUsersEnv> = async (context) => {
  const db = context.env.DB;
  if (!db) return tenantError("Camada comercial indisponível.", "COMMERCIAL_DB_UNAVAILABLE", 503);
  const url = new URL(context.request.url);
  const clinicId = (url.searchParams.get("clinicId") ?? "").trim().slice(0, 80);
  const targetUserId = (url.searchParams.get("userId") ?? "").trim().slice(0, 80);
  const resolved = await resolveManagerContext(db, clinicId, context);
  if (!resolved.ok) return resolved.response;
  if (!targetUserId) return tenantError("userId é obrigatório.", "COMMERCIAL_USER_REQUIRED", 400);
  const { user, snapshot } = resolved;
  // Não decidir pelo COUNT do snapshot: o trigger decide dentro do batch.
  try {
    const [revokeResult] = await db.batch([
      db.prepare(`UPDATE commercial_license_users SET status = 'revoked', revoked_at = datetime('now')
        WHERE license_id = ? AND user_id = ? AND status = 'active'`).bind(snapshot.licenseId, targetUserId),
      db.prepare(`INSERT INTO commercial_usage_events (id, clinic_id, license_id, actor_user_id, kind)
        SELECT ?, ?, ?, ?, 'authorized_user_revoked' WHERE changes() = 1`).bind(crypto.randomUUID(), clinicId, snapshot.licenseId, user.id),
      prepareSaasAudit(db, {
        clinicId, actorUserId: user.id, action: "commercial_authorized_user_revoked",
        targetType: "commercial_license_user", targetId: targetUserId, metadata: { licenseId: snapshot.licenseId },
      }, true),
    ]);
    if (!revokeResult.meta?.changes) return tenantError("Usuário não está autorizado nesta licença.", "COMMERCIAL_SEAT_NOT_FOUND", 404);
  } catch (error) {
    const detail = error instanceof Error ? `${error.message} ${String(error.cause ?? "")}` : String(error);
    if (detail.includes("COMMERCIAL_LAST_AUTHORIZED_USER")) {
      return tenantError("A licença precisa manter ao menos um usuário autorizado.", "COMMERCIAL_LAST_AUTHORIZED_USER", 409);
    }
    console.error("[commercial.users] revoke error", error);
    return tenantError("Não foi possível revogar o usuário.", "COMMERCIAL_REVOKE_FAILED", 409);
  }
  return tenantJson({ licenseId: snapshot.licenseId, userId: targetUserId, authorized: false });
};
