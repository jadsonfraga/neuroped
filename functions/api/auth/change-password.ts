import { z } from "zod";
import { getContextUser } from "./_authorization";
import { hashPassword, verifyPassword } from "./_crypto";
import { getUserById, json, type Env } from "./_shared";
import { strongPasswordSchema } from "./_passwordPolicy";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(1_024),
  newPassword: strongPasswordSchema,
}).strict();

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return json({ error: "Banco indisponível.", code: "DB_UNAVAILABLE" }, 503);
  if (!user) return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401);

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Corpo JSON inválido.", code: "INVALID_JSON" }, 400);
  }
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return json({
      error: "A nova senha não atende aos requisitos de segurança.",
      code: "PASSWORD_POLICY_FAILED",
      details: parsed.error.issues,
    }, 400);
  }

  const row = await getUserById(db, user.id);
  if (!row?.is_active || !row.password_hash) {
    return json({ error: "Conta indisponível.", code: "ACCOUNT_UNAVAILABLE" }, 409);
  }
  if (!(await verifyPassword(parsed.data.currentPassword, row.password_hash))) {
    return json({ error: "Senha atual incorreta.", code: "WRONG_PASSWORD" }, 401);
  }
  if (await verifyPassword(parsed.data.newPassword, row.password_hash)) {
    return json({ error: "A nova senha deve ser diferente da atual.", code: "PASSWORD_REUSE_NOT_ALLOWED" }, 409);
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  const now = new Date().toISOString();
  const ip = (
    context.request.headers.get("CF-Connecting-IP")
    ?? context.request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()
    ?? ""
  ).slice(0, 64) || null;
  try {
    const results = await db.batch([
      db.prepare(
        `UPDATE users
            SET password_hash = ?, must_change_password = 0,
                failed_login_attempts = 0, locked_until = NULL, updated_at = ?
          WHERE id = ? AND password_hash = ? AND is_active = 1`,
      ).bind(newHash, now, user.id, row.password_hash),
      db.prepare(
        `INSERT INTO audit_logs
          (id, action, resource, resource_id, user_id, ip, details, created_at)
         SELECT ?, 'auth.password.change', 'user', ?, ?, ?, ?, ?
          WHERE changes() = 1`,
      ).bind(
        crypto.randomUUID(),
        user.id,
        user.id,
        ip,
        JSON.stringify({ allSessionsRevoked: true }),
        now,
      ),
      db.prepare(
        `UPDATE auth_refresh_sessions
            SET revoked_at = ?, revoke_reason = 'password_changed'
          WHERE user_id = ? AND revoked_at IS NULL AND changes() = 1`,
      ).bind(now, user.id),
    ]);
    if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) {
      return json({
        error: "A conta mudou durante a operação. Entre novamente e repita a troca.",
        code: "PASSWORD_STATE_CHANGED",
      }, 409);
    }
    return json({ ok: true, logoutRequired: true }, 200);
  } catch (error) {
    console.error("[auth/change-password] atomic update failed", error);
    return json({ error: "Não foi possível alterar a senha.", code: "AUTH_UNAVAILABLE" }, 503);
  }
};
