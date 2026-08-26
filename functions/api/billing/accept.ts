import { hashPassword } from "../auth/_crypto";
import { getUserByEmail } from "../auth/_shared";
import { validateInvitationForAccept } from "./_onboarding";
import { isClinicMembershipRole } from "../../../shared/tenant";

interface Env {
  DB?: D1Database;
}

interface InvitationRow {
  id: string;
  clinic_id: string;
  invited_by_user_id: string | null;
  email: string;
  role: string;
  token_hash: string;
  status: string;
  expires_at: string;
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

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
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

  const tokenHash = await sha256Hex(token);
  const invitation = await env.DB.prepare(
    `SELECT id, clinic_id, invited_by_user_id, email, role, token_hash, status, expires_at
       FROM clinic_invitations
      WHERE token_hash = ? LIMIT 1`,
  ).bind(tokenHash).first<InvitationRow>();

  if (!invitation || !isClinicMembershipRole(invitation.role)) {
    return json({ error: "Convite inválido.", code: "INVITATION_INVALID" }, 409);
  }
  const validity = validateInvitationForAccept(invitation);
  if (!validity.ok) {
    return json({ error: "Convite expirado, revogado ou já utilizado.", code: validity.reason ?? "INVITATION_INVALID" }, 409);
  }

  const billing = await env.DB.prepare(
    `SELECT bc.status, bc.trial_ends_at,
            COALESCE(bs.seats, 0) AS seats,
            (SELECT COUNT(*) FROM clinic_memberships cm
              WHERE cm.clinic_id = bc.clinic_id AND cm.active = 1) AS active_members
       FROM billing_customers bc
       LEFT JOIN billing_subscriptions bs
         ON bs.customer_id = bc.id
        AND bs.status IN ('trial','active','past_due')
      WHERE bc.clinic_id = ?
      ORDER BY bs.updated_at DESC
      LIMIT 1`,
  ).bind(invitation.clinic_id).first<{
    status: string;
    trial_ends_at: string | null;
    seats: number;
    active_members: number;
  }>();

  const trialExpired = billing?.status === "trial"
    && (!billing.trial_ends_at || new Date(billing.trial_ends_at) <= new Date());
  if (!billing || !["trial", "active"].includes(billing.status) || trialExpired) {
    return json({ error: "Clínica sem entitlement para aceitar novos membros.", code: "BILLING_ENTITLEMENT_DENIED" }, 402);
  }
  if (Number(billing.active_members) >= Number(billing.seats)) {
    return json({ error: "Limite de assentos atingido.", code: "SEAT_LIMIT_REACHED" }, 409);
  }

  const existing = await getUserByEmail(env.DB, invitation.email);
  if (existing && existing.is_active !== 1) {
    return json({ error: "Conta existente está inativa.", code: "ACCOUNT_INACTIVE" }, 409);
  }

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
    const globalRole = invitation.role === "assistant"
      ? "operator"
      : ["owner", "clinic_admin", "professional"].includes(invitation.role)
        ? "professional"
        : "reader";
    statements.push(
      env.DB.prepare(
        `INSERT INTO users
          (id, name, email, role, is_active, password_hash, must_change_password,
           failed_login_attempts, created_at, updated_at)
         SELECT ?, ?, ?, ?, 1, ?, 0, 0, ?, ?
          WHERE EXISTS (
            SELECT 1 FROM clinic_invitations
             WHERE id = ? AND token_hash = ? AND status = 'pending'
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
        tokenHash,
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
           WHERE id = ? AND token_hash = ? AND status = 'pending'
             AND julianday(expires_at) > julianday(?)
        )
       ON CONFLICT(clinic_id, user_id) DO UPDATE SET
         role = excluded.role,
         active = 1,
         invited_by_user_id = excluded.invited_by_user_id,
         updated_at = excluded.updated_at`,
    ).bind(
      invitation.clinic_id,
      userId,
      invitation.role,
      invitation.invited_by_user_id,
      now,
      now,
      invitation.id,
      tokenHash,
      now,
    ),
    env.DB.prepare(
      `UPDATE clinic_invitations
          SET status = 'accepted', accepted_at = ?
        WHERE id = ? AND token_hash = ? AND status = 'pending'
          AND julianday(expires_at) > julianday(?)`,
    ).bind(now, invitation.id, tokenHash, now),
    env.DB.prepare(
      `INSERT INTO saas_audit_events
        (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
       VALUES (?, ?, ?, 'invitation.accepted', 'clinic_invitation', ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      invitation.clinic_id,
      userId,
      invitation.id,
      JSON.stringify({ role: invitation.role }),
      now,
    ),
  );

  try {
    const results = await env.DB.batch(statements);
    const invitationUpdate = results[results.length - 2];
    if ((invitationUpdate?.meta?.changes ?? 0) !== 1) {
      return json({ error: "Convite mudou durante o aceite.", code: "INVITATION_STALE" }, 409);
    }
  } catch (error) {
    const message = String(error);
    if (message.includes("SEAT_LIMIT_REACHED") || message.includes("BILLING_ENTITLEMENT_DENIED")) {
      return json({ error: "Limite de assentos ou entitlement alterado durante o aceite.", code: "SEAT_LIMIT_REACHED" }, 409);
    }
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
