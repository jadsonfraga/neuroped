/**
 * JWT short-lived (15min) para acesso + refresh token long-lived (7 dias) com rotacao.
 *
 * Estrategia:
 *  - Access token: JWT HS256, payload pequeno (sub, role, iat, exp).
 *  - Refresh token: opaco (random 32 bytes), armazenado em DB com hash SHA-256.
 *  - Rotacao: cada refresh emite NOVO refresh token e revoga o anterior.
 *  - Reuse-detection: se o cliente apresentar token revogado, revogamos toda a familia.
 */

import jwt from "jsonwebtoken";
import { generateRandomToken, sha256 } from "./crypto.js";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 min
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 dias

export class JwtConfigurationError extends Error {}
export class JwtVerificationError extends Error {}

function getJwtSecret(): string {
  const secret = process.env.NEUROPED_JWT_SECRET;
  if (!secret) {
    throw new JwtConfigurationError(
      "NEUROPED_JWT_SECRET ausente. Defina com pelo menos 32 caracteres aleatorios em .env.",
    );
  }
  if (secret.length < 32) {
    throw new JwtConfigurationError("NEUROPED_JWT_SECRET muito curto. Minimo 32 caracteres.");
  }
  return secret;
}

export interface AccessTokenClaims {
  sub: string; // user.id
  email: string;
  role: string;
  name: string;
  iat: number;
  exp: number;
}

export function signAccessToken(params: {
  userId: string;
  email: string;
  role: string;
  name: string;
}): string {
  return jwt.sign(
    {
      sub: params.userId,
      email: params.email,
      role: params.role,
      name: params.name,
    },
    getJwtSecret(),
    {
      algorithm: "HS256",
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      issuer: "neuroped-edj",
      audience: "neuroped-edj-client",
    },
  );
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: "neuroped-edj",
      audience: "neuroped-edj-client",
    }) as AccessTokenClaims;
    return decoded;
  } catch (e: any) {
    throw new JwtVerificationError(`Token invalido: ${e.message}`);
  }
}

/**
 * Gera novo refresh token. Retorna o valor em texto (para enviar ao cliente)
 * e o hash (para gravar em DB).
 */
export function issueRefreshToken(): {
  token: string;
  tokenHash: string;
  expiresAt: string;
} {
  const token = generateRandomToken(32);
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString();
  return { token, tokenHash, expiresAt };
}

export function hashRefreshToken(token: string): string {
  return sha256(token);
}

export const JWT_CONFIG = {
  accessTtlSeconds: ACCESS_TOKEN_TTL_SECONDS,
  refreshTtlSeconds: REFRESH_TOKEN_TTL_SECONDS,
} as const;
