import { getContextUser } from "../auth/_authorization";
import { isClinicMembershipRole, type ClinicMembershipRole } from "../../../shared/tenant";
import { getClinicMembership, membershipCanManage, tenantError, tenantJson } from "../tenant/_core";
import {
  buildInvitationUrl,
  generateInvitationToken,
  INVITATION_EXPIRY_MS,
  isoUtc,
  normalizeInvitationEmail,
} from "./_onboarding";
import { requireBillingEntitlement } from "./_guard";
import { invitationDeliveryMode, sendInvitationEmail } from "./_invitationDelivery";
import type { MailTransportEnv } from "../auth/_mailTransport";
import { boundedText as clean } from "../_request";

interface Env extends MailTransportEnv {
  DB?: D1Database;
  APP_BASE_URL?: string;
  ENVIRONMENT?: string;
}

/**
 * Entrega o convite e decide o que a API pode devolver ao convidante.
 *
 * Quando há transporte de e-mail, o token vai DIRETO a quem precisa provar
 * posse do endereço, e a resposta NÃO devolve a URL. Isso fecha o vetor que a
 * revisão adversarial de 03/09 nomeou: com o link em mãos, o convidante podia
 * criar a conta em nome de um terceiro.
 *
 * Sem transporte, o comportamento anterior continua — link devolvido e
 * rotulado como manual —, para que uma instalação sem e-mail não perca a
 * capacidade de convidar. É degradação declarada, não silenciosa.
 */
async function deliverInvitation(
  env: Env,
  params: { to: string; clinicName: string; role: string; invitationUrl: string; expiresAt: string },
): Promise<{ delivery: "email" | "manual"; invitationUrl?: string }> {
  if (invitationDeliveryMode(env) !== "email") {
    return { delivery: "manual", invitationUrl: params.invitationUrl };
  }
  const sent = await sendInvitationEmail(env, params);
  // Falha de entrega não pode deixar o convite inalcançável: o link volta ao
  // gestor com o rótulo manual, e ele decide como conduzir.
  return sent ? { delivery: "email" } : { delivery: "manual", invitationUrl: params.invitationUrl };
}

async function manager(context: Parameters<PagesFunction<Env>>[0], clinicId: string) {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return { error: tenantError("Billing indisponível.", "DB_REQUIRED", 503) } as const;
  if (!user) return { error: tenantError("Não autenticado.", "UNAUTHENTICATED", 401) } as const;
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return { error: tenantError("Apenas gestores podem administrar convites.", "TENANT_FORBIDDEN", 403) } as const;
  }
  const denial = await requireBillingEntitlement(db, user.id, clinicId, "admin");
  if (denial) return { error: denial } as const;
  return { db, user, membership } as const;
}

