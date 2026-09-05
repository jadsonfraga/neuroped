/**
 * POST /api/auth/resend-verification — reenvia o link de confirmação de e-mail.
 *
 * Invariantes de segurança:
 * - resposta SEMPRE 202 genérica (anti-enumeração), inclusive quando o e-mail
 *   não existe, já está verificado ou a entrega está desconfigurada;
 * - rate limit persistente por bucket HMAC de IP, com balde sentinela quando o
 *   IP não é identificável — ausência de header nunca libera a requisição;
 * - o token nunca é persistido em texto claro (apenas SHA-256) e emitir um
 *   novo invalida os pendentes da mesma conta.
 */
import {
  consumeVerificationAttempt,
  emailVerificationConfigured,
  issueEmailVerification,
  type EmailVerificationEnv,
} from "./_emailVerification";
import { AUTH_INPUT_LIMITS } from "./_limits";
import { json } from "./_shared";
import { boundedText, isPlainObject } from "../_request";

function genericAccepted(): Response {
  return json(
    {
      ok: true,
      message:
        "Se existir uma conta pendente de confirmação para este e-mail, enviaremos um novo link.",
    },
    202,
  );
}

export const onRequestPost: PagesFunction<EmailVerificationEnv> = async (
  context,
) => {
  const db = context.env.DB;
  const secret = context.env.NEUROPED_JWT_SECRET?.trim();
  if (!db || !secret || secret.length < 32) return genericAccepted();

  try {
    const allowed = await consumeVerificationAttempt(
      db,
      secret,
      context.request,
    );
    if (!allowed) return genericAccepted();
  } catch (error) {
    console.error(
      "[auth/resend-verification] rate limiter indisponível",
      error,
    );
    return genericAccepted();
  }

  let parsed: unknown;
  try {
    parsed = await context.request.json();
  } catch {
    return json({ error: "Corpo inválido.", code: "INVALID_JSON" }, 400);
  }
  if (!isPlainObject(parsed)) {
    return json(
      { error: "Corpo deve ser um objeto JSON.", code: "INVALID_JSON" },
      400,
    );
  }

  const email = boundedText(
    parsed.email,
    AUTH_INPUT_LIMITS.email,
  ).toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return genericAccepted();
  if (!emailVerificationConfigured(context.env)) return genericAccepted();

  const user = await db
    .prepare(
      `SELECT id, email
         FROM users
        WHERE lower(email) = ?
          AND is_active = 1
          AND email_verified_at IS NULL
        LIMIT 1`,
    )
    .bind(email)
    .first<{ id: string; email: string }>();
  // Conta inexistente e conta já verificada respondem igual: nenhuma das duas
  // pode servir de oráculo sobre o estado de um endereço.
  if (!user) return genericAccepted();

  const e2eEmail = context.env.NEUROPED_E2E_EMAIL?.trim().toLowerCase();
  if (e2eEmail && user.email.trim().toLowerCase() === e2eEmail)
    return genericAccepted();

  try {
    await issueEmailVerification(db, context.env, user);
  } catch (error) {
    console.error("[auth/resend-verification] emissão falhou", error);
  }

  return genericAccepted();
};
