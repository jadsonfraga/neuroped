/**
 * _shared.ts — Tipos e helpers comuns às functions de auth (D1 + JWT).
 *
 * Backend de autenticação nativo do Cloudflare Pages, sobre D1. Espelha o
 * contrato que a UI já espera (client/src/lib/authClient.ts):
 *   POST /api/auth/login    → { accessToken, refreshToken, expiresIn, user }
 *   POST /api/auth/refresh  → { accessToken, refreshToken }
 *   GET  /api/auth/me       → user
 *   POST /api/auth/logout   → { ok }
 */

import { hashPassword, verifyPassword } from "./_crypto";

export interface Env {
  DB?: D1Database;
  NEUROPED_JWT_SECRET?: string;
  ADMIN_EMAIL?: string;
  ADMIN_INITIAL_PASSWORD?: string;
  /** Migração única e explícita da senha admin existente; permanece desativada por padrão. */
  ADMIN_FORCE_PASSWORD_RESET?: string;
  ADMIN_NAME?: string;
  /** Conta técnica sentinela para smoke tests pós-deploy — nunca vinculada a uma clínica. */
  NEUROPED_E2E_EMAIL?: string;
  NEUROPED_E2E_PASSWORD?: string;
  NEUROPED_E2E_NAME?: string;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: number;
  password_hash: string | null;
  must_change_password: number | null;
  failed_login_attempts: number | null;
  locked_until: string | null;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
}

// TTLs em segundos: access curto (refresh automático no client em 401) e
// refresh moderado. O estado revogável é gerenciado em _sessions.ts.
export const ACCESS_TTL = 15 * 60; // 15 min
export const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 dias

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export { json } from "../_request";

export function publicUser(u: UserRow): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    mustChangePassword: !!u.must_change_password,
  };
}

export async function getUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db
    .prepare(
      `SELECT id, name, email, role, is_active, password_hash, must_change_password,
              failed_login_attempts, locked_until
         FROM users WHERE email = ? LIMIT 1`,
    )
    .bind(email.toLowerCase().trim())
    .first<UserRow>();
}

export async function getUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return db
    .prepare(
      `SELECT id, name, email, role, is_active, password_hash, must_change_password,
              failed_login_attempts, locked_until
         FROM users WHERE id = ? LIMIT 1`,
    )
    .bind(id)
    .first<UserRow>();
}

export function isLocked(u: UserRow): boolean {
  if (!u.locked_until) return false;
  const until = Date.parse(u.locked_until);
  // Campo presente porém malformado é estado inseguro: não reinterpretar como
  // conta desbloqueada. O operador precisa corrigir o dado antes do login.
  return !Number.isFinite(until) || until > Date.now();
}

export async function registerFailedAttempt(db: D1Database, u: UserRow): Promise<void> {
  const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString();
  // Incremento atômico: duas tentativas simultâneas não podem ler o mesmo contador
  // e sobrescrever uma à outra, postergando artificialmente o lockout.
  await db
    .prepare(
      `UPDATE users
          SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
              locked_until = CASE
                WHEN COALESCE(failed_login_attempts, 0) + 1 >= ? THEN ?
                ELSE locked_until
              END
        WHERE id = ? AND is_active = 1`,
    )
    .bind(MAX_FAILED_ATTEMPTS, lockedUntil, u.id)
    .run();
}

