import { getContextUser } from "../../auth/_authorization";
import {
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";
import { inviteEmailHash, sha256Hex } from "../../saas/_invite";

interface InviteRow {
  id: string;
  clinic_id: string;
  role: "clinic_admin" | "professional" | "assistant" | "financial";
  email_hash: string;
  expires_at: string;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!user.email) return tenantError("A sessão não possui e-mail verificável.", "EMAIL_REQUIRED", 400);

  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }

  const token = cleanText(body.token, 160);
  if (token.length < 40) return tenantError("Token de convite inválido.", "VALIDATION_ERROR", 400);
  const tokenHash = await sha256Hex(token);
  const now = new Date().toISOString();
  const invite = await db
    .prepare(
      `SELECT id, clinic_id, role, email_hash, expires_at
         FROM saas_membership_invites
        WHERE token_hash = ? AND accepted_at IS NULL AND revoked_at IS NULL
          AND expires_at > ?
        LIMIT 1`,
    )
    .bind(tokenHash, now)
    .first<InviteRow>();
  if (!invite) return tenantError("Convite inválido, expirado ou já utilizado.", "INVITE_INVALID", 404);

  const emailHash = await inviteEmailHash(context.env, invite.clinic_id, user.email.trim().toLocaleLowerCase("en-US"));
  if (emailHash !== invite.email_hash) return tenantError("O convite não pertence ao e-mail autenticado.", "INVITE_EMAIL_MISMATCH", 403);

  const clinic = await db
    .prepare(`SELECT id, name, status FROM clinics WHERE id = ? LIMIT 1`)
    .bind(invite.clinic_id)
    .first<{ id: string; name: string; status: "active" | "suspended" | "closed" }>();
  if (!clinic || clinic.status !== "active") return tenantError("A clínica não está disponível para novos acessos.", "TENANT_UNAVAILABLE", 409);

  const existing = await db
    .prepare(`SELECT active FROM clinic_memberships WHERE clinic_id = ? AND user_id = ? LIMIT 1`)
    .bind(invite.clinic_id, user.id)
    .first<{ active: number }>();
  if (existing?.active === 1) return tenantError("Você já é membro ativo desta clínica.", "MEMBERSHIP_EXISTS", 409);

  const subscription = await db
    .prepare(
      `SELECT seats FROM billing_subscriptions bs
         JOIN billing_customers bc ON bc.id = bs.customer_id
        WHERE bc.clinic_id = ? AND bs.status IN ('trial','active','past_due')
        ORDER BY bs.updated_at DESC LIMIT 1`,
    )
    .bind(invite.clinic_id)
    .first<{ seats: number | null }>();
  const seats = subscription?.seats ?? null;
  if (seats !== null) {
    const activeMembers = await db
      .prepare(`SELECT COUNT(*) AS count FROM clinic_memberships WHERE clinic_id = ? AND active = 1`)
      .bind(invite.clinic_id)
      .first<{ count: number }>();
    if (Number(activeMembers?.count ?? 0) >= seats) return tenantError("A clínica atingiu o limite de assentos.", "SEAT_LIMIT_REACHED", 409);
  }

  try {
    const results = await db.batch([
      db
        .prepare(
          `UPDATE saas_membership_invites
              SET accepted_at = ?
            WHERE id = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ?`,
        )
        .bind(now, invite.id, now),
      db
        .prepare(
          `INSERT INTO clinic_memberships
             (clinic_id, user_id, role, active, invited_by_user_id, created_at, updated_at)
           VALUES (?, ?, ?, 1, NULL, ?, ?)
           ON CONFLICT(clinic_id, user_id) DO UPDATE SET
             role = excluded.role,
             active = 1,
             updated_at = excluded.updated_at`,
        )
        .bind(invite.clinic_id, user.id, invite.role, now, now),
      prepareSaasAudit(
        db,
        {
          clinicId: invite.clinic_id,
          actorUserId: user.id,
          action: "saas_membership_invite_accept",
          targetType: "clinic_membership",
          targetId: user.id,
          metadata: { role: invite.role },
        },
        true,
      ),
    ]);
    if ((results[0]?.meta?.changes ?? 0) !== 1 || (results[1]?.meta?.changes ?? 0) !== 1 || (results[2]?.meta?.changes ?? 0) !== 1) {
      return tenantError("O convite mudou durante o aceite. Tente novamente.", "INVITE_STALE", 409);
    }
    return tenantJson({ data: { clinicId: clinic.id, clinicName: clinic.name, role: invite.role, acceptedAt: now } });
  } catch (error) {
    console.error("[tenants.invites.accept.POST] failed", error);
    return tenantError("Não foi possível aceitar o convite.", "INVITE_ACCEPT_FAILED", 500);
  }
};
