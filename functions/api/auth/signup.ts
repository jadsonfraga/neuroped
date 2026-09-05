import { hashPassword } from "./_crypto";
import { issueEmailVerification, type EmailVerificationEnv } from "./_emailVerification";
import { enforceLoginAbuseLimit, registerLoginAbuseFailure } from "./_rateLimit";
import { createSessionTokens } from "./_sessions";
import { getUserByEmail, json, publicUser, type UserRow } from "./_shared";
import { isPlainObject } from "../_request";

const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;
const EMAIL_MAX = 254;

/**
 * POST /api/auth/signup — cadastro self-service do SaaS.
 *
 * Fechado por padrão: só opera com SAAS_SIGNUP_ENABLED="true". Abrir cadastro
 * público numa plataforma de saúde é decisão de negócio do operador, não um
 * default de código. Enquanto desligado, a resposta é honesta (503), nunca um
 * fluxo fake.
 *
 * A conta nasce com papel global 'professional' e nenhuma clínica: o acesso a
 * dados clínicos continua condicionado a criar/entrar numa clínica (membership
 * + entitlement de billing), então o cadastro em si não expande superfície
 * clínica. Mesma política de senha do change-password; mesmo balde de abuso
 * por IP do login para conter criação em massa.
 */
function passwordPolicyError(password: string): string | null {
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return `A senha deve ter entre ${PASSWORD_MIN} e ${PASSWORD_MAX} caracteres.`;
  }
  if (!/[A-Z]/.test(password)) return "A senha deve conter letra maiúscula.";
  if (!/[a-z]/.test(password)) return "A senha deve conter letra minúscula.";
  if (!/[0-9]/.test(password)) return "A senha deve conter número.";
  if (!/[^A-Za-z0-9]/.test(password)) return "A senha deve conter símbolo.";
  return null;
}

function validEmail(email: string): boolean {
  return email.length <= EMAIL_MAX && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const onRequestPost: PagesFunction<EmailVerificationEnv> = async (context) => {
  const { env, request } = context;

  if (env.SAAS_SIGNUP_ENABLED !== "true") {
    return json(
      {
        error: "Cadastro self-service não está habilitado nesta instalação.",
        code: "SIGNUP_DISABLED",
      },
      503,
    );
  }
  if (!env.DB) return json({ error: "Banco indisponível.", code: "DB_UNAVAILABLE" }, 503);
  const secret = env.NEUROPED_JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    return json({ error: "Autenticação não configurada.", code: "AUTH_NOT_CONFIGURED" }, 503);
  }

  try {
    const limit = await enforceLoginAbuseLimit(env, request, secret);
    if (limit) return limit;
  } catch {
    // O middleware global mantém o teto por IP; indisponibilidade do bucket
    // auxiliar não bloqueia o cadastro.
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!isPlainObject(parsed)) return json({ error: "Corpo JSON inválido.", code: "INVALID_JSON" }, 400);
    body = parsed;
  } catch {
    return json({ error: "Corpo JSON inválido.", code: "INVALID_JSON" }, 400);
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 160) : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, EMAIL_MAX + 1) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2) return json({ error: "Informe seu nome completo.", code: "VALIDATION_ERROR" }, 400);
  if (!validEmail(email)) return json({ error: "E-mail inválido.", code: "VALIDATION_ERROR" }, 400);
  const policyError = passwordPolicyError(password);
  if (policyError) return json({ error: policyError, code: "WEAK_PASSWORD" }, 400);

  // Identidades reservadas da plataforma nunca podem nascer pelo cadastro
  // público — resposta idêntica à de e-mail em uso para não servir de oráculo
  // de configuração.
  const reservedEmails = [env.NEUROPED_E2E_EMAIL, env.ADMIN_EMAIL]
    .map((value) => value?.trim().toLowerCase())
    .filter(Boolean);
  const emailInUse = json(
    { error: "Este e-mail não está disponível para cadastro.", code: "EMAIL_IN_USE" },
    409,
  );
  if (reservedEmails.includes(email)) {
    try {
      await registerLoginAbuseFailure(env, request, secret);
    } catch {
      // Resposta externa idêntica mesmo sem o bucket distribuído.
    }
    return emailInUse;
  }

  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    const inserted = await env.DB
      .prepare(
        `INSERT INTO users
           (id, name, email, password_hash, must_change_password, failed_login_attempts,
            role, is_active, created_at, updated_at)
         SELECT ?, ?, ?, ?, 0, 0, 'professional', 1, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = ?)`,
      )
      .bind(userId, name, email, passwordHash, now, now, email)
      .run();
    if ((inserted.meta?.changes ?? 0) !== 1) {
      try {
        await registerLoginAbuseFailure(env, request, secret);
      } catch {
        // Tentativas repetidas contra e-mails existentes contam no teto de abuso.
      }
      return emailInUse;
    }
  } catch (error) {
    console.error("[auth/signup] DB error", error);
    return json({ error: "Não foi possível concluir o cadastro.", code: "DB_ERROR" }, 500);
  }

  const user = (await getUserByEmail(env.DB, email)) as UserRow | null;
  if (!user) {
    return json({ error: "Não foi possível concluir o cadastro.", code: "DB_ERROR" }, 500);
  }

  // Dispara a confirmação de posse do e-mail. É best-effort de propósito: a
  // conta já existe e não tem privilégio clínico nenhum até verificar (o gate
  // vive em POST /api/tenants), então falha de entrega não pode derrubar o
  // cadastro — o usuário pede reenvio em /api/auth/resend-verification.
  try {
    await issueEmailVerification(env.DB, env, { id: user.id, email: user.email });
  } catch (error) {
    console.error("[auth/signup] verificação de e-mail não emitida", error);
  }

  try {
    const tokens = await createSessionTokens(env.DB, user, secret);
    return json(
      { ...tokens, user: publicUser(user), emailVerificationRequired: true },
      201,
    );
  } catch (error) {
    console.error("[auth/signup] sessão indisponível", error);
    // A conta existe; sem sessão revogável não emitimos tokens — o usuário
    // entra pelo login normal.
    return json(
      { created: true, error: "Conta criada. Faça login para continuar.", code: "AUTH_SESSION_UNAVAILABLE" },
      503,
    );
  }
};
