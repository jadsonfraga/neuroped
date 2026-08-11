/**
 * Middleware de autenticacao e autorizacao.
 *
 *  requireAuth         — valida access token, confirma conta ativa no banco e popula req.user.
 *  optionalAuth        — popula req.user somente quando token e conta atual são válidos.
 *  requireRole(roles)  — checa o PAPEL ATUAL do banco, nunca o papel congelado no JWT.
 */

import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { users, type UserRole } from "@shared/schema";
import { verifyAccessToken, type AccessTokenClaims } from "../lib/jwt.js";
import { db } from "../storage.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
      name: string;
    };
  }
}

function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  // Fallback para cookie httpOnly se o cliente preferir.
  if (req.cookies && typeof req.cookies.access_token === "string") {
    return req.cookies.access_token;
  }
  return null;
}

function currentUserForClaims(claims: AccessTokenClaims): Request["user"] | null {
  const current = db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, claims.sub))
    .get();

  if (!current?.isActive) return null;
  return {
    id: current.id,
    email: current.email,
    role: current.role,
    name: current.name,
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required", code: "AUTH_MISSING" });
    return;
  }

  let claims: AccessTokenClaims;
  try {
    claims = verifyAccessToken(token);
  } catch (e: any) {
    res.status(401).json({
      error: "Invalid or expired token",
      code: "AUTH_INVALID",
      detail: process.env.NODE_ENV === "development" ? e.message : undefined,
    });
    return;
  }

  try {
    // Revogação e RBAC precisam refletir o estado atual, não os claims de até
    // 15 minutos atrás. Isso invalida imediatamente conta desativada e impede
    // que redução de papel preserve privilégios via JWT antigo.
    const current = currentUserForClaims(claims);
    if (!current) {
      res.status(401).json({ error: "Invalid or inactive session", code: "AUTH_INVALID" });
      return;
    }
    req.user = current;
    next();
  } catch (error) {
    console.error("[auth] current-user lookup failed:", error);
    res.status(503).json({ error: "Authentication temporarily unavailable", code: "AUTH_UNAVAILABLE" });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    const claims = verifyAccessToken(token);
    const current = currentUserForClaims(claims);
    if (current) req.user = current;
  } catch {
    // Rota opcional permanece anônima quando token, conta ou banco não validam.
  }
  next();
}

export function requireRole(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required", code: "AUTH_MISSING" });
      return;
    }
    if (!allowed.includes(req.user.role as UserRole)) {
      res.status(403).json({
        error: "Insufficient permissions",
        code: "FORBIDDEN",
        required: allowed,
      });
      return;
    }
    next();
  };
}

/** Atalho: rota requer admin */
export const requireAdmin = requireRole("admin");
/** Atalho: rota requer profissional ou superior */
export const requireProfessional = requireRole("admin", "professional");
