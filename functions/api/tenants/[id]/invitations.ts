import { z } from "zod";
import { getContextUser } from "../../auth/_authorization";
import { sha256Hex } from "../../auth/_crypto";
import {
  isClinicMembershipRole,
  type ClinicMembershipRole,
} from "../../../../shared/tenant";
import {
  getClinicMembership,
  membershipCanManage,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";
import { activeMemberCount, getBillingAccount } from "../../billing/_core";

interface InvitationEnv extends TenantEnv {
  CANONICAL_APP_URL?: string;
}

const invitationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(["owner", "clinic_admin", "professional", "assistant", "financial"]),
}).strict();

const GLOBAL_CLINICAL_ROLES = new Set(["admin", "professional"]);
const TENANT_CLINICAL_ROLES = new Set<ClinicMembershipRole>([
  "owner",
  "clinic_admin",
  "professional",
]);

function clinicIdFrom(params: Record<string, string | string[]>): string {
  const raw = params.id;
  return String(Array.isArray(raw) ? raw[0] : (raw ?? "")).trim().slice(0, 80);
}

function canonicalOrigin(value: string | undefined): string {
  const fallback = "https://neuroped.pages.dev";
  try {
    const url = new URL(value?.trim() || fallback);
    if (url.protocol !== "https:") return fallback;
    if (!["neuroped.pages.dev", "superneuroped.vercel.app"].includes(url.hostname)) return fallback;
    return url.origin;
  } catch {
    return fallback;
  }
}

function createRawToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function managerContext(context: Parameters<PagesFunction<InvitationEnv>>[0]) {
  const db = context.env.DB;
  const user = getContextUser(context);
  const clinicId = clinicIdFrom(context.params as Record<string, string | string[]>);
  if (!db) return { error: tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503) } as const;
  if (!user) return { error: tenantError("Não autenticado.", "UNAUTHENTICATED", 401) } as const;
  if (!clinicId) return { error: tenantError("Clínica inválida.", "VALIDATION_ERROR", 400) } as const;
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return { error: tenantError("Apenas gestores podem administrar convites.", "TENANT_FORBIDDEN", 403) } as const;
  }
  return { db, user, clinicId, membership } as const;
}

function seatLimitError(error: unknown): boolean {
  return (error instanceof Error ? error.message : String(error)).includes("SEAT_LIMIT_REACHED");
}

export const onRequestGet: PagesFunction<InvitationEnv> = async (context) => {
  const auth = await managerContext(context);
  if ("error" in auth) return auth.error;
  const now = new Date().toISOString();
  const rows = await auth.db.prepare(
    `SELECT id, email, role, expires_at, created_at
       FROM clinic_invitations
      WHERE clinic_id = ? AND accepted_at IS NULL AND revoked_at IS NULL
        AND datetime(expires_at) > datetime(?)
      ORDER BY created_at DESC`,
  ).bind(auth.clinicId, now).all<{
    id: string;
    email: string;
    role: ClinicMembershipRole;
    expires_at: string;
    created_at: string;
  }>();
  return tenantJson({
    data: (rows.results ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    })),
  });
};

