import { getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import {
  getClinicMembership,
  membershipCanManage,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";
import {
  inviteEmailHash,
  isInvitableRole,
  normalizeInviteEmail,
  randomInviteToken,
  sha256Hex,
} from "../../saas/_invite";

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function clinicIdFrom(context: Parameters<PagesFunction<TenantEnv>>[0]): string {
  const raw = context.params.id;
  return cleanText(Array.isArray(raw) ? raw[0] : raw, 80);
}

function inviteBaseUrl(env: TenantEnv): string | null {
  const value = env.APP_BASE_URL?.trim().replace(/\/+$/, "") ?? "";
  if (!value) return null;
  if (env.ENVIRONMENT?.trim().toLowerCase() === "production" && !value.startsWith("https://")) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || env.ENVIRONMENT?.trim().toLowerCase() !== "production" ? value : null;
  } catch {
    return null;
  }
}

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const clinicId = clinicIdFrom(context);
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!clinicId) return tenantError("clinicId inválido.", "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return tenantError("Acesso administrativo negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  }
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "admin");
  if (billingError) return billingError;

  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }

  const email = normalizeInviteEmail(body.email);
  const role = cleanText(body.role, 30);
  const expirationDays = Number(body.expirationDays ?? 7);
  if (!email.includes("@") || email.length < 6) return tenantError("E-mail de convite inválido.", "VALIDATION_ERROR", 400);
  if (!isInvitableRole(role)) return tenantError("Papel de convite inválido.", "VALIDATION_ERROR", 400);
  if (!Number.isInteger(expirationDays) || expirationDays < 1 || expirationDays > 30) return tenantError("expirationDays deve estar entre 1 e 30.", "VALIDATION_ERROR", 400);

  const baseUrl = inviteBaseUrl(context.env);
  if (!baseUrl) return tenantError("APP_BASE_URL HTTPS não configurada para convites.", "INVITE_BASE_URL_NOT_CONFIGURED", 503);
  const operationalKey = context.env.OPERATIONAL_DATA_KEY?.trim() ?? "";
  if (operationalKey.length < 32) return tenantError("Chave operacional não configurada.", "OPERATIONAL_CRYPTO_NOT_CONFIGURED", 503);

  const targetUser = await db
    .prepare(`SELECT id, role FROM users WHERE lower(email) = lower(?) LIMIT 1`)
    .bind(email)
    .first<{ id: string; role: string }>();
  if (targetUser?.role === "admin" && role !== "clinic_admin") {
    return tenantError("Usuário administrativo não pode receber papel incompatível.", "ROLE_CONFLICT", 409);
  }
  if (targetUser) {
    const existing = await db
      .prepare(`SELECT active FROM clinic_memberships WHERE clinic_id = ? AND user_id = ? LIMIT 1`)
      .bind(clinicId, targetUser.id)
      .first<{ active: number }>();
    if (existing?.active === 1) return tenantError("Este usuário já é membro ativo da clínica.", "MEMBERSHIP_EXISTS", 409);
  }

  const token = randomInviteToken();
  const tokenHash = await sha256Hex(token);
  const emailHash = await inviteEmailHash(context.env, clinicId, email);
  const now = new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000).toISOString();
  const id = crypto.randomUUID();

  try {
    const results = await db.batch([
      db
        .prepare(
          `UPDATE saas_membership_invites
              SET revoked_at = ?
            WHERE clinic_id = ? AND email_hash = ?
              AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ?`,
        )
        .bind(createdAt, clinicId, emailHash, createdAt),
      db
        .prepare(
          `INSERT INTO saas_membership_invites
             (id, clinic_id, email_hash, role, token_hash, expires_at, invited_by_user_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(id, clinicId, emailHash, role, tokenHash, expiresAt, user.id, createdAt),
      prepareSaasAudit(
        db,
        {
          clinicId,
          actorUserId: user.id,
          action: "saas_membership_invite_create",
          targetType: "membership_invite",
          targetId: id,
          metadata: { role, expirationDays },
        },
        true,
      ),
    ]);
    if ((results[1]?.meta?.changes ?? 0) !== 1 || (results[2]?.meta?.changes ?? 0) !== 1) {
      return tenantError("O convite não pôde ser auditado.", "AUDIT_WRITE_FAILED", 500);
    }
    return tenantJson({
      data: {
        id,
        clinicId,
        email,
        role,
        expiresAt,
        inviteUrl: `${baseUrl}/#/convite?token=${encodeURIComponent(token)}`,
      },
    }, 201);
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) return tenantError("Já existe um convite ativo para este destinatário.", "INVITE_EXISTS", 409);
    console.error("[tenants.invites.POST] failed", error);
    return tenantError("Não foi possível criar o convite.", "INVITE_CREATE_FAILED", 500);
  }
};
