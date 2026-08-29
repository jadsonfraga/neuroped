/**
 * API de Onboarding — Tracking de progresso de ativação da clínica
 *
 * Endpoints:
 * GET  /api/saas/onboarding/progress?clinicId=...
 * POST /api/saas/onboarding/steps/:stepId/complete
 * GET  /api/saas/onboarding/steps
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../storage.js";
import {
  onboardingChecklist,
  onboardingSteps,
  onboardingStepLabels,
  completeOnboardingStepSchema,
  type OnboardingProgress,
} from "@shared/saas-schema";
import { requireAuth } from "../middleware/auth.js";
import { validateClinicOwnership } from "../middleware/saas-authorization.js";
import { oneParam } from "../lib/http.js";

/**
 * GET /api/saas/onboarding/progress
 * Retorna progresso de onboarding da clínica
 */
function handleGetProgress(req: Request, res: Response) {
  try {
    // Resolvido por validateClinicOwnership a partir da membership do usuário.
    const clinicId = (req as any).clinicId as string;

    // Buscar checklist steps
    const steps = db
      .select()
      .from(onboardingChecklist)
      .where(eq(onboardingChecklist.clinicId, clinicId))
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

    const completedSteps = steps.filter((s) => s.completed).length;
    const totalSteps = steps.length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    const nextStep = steps.find((s) => !s.completed)?.stepId || null;

    const progress: OnboardingProgress = {
      clinicId,
      totalSteps,
      completedSteps,
      percentage,
      steps: steps.sort(
        (a, b) =>
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
function handleCompleteStep(req: Request, res: Response) {
  try {
    const stepId = oneParam(req.params.stepId);
    if (!onboardingSteps.includes(stepId as any)) {
      return res.status(400).json({ error: "Invalid step ID" });
    }

    const body = req.body;
    const input = completeOnboardingStepSchema.parse(body);

    const clinicId = (req as any).clinicId as string;
    const user = req.user;
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
      })
      .where(
        and(
          eq(onboardingChecklist.clinicId, clinicId),
          eq(onboardingChecklist.stepId, stepId as (typeof onboardingSteps)[number]),
        ),
      )
      .run();

    if (result.changes === 0) {
      return res
        .status(404)
        .json({ error: "Step not found or already completed" });
    }

    // Retornar novo progresso
    const steps = db
      .select()
      .from(onboardingChecklist)
      .where(eq(onboardingChecklist.clinicId, clinicId))
      .all();

    const completedSteps = steps.filter((s) => s.completed).length;
    const totalSteps = steps.length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    const progress: OnboardingProgress = {
      clinicId,
      totalSteps,
      completedSteps,
      percentage,
      steps,
      nextStep: (steps.find((s) => !s.completed)?.stepId as any) || null,
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
function handleGetSteps(_req: Request, res: Response) {
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
  app.get(
    "/api/saas/onboarding/progress",
    requireAuth,
    validateClinicOwnership,
    handleGetProgress,
  );
  app.post(
    "/api/saas/onboarding/steps/:stepId/complete",
    requireAuth,
    validateClinicOwnership,
    handleCompleteStep,
  );
  // Catálogo estático de etapas: não expõe dado de clínica alguma.
  app.get("/api/saas/onboarding/steps", requireAuth, handleGetSteps);
}
