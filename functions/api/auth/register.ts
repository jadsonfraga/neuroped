import { hashPassword } from "./_crypto";
import { type Env, json } from "./_shared";
import { AUTH_INPUT_LIMITS } from "./_limits";
import { boundedText, isPlainObject } from "../_request";

const REGISTRATION_WINDOW_MS = 60 * 60 * 1000;
const REGISTRATION_MAX_ATTEMPTS = 5;
const REGISTRATION_RETENTION_MS = 24 * 60 * 60 * 1000;

interface RegistrationEnv extends Env {
  DB?: D1Database;
}

function normalizeEmail(value: unknown): string {
  return boundedText(value, AUTH_INPUT_LIMITS.email).toLowerCase();
}

function isValidEmail(value: string): boolean {
  if (!value || value.length > AUTH_INPUT_LIMITS.email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isAcceptablePassword(value: string): boolean {
  return value.length >= 12 && value.length <= AUTH_INPUT_LIMITS.password;
}

async function registrationBucket(secret: string, request: Request): Promise<string | null> {
  const ip = request.headers.get("CF-Connecting-IP")?.trim();
  if (!ip) return null;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`neuroped-auth-register-v1:${ip}`),
  );
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function consumeRegistrationAttempt(
  db: D1Database,
  secret: string,
  request: Request,
): Promise<Response | null> {
  const bucket = await registrationBucket(secret, request);
  if (!bucket) return null;

  const existing = await db
    .prepare(
      `SELECT attempts, blocked_until
         FROM auth_registration_rate_limits
        WHERE bucket_hash = ?
        LIMIT 1`,
    )
    .bind(bucket)
    .first<{ attempts: number; blocked_until: string | null }>();

  if (existing?.blocked_until) {
    const blockedUntil = Date.parse(existing.blocked_until);
    if (!Number.isFinite(blockedUntil) || blockedUntil > Date.now()) {
      return json(
        {
          error: "Muitas tentativas de criação de conta. Aguarde antes de tentar novamente.",
          code: "REGISTRATION_RATE_LIMITED",
        },
        429,
      );
    }
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const cutoffIso = new Date(now.getTime() - REGISTRATION_WINDOW_MS).toISOString();
  const retentionCutoffIso = new Date(now.getTime() - REGISTRATION_RETENTION_MS).toISOString();
  const blockedUntilIso = new Date(now.getTime() + REGISTRATION_WINDOW_MS).toISOString();

  await db.batch([
    db
      .prepare(
        `INSERT INTO auth_registration_rate_limits
          (bucket_hash, window_started_at, attempts, blocked_until, updated_at)
         VALUES (?, ?, 1, NULL, ?)
         ON CONFLICT(bucket_hash) DO UPDATE SET
           attempts = CASE
             WHEN auth_registration_rate_limits.window_started_at < ? THEN 1
             ELSE auth_registration_rate_limits.attempts + 1
           END,
           window_started_at = CASE
             WHEN auth_registration_rate_limits.window_started_at < ? THEN ?
             ELSE auth_registration_rate_limits.window_started_at
           END,
           blocked_until = CASE
             WHEN auth_registration_rate_limits.window_started_at < ? THEN NULL
             WHEN auth_registration_rate_limits.attempts + 1 >= ? THEN ?
             ELSE auth_registration_rate_limits.blocked_until
           END,
           updated_at = ?`,
      )
      .bind(
        bucket,
        nowIso,
        nowIso,
        cutoffIso,
        cutoffIso,
        nowIso,
        cutoffIso,
        REGISTRATION_MAX_ATTEMPTS,
        blockedUntilIso,
        nowIso,
      ),
    db
      .prepare(`DELETE FROM auth_registration_rate_limits WHERE updated_at < ?`)
      .bind(retentionCutoffIso),
  ]);

  return null;
}

export const onRequestPost: PagesFunction<RegistrationEnv> = async (context) => {
  const { env, request } = context;
  const secret = env.NEUROPED_JWT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    return json(
      { error: "Autenticação não configurada.", code: "AUTH_NOT_CONFIGURED" },
      503,
    );
  }
  if (!env.DB) {
    return json({ error: "Banco indisponível.", code: "DB_UNAVAILABLE" }, 503);
  }

  try {
    const limited = await consumeRegistrationAttempt(env.DB, secret, request);
    if (limited) return limited;
  } catch (error) {
    // Cadastro público é uma superfície de abuso. Se o limitador persistente não
    // estiver operacional, falha fechado sem afetar login de contas existentes.
    console.error("[auth/register] rate limiter indisponível", error);
    return json(
      { error: "Criação de conta temporariamente indisponível.", code: "REGISTRATION_GUARD_UNAVAILABLE" },
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

  const name = boundedText(parsed.name, 160);
  const email = normalizeEmail(parsed.email);
  const password = typeof parsed.password === "string" ? parsed.password : "";
  const specialty = boundedText(parsed.specialty, 120) || null;
  const professionalRegistry = boundedText(parsed.professionalRegistry, 80) || null;

  if (name.length < 2 || !isValidEmail(email)) {
    return json(
      { error: "Nome e e-mail profissional válidos são obrigatórios.", code: "VALIDATION_ERROR" },
      400,
    );
  }
  if (!isAcceptablePassword(password)) {
    return json(
      { error: "A senha deve ter pelo menos 12 caracteres.", code: "PASSWORD_TOO_WEAK" },
      400,
    );
  }

  const reserved = new Set(
    [env.ADMIN_EMAIL, env.NEUROPED_E2E_EMAIL]
      .map((value) => value?.trim().toLowerCase())
      .filter((value): value is string => Boolean(value)),
  );
  if (reserved.has(email)) {
    return json(
      { error: "Não foi possível criar uma conta com estes dados.", code: "ACCOUNT_CONFLICT" },
      409,
    );
  }

  const existing = await env.DB
    .prepare(`SELECT id FROM users WHERE lower(email) = ? LIMIT 1`)
    .bind(email)
    .first<{ id: string }>();
  if (existing) {
    return json(
      { error: "Já existe uma conta para este e-mail.", code: "ACCOUNT_EXISTS" },
      409,
    );
  }

  const userId = crypto.randomUUID();
  const auditId = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);

  try {
    const results = await env.DB.batch([
      env.DB
        .prepare(
          `INSERT INTO users
            (id, name, email, crm, specialty, password_hash, must_change_password,
             failed_login_attempts, role, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'professional', 1, ?, ?)`,
        )
        .bind(
          userId,
          name,
          email,
          professionalRegistry,
          specialty,
          passwordHash,
          now,
          now,
        ),
      env.DB
        .prepare(
          `INSERT INTO saas_audit_log
            (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
           VALUES (?, NULL, ?, 'account_register', 'user', ?, ?, ?)`,
        )
        .bind(
          auditId,
          userId,
          userId,
          JSON.stringify({ source: "self_service" }),
          now,
        ),
    ]);

    if (
      Number(results[0]?.meta?.changes ?? 0) !== 1 ||
      Number(results[1]?.meta?.changes ?? 0) !== 1
    ) {
      return json(
        { error: "Não foi possível criar a conta.", code: "REGISTRATION_STALE" },
        409,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/unique|constraint/i.test(message)) {
      return json(
        { error: "Já existe uma conta para este e-mail.", code: "ACCOUNT_EXISTS" },
        409,
      );
    }
    console.error("[auth/register] DB error", error);
    return json(
      { error: "Não foi possível criar a conta.", code: "REGISTRATION_FAILED" },
      500,
    );
  }

  return json(
    {
      ok: true,
      user: {
        id: userId,
        name,
        email,
        role: "professional",
        mustChangePassword: false,
      },
      next: "login",
    },
    201,
  );
};