export const onRequestPost: PagesFunction<InvitationEnv> = async (context) => {
  const auth = await managerContext(context);
  if ("error" in auth) return auth.error;
  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  const parsed = invitationSchema.safeParse(body);
  if (!parsed.success || !isClinicMembershipRole(parsed.data?.role)) {
    return tenantError("E-mail e papel válidos são obrigatórios.", "VALIDATION_ERROR", 400);
  }
  const { email, role } = parsed.data;
  if (role === "owner" && auth.membership.role !== "owner") {
    return tenantError("Somente owner pode convidar outro owner.", "TENANT_FORBIDDEN", 403);
  }

  const [account, activeMembers, target] = await Promise.all([
    getBillingAccount(auth.db, auth.clinicId),
    activeMemberCount(auth.db, auth.clinicId),
    auth.db.prepare(
      `SELECT u.id, u.role AS global_role,
              COALESCE(m.active, 0) AS membership_active
         FROM users u
         LEFT JOIN clinic_memberships m ON m.user_id = u.id AND m.clinic_id = ?
        WHERE lower(u.email) = ? AND u.is_active = 1
        LIMIT 1`,
    ).bind(auth.clinicId, email).first<{
      id: string;
      global_role: string;
      membership_active: number;
    }>(),
  ]);
  if (!account) return tenantError("Conta comercial ausente.", "BILLING_ACCOUNT_MISSING", 409);
  if (activeMembers >= account.seat_quantity) {
    return tenantError("Todos os assentos estão ocupados.", "SEAT_LIMIT_REACHED", 402);
  }
  if (target?.membership_active) {
    return tenantError("Esta pessoa já faz parte da clínica.", "MEMBERSHIP_ALREADY_ACTIVE", 409);
  }
  if (target && TENANT_CLINICAL_ROLES.has(role) && !GLOBAL_CLINICAL_ROLES.has(target.global_role)) {
    return tenantError("A conta existente não permite o papel clínico escolhido.", "GLOBAL_ROLE_INCOMPATIBLE", 409);
  }

  const invitationId = crypto.randomUUID();
  const rawToken = createRawToken();
  const tokenHash = await sha256Hex(rawToken);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000).toISOString();
  try {
    const results = await auth.db.batch([
      auth.db.prepare(
        `UPDATE clinic_invitations SET revoked_at = ?
          WHERE clinic_id = ? AND lower(email) = ?
            AND accepted_at IS NULL AND revoked_at IS NULL
            AND datetime(expires_at) <= datetime(?)`,
      ).bind(now, auth.clinicId, email, now),
      auth.db.prepare(
        `INSERT INTO clinic_invitations
          (id, clinic_id, email, role, token_hash, invited_by_user_id,
           expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(invitationId, auth.clinicId, email, role, tokenHash, auth.user.id, expiresAt, now),
      prepareSaasAudit(auth.db, {
        clinicId: auth.clinicId,
        actorUserId: auth.user.id,
        action: "clinic_invitation_create",
        targetType: "clinic_invitation",
        targetId: invitationId,
        metadata: { role, existingAccount: Boolean(target) },
      }, true),
    ]);
    if (Number(results[1]?.meta?.changes ?? 0) !== 1 || Number(results[2]?.meta?.changes ?? 0) !== 1) {
      return tenantError("O convite mudou durante a operação.", "INVITATION_STALE", 409);
    }
  } catch (error) {
    if (seatLimitError(error)) {
      return tenantError("Assentos ativos e reservados já atingiram o limite do plano.", "SEAT_LIMIT_REACHED", 402);
    }
    if (/unique|constraint/i.test(error instanceof Error ? error.message : String(error))) {
      return tenantError("Já existe um convite pendente para este e-mail.", "INVITATION_ALREADY_PENDING", 409);
    }
    console.error("[tenant.invitations.POST] DB error", error);
    return tenantError("Não foi possível criar o convite.", "DB_ERROR", 500);
  }

  const url = `${canonicalOrigin(context.env.CANONICAL_APP_URL)}/#/aceitar-convite?token=${encodeURIComponent(rawToken)}`;
  return tenantJson({
    id: invitationId,
    email,
    role,
    expiresAt,
    existingAccount: Boolean(target),
    url,
  }, 201);
};

export const onRequestDelete: PagesFunction<InvitationEnv> = async (context) => {
  const auth = await managerContext(context);
  if ("error" in auth) return auth.error;
  const invitationId = new URL(context.request.url).searchParams.get("invitationId")?.trim().slice(0, 80) ?? "";
  if (!invitationId) return tenantError("invitationId é obrigatório.", "VALIDATION_ERROR", 400);
  const now = new Date().toISOString();
  const results = await auth.db.batch([
    auth.db.prepare(
      `UPDATE clinic_invitations SET revoked_at = ?
        WHERE id = ? AND clinic_id = ? AND accepted_at IS NULL AND revoked_at IS NULL`,
    ).bind(now, invitationId, auth.clinicId),
    prepareSaasAudit(auth.db, {
      clinicId: auth.clinicId,
      actorUserId: auth.user.id,
      action: "clinic_invitation_revoke",
      targetType: "clinic_invitation",
      targetId: invitationId,
    }, true),
  ]);
  if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) {
    return tenantError("Convite pendente não encontrado.", "INVITATION_NOT_FOUND", 404);
  }
  return tenantJson({ ok: true });
};
