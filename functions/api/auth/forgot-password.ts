import { AUTH_INPUT_LIMITS } from "./_limits";
import {
  passwordResetDeliveryConfigured,
  sendPasswordResetEmail,
  type PasswordResetDeliveryEnv,
} from "./_passwordResetDelivery";
import { json } from "./_shared";
import { boundedText, isPlainObject } from "../_request";

const RESET_WINDOW_MS = 60 * 60 * 1000;
const RESET_MAX_ATTEMPTS = 5;
const RESET_TTL_MS = 30 * 60 * 1000;
const RESET_RETENTION_MS = 24 * 60 * 60 * 1000;

function genericAccepted(): Response {
  return json(
    {
      ok: true,
      message: "Se existir uma conta ativa para este e-mail, enviaremos instruções de redefinição.",
    },
    202,
  );
}

function normalizeEmail(value: unknown): string {
  return boundedText(value, AUTH_INPUT_LIMITS.email).toLowerCase();
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function resetBucket(secret: string, request: Request): Promise<string | null> {
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
    new TextEncoder().encode(`neuroped-auth-password-reset-v1:${ip}`),
  );
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function consumeResetAttempt(
  db: D1Database,
  secret: string,
  request: Request,
): Promise<boolean> {
  const bucket = await resetBucket(secret, request);
  if (!bucket) return true;

  const existing = await db
    .prepare(
      `SELECT attempts, blocked_until
         FROM auth_password_reset_rate_limits
        WHERE bucket_hash = ?
        LIMIT 1`,
    )
    .bind(bucket)
    .first<{ attempts: number; blocked_until: string | null }>();

  if (existing?.blocked_until) {
    const blockedUntil = Date.parse(existing.blocked_until);
    if (!Number.isFinite(blockedUntil) || blockedUntil > Date.now()) return false;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const cutoffIso = new Date(now.getTime() - RESET_WINDOW_MS).toISOString();
  const retentionCutoffIso = new Date(now.getTime() - RESET_RETENTION_MS).toISOString();
  const blockedUntilIso = new Date(now.getTime() + RESET_WINDOW_MS).toISOString();

  await db.batch([
    db
      .prepare(
        `INSERT INTO auth_password_reset_rate_limits
          (bucket_hash, window_started_at, attempts, blocked_until, updated_at)
         VALUES (?, ?, 1, NULL, ?)
         ON CONFLICT(bucket_hash) DO UPDATE SET
           attempts = CASE
             WHEN auth_password_reset_rate_limits.window_started_at < ? THEN 1
             ELSE auth_password_reset_rate_limits.attempts + 1
           END,
           window_started_at = CASE
             WHEN auth_password_reset_rate_limits.window_started_at < ? THEN ?
             ELSE auth_password_reset_rate_limits.window_started_at
           END,
           blocked_until = CASE
             WHEN auth_password_reset_rate_limits.window_started_at < ? THEN NULL
             WHEN auth_password_reset_rate_limits.attempts + 1 >= ? THEN ?
             ELSE auth_password_reset_rate_limits.blocked_until
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
        RESET_MAX_ATTEMPTS,
        blockedUntilIso,
        nowIso,
      ),
    db
      .prepare(`DELETE FROM auth_password_reset_rate_limits WHERE updated_at < ?`)
      .bind(retentionCutoffIso),
  ]);

  return true;
}

export const onRequestPost: PagesFunction<PasswordResetDeliveryEnv> = async (context) => {
  const db = context.env.DB;
  const secret = context.env.NEUROPED_JWT_SECRET?.trim();
  if (!db || !secret || secret.length < 32) return genericAccepted();

  try {
    const allowed = await consumeResetAttempt(db, secret, context.request);
    if (!allowed) return genericAccepted();
  } catch (error) {
    console.error("[auth/forgot-password] rate limiter indisponível", error);
    return genericAccepted();
  }

  let parsed: unknown;
  try {
    parsed = await context.request.json();
  } catch {
    return json({ error: "Corpo inválido.", code: "INVALID_JSON" }, 400);
  }
  if (!isPlainObject(parsed)) {
    return json({ error: "Corpo deve ser um objeto JSON.", code: "INVALID_JSON" }, 400);
  }

  const email = normalizeEmail(parsed.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return genericAccepted();
  if (!passwordResetDeliveryConfigured(context.env)) return genericAccepted();

  const user = await db
    .prepare(`SELECT id, email FROM users WHERE lower(email) = ? AND is_active = 1 LIMIT 1`)
    .bind(email)
    .first<{ id: string; email: string }>();
  if (!user) return genericAccepted();

  const e2eEmail = context.env.NEUROPED_E2E_EMAIL?.trim().toLowerCase();
  if (e2eEmail && user.email.trim().toLowerCase() === e2eEmail) return genericAccepted();

  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const tokenId = crypto.randomUUID();
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + RESET_TTL_MS).toISOString();

  try {
    await db.batch([
      db
        .prepare(
          `DELETE FROM auth_password_reset_tokens
            WHERE user_id = ? AND consumed_at IS NULL`,
        )
        .bind(user.id),
      db
        .prepare(
          `DELETE FROM auth_password_reset_tokens
            WHERE julianday(expires_at) <= julianday(?)`,
        )
        .bind(nowIso),
      db
        .prepare(
          `INSERT INTO auth_password_reset_tokens
            (id, user_id, token_hash, expires_at, consumed_at, consumed_by_request_id, created_at)
           VALUES (?, ?, ?, ?, NULL, NULL, ?)`,
        )
        .bind(tokenId, user.id, tokenHash, expiresAt, nowIso),
    ]);

    const delivered = await sendPasswordResetEmail(context.env, user.email, token);
    if (!delivered) {
      await db
        .prepare(`DELETE FROM auth_password_reset_tokens WHERE id = ? AND consumed_at IS NULL`)
        .bind(tokenId)
        .run();
      console.error("[auth/forgot-password] delivery failed");
      return genericAccepted();
    }

    await db
      .prepare(
        `INSERT INTO saas_audit_log
          (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
         VALUES (?, NULL, ?, 'password_reset_requested', 'user', ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        user.id,
        user.id,
        JSON.stringify({ source: "self_service", delivery: "email" }),
        nowIso,
      )
      .run();
  } catch (error) {
    console.error("[auth/forgot-password] recovery flow failed", error);
  }

  return genericAccepted();
};
