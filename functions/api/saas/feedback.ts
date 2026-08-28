/**
 * API de Feedback — NPS e ratings pós-consulta
 *
 * Endpoints:
 * POST /api/saas/feedback/appointments/:appointmentId/submit
 * GET  /api/saas/feedback/metrics?clinicId=...&from=...&to=...
 * GET  /api/saas/feedback/appointments/:appointmentId
 */

import { Hono } from "hono";
import { z } from "zod";
import type { HonoContext } from "./types";
import {
  appointmentFeedback,
  submitAppointmentFeedbackSchema,
  type OperationsFeedbackMetrics,
} from "@shared/saas-schema";

const router = new Hono<HonoContext>();

/**
 * Calcula sentiment baseado em NPS ou rating
 */
function calculateSentiment(rating?: number, npsScore?: number): "positive" | "neutral" | "negative" | null {
  if (npsScore !== undefined) {
    if (npsScore >= 9) return "positive";
    if (npsScore >= 7) return "neutral";
    return "negative";
  }

  if (rating !== undefined) {
    if (rating >= 4) return "positive";
    if (rating === 3) return "neutral";
    return "negative";
  }

  return null;
}

/**
 * POST /api/saas/feedback/appointments/:appointmentId/submit
 * Submete feedback de uma consulta
 */
router.post("/appointments/:appointmentId/submit", async (c) => {
  try {
    const appointmentId = c.req.param("appointmentId");
    const body = await c.req.json();
    const input = submitAppointmentFeedbackSchema.parse(body);

    const db = c.get("db");
    if (!db) {
      return c.json({ error: "Database not available" }, 500);
    }

    const now = new Date().toISOString();
    const sentiment = calculateSentiment(input.rating, input.npsScore);

    // Verificar se já existe feedback para este appointment
    const existing = await db
      .select()
      .from(appointmentFeedback)
      .where((t) => t.appointmentId.eq(appointmentId))
      .first();

    if (existing) {
      // Atualizar existente
      await db
        .update(appointmentFeedback)
        .set({
          rating: input.rating || undefined,
          npsScore: input.npsScore || undefined,
          comment: input.comment || undefined,
          sentiment: sentiment || undefined,
          respondedAt: now,
          updatedAt: now,
        })
        .where((t) => t.appointmentId.eq(appointmentId))
        .run();
    } else {
      // Criar novo (clinicId será preenchido pela chamada)
      const clinicId = c.req.query("clinicId") || "unknown";
      await db
        .insert(appointmentFeedback)
        .values({
          id: `af_${crypto.randomUUID()}`,
          appointmentId,
          clinicId,
          rating: input.rating || undefined,
          npsScore: input.npsScore || undefined,
          comment: input.comment || undefined,
          sentiment: sentiment || undefined,
          respondedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    return c.json({
      success: true,
      appointmentId,
      feedback: {
        rating: input.rating,
        npsScore: input.npsScore,
        sentiment,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request", details: error.errors }, 400);
    }
    console.error("Error submitting feedback:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * GET /api/saas/feedback/appointments/:appointmentId
 * Retorna feedback de uma consulta
 */
router.get("/appointments/:appointmentId", async (c) => {
  try {
    const appointmentId = c.req.param("appointmentId");

    const db = c.get("db");
    if (!db) {
      return c.json({ error: "Database not available" }, 500);
    }

    const feedback = await db
      .select()
      .from(appointmentFeedback)
      .where((t) => t.appointmentId.eq(appointmentId))
      .first();

    if (!feedback) {
      return c.json({ error: "Feedback not found" }, 404);
    }

    return c.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * GET /api/saas/feedback/metrics?clinicId=...&from=...&to=...
 * Retorna métricas agregadas de feedback
 */
router.get("/metrics", async (c) => {
  try {
    const clinicId = c.req.query("clinicId");
    const from = c.req.query("from");
    const to = c.req.query("to");

    if (!clinicId || !from || !to) {
      return c.json(
        { error: "Missing required query params: clinicId, from, to" },
        400,
      );
    }

    // Validar datas ISO
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return c.json({ error: "Invalid date format. Use ISO 8601" }, 400);
    }

    const db = c.get("db");
    if (!db) {
      return c.json({ error: "Database not available" }, 500);
    }

    // Buscar todos os feedbacks no período
    const feedbacks = await db
      .select()
      .from(appointmentFeedback)
      .where(
        (t) =>
          t.clinicId.eq(clinicId) &&
          t.createdAt.gte(from) &&
          t.createdAt.lte(to),
      )
      .all();

    // Agregar métricas
    const respondedFeedbacks = feedbacks.filter((f) => f.respondedAt);
    const ratings = respondedFeedbacks
      .filter((f) => f.rating)
      .map((f) => f.rating as number);
    const npsScores = respondedFeedbacks
      .filter((f) => f.npsScore !== null)
      .map((f) => f.npsScore as number);

    const averageRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

    const averageNps =
      npsScores.length > 0
        ? Math.round(npsScores.reduce((a, b) => a + b, 0) / npsScores.length)
        : null;

    // Determinar categoria de NPS
    let npsCategory: "detractors" | "passives" | "promoters" | null = null;
    if (averageNps !== null) {
      if (averageNps >= 9) npsCategory = "promoters";
      else if (averageNps >= 7) npsCategory = "passives";
      else npsCategory = "detractors";
    }

    // Contar sentimentos
    const sentimentCounts = {
      positive: feedbacks.filter((f) => f.sentiment === "positive").length,
      neutral: feedbacks.filter((f) => f.sentiment === "neutral").length,
      negative: feedbacks.filter((f) => f.sentiment === "negative").length,
    };

    const metrics: OperationsFeedbackMetrics = {
      clinicId,
      periodFrom: from,
      periodTo: to,
      totalResponses: respondedFeedbacks.length,
      totalAppointments: feedbacks.length, // Aproximado
      responseRate:
        feedbacks.length > 0
          ? Math.round((respondedFeedbacks.length / feedbacks.length) * 100)
          : 0,
      averageRating,
      averageNps,
      npsCategory,
      sentimentBreakdown: sentimentCounts,
    };

    return c.json(metrics);
  } catch (error) {
    console.error("Error calculating metrics:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default router;
