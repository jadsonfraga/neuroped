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
// Mantidos por compatibilidade com tokens Express emitidos antes desta auditoria.
// O runtime Cloudflare usa issuer/audience próprios e não aceita estes tokens.
const JWT_ISSUER = "neuroped-edj";
const JWT_AUDIENCE = "neuroped-edj-client";

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
  type: "access";
  /** Id da família de sessão (mesmo valor gravado em refresh_tokens.session_id). */
  sid: string;
  iat: number;
  exp: number;
  /** Hash/id do refresh token que mantém esta sessão ativa. */
  sid: string;
}

export function signAccessToken(params: {
  userId: string;
  email: string;
  role: string;
  name: string;
  sessionId: string;
}): string {
  return jwt.sign(
    {
      sub: params.userId,
      email: params.email,
      role: params.role,
      name: params.name,
      type: "access",
      sid: params.sessionId,
    },
    getJwtSecret(),
    {
      algorithm: "HS256",
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    },
  );
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as AccessTokenClaims;
    if (
      decoded.type !== "access" ||
      typeof decoded.sub !== "string" || decoded.sub.length === 0 ||
      typeof decoded.email !== "string" || decoded.email.length === 0 ||
      typeof decoded.role !== "string" || decoded.role.length === 0 ||
      typeof decoded.name !== "string" || decoded.name.length === 0 ||
      typeof decoded.sid !== "string" || decoded.sid.length === 0 ||
      !Number.isInteger(decoded.iat) || !Number.isInteger(decoded.exp) ||
      decoded.exp <= decoded.iat
    ) {
      throw new Error("claims inválidas");
    }
    return decoded;
  } catch (e: any) {
    throw new JwtVerificationError(`Token invalido: ${e.message}`);
  }
}

/**
 * Gera novo refresh token. Retorna também o id persistido que vincula o
 * access token à sessão revogável. O valor em texto é enviado ao cliente e
 * somente o hash é gravado no DB.
 */
export function issueRefreshToken(): {
  id: string;
  token: string;
  tokenHash: string;
  expiresAt: string;
} {
  const id = crypto.randomUUID();
  const token = generateRandomToken(32);
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString();
  return { id, token, tokenHash, expiresAt };
}

export function hashRefreshToken(token: string): string {
  return sha256(token);
}

export const JWT_CONFIG = {
  accessTtlSeconds: ACCESS_TOKEN_TTL_SECONDS,
  refreshTtlSeconds: REFRESH_TOKEN_TTL_SECONDS,
} as const;
