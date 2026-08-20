import { z } from "zod";
import { hashPassword, sha256Hex, verifyPassword } from "./_crypto";
import {
  isLocked,
  json,
  registerFailedAttempt,
  type Env,
} from "./_shared";
import { strongPasswordSchema } from "./_passwordPolicy";
import {
  isClinicMembershipRole,
  type ClinicMembershipRole,
} from "../../../shared/tenant";
import { prepareSaasAudit } from "../tenant/_core";

const tokenPattern = /^[A-Za-z0-9_-]{40,128}$/;
const acceptSchema = z.object({
  token: z.string().regex(tokenPattern),
  name: z.string().trim().min(2).max(160).optional(),
  password: z.string().min(1).max(1_024),
}).strict();

interface InvitationRow {
  id: string;
  clinic_id: string;
  clinic_name: string;
  email: string;
  role: ClinicMembershipRole;
  invited_by_user_id: string;
  expires_at: string;
  existing_user_id: string | null;
  existing_name: string | null;
  existing_global_role: string | null;
  existing_password_hash: string | null;
  existing_is_active: number | null;
  existing_locked_until: string | null;
  existing_failed_attempts: number | null;
}

async function findInvitation(
  db: D1Database,
  rawToken: string,
  now: string,
): Promise<InvitationRow | null> {
  const tokenHash = await sha256Hex(rawToken);
  const row = await db.prepare(
    `SELECT i.id, i.clinic_id, c.name AS clinic_name, i.email, i.role,
            i.invited_by_user_id, i.expires_at,
            u.id AS existing_user_id, u.name AS existing_name,
            u.role AS existing_global_role, u.password_hash AS existing_password_hash,
            u.is_active AS existing_is_active, u.locked_until AS existing_locked_until,
            u.failed_login_attempts AS existing_failed_attempts
       FROM clinic_invitations i
       JOIN clinics c ON c.id = i.clinic_id AND c.status = 'active'
       LEFT JOIN users u ON lower(u.email) = lower(i.email)
      WHERE i.token_hash = ? AND i.accepted_at IS NULL AND i.revoked_at IS NULL
        AND datetime(i.expires_at) > datetime(?)
      LIMIT 1`,
  ).bind(tokenHash, now).first<InvitationRow>();
  if (!row || !isClinicMembershipRole(row.role)) return null;
  return row;
}

function invitedUserSnapshot(row: InvitationRow) {
  if (!row.existing_user_id) return null;
  return {
    id: row.existing_user_id,
    name: row.existing_name ?? "",
    email: row.email,
    role: row.existing_global_role ?? "reader",
    is_active: row.existing_is_active ?? 0,
    password_hash: row.existing_password_hash,
    must_change_password: 0,
    failed_login_attempts: row.existing_failed_attempts ?? 0,
    locked_until: row.existing_locked_until,
  };
}

function globalRoleFor(role: ClinicMembershipRole): "professional" | "reader" {
  return role === "owner" || role === "clinic_admin" || role === "professional"
    ? "professional"
    : "reader";
}

function roleCompatible(globalRole: string, tenantRole: ClinicMembershipRole): boolean {
  if (!["owner", "clinic_admin", "professional"].includes(tenantRole)) return true;
  return globalRole === "admin" || globalRole === "professional";
}

