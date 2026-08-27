/**
 * API de Onboarding — Tracking de progresso de ativação da clínica
 *
 * Endpoints:
 * GET  /api/saas/onboarding/progress?clinicId=...
 * POST /api/saas/onboarding/steps/:stepId/complete
 * GET  /api/saas/onboarding/steps
 */

import type { Express } from "express";
import { z } from "zod";
import { db } from "../storage.js";
import {
  onboardingChecklist,
  onboardingSteps,
  onboardingStepLabels,
  completeOnboardingStepSchema,
  type OnboardingProgress,
} from "@shared/saas-schema";
import { requireAuth } from "../middleware/auth.js";

/**
 * GET /api/saas/onboarding/progress
 * Retorna progresso de onboarding da clínica
 */
function handleGetProgress(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const clinicId = req.query.clinicId as string;
    if (!clinicId) {
      return res.status(400).json({ error: "Missing clinicId query param" });
    }

    // TODO: Validar ownership aqui (user é admin/clinic_admin da clínica)
    // const user = req.user as any;
    // if (!user || !canAccessClinic(user, clinicId)) {
    //   return res.status(403).json({ error: "Forbidden" });
    // }

    // Buscar checklist steps
    const steps = db
      .select()
      .from(onboardingChecklist)
      .where((t: any) => t.clinicId.eq(clinicId))
      .all();

    if (!steps || steps.length === 0) {
      return res.json({
        clinicId,
        totalSteps: onboardingSteps.length,
        completedSteps: 0,
        percentage: 0,
        steps: [],
        nextStep: onboardingSteps[0],
        estimatedCompletionDays: 3,
      } as OnboardingProgress);
    }

    const completedSteps = steps.filter((s: any) => s.completed).length;
    const totalSteps = steps.length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    const nextStep =
      steps.find((s: any) => !s.completed)?.stepId || null;

    const progress: OnboardingProgress = {
      clinicId,
      totalSteps,
      completedSteps,
      percentage,
      steps: steps.sort(
        (a: any, b: any) =>
          onboardingSteps.indexOf(a.stepId as any) -
          onboardingSteps.indexOf(b.stepId as any),
      ),
      nextStep: nextStep as any,
      estimatedCompletionDays: Math.max(
        1,
        Math.ceil((totalSteps - completedSteps) / 1.5),
      ),
    };

    return res.json(progress);
  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/saas/onboarding/steps/:stepId/complete
 * Marca uma etapa de onboarding como completa
 */
function handleCompleteStep(
  req: Express.Request,
  res: Express.Response,
) {
  try {
    const stepId = req.params.stepId;
    if (!onboardingSteps.includes(stepId as any)) {
      return res.status(400).json({ error: "Invalid step ID" });
    }

    const body = req.body;
    const input = completeOnboardingStepSchema.parse(body);

    const clinicId = req.query.clinicId as string;
    if (!clinicId) {
      return res.status(400).json({ error: "Missing clinicId query param" });
    }

    // TODO: Validar ownership
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const now = new Date().toISOString();

    // Atualizar step
    const result = db
      .update(onboardingChecklist)
      .set({
        completed: true,
        completedAt: now,
        completedBy: user.id,
        notes: input.notes || undefined,
        updatedAt: now,
      } as any)
      .where((t: any) => t.clinicId.eq(clinicId) && t.stepId.eq(stepId))
      .run();

    if ((result as any).changes === 0) {
      return res
        .status(404)
        .json({ error: "Step not found or already completed" });
    }

    // Retornar novo progresso
    const steps = db
      .select()
      .from(onboardingChecklist)
      .where((t: any) => t.clinicId.eq(clinicId))
      .all();

    const completedSteps = steps.filter((s: any) => s.completed).length;
    const totalSteps = steps.length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    const progress: OnboardingProgress = {
      clinicId,
      totalSteps,
      completedSteps,
      percentage,
      steps,
      nextStep: steps.find((s: any) => !s.completed)?.stepId as any || null,
      estimatedCompletionDays: Math.max(
        1,
        Math.ceil((totalSteps - completedSteps) / 1.5),
      ),
    };

    return res.json(progress);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request", details: error.errors });
    }
    console.error("Error completing onboarding step:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /api/saas/onboarding/steps
 * Lista todos os steps disponíveis com labels
 */
function handleGetSteps(
  _req: Express.Request,
  res: Express.Response,
) {
  const steps = onboardingSteps.map((stepId) => ({
    id: stepId,
    label: onboardingStepLabels[stepId],
    order: onboardingSteps.indexOf(stepId),
  }));

  return res.json({ steps });
}

/**
 * Registra rotas de onboarding
 */
export function registerOnboardingRoutes(app: Express) {
  app.get("/api/saas/onboarding/progress", requireAuth, handleGetProgress);
  app.post(
    "/api/saas/onboarding/steps/:stepId/complete",
    requireAuth,
    handleCompleteStep,
  );
  app.get("/api/saas/onboarding/steps", handleGetSteps);
}
