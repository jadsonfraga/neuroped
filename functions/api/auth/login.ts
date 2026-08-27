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
import { bootstrapHardenedE2EAccount } from "./_e2eBootstrap";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "./_crypto";
import { createSessionTokens } from "./_sessions";
import { isPlainObject } from "../_request";
import { AUTH_INPUT_LIMITS } from "./_limits";
import { enforceLoginAbuseLimit, registerLoginAbuseFailure } from "./_rateLimit";

const INVALID = { error: "Credenciais inválidas.", code: "INVALID_CREDENTIALS" };

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

  // ADMIN_EMAIL e NEUROPED_E2E_EMAIL são identidades mutuamente exclusivas.
  // Falhar antes de qualquer bootstrap impede criar uma conta privilegiada no
  // endereço reservado à sentinela técnica em bancos ainda vazios.
  const adminEmail = env.ADMIN_EMAIL?.toLowerCase().trim();
  const e2eEmail = env.NEUROPED_E2E_EMAIL?.toLowerCase().trim();
  const e2ePassword = env.NEUROPED_E2E_PASSWORD;
  if (adminEmail && e2eEmail && adminEmail === e2eEmail) {
    console.error("[auth/login] ADMIN_EMAIL colide com NEUROPED_E2E_EMAIL reservado");
    return json(
      { error: "Autenticação temporariamente indisponível.", code: "AUTH_CONFIGURATION_INVALID" },
      503,
    );
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

  try {
    const abuseLimit = await enforceLoginAbuseLimit(env, request, secret);
    if (abuseLimit) return abuseLimit;
  } catch {
    // O lockout por conta continua disponível; falha do limitador auxiliar não
    // transforma indisponibilidade de telemetria em indisponibilidade de login.
  }

  // O bootstrap administrativo continua best-effort, mas só depois de provar
  // que sua identidade não colide com a sentinela E2E.
  try {
    await bootstrapAdmin(env.DB, env);
  } catch {
    /* bootstrap é best-effort; não bloqueia login de usuários já existentes */
  }

  // O e-mail E2E é reservado. Qualquer tentativa com esse e-mail precisa
  // apresentar exatamente o secret técnico atual; nunca cai no fluxo humano.
  const isReservedE2EIdentity = !!e2eEmail && email === e2eEmail;
  if (isReservedE2EIdentity) {
    if (!e2ePassword || password !== e2ePassword) {
      try {
        await registerLoginAbuseFailure(env, request, secret);
      } catch {
        // Resposta externa permanece genérica.
      }
      return json(INVALID, 401);
    }
    try {
      await bootstrapHardenedE2EAccount(env.DB, env, password);
    } catch {
      return json(INVALID, 401);
    }
  }

  const user = await getUserByEmail(env.DB, email);
  const locked = user ? isLocked(user) : false;

  // Mesmo quando o e-mail não existe, executa PBKDF2 sobre um hash sentinela.
  const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_PASSWORD_HASH);
  if (!user || !user.is_active || locked || !ok) {
    if (user && user.is_active && !locked && !ok) {
      await registerFailedAttempt(env.DB, user);
      try {
        await registerLoginAbuseFailure(env, request, secret);
      } catch {
        // O contador atômico por conta já foi registrado.
      }
    } else {
      try {
        await registerLoginAbuseFailure(env, request, secret);
      } catch {
        // A resposta externa continua genérica mesmo sem o bucket distribuído.
      }
    }
    return json(INVALID, 401);
  }

  if (!(await registerSuccessfulLogin(env.DB, user))) {
    return json(INVALID, 401);
  }
  try {
    const tokens = await createSessionTokens(env.DB, user, secret, {
      requireNoClinicMembership: isReservedE2EIdentity,
    });
    return json({ ...tokens, user: publicUser(user) }, 200);
  } catch (error) {
    console.error("[auth/login] não foi possível criar sessão revogável:", error);
    return json(
      { error: "Sessão de autenticação indisponível.", code: "AUTH_SESSION_UNAVAILABLE" },
      503,
    );
  }
};
