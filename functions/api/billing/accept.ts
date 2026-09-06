import { getContextUser } from "../auth/_authorization";
import { hashPassword, sha256Hex } from "../auth/_crypto";
import { passwordPolicyError } from "../auth/_passwordPolicy";
import { canonicalEmail, getUserByEmail } from "../auth/_shared";
import { json, boundedText as text } from "../_request";
import { isClinicMembershipRole } from "../../../shared/tenant";
import { validateInvitationForAccept } from "./_onboarding";

interface Env {
  DB?: D1Database;
  /** Identidade técnica reservada; nunca pode aceitar convite de clínica. */
  NEUROPED_E2E_EMAIL?: string;
  /** Mesmo opt-in do cadastro público: também gates a criação de conta via convite. */
  SAAS_SIGNUP_ENABLED?: string;
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  if (!env.DB) return json({ error: "Banco SaaS indisponível.", code: "DB_REQUIRED" }, 503);
  const authUser = getContextUser(context);

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
  // Senha é dado opaco: não passa por boundedText, que faria trim/truncamento.
  const password = typeof body.password === "string" ? body.password : "";
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

  const reservedEmail = env.NEUROPED_E2E_EMAIL?.trim().toLowerCase() ?? "";
  if (reservedEmail && invitation.email.trim().toLowerCase() === reservedEmail) {
    return json(
      { error: "A conta técnica E2E é reservada e não pode integrar uma clínica.", code: "TECHNICAL_ACCOUNT_RESERVED" },
      409,
    );
  }

  if (authUser && authUser.email.trim().toLowerCase() !== invitation.email.trim().toLowerCase()) {
    return json(
      { error: "Convite deve ser aceito pela conta com o e-mail convidado.", code: "INVITATION_EMAIL_MISMATCH" },
      403,
    );
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
  if (existing && reservedEmail && existing.email.trim().toLowerCase() === reservedEmail) {
    return json(
      { error: "A conta técnica E2E é reservada e não pode integrar uma clínica.", code: "TECHNICAL_ACCOUNT_RESERVED" },
      409,
    );
  }
  if (existing && !authUser) {
    return json(
      { error: "Faça login com a conta convidada para aceitar este convite.", code: "AUTHENTICATION_REQUIRED" },
      401,
    );
  }
  if (existing && authUser && existing.id !== authUser.id) {
    return json(
      { error: "Convite deve ser aceito pela conta com o e-mail convidado.", code: "INVITATION_EMAIL_MISMATCH" },
      403,
    );
  }

  let userId = existing?.id ?? "";
  let passwordHash: string | null = null;
  if (!existing) {
    if (env.SAAS_SIGNUP_ENABLED !== "true") {
      return json(
        {
          error:
            "Criação de conta via convite não está habilitada nesta instalação. Peça ao gestor um convite para uma conta existente ou aguarde a liberação do cadastro.",
          code: "INVITE_ACCOUNT_CREATION_DISABLED",
        },
        503,
      );
    }
    if (name.length < 2) {
      return json({ error: "Informe seu nome completo.", code: "ACCOUNT_DATA_REQUIRED" }, 400);
    }
    const policyError = passwordPolicyError(password);
    if (policyError) {
      return json({ error: policyError, code: "WEAK_PASSWORD" }, 400);
    }
    userId = crypto.randomUUID();
    passwordHash = await hashPassword(password);
  }

  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [];
  if (!existing) {
    const globalRole = ["owner", "clinic_admin", "professional"].includes(invitation.role)
      ? "professional"
      : invitation.role === "assistant"
        ? "operator"
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
        canonicalEmail(invitation.email),
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

  const membershipIndex = statements.length;
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
          AND NOT EXISTS (
            SELECT 1 FROM users u
             WHERE u.id = ? AND lower(u.email) = ?
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
      userId,
      reservedEmail,
    ),
    env.DB.prepare(
      `UPDATE clinic_invitations
          SET status = 'accepted', accepted_at = ?
        WHERE id = ? AND token_hash = ? AND status = 'pending'
          AND julianday(expires_at) > julianday(?)
          AND changes() = 1`,
    ).bind(now, invitation.id, tokenHash, now),
    env.DB.prepare(
      `INSERT INTO saas_audit_events
        (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
       SELECT ?, ?, ?, 'invitation.accepted', 'clinic_invitation', ?, ?, ?
        WHERE changes() = 1`,
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
    const membershipResult = results[membershipIndex];
    const invitationUpdate = results[membershipIndex + 1];
    const auditInsert = results[membershipIndex + 2];
    if (
      (membershipResult?.meta?.changes ?? 0) !== 1 ||
      (invitationUpdate?.meta?.changes ?? 0) !== 1 ||
      (auditInsert?.meta?.changes ?? 0) !== 1
    ) {
      return json(
        { error: "Convite mudou durante o aceite ou a identidade está reservada.", code: "INVITATION_STALE" },
        409,
      );
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
