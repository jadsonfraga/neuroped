/**
 * POST /api/auth/login — autentica e emite tokens (access + refresh).
 *
 * Resposta (contrato da UI): { accessToken, refreshToken, expiresIn, user }.
 * Mensagens genéricas em falha (não revela se o e-mail existe).
 */
import {
  type Env,
  json,
  publicUser,
  getUserByEmail,
  isLocked,
  issueTokens,
  registerFailedAttempt,
  registerSuccessfulLogin,
  bootstrapAdmin,
} from "./_shared";
import { verifyPassword } from "./_crypto";

const INVALID = { error: "Credenciais inválidas.", code: "INVALID_CREDENTIALS" };

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  const secret = env.NEUROPED_JWT_SECRET;
  if (!secret) {
    return json(
      { error: "Autenticação não configurada (NEUROPED_JWT_SECRET ausente).", code: "AUTH_NOT_CONFIGURED" },
      503,
    );
  }
  if (!env.DB) {
    return json({ error: "Banco indisponível.", code: "DB_UNAVAILABLE" }, 503);
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Corpo inválido.", code: "INVALID_JSON" }, 400);
  }

  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return json({ error: "Informe e-mail e senha.", code: "MISSING_FIELDS" }, 400);
  }

  // Provisiona o admin inicial (idempotente) antes de buscar o usuário.
  try {
    await bootstrapAdmin(env.DB, env);
  } catch {
    /* bootstrap é best-effort; não bloqueia login de usuários já existentes */
  }

  const user = await getUserByEmail(env.DB, email);
  if (!user) return json(INVALID, 401);

  if (!user.is_active) {
    return json({ error: "Conta desativada.", code: "ACCOUNT_DISABLED" }, 403);
  }
  if (isLocked(user)) {
    return json(
      { error: "Conta temporariamente bloqueada por tentativas. Aguarde alguns minutos.", code: "ACCOUNT_LOCKED" },
      423,
    );
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    await registerFailedAttempt(env.DB, user);
    return json(INVALID, 401);
  }

  await registerSuccessfulLogin(env.DB, user);
  const tokens = await issueTokens(user, secret);
  return json({ ...tokens, user: publicUser(user) }, 200);
};
