/**
 * API de Feedback — NPS e ratings pós-consulta
 *
 * Endpoints:
 * POST /api/saas/feedback/appointments/:appointmentId/submit
 * GET  /api/saas/feedback/appointments/:appointmentId
 * GET  /api/saas/feedback/metrics?clinicId=...&from=...&to=...
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "../storage.js";
import {
  appointmentFeedback,
  submitAppointmentFeedbackSchema,
  type OperationsFeedbackMetrics,
} from "@shared/saas-schema";
import { requireAuth } from "../middleware/auth.js";
import { validateClinicOwnership } from "../middleware/saas-authorization.js";
import { oneParam } from "../lib/http.js";

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
function handleSubmitFeedback(req: Request, res: Response) {
  try {
    const appointmentId = oneParam(req.params.appointmentId);
    const body = req.body;
    const input = submitAppointmentFeedbackSchema.parse(body);

    const now = new Date().toISOString();
    const sentiment = calculateSentiment(input.rating, input.npsScore);
    const clinicId = (req as any).clinicId as string;

    // Verificar se já existe feedback para este appointment
    const existing = db
      .select()
      .from(appointmentFeedback)
      .where(eq(appointmentFeedback.appointmentId, appointmentId))
      .get();

    // O appointment_id é único globalmente: um feedback já registrado por
    // outra clínica não pode ser sobrescrito a partir desta.
    if (existing && existing.clinicId !== clinicId) {
      return res.status(403).json({ error: "Feedback belongs to another clinic" });
    }

    if (existing) {
      // Atualizar existente
      db.update(appointmentFeedback)
        .set({
          rating: input.rating ?? undefined,
          npsScore: input.npsScore ?? undefined,
          comment: input.comment ?? undefined,
          sentiment: sentiment ?? undefined,
          respondedAt: now,
          updatedAt: now,
        })
        .where(eq(appointmentFeedback.appointmentId, appointmentId))
        .run();
    } else {
      // Criar novo
      db.insert(appointmentFeedback).values({
        id: `af_${crypto.randomUUID()}`,
        appointmentId,
        clinicId,
        rating: input.rating ?? undefined,
        npsScore: input.npsScore ?? undefined,
        comment: input.comment ?? undefined,
        sentiment: sentiment ?? undefined,
        respondedAt: now,
        createdAt: now,
        updatedAt: now,
      }).run();
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
function handleGetFeedback(req: Request, res: Response) {
  try {
    const appointmentId = oneParam(req.params.appointmentId);
    const clinicId = (req as any).clinicId as string;

    // Escopado à clínica: conhecer o appointmentId não basta para ler.
    const feedback = db
      .select()
      .from(appointmentFeedback)
      .where(
        and(
          eq(appointmentFeedback.appointmentId, appointmentId),
          eq(appointmentFeedback.clinicId, clinicId),
        ),
      )
      .get();

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
function handleGetMetrics(req: Request, res: Response) {
  try {
    const clinicId = (req as any).clinicId as string;
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!from || !to) {
      return res.status(400).json({
        error: "Missing required query params: from, to",
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
        and(
          eq(appointmentFeedback.clinicId, clinicId),
          gte(appointmentFeedback.createdAt, from),
          lte(appointmentFeedback.createdAt, to),
        ),
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
      positive: feedbacks.filter((f) => f.sentiment === "positive").length,
      neutral: feedbacks.filter((f) => f.sentiment === "neutral").length,
      negative: feedbacks.filter((f) => f.sentiment === "negative").length,
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
  // Submissão exige sessão: sem um token de convite assinado (que ainda não
  // existe), uma rota pública aqui aceitaria escrita anônima em qualquer
  // appointment e sobrescrita de respostas já registradas.
  app.post(
    "/api/saas/feedback/appointments/:appointmentId/submit",
    requireAuth,
    validateClinicOwnership,
    handleSubmitFeedback,
  );
  app.get(
    "/api/saas/feedback/appointments/:appointmentId",
    requireAuth,
    validateClinicOwnership,
    handleGetFeedback,
  );
  app.get(
    "/api/saas/feedback/metrics",
    requireAuth,
    validateClinicOwnership,
    handleGetMetrics,
  );
}
