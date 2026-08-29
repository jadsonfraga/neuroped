/**
 * SaaS Authorization Middleware
 *
 * Resolve o acesso a uma clínica EXCLUSIVAMENTE por membership explícita,
 * espelhando o contrato do D1 em functions/api/tenant/_core.ts. Um `clinicId`
 * enviado pelo cliente (query, body ou rota) é apenas um pedido: só passa se
 * existir uma linha ativa em `clinic_memberships` ligando aquele usuário
 * àquela clínica. O papel global `admin` NÃO é bypass entre clínicas.
 *
 * Toda tentativa — permitida ou negada — é registrada em `authorization_logs`.
 */

import type { Request, Response, NextFunction } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../storage.js";
import {
  authorizationLogs,
  clinicMemberships,
  type ClinicMembership,
} from "@shared/saas-schema-extended";
import { canManageClinic, type ClinicMembershipRole } from "@shared/tenant";

type AuthContext = {
  userId: string;
  clinicId: string;
  role?: string;
  ip: string;
  userAgent: string;
};

/**
 * Clínica pessoal de um usuário. Serve de escopo padrão quando o cliente não
 * pede uma clínica específica, para que a superfície SaaS seja utilizável sem
 * depender de um provisionamento de clínicas que o runtime Express ainda não
 * possui. O identificador é derivado no servidor — nunca aceito do cliente.
 */
export function personalClinicId(userId: string): string {
  return `user_${userId}`;
}

/**
 * Garante que o usuário seja `owner` da própria clínica pessoal.
 * Idempotente: repetir a chamada não altera uma membership existente.
 */
export function ensurePersonalClinicMembership(userId: string): string {
  const clinicId = personalClinicId(userId);
  try {
    const existing = db
      .select()
      .from(clinicMemberships)
      .where(
        and(
          eq(clinicMemberships.clinicId, clinicId),
          eq(clinicMemberships.userId, userId),
        ),
      )
      .get();

    if (!existing) {
      db.insert(clinicMemberships)
        .values({
          clinicId,
          userId,
          role: "owner",
          active: true,
          createdAt: new Date().toISOString(),
        })
        .onConflictDoNothing()
        .run();
    }
  } catch (err) {
    console.error("Failed to ensure personal clinic membership:", err);
  }
  return clinicId;
}

/**
 * Busca a membership ativa do usuário na clínica. Retorna null quando não há
 * vínculo — o chamador deve tratar isso como negação (fail closed).
 */
export function getClinicMembership(
  clinicId: string,
  userId: string,
): ClinicMembership | null {
  try {
    const row = db
      .select()
      .from(clinicMemberships)
      .where(
        and(
          eq(clinicMemberships.clinicId, clinicId),
          eq(clinicMemberships.userId, userId),
          eq(clinicMemberships.active, true),
        ),
      )
      .get();
    return row ?? null;
  } catch (err) {
    // Falha de armazenamento não pode abrir uma clínica de terceiro.
    console.error("Membership lookup failed:", err);
    return null;
  }
}

/**
 * Logs authorization attempts (allowed and denied)
 */
export function logAuthorizationAttempt(
  context: AuthContext,
  action: string,
  resource: string | undefined,
  result: "allowed" | "denied",
  reason?: string,
) {
  try {
    db.insert(authorizationLogs)
      .values({
        id: `alog_${crypto.randomUUID()}`,
        clinicId: context.clinicId,
        userId: context.userId,
        action,
        resource,
        result,
        reason,
        ipAddress: context.ip,
        userAgent: context.userAgent,
        createdAt: new Date().toISOString(),
      })
      .run();
  } catch (err) {
    console.error("Failed to log authorization attempt:", err);
  }
}

function contextFrom(req: Request, userId: string, clinicId: string): AuthContext {
  return {
    userId,
    clinicId,
    ip: req.ip || "unknown",
    userAgent: req.get("user-agent") || "unknown",
  };
}

/**
 * Middleware: resolve e valida a clínica do pedido.
 *
 * Sem `clinicId` explícito o pedido é escopado à clínica pessoal do usuário.
 * Com `clinicId` explícito, exige membership ativa — caso contrário 403.
 */
export function validateClinicOwnership(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const requested =
      (typeof req.query.clinicId === "string" ? req.query.clinicId : undefined) ||
      (typeof req.body?.clinicId === "string" ? req.body.clinicId : undefined);

    // Sem clínica pedida: escopo pessoal, derivado no servidor.
    if (!requested) {
      const clinicId = ensurePersonalClinicMembership(user.id);
      (req as any).clinicId = clinicId;
      (req as any).clinicRole = "owner" as ClinicMembershipRole;
      (req as any).authContext = contextFrom(req, user.id, clinicId);
      return next();
    }

    // Clínica pedida: só passa com membership ativa.
    const membership =
      requested === personalClinicId(user.id)
        ? { clinicId: requested, userId: user.id, role: "owner" as const, active: true, createdAt: "" }
        : getClinicMembership(requested, user.id);

    if (!membership) {
      const context = contextFrom(req, user.id, requested);
      logAuthorizationAttempt(
        context,
        `${req.method} ${req.path}`,
        `clinic:${requested}`,
        "denied",
        "clinic_membership_missing",
      );
      return res.status(403).json({ error: "Clinic access denied" });
    }

    (req as any).clinicId = membership.clinicId;
    (req as any).clinicRole = membership.role;
    (req as any).authContext = contextFrom(req, user.id, membership.clinicId);
    next();
  } catch (error) {
    console.error("Clinic ownership validation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware: exige um papel com permissão de gestão na clínica já resolvida
 * por `validateClinicOwnership`. Use em escrita de configuração da clínica.
 */
export function requireClinicManager(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const role = (req as any).clinicRole as ClinicMembershipRole | undefined;
  const context = (req as any).authContext as AuthContext | undefined;

  if (!role || !canManageClinic(role)) {
    if (context) {
      logAuthorizationAttempt(
        context,
        `${req.method} ${req.path}`,
        undefined,
        "denied",
        "insufficient_clinic_role",
      );
    }
    return res.status(403).json({ error: "Insufficient clinic role" });
  }
  next();
}

/**
 * Export auth context type for route handlers
 */
export type AuthorizationContext = AuthContext;