async function assertSeatAvailable(db: D1Database, clinicId: string): Promise<boolean> {
  const row = await db.prepare(
    `SELECT
       bc.status AS customer_status,
       bc.trial_ends_at,
       (SELECT COUNT(*) FROM clinic_memberships WHERE clinic_id = ? AND active = 1) AS active_members,
       COALESCE((
         SELECT bs.seats
           FROM billing_subscriptions bs
           JOIN billing_customers bc2 ON bc2.id = bs.customer_id
          WHERE bc2.clinic_id = ?
            AND bs.status IN ('trial','active','past_due')
          ORDER BY bs.updated_at DESC LIMIT 1
       ), 0) AS seats
       FROM billing_customers bc
      WHERE bc.clinic_id = ? LIMIT 1`,
  ).bind(clinicId, clinicId, clinicId).first<{
    customer_status: string;
    trial_ends_at: string | null;
    active_members: number;
    seats: number;
  }>();
  if (!row || !["trial", "active"].includes(row.customer_status)) return false;
  if (row.customer_status === "trial" && (!row.trial_ends_at || new Date(row.trial_ends_at) <= new Date())) return false;
  return Number(row.active_members) < Number(row.seats);
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const clinicId = clean(new URL(context.request.url).searchParams.get("clinicId"), 80);
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  const auth = await manager(context, clinicId);
  if ("error" in auth) return auth.error;

  const rows = await auth.db.prepare(
    `SELECT id, email, role, status, expires_at, accepted_at, created_at, last_sent_at, resend_count
       FROM clinic_invitations
      WHERE clinic_id = ?
      ORDER BY created_at DESC LIMIT 100`,
  ).bind(clinicId).all<Record<string, unknown>>();
  return tenantJson({ data: rows.results ?? [] });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }

  const clinicId = clean(body.clinicId, 80);
  const action = clean(body.action, 20) || "create";
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  const auth = await manager(context, clinicId);
  if ("error" in auth) return auth.error;
  if (action !== "create" && action !== "resend") {
    return tenantError("Ação de convite inválida.", "VALIDATION_ERROR", 400);
  }

  const now = isoUtc(new Date());
  const expiresAt = isoUtc(new Date(Date.now() + INVITATION_EXPIRY_MS));
  const generated = await generateInvitationToken();
  const invitationUrl = buildInvitationUrl(context.env.APP_BASE_URL, generated.token);
  if (!invitationUrl) {
    return tenantError(
      "URL pública HTTPS do onboarding não configurada.",
      "ONBOARDING_BASE_URL_NOT_CONFIGURED",
      503,
    );
  }

  if (action === "resend") {
    const existingId = clean(body.invitationId, 80);
    if (!existingId) return tenantError("invitationId é obrigatório para reenvio.", "VALIDATION_ERROR", 400);
    const existing = await auth.db.prepare(
      `SELECT email, role, resend_count, last_sent_at
         FROM clinic_invitations
        WHERE id = ? AND clinic_id = ? AND status = 'pending'
        LIMIT 1`,
    ).bind(existingId, clinicId).first<{
      email: string;
      role: string;
      resend_count: number;
      last_sent_at: string | null;
    }>();
    if (!existing) return tenantError("Convite não está disponível para reenvio.", "INVITATION_NOT_USABLE", 409);

    const lastSent = existing.last_sent_at ? new Date(existing.last_sent_at.replace(" ", "T") + "Z") : null;
    const sameDay = lastSent && Date.now() - lastSent.getTime() < 24 * 60 * 60 * 1000;
    if (sameDay && Number(existing.resend_count) >= 3) {
      return tenantError("Limite de reenvios atingido nas últimas 24 horas.", "INVITATION_RESEND_LIMIT", 429);
    }

    const result = await auth.db.prepare(
      `UPDATE clinic_invitations
          SET token_hash = ?, expires_at = ?, last_sent_at = ?,
              resend_count = CASE
                WHEN last_sent_at IS NOT NULL AND julianday(?) - julianday(last_sent_at) < 1
                  THEN resend_count + 1
                ELSE 1
              END
        WHERE id = ? AND clinic_id = ? AND status = 'pending'`,
    ).bind(generated.tokenHash, expiresAt, now, now, existingId, clinicId).run();
    if ((result.meta?.changes ?? 0) !== 1) {
      return tenantError("Convite mudou durante o reenvio.", "INVITATION_STALE", 409);
    }
    const delivered = await deliverInvitation(context.env, {
      to: existing.email,
      clinicName: auth.membership.clinicName,
      role: existing.role,
      invitationUrl,
      expiresAt,
    });
    return tenantJson({
      id: existingId,
      email: existing.email,
      role: existing.role,
      expiresAt,
      ...delivered,
    });
  }

  const email = normalizeInvitationEmail(clean(body.email, 320));
  const roleRaw = clean(body.role, 40);
  if (!email || !isClinicMembershipRole(roleRaw)) {
    return tenantError("email e role válidos são obrigatórios.", "VALIDATION_ERROR", 400);
  }
  const role = roleRaw as ClinicMembershipRole;
  if (role === "owner" && auth.membership.role !== "owner") {
    return tenantError("Somente owner pode convidar outro owner.", "TENANT_FORBIDDEN", 403);
  }
  if (!(await assertSeatAvailable(auth.db, clinicId))) {
    return tenantError("Limite de assentos atingido ou billing sem entitlement.", "SEAT_LIMIT_REACHED", 409);
  }

  const activeAlready = await auth.db.prepare(
    `SELECT 1
       FROM clinic_memberships cm
       JOIN users u ON u.id = cm.user_id
      WHERE cm.clinic_id = ? AND cm.active = 1 AND lower(u.email) = ?
      LIMIT 1`,
  ).bind(clinicId, email).first();
  if (activeAlready) {
    return tenantError("Este e-mail já pertence a um membro ativo.", "MEMBERSHIP_ALREADY_ACTIVE", 409);
  }

  const pendingAlready = await auth.db.prepare(
    `SELECT id FROM clinic_invitations
      WHERE clinic_id = ? AND lower(email) = ? AND status = 'pending'
        AND julianday(expires_at) > julianday('now')
      LIMIT 1`,
  ).bind(clinicId, email).first<{ id: string }>();
  if (pendingAlready) {
    return tenantError("Já existe convite pendente para este e-mail.", "INVITATION_ALREADY_PENDING", 409);
  }

  const invitationId = crypto.randomUUID();
  try {
    await auth.db.prepare(
      `INSERT INTO clinic_invitations
        (id, clinic_id, invited_by_user_id, email, role, token_hash, status,
         expires_at, last_sent_at, resend_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, 0, ?)`,
    ).bind(
      invitationId,
      clinicId,
      auth.user.id,
      email,
      role,
      generated.tokenHash,
      expiresAt,
      now,
      now,
    ).run();
  } catch (error) {
    console.error("[billing.invitations] create", error);
    return tenantError("Não foi possível criar o convite.", "INVITATION_CREATE_FAILED", 500);
  }

  const delivered = await deliverInvitation(context.env, {
    to: email,
    clinicName: auth.membership.clinicName,
    role,
    invitationUrl,
    expiresAt,
  });
  return tenantJson({
    id: invitationId,
    email,
    role,
    expiresAt,
    ...delivered,
  }, 201);
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const clinicId = clean(url.searchParams.get("clinicId"), 80);
  const invitationId = clean(url.searchParams.get("invitationId"), 80);
  if (!clinicId || !invitationId) {
    return tenantError("clinicId e invitationId são obrigatórios.", "VALIDATION_ERROR", 400);
  }
  const auth = await manager(context, clinicId);
  if ("error" in auth) return auth.error;
  const result = await auth.db.prepare(
    `UPDATE clinic_invitations SET status = 'revoked'
      WHERE id = ? AND clinic_id = ? AND status = 'pending'`,
  ).bind(invitationId, clinicId).run();
  if ((result.meta?.changes ?? 0) !== 1) {
    return tenantError("Convite não encontrado ou já encerrado.", "INVITATION_NOT_USABLE", 404);
  }
  return tenantJson({ ok: true });
};
