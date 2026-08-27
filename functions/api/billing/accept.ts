import { hashPassword } from "../auth/_crypto";
import { getUserByEmail } from "../auth/_shared";
import { validateInvitationForAccept } from "./_onboarding";
import { isClinicMembershipRole, type ClinicMembershipRole } from "../../../shared/tenant";

interface Env {
  DB?: D1Database;
  /** Identidade técnica reservada; nunca pode aceitar convite de clínica. */
  NEUROPED_E2E_EMAIL?: string;
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

type GlobalRole = "admin" | "professional" | "operator" | "reader";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function requiredGlobalRoleForMembership(role: ClinicMembershipRole): GlobalRole {
  if (role === "assistant") return "operator";
  if (role === "financial") return "reader";
  return "professional";
}

function strongestGlobalRole(current: string, required: GlobalRole): GlobalRole {
  const rank: Record<GlobalRole, number> = {
    reader: 0,
    operator: 1,
    professional: 2,
    admin: 3,
  };
  const normalizedCurrent: GlobalRole =
    current === "admin" || current === "professional" || current === "operator" || current === "reader"
      ? current
      : "reader";
  return rank[normalizedCurrent] >= rank[required] ? normalizedCurrent : required;
}

async function resolveAssistantProvider(
  db: D1Database,
  clinicId: string,
  invitedByUserId: string | null,
): Promise<string | null> {
  const preferred = invitedByUserId ?? "";
  const row = await db.prepare(
    `SELECT u.id
       FROM clinic_memberships cm
       JOIN users u ON u.id = cm.user_id
      WHERE cm.clinic_id = ?
        AND cm.active = 1
        AND u.is_active = 1
        AND u.role IN ('admin','professional')
      ORDER BY
        CASE
          WHEN u.id = ? THEN 0
          WHEN cm.role = 'owner' THEN 1
          WHEN cm.role = 'clinic_admin' THEN 2
          ELSE 3
        END,
        cm.created_at ASC
      LIMIT 1`,
  ).bind(clinicId, preferred).first<{ id: string }>();
  return row?.id ?? null;
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
  const membershipRole = invitation.role as ClinicMembershipRole;
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

  const requiredGlobalRole = requiredGlobalRoleForMembership(membershipRole);
  const effectiveGlobalRole = existing
    ? strongestGlobalRole(existing.role, requiredGlobalRole)
    : requiredGlobalRole;

  let assistantProviderId: string | null = null;
  if (membershipRole === "assistant") {
    assistantProviderId = await resolveAssistantProvider(
      env.DB,
      invitation.clinic_id,
      invitation.invited_by_user_id,
    );
    if (!assistantProviderId) {
      return json(
        { error: "Não há profissional ativo da clínica para vincular este assistente.", code: "ASSISTANT_PROVIDER_REQUIRED" },
        409,
      );
    }
    const existingStaffLink = await env.DB.prepare(
      `SELECT provider_user_id
         FROM booking_staff_links
        WHERE staff_user_id = ?
        LIMIT 1`,
    ).bind(userId).first<{ provider_user_id: string }>();
    if (existingStaffLink && existingStaffLink.provider_user_id !== assistantProviderId) {
      return json(
        { error: "Esta conta de assistente já está vinculada a outro profissional da Agenda.", code: "STAFF_ALREADY_LINKED" },
        409,
      );
    }
  }

  const now = new Date().toISOString();
  const pendingInvitationClause = `EXISTS (
    SELECT 1 FROM clinic_invitations
     WHERE id = ? AND token_hash = ? AND status = 'pending'
       AND julianday(expires_at) > julianday(?)
  )`;
  const statements: D1PreparedStatement[] = [];
  const requiredResultIndexes: number[] = [];

  if (!existing) {
    requiredResultIndexes.push(statements.length);
    statements.push(
      env.DB.prepare(
        `INSERT INTO users
          (id, name, email, role, is_active, password_hash, must_change_password,
           failed_login_attempts, created_at, updated_at)
         SELECT ?, ?, ?, ?, 1, ?, 0, 0, ?, ?
          WHERE ${pendingInvitationClause}`,
      ).bind(
        userId,
        name,
        invitation.email,
        effectiveGlobalRole,
        passwordHash,
        now,
        now,
        invitation.id,
        tokenHash,
        now,
      ),
    );
  } else if (effectiveGlobalRole !== existing.role) {
    requiredResultIndexes.push(statements.length);
    statements.push(
      env.DB.prepare(
        `UPDATE users SET role = ?, updated_at = ?
          WHERE id = ? AND is_active = 1 AND role = ?
            AND ${pendingInvitationClause}`,
      ).bind(
        effectiveGlobalRole,
        now,
        existing.id,
        existing.role,
        invitation.id,
        tokenHash,
        now,
      ),
    );
  }

  const membershipIndex = statements.length;
  requiredResultIndexes.push(membershipIndex);
  statements.push(
    env.DB.prepare(
      `INSERT INTO clinic_memberships
        (clinic_id, user_id, role, active, invited_by_user_id, created_at, updated_at)
       SELECT ?, ?, ?, 1, ?, ?, ?
        WHERE ${pendingInvitationClause}
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
      membershipRole,
      invitation.invited_by_user_id,
      now,
      now,
      invitation.id,
      tokenHash,
      now,
      userId,
      reservedEmail,
    ),
  );

  if (membershipRole === "assistant" && assistantProviderId) {
    const assistantLinkIndex = statements.length;
    requiredResultIndexes.push(assistantLinkIndex);
    statements.push(
      env.DB.prepare(
        `INSERT INTO booking_staff_links
          (provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at)
         SELECT ?, ?, 1, ?, ?, ?
          WHERE changes() = 1
            AND ${pendingInvitationClause}
         ON CONFLICT(provider_user_id, staff_user_id) DO UPDATE SET
           active = 1,
           created_by_user_id = excluded.created_by_user_id,
           updated_at = excluded.updated_at`,
      ).bind(
        assistantProviderId,
        userId,
        invitation.invited_by_user_id ?? assistantProviderId,
        now,
        now,
        invitation.id,
        tokenHash,
        now,
      ),
    );
  }

  const invitationUpdateIndex = statements.length;
  requiredResultIndexes.push(invitationUpdateIndex);
  statements.push(
    env.DB.prepare(
      `UPDATE clinic_invitations
          SET status = 'accepted', accepted_at = ?
        WHERE id = ? AND token_hash = ? AND status = 'pending'
          AND julianday(expires_at) > julianday(?)
          AND EXISTS (
            SELECT 1 FROM clinic_memberships cm
             WHERE cm.clinic_id = ? AND cm.user_id = ?
               AND cm.active = 1 AND cm.role = ?
          )`,
    ).bind(
      now,
      invitation.id,
      tokenHash,
      now,
      invitation.clinic_id,
      userId,
      membershipRole,
    ),
  );

  const auditIndex = statements.length;
  requiredResultIndexes.push(auditIndex);
  statements.push(
    env.DB.prepare(
      `INSERT INTO saas_audit_events
        (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
       SELECT ?, ?, ?, 'invitation.accepted', 'clinic_invitation', ?, ?, ?
        WHERE EXISTS (
          SELECT 1 FROM clinic_invitations
           WHERE id = ? AND token_hash = ? AND status = 'accepted' AND accepted_at = ?
        )`,
    ).bind(
      crypto.randomUUID(),
      invitation.clinic_id,
      userId,
      invitation.id,
      JSON.stringify({
        role: membershipRole,
        globalRole: effectiveGlobalRole,
        operationsProviderId: assistantProviderId,
      }),
      now,
      invitation.id,
      tokenHash,
      now,
    ),
  );

  try {
    const results = await env.DB.batch(statements);
    const incomplete = requiredResultIndexes.some(
      (index) => (results[index]?.meta?.changes ?? 0) !== 1,
    );
    if (incomplete) {
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
    if (message.includes("booking_staff_links") || message.includes("STAFF_ALREADY_LINKED")) {
      return json({ error: "Não foi possível vincular o assistente à Agenda deste profissional.", code: "STAFF_ALREADY_LINKED" }, 409);
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
    role: membershipRole,
    accountCreated: !existing,
  }, 201);
};
