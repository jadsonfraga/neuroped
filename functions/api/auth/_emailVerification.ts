/**
 * _emailVerification.ts — emissão, entrega e limite de reenvio do token de
 * verificação de posse do e-mail.
 *
 * Espelha deliberadamente o desenho já provado da recuperação de senha (0020):
 * token aleatório de 256 bits, persistido só como SHA-256, TTL curto, uso
 * único, balde de rate limit persistente e link no fragmento da URL (o token
 * não integra a requisição HTTP ao origin/CDN).
 */
import { sha256Hex } from "./_crypto";
import { canonicalEmail } from "./_shared";
import type { Env } from "./_shared";
import {
  mailTransportConfigured,
  publicAppBaseUrl,
  sendTransactionalEmail,
  type MailTransportEnv,
} from "./_mailTransport";

export interface EmailVerificationEnv extends Env, MailTransportEnv {}

export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
export const VERIFICATION_WINDOW_MS = 60 * 60 * 1000;
export const VERIFICATION_MAX_ATTEMPTS = 5;
export const VERIFICATION_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export function emailVerificationConfigured(
  env: EmailVerificationEnv,
): boolean {
  return mailTransportConfigured(env);
}

export function randomVerificationToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export async function sendEmailVerification(
  env: EmailVerificationEnv,
  recipient: string,
  token: string,
): Promise<boolean> {
  const baseUrl = publicAppBaseUrl(env);
  if (!baseUrl) return false;

  const verifyUrl = `${baseUrl}/#/verificar-email?token=${encodeURIComponent(token)}`;
  return sendTransactionalEmail(env, {
    to: recipient,
    subject: "Confirme seu e-mail — NeuroPed",
    text: [
      "Uma conta NeuroPed foi criada com este endereço de e-mail.",
      "",
      `Confirme que o endereço é seu abrindo: ${verifyUrl}`,
      "",
      "O link expira em 24 horas e só pode ser usado uma vez.",
      "Enquanto o e-mail não for confirmado, a conta não pode criar uma clínica.",
      "",
      "Se você não criou esta conta, ignore esta mensagem — sem a confirmação,",
      "quem a criou não consegue avançar.",
    ].join("\n"),
  });
}

/**
 * Emite um token novo e invalida os pendentes do mesmo usuário.
 *
 * A entrega vem ANTES do commit do token só na aparência: se o envio falhar, o
 * token recém-criado é apagado — nada fica pendente sem que o destinatário
 * tenha recebido o link (mesma invariante do fluxo de senha).
 */
export async function issueEmailVerification(
  db: D1Database,
  env: EmailVerificationEnv,
  user: { id: string; email: string },
): Promise<boolean> {
  if (!emailVerificationConfigured(env)) return false;

  const token = randomVerificationToken();
  const tokenHash = await sha256Hex(token);
  const tokenId = crypto.randomUUID();
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();

  await db.batch([
    db
      .prepare(
        `DELETE FROM auth_email_verification_tokens
          WHERE user_id = ? AND consumed_at IS NULL`,
      )
      .bind(user.id),
    db
      .prepare(
        `DELETE FROM auth_email_verification_tokens
          WHERE julianday(expires_at) <= julianday(?)`,
      )
      .bind(nowIso),
    db
      .prepare(
        `INSERT INTO auth_email_verification_tokens
          (id, user_id, token_hash, email_at_issue, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        tokenId,
        user.id,
        tokenHash,
        canonicalEmail(user.email),
        expiresAt,
        nowIso,
      ),
  ]);

  const delivered = await sendEmailVerification(env, user.email, token);
  if (!delivered) {
    await db
      .prepare(
        `DELETE FROM auth_email_verification_tokens WHERE id = ? AND consumed_at IS NULL`,
      )
      .bind(tokenId)
      .run();
    console.error("[auth/email-verification] delivery failed");
    return false;
  }
  return true;
}

/**
 * Balde de rate limit do reenvio.
 *
 * Sem CF-Connecting-IP a requisição NÃO fica livre: cai num balde sentinela
 * compartilhado, sujeito ao mesmo teto. Ausência de header nunca desliga o
 * limitador.
 */
const NO_IP_BUCKET_SENTINEL = "sem-ip-identificavel";

async function verificationBucket(
  secret: string,
  request: Request,
): Promise<string> {
  const ip =
    request.headers.get("CF-Connecting-IP")?.trim() || NO_IP_BUCKET_SENTINEL;
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
    new TextEncoder().encode(`neuroped-auth-email-verification-v1:${ip}`),
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function consumeVerificationAttempt(
  db: D1Database,
  secret: string,
  request: Request,
): Promise<boolean> {
  const bucket = await verificationBucket(secret, request);

  const existing = await db
    .prepare(
      `SELECT attempts, blocked_until
         FROM auth_email_verification_rate_limits
        WHERE bucket_hash = ?
        LIMIT 1`,
    )
    .bind(bucket)
    .first<{ attempts: number; blocked_until: string | null }>();

  if (existing?.blocked_until) {
    const blockedUntil = Date.parse(existing.blocked_until);
    // Valor presente porém malformado é estado inseguro: não reinterpretar
    // como "liberado".
    if (!Number.isFinite(blockedUntil) || blockedUntil > Date.now())
      return false;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const cutoffIso = new Date(
    now.getTime() - VERIFICATION_WINDOW_MS,
  ).toISOString();
  const retentionCutoffIso = new Date(
    now.getTime() - VERIFICATION_RETENTION_MS,
  ).toISOString();
  const blockedUntilIso = new Date(
    now.getTime() + VERIFICATION_WINDOW_MS,
  ).toISOString();

  await db.batch([
    db
      .prepare(
        `INSERT INTO auth_email_verification_rate_limits
          (bucket_hash, window_started_at, attempts, blocked_until, updated_at)
         VALUES (?, ?, 1, NULL, ?)
         ON CONFLICT(bucket_hash) DO UPDATE SET
           attempts = CASE
             WHEN auth_email_verification_rate_limits.window_started_at < ? THEN 1
             ELSE auth_email_verification_rate_limits.attempts + 1
           END,
           window_started_at = CASE
             WHEN auth_email_verification_rate_limits.window_started_at < ? THEN ?
             ELSE auth_email_verification_rate_limits.window_started_at
           END,
           blocked_until = CASE
             WHEN auth_email_verification_rate_limits.window_started_at < ? THEN NULL
             WHEN auth_email_verification_rate_limits.attempts + 1 >= ? THEN ?
             ELSE auth_email_verification_rate_limits.blocked_until
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
        VERIFICATION_MAX_ATTEMPTS,
        blockedUntilIso,
        nowIso,
      ),
    db
      .prepare(
        `DELETE FROM auth_email_verification_rate_limits WHERE updated_at < ?`,
      )
      .bind(retentionCutoffIso),
  ]);

  return true;
}
