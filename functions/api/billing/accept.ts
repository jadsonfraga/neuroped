import { hashPassword } from "../auth/_crypto";
import { getUserByEmail } from "../auth/_shared";
import { hashInvitationToken, readInvitationByHash, assertUsableInvitation } from "./_onboarding";
import { isClinicMembershipRole } from "../../../shared/tenant";

interface Env {
  DB?: D1Database;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) return json({ error: "Banco SaaS indisponível.", code: "DB_REQUIRED" }, 503);

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "Corpo JSON inválido.", code: "INVALID_JSON" }, 400);
  }

  const token = text(body.token, 300);
  const name = text(body.name, 160);
  const password = text(body.password, 200);
  if (token.length < 32) return json({ error: "Convite inválido.", code: "INVITATION_INVALID" }, 400);

  const hash = await hashInvitationToken(token);
  const invitation = await readInvitationByHash(env.DB, hash);
  try {
    assertUsableInvitation(invitation, new Date());
  } catch (error) {
    return json({ error: "Convite expirado, revogado ou já utilizado.", code: String(error) }, 409);
  }
  if (!invitation || !isClinicMembershipRole(invitation.role)) {
    return json({ error: "Convite inválido.", code: "INVITATION_INVALID" }, 409);
  }

  const billing = await env.DB.prepare(
    `SELECT bc.status, COALESCE(bs.seats, 0) AS seats,
            (SELECT COUNT(*) FROM clinic_memberships cm WHERE cm.clinic_id = bc.clinic_id AND cm.active = 1) AS active_members
       FROM billing_customers bc
       LEFT JOIN billing_subscriptions bs
         ON bs.billing_customer_id = bc.id
        AND bs.status IN ('trialing','active','past_due','paused')
      WHERE bc.clinic_id = ? LIMIT 1`,
  ).bind(invitation.clinic_id).first<{ status: string; seats: number; active_members: number }>();

  if (!billing || !["trial", "active"].includes(billing.status)) {
    return json({ error: "Clínica sem entitlement para aceitar novos membros.", code: "BILLING_ENTITLEMENT_DENIED" }, 402);
  }
  if (Number(billing.active_members) >= Number(billing.seats)) {
    return json({ error: "Limite de assentos atingido.", code: "SEAT_LIMIT_REACHED" }, 409);
  }

  const existing = await getUserByEmail(env.DB, invitation.email);
  let userId = existing?.id ?? "";
  let passwordHash: string | null = null;

  if (!existing) {
    if (name.length < 2 || password.length < 10) {
      return json(
        { error: "Nome e senha de ao menos 10 caracteres são obrigatórios para criar a conta.", code: "ACCOUNT_DATA_REQUIRED" },
        400,
      );
    }
    userId = crypto.randomUUID();
    passwordHash = await hashPassword(password);
  }

  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [];

  if (!existing) {
    const globalRole = ["owner", "clinic_admin", "professional"].includes(invitation.role)
      ? "professional"
      : "assistant";
    statements.push(
      env.DB.prepare(
        `INSERT INTO users
          (id, name, email, role, is_active, auth_provider, password_hash, must_change_password,
           failed_login_attempts, created_at, updated_at)
         SELECT ?, ?, ?, ?, 1, 'local', ?, 0, 0, ?, ?
          WHERE EXISTS (
            SELECT 1 FROM clinic_invitations
             WHERE id = ? AND token_hash = ?
               AND accepted_at IS NULL AND revoked_at IS NULL
               AND julianday(expires_at) > julianday(?)
          )`,
      ).bind(
        userId,
        name,
        invitation.email,
        globalRole,
        passwordHash,
        now,
        now,
        invitation.id,
        hash,
        now,
      ),
    );
  }

  statements.push(
    env.DB.prepare(
      `INSERT INTO clinic_memberships
        (clinic_id, user_id, role, active, invited_by_user_id, created_at, updated_at)
       SELECT ?, ?, ?, 1, ?, ?, ?
        WHERE EXISTS (
          SELECT 1 FROM clinic_invitations
           WHERE id = ? AND token_hash = ?
             AND accepted_at IS NULL AND revoked_at IS NULL
             AND julianday(expires_at) > julianday(?)
        )
       ON CONFLICT(clinic_id, user_id) DO UPDATE SET
         role = excluded.role, active = 1,
         invited_by_user_id = excluded.invited_by_user_id,
         updated_at = excluded.updated_at`,
    ).bind(
      invitation.clinic_id,
      userId,
      invitation.role,
      invitation.invited_by,
      now,
      now,
      invitation.id,
      hash,
      now,
    ),
    env.DB.prepare(
      `UPDATE clinic_invitations
          SET accepted_at = ?
        WHERE id = ? AND token_hash = ?
          AND accepted_at IS NULL AND revoked_at IS NULL
          AND julianday(expires_at) > julianday(?)`,
    ).bind(now, invitation.id, hash, now),
    env.DB.prepare(
      `INSERT INTO saas_audit_events
        (id, billing_customer_id, clinic_id, actor_user_id, event_type, scope, metadata_json, created_at)
       SELECT ?, bc.id, ?, ?, 'invitation.accepted', 'admin', ?, ?
         FROM billing_customers bc
        WHERE bc.clinic_id = ? LIMIT 1`,
    ).bind(
      crypto.randomUUID(),
      invitation.clinic_id,
      userId,
      JSON.stringify({ invitationId: invitation.id, role: invitation.role }),
      now,
      invitation.clinic_id,
    ),
  );

  try {
    const results = await env.DB.batch(statements);
    const inviteUpdate = results[results.length - 2];
    if ((inviteUpdate?.meta?.changes ?? 0) !== 1) {
      return json({ error: "Convite mudou durante o aceite.", code: "INVITATION_STALE" }, 409);
    }
  } catch (error) {
    const message = String(error);
    if (/UNIQUE|constraint/i.test(message)) {
      return json({ error: "Conta ou membership já existe em estado incompatível.", code: "ACCOUNT_CONFLICT" }, 409);
    }
    console.error("[billing.accept]", error);
    return json({ error: "Não foi possível aceitar o convite.", code: "INVITATION_ACCEPT_FAILED" }, 500);
  }

  return json({
    ok: true,
    clinicId: invitation.clinic_id,
    userId,
    role: invitation.role,
    accountCreated: !existing,
  }, 201);
};