function seatLimitError(error: unknown): boolean {
  return (error instanceof Error ? error.message : String(error)).includes("SEAT_LIMIT_REACHED");
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  if (!db) return json({ error: "Banco indisponível.", code: "DB_UNAVAILABLE" }, 503);
  const token = new URL(context.request.url).searchParams.get("token")?.trim() ?? "";
  if (!tokenPattern.test(token)) {
    return json({ error: "Convite inválido ou expirado.", code: "INVITATION_NOT_AVAILABLE" }, 404);
  }
  const row = await findInvitation(db, token, new Date().toISOString());
  if (!row) return json({ error: "Convite inválido ou expirado.", code: "INVITATION_NOT_AVAILABLE" }, 404);
  return json({
    email: row.email,
    clinicName: row.clinic_name,
    role: row.role,
    expiresAt: row.expires_at,
    existingAccount: Boolean(row.existing_user_id),
    existingName: row.existing_name,
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  if (!db) return json({ error: "Banco indisponível.", code: "DB_UNAVAILABLE" }, 503);
  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Corpo JSON inválido.", code: "INVALID_JSON" }, 400);
  }
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Dados do convite inválidos.", code: "VALIDATION_ERROR" }, 400);
  }
  const now = new Date().toISOString();
  const row = await findInvitation(db, parsed.data.token, now);
  if (!row) return json({ error: "Convite inválido ou expirado.", code: "INVITATION_NOT_AVAILABLE" }, 404);

  const existing = invitedUserSnapshot(row);
  let userId: string;
  let userName: string;
  let globalRole: "professional" | "reader" | "admin" | "operator";
  let newPasswordHash: string | null = null;
  if (existing) {
    if (
      !existing.is_active
      || !existing.password_hash
      || isLocked(existing)
      || !(await verifyPassword(parsed.data.password, existing.password_hash))
    ) {
      if (existing.is_active && existing.password_hash && !isLocked(existing)) {
        await registerFailedAttempt(db, existing);
      }
      return json({ error: "Convite ou credenciais inválidos.", code: "INVITE_CREDENTIALS_INVALID" }, 401);
    }
    if (!roleCompatible(existing.role, row.role)) {
      return json({ error: "A conta não permite o papel clínico deste convite.", code: "GLOBAL_ROLE_INCOMPATIBLE" }, 409);
    }
    userId = existing.id;
    userName = existing.name;
    globalRole = existing.role as typeof globalRole;
  } else {
    const strongPassword = strongPasswordSchema.safeParse(parsed.data.password);
    if (!parsed.data.name || !strongPassword.success) {
      return json({
        error: "Nome e senha forte são obrigatórios para criar a conta.",
        code: "PASSWORD_POLICY_FAILED",
        details: strongPassword.success ? [] : strongPassword.error.issues,
      }, 400);
    }
    userId = crypto.randomUUID();
    userName = parsed.data.name;
    globalRole = globalRoleFor(row.role);
    newPasswordHash = await hashPassword(strongPassword.data);
  }

  const tokenHash = await sha256Hex(parsed.data.token);
  const statements: D1PreparedStatement[] = [];
  if (newPasswordHash) {
    statements.push(db.prepare(
      `INSERT INTO users
        (id, name, email, role, is_active, password_hash, must_change_password,
         failed_login_attempts, created_at, updated_at)
       SELECT ?, ?, ?, ?, 1, ?, 0, 0, ?, ?
        WHERE EXISTS (
          SELECT 1 FROM clinic_invitations
           WHERE id = ? AND token_hash = ? AND accepted_at IS NULL AND revoked_at IS NULL
             AND datetime(expires_at) > datetime(?)
        )`,
    ).bind(
      userId, userName, row.email.toLowerCase(), globalRole, newPasswordHash,
      now, now, row.id, tokenHash, now,
    ));
  }
  statements.push(
    db.prepare(
      `UPDATE clinic_invitations
          SET accepted_at = ?, accepted_user_id = ?
        WHERE id = ? AND token_hash = ? AND accepted_at IS NULL AND revoked_at IS NULL
          AND datetime(expires_at) > datetime(?)`,
    ).bind(now, userId, row.id, tokenHash, now),
    db.prepare(
      `INSERT INTO clinic_memberships
        (clinic_id, user_id, role, active, invited_by_user_id, created_at, updated_at)
       SELECT clinic_id, ?, role, 1, invited_by_user_id, ?, ?
         FROM clinic_invitations
        WHERE id = ? AND token_hash = ? AND accepted_user_id = ? AND accepted_at = ?
          AND revoked_at IS NULL AND changes() = 1
       ON CONFLICT(clinic_id, user_id) DO UPDATE SET
         role = excluded.role, active = 1,
         invited_by_user_id = excluded.invited_by_user_id,
         updated_at = excluded.updated_at`,
    ).bind(userId, now, now, row.id, tokenHash, userId, now),
    prepareSaasAudit(db, {
      clinicId: row.clinic_id,
      actorUserId: userId,
      action: "clinic_invitation_accept",
      targetType: "clinic_invitation",
      targetId: row.id,
      metadata: { role: row.role, newAccount: !existing },
    }, true),
  );

  try {
    const results = await db.batch(statements);
    if (results.some((result) => Number(result.meta?.changes ?? 0) !== 1)) {
      return json({ error: "Convite já utilizado ou alterado.", code: "INVITATION_STALE" }, 409);
    }
  } catch (error) {
    if (seatLimitError(error)) {
      return json({ error: "O assento reservado não está mais disponível.", code: "SEAT_LIMIT_REACHED" }, 402);
    }
    if (/unique|constraint/i.test(error instanceof Error ? error.message : String(error))) {
      return json({ error: "A conta mudou durante a aceitação. Entre ou tente novamente.", code: "ACCOUNT_STATE_CHANGED" }, 409);
    }
    console.error("[auth.invite] atomic acceptance failed", error);
    return json({ error: "Não foi possível aceitar o convite.", code: "AUTH_UNAVAILABLE" }, 503);
  }

  return json({
    ok: true,
    email: row.email,
    clinicName: row.clinic_name,
    accountCreated: !existing,
    loginRequired: true,
  }, 201);
};
