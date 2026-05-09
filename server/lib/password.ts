/**
 * Hash de senha com bcrypt. Cost factor 12 (≈250ms por hash em hardware moderno).
 * Implementa lockout por tentativas falhas: 5 falhas = locked por 15 minutos.
 */

import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function hashPassword(plaintext: string): Promise<string> {
  if (!plaintext || plaintext.length < 12) {
    throw new Error("Senha deve ter no minimo 12 caracteres");
  }
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  if (!plaintext || !hash) return false;
  try {
    return await bcrypt.compare(plaintext, hash);
  } catch {
    return false;
  }
}

export function shouldLockoutAccount(failedAttempts: number): boolean {
  return failedAttempts >= MAX_FAILED_ATTEMPTS;
}

export function calculateLockoutUntil(): string {
  const until = new Date(Date.now() + LOCKOUT_MINUTES * 60_000);
  return until.toISOString();
}

export function isAccountLocked(lockedUntil: string | null | undefined): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil).getTime() > Date.now();
}

export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  maxFailedAttempts: MAX_FAILED_ATTEMPTS,
  lockoutMinutes: LOCKOUT_MINUTES,
} as const;
