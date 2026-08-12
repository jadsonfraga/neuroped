import { getContextUser } from "../../auth/_authorization";
import {
  isClinicMembershipRole,
  type ClinicMembershipRole,
} from "../../../../shared/tenant";
import {
  getClinicMembership,
  membershipCanManage,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";

function clinicIdFrom(params: Record<string, string | string[]>): string {
  const raw = params.id;
  return String(Array.isArray(raw) ? raw[0] : (raw ?? "")).trim().slice(0, 80);
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isLastOwnerError(error: unknown): boolean {
  return /LAST_OWNER_PROTECTED/.test(error instanceof Error ? error.message : String(error));
}

type ManagerContextInput = {
  env: TenantEnv;
  data?: unknown;
  params: Record<string, string | string[]>;
};

async function managerContext(context: ManagerContextInput) {
  const db = context.env.DB;
  const user = getContextUser(context);
  const clinicId = clinicIdFrom(context.params);
  if (!db) return { error: tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503) } as const;
  if (!user) return { error: tenantError("Não autenticado.", "UNAUTHENTICATED", 401) } as const;
  if (!clinicId) return { error: tenantError("Clínica inválida.", "VALIDATION_ERROR", 400) } as const;
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return { error: tenantError("Apenas gestores da clínica podem administrar a equipe.", "TENANT_FORBIDDEN", 403) } as const;
  }
  return { db, user, clinicId, membership } as const;
}

