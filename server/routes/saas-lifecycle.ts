/**
 * API de Lifecycle — Reativação de clínicas
 *
 * Endpoints:
 * POST /api/saas/lifecycle/request-reactivation
 * GET  /api/saas/lifecycle/status?tenantId=...
 */

import type { Express } from "express";
import { z } from "zod";
import { db } from "../storage.js";
import {
  tenantLifecycleEvents,
  lifecycleEventTypes,
  type TenantLifecycleEvent,
} from "@shared/saas-schema";
import { requireAuth } from "../middleware/auth.js";

/**
 * Schema para solicitar reativação
 */
const requestReactivationSchema = z
  .object({
    tenantId: z.string().min(1).max(255),
    reason: z.string().max(500).optional(),
  })
  .strict();

type RequestReactivationInput = z.infer<typeof requestReactivationSchema>;

/**
 * POST /api/saas/lifecycle/request-reactivation
 * Solicita reativação de uma clínica fechada
 */
function handleRequestReactivation(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const body = req.body;
    const input = requestReactivationSchema.parse(body);
    const user = req.user as any;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // TODO: Validar que user é owner/admin da clínica
    // if (!canManageClinic(user, input.tenantId)) {
    //   return res.status(403).json({ error: "Forbidden" });
    // }

    const now = new Date().toISOString();

    // Buscar último estado da clínica
    const lastEvent = db
      .select()
      .from(tenantLifecycleEvents)
      .where((t: any) => t.tenantId.eq(input.tenantId))
      .orderBy((t: any) => t.createdAt)
      .all()
      .at(-1) as TenantLifecycleEvent | undefined;

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
      reason: input.reason || undefined,
      triggeredBy: user.id,
      previousState,
      newState: "reactivation_requested",
      metadata: JSON.stringify({ ip: req.ip }),
      createdAt: now,
    } as any);

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
function handleGetStatus(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const tenantId = req.query.tenantId as string;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId query param" });
    }

    // TODO: Validar ownership
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Buscar todos os eventos dessa clínica
    const events = db
      .select()
      .from(tenantLifecycleEvents)
      .where((t: any) => t.tenantId.eq(tenantId))
      .orderBy((t: any) => t.createdAt)
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
  app.get(
    "/api/saas/lifecycle/status",
    requireAuth,
    handleGetStatus,
  );
}
