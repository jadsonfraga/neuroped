/**
 * Logger de eventos de auditoria. Persiste em audit_logs com timestamp imutavel.
 * Usar em todo ponto de acesso/modificacao de dados sensiveis.
 */

import type { Request } from "express";
import { db } from "../storage.js";
import { auditLogs, type AuditEventType } from "@shared/schema";

export interface AuditContext {
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export function getAuditContextFromRequest(req: Request): AuditContext {
  const ip = (
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.ip ||
    ""
  )
    .toString()
    .split(",")[0]
    .trim();

  const userId = (req as any).user?.id ?? null;

  return {
    userId,
    ipAddress: ip || null,
    userAgent: req.headers["user-agent"]?.toString().slice(0, 500) || null,
  };
}

export interface LogAuditParams {
  eventType: AuditEventType;
  context: AuditContext;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const meta = params.metadata
      ? JSON.stringify(redactSensitive(params.metadata))
      : null;

    db.insert(auditLogs)
      .values({
        eventType: params.eventType,
        userId: params.context.userId ?? null,
        ipAddress: params.context.ipAddress ?? null,
        userAgent: params.context.userAgent ?? null,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: meta,
        success: params.success !== false,
      })
      .run();
  } catch (e) {
    // Auditoria nao deve quebrar a request principal, mas o evento nao pode
    // sumir sem rastro: grava o payload completo em stderr para que o trail
    // sobreviva nos logs do processo mesmo com o banco indisponivel.
    console.error(
      "[audit] Falha ao gravar log de auditoria — evento preservado em stderr:",
      JSON.stringify({
        eventType: params.eventType,
        userId: params.context.userId ?? null,
        targetType: params.targetType,
        targetId: params.targetId,
        success: params.success !== false,
        at: new Date().toISOString(),
      }),
      e,
    );
  }
}

/** Remove campos potencialmente sensiveis antes de gravar metadata em log. */
function redactSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE_KEYS = new Set([
    "password",
    "passwordhash",
    "newpassword",
    "oldpassword",
    "token",
    "tokenhash",
    "refreshtoken",
    "accesstoken",
    "cpf",
    "cpfencrypted",
    "authorization",
    "cookie",
    "email",
    "recipient",
    "filename",
  ]);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const normalizedKey = k.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (SENSITIVE_KEYS.has(normalizedKey)) {
      out[k] = "[REDACTED]";
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        typeof item === "object" && item !== null
          ? redactSensitive(item as Record<string, unknown>)
          : item,
      );
    } else if (typeof v === "object" && v !== null) {
      out[k] = redactSensitive(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}
