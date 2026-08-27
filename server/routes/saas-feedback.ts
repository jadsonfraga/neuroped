/**
 * API de Feedback — NPS e ratings pós-consulta
 *
 * Endpoints:
 * POST /api/saas/feedback/appointments/:appointmentId/submit
 * GET  /api/saas/feedback/appointments/:appointmentId
 * GET  /api/saas/feedback/metrics?clinicId=...&from=...&to=...
 */

import type { Express } from "express";
import { z } from "zod";
import { db } from "../storage.js";
import {
  appointmentFeedback,
  submitAppointmentFeedbackSchema,
  type OperationsFeedbackMetrics,
  type AppointmentFeedback,
} from "@shared/saas-schema";
import { requireAuth } from "../middleware/auth.js";

/**
 * Calcula sentiment baseado em NPS ou rating
 */
function calculateSentiment(
  rating?: number,
  npsScore?: number,
): "positive" | "neutral" | "negative" | null {
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
function handleSubmitFeedback(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const appointmentId = req.params.appointmentId;
    const body = req.body;
    const input = submitAppointmentFeedbackSchema.parse(body);

    const now = new Date().toISOString();
    const sentiment = calculateSentiment(input.rating, input.npsScore);
    const clinicId = (req.query.clinicId as string) || "unknown";

    // Verificar se já existe feedback para este appointment
    const existing = db
      .select()
      .from(appointmentFeedback)
      .where((t: any) => t.appointmentId.eq(appointmentId))
      .first();

    if (existing) {
      // Atualizar existente
      db.update(appointmentFeedback)
        .set({
          rating: input.rating || undefined,
          npsScore: input.npsScore || undefined,
          comment: input.comment || undefined,
          sentiment: sentiment || undefined,
          respondedAt: now,
          updatedAt: now,
        } as any)
        .where((t: any) => t.appointmentId.eq(appointmentId))
        .run();
    } else {
      // Criar novo
      db.insert(appointmentFeedback).values({
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
      } as any);
    }

    return res.json({
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
      return res
        .status(400)
        .json({ error: "Invalid request", details: error.errors });
    }
    console.error("Error submitting feedback:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/saas/feedback/appointments/:appointmentId
 * Retorna feedback de uma consulta
 */
function handleGetFeedback(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const appointmentId = req.params.appointmentId;

    const feedback = db
      .select()
      .from(appointmentFeedback)
      .where((t: any) => t.appointmentId.eq(appointmentId))
      .first();

    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    return res.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/saas/feedback/metrics?clinicId=...&from=...&to=...
 * Retorna métricas agregadas de feedback
 */
function handleGetMetrics(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const clinicId = req.query.clinicId as string;
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!clinicId || !from || !to) {
      return res.status(400).json({
        error: "Missing required query params: clinicId, from, to",
      });
    }

    // Validar datas ISO
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use ISO 8601" });
    }

    // Buscar todos os feedbacks no período
    const feedbacks = db
      .select()
      .from(appointmentFeedback)
      .where(
        (t: any) =>
          t.clinicId.eq(clinicId) &&
          t.createdAt.gte(from) &&
          t.createdAt.lte(to),
      )
      .all();

    // Agregar métricas
    const respondedFeedbacks = feedbacks.filter((f: any) => f.respondedAt);
    const ratings = respondedFeedbacks
      .filter((f: any) => f.rating)
      .map((f: any) => f.rating as number);
    const npsScores = respondedFeedbacks
      .filter((f: any) => f.npsScore !== null)
      .map((f: any) => f.npsScore as number);

    const averageRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10,
          ) / 10
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
      positive: feedbacks.filter((f: any) => f.sentiment === "positive")
        .length,
      neutral: feedbacks.filter((f: any) => f.sentiment === "neutral").length,
      negative: feedbacks.filter((f: any) => f.sentiment === "negative")
        .length,
    };

    const metrics: OperationsFeedbackMetrics = {
      clinicId,
      periodFrom: from,
      periodTo: to,
      totalResponses: respondedFeedbacks.length,
      totalAppointments: feedbacks.length,
      responseRate:
        feedbacks.length > 0
          ? Math.round((respondedFeedbacks.length / feedbacks.length) * 100)
          : 0,
      averageRating,
      averageNps,
      npsCategory,
      sentimentBreakdown: sentimentCounts,
    };

    return res.json(metrics);
  } catch (error) {
    console.error("Error calculating metrics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Registra rotas de feedback
 */
export function registerFeedbackRoutes(app: Express) {
  app.post(
    "/api/saas/feedback/appointments/:appointmentId/submit",
    handleSubmitFeedback,
  );
  app.get(
    "/api/saas/feedback/appointments/:appointmentId",
    requireAuth,
    handleGetFeedback,
  );
  app.get("/api/saas/feedback/metrics", requireAuth, handleGetMetrics);
}
