/**
 * API de Lifecycle — Reativação de clínicas
 *
 * Endpoints:
 * POST /api/saas/lifecycle/request-reactivation
 * GET  /api/saas/lifecycle/status?tenantId=...
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db } from "../storage.js";
import { tenantLifecycleEvents } from "@shared/saas-schema";
import { requireAuth } from "../middleware/auth.js";
import {
  getClinicMembership,
  personalClinicId,
  logAuthorizationAttempt,
} from "../middleware/saas-authorization.js";
import { canManageClinic } from "@shared/tenant";

/**
 * Um tenant do ciclo de vida é uma clínica. Só quem tem membership ativa com
 * papel de gestão pode ler o histórico ou pedir reativação — conhecer o
 * tenantId não basta.
 */
function canManageTenant(tenantId: string, userId: string): boolean {
  if (tenantId === personalClinicId(userId)) return true;
  const membership = getClinicMembership(tenantId, userId);
  return membership ? canManageClinic(membership.role) : false;
}

function authContextFor(req: Request, userId: string, tenantId: string) {
  return {
    userId,
    clinicId: tenantId,
    ip: req.ip || "unknown",
    userAgent: req.get("user-agent") || "unknown",
  };
}

/**
 * Schema para solicitar reativação
 */
const requestReactivationSchema = z
  .object({
    tenantId: z.string().min(1).max(255),
    reason: z.string().max(500).optional(),
  })
  .strict();

/**
 * POST /api/saas/lifecycle/request-reactivation
 * Solicita reativação de uma clínica fechada
 */
function handleRequestReactivation(req: Request, res: Response) {
  try {
    const body = req.body;
    const input = requestReactivationSchema.parse(body);
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!canManageTenant(input.tenantId, user.id)) {
      logAuthorizationAttempt(
        authContextFor(req, user.id, input.tenantId),
        "request_reactivation",
        `tenant:${input.tenantId}`,
        "denied",
        "insufficient_clinic_role",
      );
      return res.status(403).json({ error: "Tenant access denied" });
    }

    const now = new Date().toISOString();

    // Buscar último estado da clínica
    const events = db
      .select()
      .from(tenantLifecycleEvents)
      .where(eq(tenantLifecycleEvents.tenantId, input.tenantId))
      .orderBy(asc(tenantLifecycleEvents.createdAt))
      .all();

    const lastEvent = events.at(-1);
    const previousState = lastEvent?.newState || "unknown";

    // Validar que clínica está em estado "closed"
    if (previousState !== "closed") {
      return res.status(400).json({
        error: `Cannot request reactivation from state: ${previousState}`,
      });
    }

    // TODO: Validar subscription em Asaas antes de permitir reativação
    // const subscription = await getAsaasSubscription(tenantId);
    // if (!subscription || subscription.status !== 'active') {
    //   return res.status(402).json({
    //     error: "Active subscription required for reactivation"
    //   });
    // }

    // Registrar evento
    db.insert(tenantLifecycleEvents).values({
      id: `tle_${crypto.randomUUID()}`,
      tenantId: input.tenantId,
      eventType: "reactivation_requested",
      reason: input.reason ?? undefined,
      triggeredBy: user.id,
      previousState,
      newState: "reactivation_requested",
      metadata: JSON.stringify({ ip: req.ip }),
      createdAt: now,
    }).run();

    return res.json({
      success: true,
      tenantId: input.tenantId,
      event: "reactivation_requested",
      previousState,
      newState: "reactivation_requested",
      message: "Reactivation request submitted. Awaiting admin approval.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request", details: error.errors });
    }
    console.error("Error requesting reactivation:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/saas/lifecycle/status?tenantId=...
 * Retorna status de lifecycle da clínica
 */
function handleGetStatus(req: Request, res: Response) {
  try {
    const tenantId = req.query.tenantId as string;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId query param" });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!canManageTenant(tenantId, user.id)) {
      logAuthorizationAttempt(
        authContextFor(req, user.id, tenantId),
        "get_lifecycle_status",
        `tenant:${tenantId}`,
        "denied",
        "insufficient_clinic_role",
      );
      return res.status(403).json({ error: "Tenant access denied" });
    }

    // Buscar todos os eventos dessa clínica
    const events = db
      .select()
      .from(tenantLifecycleEvents)
      .where(eq(tenantLifecycleEvents.tenantId, tenantId))
      .orderBy(asc(tenantLifecycleEvents.createdAt))
      .all();

    if (events.length === 0) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const lastEvent = events[events.length - 1];
    const currentState = lastEvent.newState || "unknown";

    return res.json({
      tenantId,
      currentState,
      previousState: lastEvent.previousState,
      lastEventType: lastEvent.eventType,
      lastEventAt: lastEvent.createdAt,
      eventHistory: events.map((e) => ({
        type: e.eventType,
        state: e.newState,
        reason: e.reason,
        triggeredAt: e.createdAt,
        triggeredBy: e.triggeredBy,
      })),
    });
  } catch (error) {
    console.error("Error fetching lifecycle status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Registra rotas de lifecycle
 */
export function registerLifecycleRoutes(app: Express) {
  app.post(
    "/api/saas/lifecycle/request-reactivation",
    requireAuth,
    handleRequestReactivation,
  );
  app.get("/api/saas/lifecycle/status", requireAuth, handleGetStatus);
}
