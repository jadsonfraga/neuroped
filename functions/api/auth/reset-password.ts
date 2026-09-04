/**
 * POST /api/auth/reset-password — troca o token de redefinição pela nova senha.
 *
 * Invariantes de segurança:
 * - claim atômico do token (consumed_by_request_id) dentro de um único batch:
 *   nenhuma etapa (senha, revogação de sessões, auditoria) acontece sem ele;
 * - todas as sessões refresh do usuário são revogadas na redefinição;
 * - política de senha idêntica à troca autenticada (12–128 + complexidade);
 * - reuso de token responde o mesmo 400 genérico de token desconhecido.
 */
import { hashPassword, sha256Hex } from "./_crypto";
import { AUTH_INPUT_LIMITS } from "./_limits";
import { json, type Env } from "./_shared";
import { boundedText, isPlainObject } from "../_request";

const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;

// Mesma política de change-password.ts: manter as duas em sincronia.
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

function invalidToken(): Response {
  return json(
    { error: "Link de redefinição inválido ou expirado.", code: "RESET_TOKEN_INVALID" },
    400,
  );
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  if (!db) return json({ error: "Banco indisponível.", code: "DB_UNAVAILABLE" }, 503);

  let parsed: unknown;
  try {
    parsed = await context.request.json();
  } catch {
    return json({ error: "Corpo inválido.", code: "INVALID_JSON" }, 400);
  }
  if (!isPlainObject(parsed)) {
    return json({ error: "Corpo deve ser um objeto JSON.", code: "INVALID_JSON" }, 400);
  }

  const token = boundedText(parsed.token, 256);
  const password = typeof parsed.password === "string" ? parsed.password : "";
  if (token.length < 32) return invalidToken();
  if (password.length > AUTH_INPUT_LIMITS.password) {
    return json({ error: "Senha longa demais.", code: "PASSWORD_TOO_WEAK" }, 400);
  }
  const policyError = passwordPolicyError(password);
  if (policyError) {
    return json({ error: policyError, code: "PASSWORD_TOO_WEAK" }, 400);
  }

  const tokenHash = await sha256Hex(token);
  const nowIso = new Date().toISOString();
  const row = await db
    .prepare(
      `SELECT t.user_id, u.email
         FROM auth_password_reset_tokens t
         JOIN users u ON u.id = t.user_id
        WHERE t.token_hash = ?
          AND t.consumed_at IS NULL
          AND julianday(t.expires_at) > julianday(?)
          AND u.is_active = 1
        LIMIT 1`,
    )
    .bind(tokenHash, nowIso)
    .first<{ user_id: string; email: string }>();
  if (!row) return invalidToken();

  const e2eEmail = context.env.NEUROPED_E2E_EMAIL?.trim().toLowerCase();
  if (e2eEmail && row.email.trim().toLowerCase() === e2eEmail) return invalidToken();

  const passwordHash = await hashPassword(password);
  const claimId = crypto.randomUUID();
  const auditId = crypto.randomUUID();

  try {
    const results = await db.batch([
      db
        .prepare(
          `UPDATE auth_password_reset_tokens
              SET consumed_at = ?, consumed_by_request_id = ?
            WHERE token_hash = ?
              AND consumed_at IS NULL
              AND julianday(expires_at) > julianday(?)`,
        )
        .bind(nowIso, claimId, tokenHash, nowIso),
      db
        .prepare(
          `UPDATE users
              SET password_hash = ?, must_change_password = 0,
                  failed_login_attempts = 0, locked_until = NULL, updated_at = ?
            WHERE id = ?
              AND EXISTS (
                SELECT 1
                  FROM auth_password_reset_tokens t
                 WHERE t.user_id = users.id
                   AND t.token_hash = ?
                   AND t.consumed_by_request_id = ?
              )`,
        )
        .bind(passwordHash, nowIso, row.user_id, tokenHash, claimId),
      db
        .prepare(
          `DELETE FROM auth_refresh_sessions
            WHERE user_id = ?
              AND EXISTS (
                SELECT 1 FROM auth_password_reset_tokens t
                 WHERE t.user_id = ?
                   AND t.token_hash = ?
                   AND t.consumed_by_request_id = ?
              )`,
        )
        .bind(row.user_id, row.user_id, tokenHash, claimId),
      db
        .prepare(
          `UPDATE auth_password_reset_tokens
              SET consumed_at = COALESCE(consumed_at, ?)
            WHERE user_id = ?
              AND id <> (SELECT id FROM auth_password_reset_tokens WHERE token_hash = ? LIMIT 1)
              AND consumed_at IS NULL`,
        )
        .bind(nowIso, row.user_id, tokenHash),
      db
        .prepare(
          `INSERT INTO saas_audit_log
            (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
           SELECT ?, NULL, ?, 'password_reset_completed', 'user', ?, ?, ?
            WHERE EXISTS (
              SELECT 1 FROM auth_password_reset_tokens t
               WHERE t.user_id = ?
                 AND t.token_hash = ?
                 AND t.consumed_by_request_id = ?
            )`,
        )
        .bind(
          auditId,
          row.user_id,
          row.user_id,
          JSON.stringify({ source: "self_service", sessionsRevoked: true }),
          nowIso,
          row.user_id,
          tokenHash,
          claimId,
        ),
    ]);

    if (
      Number(results[0]?.meta?.changes ?? 0) !== 1 ||
      Number(results[1]?.meta?.changes ?? 0) !== 1 ||
      Number(results[4]?.meta?.changes ?? 0) !== 1
    ) {
      return invalidToken();
    }
  } catch (error) {
    console.error("[auth/reset-password] reset failed", error);
    return json(
      { error: "Não foi possível redefinir a senha.", code: "RESET_FAILED" },
      500,
    );
  }

  return json({ ok: true, message: "Senha redefinida com sucesso. Entre novamente." });
};
