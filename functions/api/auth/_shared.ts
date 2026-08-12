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

import { hashPassword } from "./_crypto";

export interface Env {
  DB?: D1Database;
  NEUROPED_JWT_SECRET?: string;
  ADMIN_EMAIL?: string;
  ADMIN_INITIAL_PASSWORD?: string;
  ADMIN_NAME?: string;
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

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

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
  return Number.isFinite(until) && until > Date.now();
}

/**
 * Incrementa falhas no próprio UPDATE. O formato anterior calculava
 * `attempts = row + 1` em memória depois do bcrypt; logins simultâneos podiam
 * ler o mesmo valor e sobrescrever o contador, enfraquecendo o lockout.
 */
export async function registerFailedAttempt(db: D1Database, u: UserRow): Promise<void> {
  const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString();
  await db
    .prepare(
      `UPDATE users
          SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
              locked_until = CASE
                WHEN COALESCE(failed_login_attempts, 0) + 1 >= ? THEN ?
                ELSE locked_until
              END
        WHERE id = ?`,
    )
    .bind(MAX_FAILED_ATTEMPTS, lockedUntil, u.id)
    .run();
}

export async function registerSuccessfulLogin(db: D1Database, u: UserRow): Promise<void> {
  await db
    .prepare(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL,
              last_login_at = ? WHERE id = ?`,
    )
    .bind(new Date().toISOString(), u.id)
    .run();
}

/**
 * Bootstrap idempotente do admin a partir de variáveis de ambiente
 * (ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD), definidas como secrets no Cloudflare.
 * - Se o usuário não existe: cria como admin ativo (sem forçar troca, pois a UI
 *   ainda não tem fluxo de troca de senha).
 * - Se existe mas sem password_hash (ex.: seed só com pin): faz backfill do hash.
 * Nunca sobrescreve uma senha já definida.
 */
export async function bootstrapAdmin(db: D1Database, env: Env): Promise<void> {
  const email = env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = env.ADMIN_INITIAL_PASSWORD;
  if (!email || !password) return;

  const existing = await getUserByEmail(db, email);
  const now = new Date().toISOString();

  if (existing) {
    if (!existing.password_hash) {
      const hash = await hashPassword(password);
      await db
        .prepare(
          `UPDATE users SET password_hash = ?, is_active = 1, must_change_password = 0,
                  updated_at = ? WHERE id = ?`,
        )
        .bind(hash, now, existing.id)
        .run();
    }
    return;
  }

  const id = crypto.randomUUID();
  const name = env.ADMIN_NAME || "Administrador";
  const hash = await hashPassword(password);
  await db
    .prepare(
      `INSERT INTO users (id, name, email, role, is_active, password_hash,
              must_change_password, failed_login_attempts, created_at, updated_at)
       VALUES (?, ?, ?, 'admin', 1, ?, 0, 0, ?, ?)`,
    )
    .bind(id, name, email, hash, now, now)
    .run();
}