/**
 * Middleware de autenticacao e autorizacao.
 *
 *  requireAuth         — valida access token e popula req.user.
 *  optionalAuth        — popula req.user se token presente, mas nao bloqueia.
 *  requireRole(roles)  — checa se req.user.role pertence ao conjunto permitido.
 */

import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { verifyAccessToken } from "../lib/jwt.js";
import { db } from "../storage.js";
import { users, type UserRole } from "@shared/schema";

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
  // Sem fallback de cookie: nenhuma rota grava access_token em cookie, e
  // aceitar cookies aqui abriria vetor CSRF via formulário urlencoded
  // (requisição "simples", sem preflight CORS).
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
    // Revalida contra o banco a cada request: desativação de conta, troca de
    // senha e mudança de papel valem imediatamente, não só após o TTL de 15min
    // do access token. Role vem do banco, nunca do token.
    const live = db
      .select({ id: users.id, email: users.email, role: users.role, name: users.name, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, claims.sub))
      .get();
    if (!live || !live.isActive) {
      res.status(401).json({ error: "Invalid or expired token", code: "AUTH_INVALID" });
      return;
    }
    req.user = {
      id: live.id,
      email: live.email,
      role: live.role,
      name: live.name,
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
    const live = db
      .select({ id: users.id, email: users.email, role: users.role, name: users.name, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, claims.sub))
      .get();
    if (live && live.isActive) {
      req.user = { id: live.id, email: live.email, role: live.role, name: live.name };
    }
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
