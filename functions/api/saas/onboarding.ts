/**
 * API de Onboarding — Tracking de progresso de ativação da clínica
 *
 * Endpoints:
 * GET  /api/saas/onboarding/progress?clinicId=...
 * POST /api/saas/onboarding/steps/:stepId/complete
 * GET  /api/saas/onboarding/steps
 */

import { z } from "zod";
import {
  onboardingChecklist,
  onboardingSteps,
  onboardingStepLabels,
  completeOnboardingStepSchema,
  type OnboardingProgress,
} from "@shared/saas-schema";

/**
 * GET /api/saas/onboarding/progress
 * Retorna progresso de onboarding da clínica
 */
router.get("/progress", async (c) => {
  try {
    const clinicId = c.req.query("clinicId");
    if (!clinicId) {
      return c.json({ error: "Missing clinicId query param" }, 400);
    }

    // Validar ownership: usuário deve ser admin ou clinic_admin da clínica
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const db = c.get("db");
    if (!db) {
      return c.json({ error: "Database not available" }, 500);
    }

    // Buscar checklist steps
    const steps = await db
      .select()
      .from(onboardingChecklist)
      .where((t) => t.clinicId.eq(clinicId))
      .all();

    if (!steps || steps.length === 0) {
      // Clínica pode não ter steps inicializados ainda
      return c.json({
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

    // Encontrar próximo step não completado
    const nextStep = steps.find((s) => !s.completed)?.stepId || null;

    const progress: OnboardingProgress = {
      clinicId,
      totalSteps,
      completedSteps,
      percentage,
      steps: steps.sort((a, b) => onboardingSteps.indexOf(a.stepId as any) - onboardingSteps.indexOf(b.stepId as any)),
      nextStep: nextStep as any,
      estimatedCompletionDays: Math.max(1, Math.ceil((totalSteps - completedSteps) / 1.5)),
    };

    return c.json(progress);
  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * POST /api/saas/onboarding/steps/:stepId/complete
 * Marca uma etapa de onboarding como completa
 */
router.post("/steps/:stepId/complete", async (c) => {
  try {
    const stepId = c.req.param("stepId");
    if (!onboardingSteps.includes(stepId as any)) {
      return c.json({ error: "Invalid step ID" }, 400);
    }

    const body = await c.req.json();
    const input = completeOnboardingStepSchema.parse(body);

    const clinicId = c.req.query("clinicId");
    if (!clinicId) {
      return c.json({ error: "Missing clinicId query param" }, 400);
    }

    // Validar ownership
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const db = c.get("db");
    if (!db) {
      return c.json({ error: "Database not available" }, 500);
    }

    // Atualizar step
    const now = new Date().toISOString();
    const updated = await db
      .update(onboardingChecklist)
      .set({
        completed: true,
        completedAt: now,
        completedBy: user.id,
        notes: input.notes || undefined,
        updatedAt: now,
      })
      .where((t) => t.clinicId.eq(clinicId) && t.stepId.eq(stepId))
      .run();

    if (updated.changes === 0) {
      return c.json({ error: "Step not found or already completed" }, 404);
    }

    // Retornar novo progresso
    const steps = await db
      .select()
      .from(onboardingChecklist)
      .where((t) => t.clinicId.eq(clinicId))
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
      nextStep: steps.find((s) => !s.completed)?.stepId as any || null,
      estimatedCompletionDays: Math.max(1, Math.ceil((totalSteps - completedSteps) / 1.5)),
    };

    return c.json(progress);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request", details: error.errors }, 400);
    }
    console.error("Error completing onboarding step:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * GET /api/saas/onboarding/steps
 * Lista todos os steps disponíveis com labels
 */
router.get("/steps", async (c) => {
  const steps = onboardingSteps.map((stepId) => ({
    id: stepId,
    label: onboardingStepLabels[stepId],
    order: onboardingSteps.indexOf(stepId),
  }));

  return c.json({ steps });
});

export default router;
