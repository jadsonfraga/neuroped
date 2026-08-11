import { json, type Env } from "./_shared";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_WINDOW = 30;

interface RateLimitRow {
  failed_attempts: number;
  blocked_until: string | null;
}

async function bucketHash(secret: string, request: Request): Promise<string | null> {
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
    new TextEncoder().encode(`neuroped-auth-rate-limit-v1:${ip}`),
  );
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function ensureRateLimitSchema(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS auth_login_rate_limits (
        bucket_hash TEXT PRIMARY KEY,
        window_started_at TEXT NOT NULL,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        blocked_until TEXT,
        updated_at TEXT NOT NULL
      )`,
    )
    .run();
}

/**
 * Retorna 429 apenas quando um bucket já está bloqueado. Sem CF-Connecting-IP
 * (testes locais / ambientes fora do Cloudflare), o controle por conta continua
 * ativo e este limitador distribuído fica inerte.
 */
export async function enforceLoginAbuseLimit(
  env: Env,
  request: Request,
  secret: string,
): Promise<Response | null> {
  if (!env.DB) return null;
  const bucket = await bucketHash(secret, request);
  if (!bucket) return null;

  await ensureRateLimitSchema(env.DB);
  const row = await env.DB
    .prepare(
      `SELECT failed_attempts, blocked_until
         FROM auth_login_rate_limits
        WHERE bucket_hash = ?
        LIMIT 1`,
    )
    .bind(bucket)
    .first<RateLimitRow>();

  if (!row?.blocked_until) return null;
  const blockedUntil = Date.parse(row.blocked_until);
  if (!Number.isFinite(blockedUntil) || blockedUntil <= Date.now()) return null;

  return json(
    {
      error: "Muitas tentativas de autenticação. Aguarde alguns minutos.",
      code: "LOGIN_RATE_LIMITED",
    },
    429,
  );
}

/**
 * Registra somente falhas. O contador é atualizado atomicamente pelo SQLite,
 * evitando read-modify-write em memória. O bucket é HMAC do IP, nunca IP bruto.
 */
export async function registerLoginAbuseFailure(
  env: Env,
  request: Request,
  secret: string,
): Promise<void> {
  if (!env.DB) return;
  const bucket = await bucketHash(secret, request);
  if (!bucket) return;

  await ensureRateLimitSchema(env.DB);
  const now = new Date();
  const nowIso = now.toISOString();
  const cutoffIso = new Date(now.getTime() - WINDOW_MS).toISOString();
  const blockedUntil = new Date(now.getTime() + WINDOW_MS).toISOString();

  await env.DB
    .prepare(
      `INSERT INTO auth_login_rate_limits
        (bucket_hash, window_started_at, failed_attempts, blocked_until, updated_at)
       VALUES (?, ?, 1, NULL, ?)
       ON CONFLICT(bucket_hash) DO UPDATE SET
         failed_attempts = CASE
           WHEN auth_login_rate_limits.window_started_at < ? THEN 1
           ELSE auth_login_rate_limits.failed_attempts + 1
         END,
         window_started_at = CASE
           WHEN auth_login_rate_limits.window_started_at < ? THEN ?
           ELSE auth_login_rate_limits.window_started_at
         END,
         blocked_until = CASE
           WHEN auth_login_rate_limits.window_started_at < ? THEN NULL
           WHEN auth_login_rate_limits.failed_attempts + 1 >= ? THEN ?
           ELSE auth_login_rate_limits.blocked_until
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
      MAX_FAILURES_PER_WINDOW,
      blockedUntil,
      nowIso,
    )
    .run();
}
