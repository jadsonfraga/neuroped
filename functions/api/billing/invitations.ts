import { getContextUser } from "../auth/_authorization";
import { isClinicMembershipRole, type ClinicMembershipRole } from "../../../shared/tenant";
import { getClinicMembership, membershipCanManage, tenantError, tenantJson } from "../tenant/_core";
import {
  generateInvitationToken,
  invitationExpiryIso,
  normaliseInviteEmail,
} from "./_onboarding";
import { evaluateEntitlement, denialResponse } from "../../../server/lib/billingEntitlement";

interface Env {
  DB?: D1Database;
  APP_BASE_URL?: string;
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
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
  const entitlement = await evaluateEntitlement(db, user.id, clinicId, "admin");
  if (!entitlement.allowed) return { error: denialResponse(entitlement) } as const;
  return { db, user, membership } as const;
}

async function assertSeatAvailable(db: D1Database, clinicId: string): Promise<boolean> {
  const row = await db.prepare(
    `SELECT
       (SELECT COUNT(*) FROM clinic_memberships WHERE clinic_id = ? AND active = 1) AS active_members,
       COALESCE((
         SELECT bs.seats
           FROM billing_subscriptions bs
           JOIN billing_customers bc ON bc.id = bs.billing_customer_id
          WHERE bc.clinic_id = ?
            AND bs.status IN ('trialing','active','past_due','paused')
          ORDER BY bs.updated_at DESC LIMIT 1
       ), 0) AS seats`,
  ).bind(clinicId, clinicId).first<{ active_members: number; seats: number }>();
  return Number(row?.active_members ?? 0) < Number(row?.seats ?? 0);
}

function invitationLink(base: string | undefined, token: string): string {
  const url = new URL((base?.trim() || "https://superneuroped.vercel.app").replace(/\/+$/, "") + "/invite");
  url.searchParams.set("token", token);
  return url.toString();
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const clinicId = clean(new URL(context.request.url).searchParams.get("clinicId"), 80);
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  const auth = await manager(context, clinicId);
  if ("error" in auth) return auth.error;

  const rows = await auth.db.prepare(
    `SELECT id, email, role, expires_at, accepted_at, revoked_at, created_at, last_sent_at, resend_count
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

  const now = new Date().toISOString();
  const generated = await generateInvitationToken();
  const expiresAt = invitationExpiryIso(new Date());

  if (action === "resend") {
    const existingId = clean(body.invitationId, 80);
    if (!existingId) return tenantError("invitationId é obrigatório para reenvio.", "VALIDATION_ERROR", 400);
    const existing = await auth.db.prepare(
      `SELECT email, role FROM clinic_invitations
        WHERE id = ? AND clinic_id = ? AND accepted_at IS NULL AND revoked_at IS NULL
        LIMIT 1`,
    ).bind(existingId, clinicId).first<{ email: string; role: string }>();
    if (!existing) {
      return tenantError("Convite não está disponível para reenvio.", "INVITATION_NOT_USABLE", 409);
    }
    const result = await auth.db.prepare(
      `UPDATE clinic_invitations
          SET token_hash = ?, expires_at = ?, last_sent_at = ?,
              resend_count = COALESCE(resend_count, 0) + 1
        WHERE id = ? AND clinic_id = ? AND accepted_at IS NULL AND revoked_at IS NULL`,
    ).bind(generated.hash, expiresAt, now, existingId, clinicId).run();
    if ((result.meta?.changes ?? 0) !== 1) {
      return tenantError("Convite mudou durante o reenvio.", "INVITATION_STALE", 409);
    }
    return tenantJson({
      id: existingId,
      email: existing.email,
      role: existing.role,
      expiresAt,
      invitationUrl: invitationLink(context.env.APP_BASE_URL, generated.token),
    });
  }

  if (action !== "create") {
    return tenantError("Ação de convite inválida.", "VALIDATION_ERROR", 400);
  }

  const email = normaliseInviteEmail(clean(body.email, 254));
  const roleRaw = clean(body.role, 40);
  if (!email || !isClinicMembershipRole(roleRaw)) {
    return tenantError("email e role válidos são obrigatórios.", "VALIDATION_ERROR", 400);
  }
  const role = roleRaw as ClinicMembershipRole;
  if (role === "owner" && auth.membership.role !== "owner") {
    return tenantError("Somente owner pode convidar outro owner.", "TENANT_FORBIDDEN", 403);
  }
  if (!(await assertSeatAvailable(auth.db, clinicId))) {
    return tenantError("Limite de assentos atingido.", "SEAT_LIMIT_REACHED", 409);
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

  const invitationId = crypto.randomUUID();
  try {
    await auth.db.prepare(
      `INSERT INTO clinic_invitations
        (id, clinic_id, email, role, token_hash, invited_by, expires_at, created_at, last_sent_at, resend_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    ).bind(
      invitationId,
      clinicId,
      email,
      role,
      generated.hash,
      auth.user.id,
      expiresAt,
      now,
      now,
    ).run();
  } catch (error) {
    console.error("[billing.invitations] create", error);
    return tenantError("Não foi possível criar o convite.", "INVITATION_CREATE_FAILED", 500);
  }

  return tenantJson({
    id: invitationId,
    email,
    role,
    expiresAt,
    invitationUrl: invitationLink(context.env.APP_BASE_URL, generated.token),
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
    `UPDATE clinic_invitations SET revoked_at = ?
      WHERE id = ? AND clinic_id = ? AND accepted_at IS NULL AND revoked_at IS NULL`,
  ).bind(new Date().toISOString(), invitationId, clinicId).run();
  if ((result.meta?.changes ?? 0) !== 1) {
    return tenantError("Convite não encontrado ou já encerrado.", "INVITATION_NOT_USABLE", 404);
  }
  return tenantJson({ ok: true });
};
