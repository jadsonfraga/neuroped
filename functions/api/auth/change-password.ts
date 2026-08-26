import { getContextUser } from "./_authorization";
import { hashPassword, verifyPassword } from "./_crypto";
import { AUTH_INPUT_LIMITS } from "./_limits";
import { enforceLoginAbuseLimit, registerLoginAbuseFailure } from "./_rateLimit";
import { getUserById, json, publicUser, type Env, type UserRow } from "./_shared";
import { preparePasswordChangeSession } from "./_passwordChangeSession";
import { isPlainObject } from "../_request";

const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;

function passwordPolicyError(password: string): string | null {
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return `A nova senha deve ter entre ${PASSWORD_MIN} e ${PASSWORD_MAX} caracteres.`;
  }
  if (!/[A-Z]/.test(password)) return "A nova senha deve conter letra maiúscula.";
  if (!/[a-z]/.test(password)) return "A nova senha deve conter letra minúscula.";
  if (!/[0-9]/.test(password)) return "A nova senha deve conter número.";
  if (!/[^A-Za-z0-9]/.test(password)) return "A nova senha deve conter símbolo.";
  return null;
}

function changedUser(user: UserRow, passwordHash: string): UserRow {
  return {
    ...user,
    password_hash: passwordHash,
    must_change_password: 0,
    failed_login_attempts: 0,
    locked_until: null,
  };
}

/**
 * POST /api/auth/change-password
 *
 * Executa no runtime canônico Cloudflare. A autenticação/access-family já foi
 * validada pelo middleware global. Senhas nunca entram em log ou auditoria.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const userContext = getContextUser(context);
  if (!env.DB) return json({ error: "Banco indisponível.", code: "DB_UNAVAILABLE" }, 503);
  if (!userContext) return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401);

  // A identidade E2E reservada é uma conta de máquina: seu ciclo de vida de
  // credencial é gerenciado exclusivamente pela rotação de
  // NEUROPED_E2E_PASSWORD, nunca pelo fluxo humano de troca de senha. Aceitar
  // aqui abriria um caminho de emissão de sessão paralelo, sem os guards
  // atômicos de clinic_membership já aplicados a login/refresh.
  const reservedE2EEmail = env.NEUROPED_E2E_EMAIL?.toLowerCase().trim();
  if (reservedE2EEmail && userContext.email.toLowerCase().trim() === reservedE2EEmail) {
    return json(
      { error: "Conta técnica não pode alterar senha pelo fluxo humano.", code: "E2E_ACCOUNT_RESERVED" },
      403,
    );
  }

  const secret = env.NEUROPED_JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    return json({ error: "Autenticação não configurada.", code: "AUTH_NOT_CONFIGURED" }, 503);
  }

  try {
    const limit = await enforceLoginAbuseLimit(env, request, secret);
    if (limit) return limit;
  } catch {
    // O middleware global mantém limite por IP; indisponibilidade do bucket
    // auxiliar não torna troca de senha impossível.
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return json({ error: "Corpo inválido.", code: "INVALID_JSON" }, 400);
  }
  if (!isPlainObject(parsed)) {
    return json({ error: "Corpo deve ser um objeto JSON.", code: "INVALID_JSON" }, 400);
  }

  const body = parsed as { currentPassword?: unknown; newPassword?: unknown };
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (
    !currentPassword || !newPassword ||
    currentPassword.length > AUTH_INPUT_LIMITS.password ||
    newPassword.length > AUTH_INPUT_LIMITS.password
  ) {
    return json({ error: "Senhas ausentes ou excedem o tamanho permitido.", code: "VALIDATION_ERROR" }, 400);
  }

  const policyError = passwordPolicyError(newPassword);
  if (policyError) return json({ error: policyError, code: "PASSWORD_POLICY" }, 400);

  const user = await getUserById(env.DB, userContext.id);
  if (!user || !user.is_active || !user.password_hash) {
    return json({ error: "Conta indisponível.", code: "ACCOUNT_UNAVAILABLE" }, 409);
  }

  const currentValid = await verifyPassword(currentPassword, user.password_hash);
  if (!currentValid) {
    try {
      await registerLoginAbuseFailure(env, request, secret);
    } catch {
      // Sem material sensível em log; falha externa continua uniforme.
    }
    return json({ error: "Senha atual inválida.", code: "CURRENT_PASSWORD_INVALID" }, 401);
  }

  if (await verifyPassword(newPassword, user.password_hash)) {
    return json({ error: "A nova senha deve ser diferente da senha atual.", code: "PASSWORD_REUSE" }, 409);
  }

  const newHash = await hashPassword(newPassword);
  const now = new Date().toISOString();
  const nextUser = changedUser(user, newHash);
  const prepared = await preparePasswordChangeSession(env.DB, nextUser, secret, newHash);

  try {
    const results = await env.DB.batch([
      env.DB
        .prepare(
          `UPDATE users
              SET password_hash = ?, must_change_password = 0,
                  failed_login_attempts = 0, locked_until = NULL, updated_at = ?
            WHERE id = ? AND is_active = 1 AND password_hash = ?`,
        )
        .bind(newHash, now, user.id, user.password_hash),
      env.DB
        .prepare(
          `UPDATE auth_refresh_sessions
              SET revoked_at = ?, revoke_reason = 'password_changed'
            WHERE user_id = ? AND revoked_at IS NULL
              AND EXISTS (
                SELECT 1 FROM users u
                 WHERE u.id = ? AND u.is_active = 1 AND u.password_hash = ?
              )`,
        )
        .bind(now, user.id, user.id, newHash),
      prepared.insertStatement,
      env.DB
        .prepare(
          `INSERT INTO audit_logs
             (id, action, resource, resource_id, user_id, ip, details, created_at)
           SELECT ?, 'auth.password.change', 'user', ?, ?, NULL, ?, ?
            WHERE EXISTS (
              SELECT 1 FROM auth_refresh_sessions s
               WHERE s.id = ? AND s.user_id = ? AND s.revoked_at IS NULL
            )`,
        )
        .bind(
          crypto.randomUUID(),
          user.id,
          user.id,
          JSON.stringify({ oldFamiliesRevoked: true, newSessionIssued: true }),
          now,
          prepared.refreshId,
          user.id,
        ),
    ]);

    const passwordChanged = Number(results[0]?.meta?.changes ?? 0) === 1;
    const sessionIssued = Number(results[2]?.meta?.changes ?? 0) === 1;
    const audited = Number(results[3]?.meta?.changes ?? 0) === 1;
    if (!passwordChanged || !sessionIssued || !audited) {
      return json(
        { error: "A conta mudou durante a operação. Entre novamente.", code: "PASSWORD_CHANGE_RACE" },
        409,
      );
    }
  } catch (error) {
    console.error("[auth/change-password] operação transacional indisponível", error);
    return json({ error: "Não foi possível trocar a senha.", code: "PASSWORD_CHANGE_UNAVAILABLE" }, 503);
  }

  return json({
    ...prepared.tokens,
    user: publicUser(nextUser),
  }, 200);
};
