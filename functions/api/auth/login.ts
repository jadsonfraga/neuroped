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
  registerFailedAttempt,
  registerSuccessfulLogin,
  bootstrapAdmin,
} from "./_shared";
import { verifyPassword } from "./_crypto";
import { createSessionTokens } from "./_sessions";
import { isPlainObject } from "../_request";
import { AUTH_INPUT_LIMITS } from "./_limits";

const INVALID = { error: "Credenciais inválidas.", code: "INVALID_CREDENTIALS" };
// Hash válido e não secreto, usado somente para manter custo de verificação
// semelhante quando o e-mail não existe. Nunca corresponde a uma conta real.
const DUMMY_PASSWORD_HASH =
  "pbkdf2$sha256$100000$bmV1cm9wZWQtYXV0aC1kdW1teQ==$O+SnV7JfIDxMFlQU1aFE6bBIXxdMwA/beS9qUXgBxs8=";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  const secret = env.NEUROPED_JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    return json(
      { error: "Autenticação não configurada (NEUROPED_JWT_SECRET ausente).", code: "AUTH_NOT_CONFIGURED" },
      503,
    );
  }
  if (!env.DB) {
    return json({ error: "Banco indisponível.", code: "DB_UNAVAILABLE" }, 503);
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
  const body = parsed as { email?: unknown; password?: unknown };

  const rawEmail = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (
    rawEmail.length > AUTH_INPUT_LIMITS.email ||
    password.length > AUTH_INPUT_LIMITS.password
  ) {
    return json(
      { error: "Credenciais excedem o tamanho permitido.", code: "VALIDATION_ERROR" },
      400,
    );
  }
  const email = rawEmail.toLowerCase().trim();
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
  const locked = Boolean(user && isLocked(user));
  const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_PASSWORD_HASH);

  // Não diferenciar conta inexistente, inativa, bloqueada ou senha incorreta na
  // resposta pública. O estado real permanece apenas no banco/auditoria.
  if (!user || !user.is_active || locked || !ok) {
    if (user && user.is_active && !locked && !ok) {
      await registerFailedAttempt(env.DB, user);
    }
    return json(INVALID, 401);
  }

  await registerSuccessfulLogin(env.DB, user);
  try {
    const tokens = await createSessionTokens(env.DB, user, secret);
    return json({ ...tokens, user: publicUser(user) }, 200);
  } catch (error) {
    console.error("[auth/login] não foi possível criar sessão revogável:", error);
    return json(
      { error: "Sessão de autenticação indisponível.", code: "AUTH_SESSION_UNAVAILABLE" },
      503,
    );
  }
};