export async function registerSuccessfulLogin(db: D1Database, u: UserRow): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL,
              last_login_at = ?
        WHERE id = ? AND is_active = 1
          AND (locked_until IS NULL OR julianday(locked_until) <= julianday(?))`,
    )
    .bind(now, u.id, now)
    .run();
  return (result.meta?.changes ?? 0) === 1;
}

/**
 * Bootstrap idempotente do admin a partir de variáveis de ambiente
 * (ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD), definidas como secrets no Cloudflare.
 *
 * Além de criar contas novas, só migra a senha de uma conta existente quando
 * ADMIN_FORCE_PASSWORD_RESET=true e o marcador de bootstrap ainda não existe.
 * Sem essa flag, uma conta que já possui senha nunca é sobrescrita durante o
 * login, mesmo que ADMIN_INITIAL_PASSWORD esteja definido ou divergente.
 */
export async function bootstrapAdmin(db: D1Database, env: Env): Promise<void> {
  const email = env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = env.ADMIN_INITIAL_PASSWORD;
  if (!email || !password) return;

  const existing = await getUserByEmail(db, email);
  const now = new Date().toISOString();
  const markerKey = "auth.admin.bootstrap.v2";
  const forcePasswordReset = env.ADMIN_FORCE_PASSWORD_RESET?.trim().toLowerCase() === "true";
  const marker = forcePasswordReset
    ? await db
        .prepare("SELECT value FROM app_settings WHERE key = ? LIMIT 1")
        .bind(markerKey)
        .first<{ value: string | null }>()
    : null;

  if (existing) {
    const needsPasswordBootstrap =
      !existing.password_hash ||
      (forcePasswordReset && !marker);
    if (needsPasswordBootstrap) {
      const hash = await hashPassword(password);
      await db.batch([
        db
          .prepare(
            `UPDATE users SET password_hash = ?, is_active = 1, must_change_password = 0,
                    failed_login_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?`,
          )
          .bind(hash, now, existing.id),
        db
          .prepare(
            `DELETE FROM auth_refresh_sessions WHERE user_id = ?`,
          )
          .bind(existing.id),
        db
          .prepare(
            `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
          )
          .bind(markerKey, "completed", now),
      ]);
    }
    return;
  }

  const id = crypto.randomUUID();
  const name = env.ADMIN_NAME || "Administrador";
  const hash = await hashPassword(password);
  await db.batch([
    db
      .prepare(
        `INSERT INTO users (id, name, email, role, is_active, password_hash,
                must_change_password, failed_login_attempts, created_at, updated_at)
         VALUES (?, ?, ?, 'admin', 1, ?, 0, 0, ?, ?)`,
      )
      .bind(id, name, email, hash, now, now),
    db
      .prepare(
        `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
      )
      .bind(markerKey, "completed", now),
  ]);
}

/**
 * Mantém uma conta técnica sentinela dedicada aos smoke tests pós-deploy.
 * A conta nasce com role mínima e sem membership de clínica. Criação, rotação
 * e recuperação de lockout só podem ocorrer quando a própria credencial E2E
 * correta foi apresentada no login. Uma conta humana com membership clínica
 * jamais é capturada por este fluxo, mesmo que possua role global `reader`.
 */
export async function bootstrapE2EAccount(
  db: D1Database,
  env: Env,
  presentedPassword?: string,
): Promise<void> {
  const email = env.NEUROPED_E2E_EMAIL?.toLowerCase().trim();
  const password = env.NEUROPED_E2E_PASSWORD;
  if (!email || !password) return;
  if (presentedPassword !== password) {
    throw new Error("E2E_CREDENTIAL_MISMATCH");
  }

  const adminEmail = env.ADMIN_EMAIL?.toLowerCase().trim();
  if (adminEmail && email === adminEmail) {
    throw new Error("E2E_ACCOUNT_COLLIDES_WITH_ADMIN");
  }

  const existing = await getUserByEmail(db, email);
  const now = new Date().toISOString();

  if (existing) {
    if (existing.role !== "reader") {
      throw new Error("E2E_ACCOUNT_ROLE_INVALID");
    }

    const membership = await db
      .prepare(
        `SELECT 1 AS has_membership
           FROM clinic_memberships
          WHERE user_id = ?
          LIMIT 1`,
      )
      .bind(existing.id)
      .first<{ has_membership: number }>();
    if (membership) {
      throw new Error("E2E_ACCOUNT_HAS_CLINIC_MEMBERSHIP");
    }

    const passwordMatches = existing.password_hash
      ? await verifyPassword(password, existing.password_hash)
      : false;
    const ready =
      passwordMatches &&
      existing.is_active === 1 &&
      !existing.must_change_password &&
      !isLocked(existing);

    // Mesmo a sentinela já pronta passa por uma guarda atômica. Isso fecha a
    // janela entre o SELECT de membership e o retorno rápido: se um vínculo for
    // criado nesse intervalo, o UPDATE casa zero linhas e o login falha fechado.
    if (ready) {
      const guard = await db
        .prepare(
          `UPDATE users
              SET updated_at = updated_at
            WHERE id = ?
              AND role = 'reader'
              AND NOT EXISTS (
                SELECT 1 FROM clinic_memberships cm WHERE cm.user_id = users.id
              )`,
        )
        .bind(existing.id)
        .run();
      if ((guard.meta?.changes ?? 0) !== 1) {
        throw new Error("E2E_ACCOUNT_MEMBERSHIP_RACE");
      }
      return;
    }

    const hash = passwordMatches && existing.password_hash
      ? existing.password_hash
      : await hashPassword(password);

    // O NOT EXISTS no próprio UPDATE fecha o TOCTOU durante rotação/recuperação.
    // O DELETE de sessões também é condicionado ao mesmo invariante.
    const results = await db.batch([
      db
        .prepare(
          `UPDATE users
              SET password_hash = ?, is_active = 1, must_change_password = 0,
                  failed_login_attempts = 0, locked_until = NULL, updated_at = ?
            WHERE id = ?
              AND role = 'reader'
              AND NOT EXISTS (
                SELECT 1 FROM clinic_memberships cm WHERE cm.user_id = users.id
              )`,
        )
        .bind(hash, now, existing.id),
      db
        .prepare(
          `DELETE FROM auth_refresh_sessions
            WHERE user_id = ?
              AND EXISTS (
                SELECT 1 FROM users u
                 WHERE u.id = ?
                   AND u.role = 'reader'
                   AND u.password_hash = ?
                   AND NOT EXISTS (
                     SELECT 1 FROM clinic_memberships cm WHERE cm.user_id = u.id
                   )
              )`,
        )
        .bind(existing.id, existing.id, hash),
    ]);

    if ((results[0]?.meta?.changes ?? 0) !== 1) {
      throw new Error("E2E_ACCOUNT_MEMBERSHIP_RACE");
    }
    return;
  }

  const id = crypto.randomUUID();
  const name = env.NEUROPED_E2E_NAME || "Conta técnica E2E";
  const hash = await hashPassword(password);
  try {
    await db
      .prepare(
        `INSERT INTO users (id, name, email, role, is_active, password_hash,
                must_change_password, failed_login_attempts, created_at, updated_at)
         VALUES (?, ?, ?, 'reader', 1, ?, 0, 0, ?, ?)`,
      )
      .bind(id, name, email, hash, now, now)
      .run();
  } catch (error) {
    // Dois smokes concorrentes do mesmo deploy (Cloudflare e Vercel) podem
    // observar existing === null antes de qualquer um inserir. A restrição
    // UNIQUE de e-mail rejeita a segunda tentativa; se a sentinela vencedora
    // já existe com a role mínima, trata como criação idempotente em vez de
    // propagar a falha para o login do outro workflow.
    const winner = await getUserByEmail(db, email);
    if (!winner || winner.role !== "reader") {
      throw error;
    }
    // O SELECT acima ainda deixa uma janela entre a criação vencedora e esta
    // releitura. A mesma guarda atômica do caminho "ready" reconfirma
    // ausência de clinic_membership no momento da reconciliação, em vez de
    // aceitar o vencedor apenas pela role já lida.
    const guard = await db
      .prepare(
        `UPDATE users
            SET updated_at = updated_at
          WHERE id = ?
            AND role = 'reader'
            AND NOT EXISTS (
              SELECT 1 FROM clinic_memberships cm WHERE cm.user_id = users.id
            )`,
      )
      .bind(winner.id)
      .run();
    if ((guard.meta?.changes ?? 0) !== 1) {
      throw new Error("E2E_ACCOUNT_MEMBERSHIP_RACE", { cause: error });
    }
  }
}
