import { hashPassword } from "./_crypto";
import { getUserByEmail, json, type Env } from "./_shared";

const SIGNUP_WINDOW_MS = 15 * 60 * 1000;
const SIGNUP_MAX_PER_WINDOW = 5;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeEmail(value: unknown): string | null {
  const email = text(value, 320).toLowerCase();
  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) return null;
  return email;
}

async function ipBucket(secret: string, request: Request): Promise<string | null> {
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
    new TextEncoder().encode(`neuroped-public-signup-v1:${ip}`),
  );
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function consumeSignupQuota(db: D1Database, bucket: string | null): Promise<boolean> {
  if (!bucket) return true;
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS auth_signup_rate_limits (
       bucket_hash TEXT PRIMARY KEY,
       window_started_at TEXT NOT NULL,
       attempts INTEGER NOT NULL DEFAULT 0,
       updated_at TEXT NOT NULL
     )`,
  ).run();

  const now = new Date();
  const nowIso = now.toISOString();
  const cutoffIso = new Date(now.getTime() - SIGNUP_WINDOW_MS).toISOString();
  const result = await db.prepare(
    `INSERT INTO auth_signup_rate_limits (bucket_hash, window_started_at, attempts, updated_at)
     VALUES (?, ?, 1, ?)
     ON CONFLICT(bucket_hash) DO UPDATE SET
       attempts = CASE
         WHEN auth_signup_rate_limits.window_started_at < ? THEN 1
         ELSE auth_signup_rate_limits.attempts + 1
       END,
       window_started_at = CASE
         WHEN auth_signup_rate_limits.window_started_at < ? THEN ?
         ELSE auth_signup_rate_limits.window_started_at
       END,
       updated_at = ?
     RETURNING attempts`,
  ).bind(bucket, nowIso, nowIso, cutoffIso, cutoffIso, nowIso, nowIso).first<{ attempts: number }>();

  return Number(result?.attempts ?? SIGNUP_MAX_PER_WINDOW + 1) <= SIGNUP_MAX_PER_WINDOW;
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const db = env.DB;
  const secret = env.NEUROPED_JWT_SECRET?.trim() ?? "";
  if (!db) return json({ error: "Cadastro indisponível neste ambiente.", code: "DB_REQUIRED" }, 503);
  if (!secret) return json({ error: "Cadastro indisponível neste ambiente.", code: "AUTH_NOT_CONFIGURED" }, 503);

  const bucket = await ipBucket(secret, request);
  if (!(await consumeSignupQuota(db, bucket))) {
    return json({ error: "Muitas tentativas de cadastro. Tente novamente mais tarde.", code: "SIGNUP_RATE_LIMITED" }, 429);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "Corpo JSON inválido.", code: "INVALID_JSON" }, 400);
  }

  const name = text(body.name, 160);
  const email = normalizeEmail(body.email);
  const password = text(body.password, 200);
  if (name.length < 2 || !email || password.length < 10) {
    return json({
      error: "Informe nome, e-mail válido e senha com pelo menos 10 caracteres.",
      code: "SIGNUP_VALIDATION_ERROR",
    }, 400);
  }

  const existing = await getUserByEmail(db, email);
  if (existing) {
    return json({
      error: "Já existe uma conta com este e-mail. Entre com sua conta ou recupere o acesso.",
      code: "EMAIL_TAKEN",
    }, 409);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);
  try {
    await db.prepare(
      `INSERT INTO users
        (id, name, email, role, is_active, password_hash, must_change_password,
         failed_login_attempts, created_at, updated_at)
       VALUES (?, ?, ?, 'professional', 1, ?, 0, 0, ?, ?)`,
    ).bind(id, name, email, passwordHash, now, now).run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/unique|constraint/i.test(message)) {
      return json({
        error: "Já existe uma conta com este e-mail. Entre com sua conta ou recupere o acesso.",
        code: "EMAIL_TAKEN",
      }, 409);
    }
    console.error("[auth.signup]", error);
    return json({ error: "Não foi possível criar a conta.", code: "SIGNUP_FAILED" }, 500);
  }

  return json({ ok: true, user: { id, name, email, role: "professional" } }, 201);
};