function contextForManager(context: Parameters<PagesFunction<TenantEnv>>[0]): ManagerContextInput {
  return {
    env: context.env,
    data: context.data,
    params: context.params as Record<string, string | string[]>,
  };
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const auth = await managerContext(contextForManager(context));
  if ("error" in auth) return auth.error;

  const rows = await auth.db
    .prepare(
      `SELECT m.user_id, m.role, m.active, m.created_at, m.updated_at,
              u.name, u.email, u.role AS global_role
         FROM clinic_memberships m
         JOIN users u ON u.id = m.user_id
        WHERE m.clinic_id = ?
        ORDER BY m.active DESC, u.name COLLATE NOCASE`,
    )
    .bind(auth.clinicId)
    .all<{
      user_id: string;
      role: string;
      active: number;
      created_at: string;
      updated_at: string;
      name: string;
      email: string | null;
      global_role: string;
    }>();

  return tenantJson({
    data: (rows.results ?? []).map((row) => ({
      userId: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
      active: Boolean(row.active),
      globalRole: row.global_role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  });
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const auth = await managerContext(contextForManager(context));
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }

  const email = cleanText(body.email, 254).toLocaleLowerCase("pt-BR");
  const roleRaw = cleanText(body.role, 40);
  if (!email || !isClinicMembershipRole(roleRaw)) {
    return tenantError("E-mail e role tenant válidos são obrigatórios.", "VALIDATION_ERROR", 400);
  }
  const role: ClinicMembershipRole = roleRaw;
  if (role === "owner" && auth.membership.role !== "owner") {
    return tenantError("Somente owner pode conceder papel owner.", "TENANT_FORBIDDEN", 403);
  }

  const target = await auth.db
    .prepare(`SELECT id, name, email FROM users WHERE lower(email) = ? AND is_active = 1 LIMIT 1`)
    .bind(email)
    .first<{ id: string; name: string; email: string }>();
  if (!target) {
    return tenantError(
      "Usuário ainda não possui conta NeuroPed. O fluxo de convite por e-mail será adicionado antes do piloto.",
      "USER_NOT_REGISTERED",
      404,
    );
  }

  const existing = await auth.db
    .prepare(
      `SELECT role, active
         FROM clinic_memberships
        WHERE clinic_id = ? AND user_id = ?
        LIMIT 1`,
    )
    .bind(auth.clinicId, target.id)
    .first<{ role: ClinicMembershipRole; active: number }>();

  const demotingActiveOwner = Boolean(
    existing?.active && existing.role === "owner" && role !== "owner",
  );
  if (demotingActiveOwner && auth.membership.role !== "owner") {
    return tenantError("Somente owner pode retirar o papel owner.", "TENANT_FORBIDDEN", 403);
  }

  const now = new Date().toISOString();
  const auditId = crypto.randomUUID();
  const membershipStatement = demotingActiveOwner
    ? auth.db
        .prepare(
          `UPDATE clinic_memberships
              SET role = ?, active = 1, invited_by_user_id = ?, updated_at = ?
            WHERE clinic_id = ? AND user_id = ? AND active = 1 AND role = 'owner'`,
        )
        .bind(role, auth.user.id, now, auth.clinicId, target.id)
    : auth.db
        .prepare(
          `INSERT INTO clinic_memberships
            (clinic_id, user_id, role, active, invited_by_user_id, created_at, updated_at)
           VALUES (?, ?, ?, 1, ?, ?, ?)
           ON CONFLICT(clinic_id, user_id) DO UPDATE SET
             role = excluded.role,
             active = 1,
             invited_by_user_id = excluded.invited_by_user_id,
             updated_at = excluded.updated_at`,
        )
        .bind(auth.clinicId, target.id, role, auth.user.id, now, now);

  try {
    const results = await auth.db.batch([
      membershipStatement,
      auth.db
        .prepare(
          `INSERT INTO saas_audit_log
            (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
           VALUES (?, ?, ?, 'clinic_membership_upsert', 'user', ?, ?, ?)`,
        )
        .bind(
          auditId,
          auth.clinicId,
          auth.user.id,
          target.id,
          JSON.stringify({ role }),
          now,
        ),
    ]);
    if (Number(results[0]?.meta?.changes ?? 0) < 1) {
      return tenantError("Membership mudou durante a operação. Recarregue e tente novamente.", "MEMBERSHIP_STALE", 409);
    }
  } catch (error) {
    if (isLastOwnerError(error)) {
      return tenantError("A clínica deve manter pelo menos um owner ativo.", "LAST_OWNER_PROTECTED", 409);
    }
    console.error("[tenants.members.POST] DB error", error);
    return tenantError("Não foi possível atualizar a equipe.", "DB_ERROR", 500);
  }

  return tenantJson(
    {
      userId: target.id,
      name: target.name,
      email: target.email,
      role,
      active: true,
    },
    201,
  );
};

export const onRequestDelete: PagesFunction<TenantEnv> = async (context) => {
  const auth = await managerContext(contextForManager(context));
  if ("error" in auth) return auth.error;

  const url = new URL(context.request.url);
  const targetUserId = cleanText(url.searchParams.get("userId"), 80);
  if (!targetUserId) return tenantError("userId é obrigatório.", "VALIDATION_ERROR", 400);

  const targetMembership = await auth.db
    .prepare(`SELECT role, active FROM clinic_memberships WHERE clinic_id = ? AND user_id = ? LIMIT 1`)
    .bind(auth.clinicId, targetUserId)
    .first<{ role: ClinicMembershipRole; active: number }>();
  if (!targetMembership || !targetMembership.active) {
    return tenantError("Membership ativa não encontrada.", "MEMBERSHIP_NOT_FOUND", 404);
  }
  if (targetMembership.role === "owner" && auth.membership.role !== "owner") {
    return tenantError("Somente owner pode remover outro owner.", "TENANT_FORBIDDEN", 403);
  }

  const now = new Date().toISOString();
  const auditId = crypto.randomUUID();
  try {
    const results = await auth.db.batch([
      auth.db
        .prepare(
          `UPDATE clinic_memberships
              SET active = 0, updated_at = ?
            WHERE clinic_id = ? AND user_id = ? AND active = 1`,
        )
        .bind(now, auth.clinicId, targetUserId),
      auth.db
        .prepare(
          `INSERT INTO saas_audit_log
            (id, clinic_id, actor_user_id, action, target_type, target_id, created_at)
           SELECT ?, ?, ?, 'clinic_membership_deactivate', 'user', ?, ?
            WHERE EXISTS (
              SELECT 1 FROM clinic_memberships
               WHERE clinic_id = ? AND user_id = ? AND active = 0 AND updated_at = ?
            )`,
        )
        .bind(
          auditId,
          auth.clinicId,
          auth.user.id,
          targetUserId,
          now,
          auth.clinicId,
          targetUserId,
          now,
        ),
    ]);
    if (Number(results[0]?.meta?.changes ?? 0) < 1) {
      return tenantError("Membership mudou durante a operação. Recarregue e tente novamente.", "MEMBERSHIP_STALE", 409);
    }
  } catch (error) {
    if (isLastOwnerError(error)) {
      return tenantError("A clínica deve manter pelo menos um owner ativo.", "LAST_OWNER_PROTECTED", 409);
    }
    console.error("[tenants.members.DELETE] DB error", error);
    return tenantError("Não foi possível desativar a membership.", "DB_ERROR", 500);
  }

  return tenantJson({ ok: true });
};
