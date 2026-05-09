/**
 * Middleware de autenticacao e autorizacao.
 *
 *  requireAuth         — valida access token e popula req.user.
 *  optionalAuth        — popula req.user se token presente, mas nao bloqueia.
 *  requireRole(roles)  — checa se req.user.role pertence ao conjunto permitido.
 */

import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import type { UserRole } from "@shared/schema";

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

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required", code: "AUTH_MISSING" });
    return;
  }

  try {
    const claims = verifyAccessToken(token);
    req.user = {
      id: claims.sub,
      email: claims.email,
      role: claims.role,
      name: claims.name,
    };
    next();
  } catch (e: any) {
    res.status(401).json({
      error: "Invalid or expired token",
      code: "AUTH_INVALID",
      detail: process.env.NODE_ENV === "development" ? e.message : undefined,
    });
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
    req.user = {
      id: claims.sub,
      email: claims.email,
      role: claims.role,
      name: claims.name,
    };
  } catch {
    // Ignora token invalido em rotas opcionais
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
