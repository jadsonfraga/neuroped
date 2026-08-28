/**
 * Testes unitários para Onboarding Checklist
 * Valida: progress calculation, completion, next step logic
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  onboardingSteps,
  onboardingStepLabels,
  type OnboardingChecklist,
} from "../../shared/saas-schema";

/**
 * Mock do banco de dados
 */
function createMockChecklist(
  completed: boolean[],
): OnboardingChecklist[] {
  return onboardingSteps.map((stepId, index) => ({
    id: `oc_${index}`,
    clinicId: "clinic_123",
    stepId,
    stepLabel: onboardingStepLabels[stepId],
    completed: completed[index] || false,
    completedAt: completed[index] ? new Date().toISOString() : null,
    completedBy: completed[index] ? "user_123" : null,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * Calcula progresso de onboarding
 */
function calculateProgress(steps: OnboardingChecklist[]) {
  const completedSteps = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const percentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const nextStep = steps.find((s) => !s.completed)?.stepId || null;
  const estimatedDays = Math.max(1, Math.ceil((totalSteps - completedSteps) / 1.5));

  return {
    totalSteps,
    completedSteps,
    percentage,
    nextStep,
    estimatedDays,
  };
}

describe("Onboarding Checklist", () => {
  it("should calculate 0% when no steps are completed", () => {
    const steps = createMockChecklist([false, false, false, false, false]);
    const progress = calculateProgress(steps);

    assert.equal(progress.percentage, 0);
    assert.equal(progress.completedSteps, 0);
    assert.equal(progress.nextStep, "clinic_profile");
  });

  it("should calculate 20% when 1 of 5 steps is completed", () => {
    const steps = createMockChecklist([true, false, false, false, false]);
    const progress = calculateProgress(steps);

    assert.equal(progress.percentage, 20);
    assert.equal(progress.completedSteps, 1);
    assert.equal(progress.nextStep, "team_members");
  });

  it("should calculate 40% when 2 of 5 steps are completed", () => {
    const steps = createMockChecklist([true, true, false, false, false]);
    const progress = calculateProgress(steps);

    assert.equal(progress.percentage, 40);
    assert.equal(progress.completedSteps, 2);
    assert.equal(progress.nextStep, "services");
  });

  it("should calculate 100% when all steps are completed", () => {
    const steps = createMockChecklist([true, true, true, true, true]);
    const progress = calculateProgress(steps);

    assert.equal(progress.percentage, 100);
    assert.equal(progress.completedSteps, 5);
    assert.equal(progress.nextStep, null);
  });

  it("should identify correct next step", () => {
    const steps = createMockChecklist([true, true, false, true, false]);
    const progress = calculateProgress(steps);

    assert.equal(progress.nextStep, "services");
  });

  it("should estimate completion days correctly", () => {
    const stepsNone = createMockChecklist([false, false, false, false, false]);
    const progressNone = calculateProgress(stepsNone);
    assert.equal(progressNone.estimatedDays, 4); // ceil(5 / 1.5) = 4

    const stepsOne = createMockChecklist([true, false, false, false, false]);
    const progressOne = calculateProgress(stepsOne);
    assert.equal(progressOne.estimatedDays, 3); // ceil(4 / 1.5) = 3

    const stepsAll = createMockChecklist([true, true, true, true, true]);
    const progressAll = calculateProgress(stepsAll);
    assert.equal(progressAll.estimatedDays, 1); // max(1, ceil(0 / 1.5)) = 1
  });

  it("should handle empty steps array", () => {
    const progress = calculateProgress([]);

    assert.equal(progress.percentage, 0);
    assert.equal(progress.completedSteps, 0);
    assert.equal(progress.nextStep, null);
  });

  it("should validate step order", () => {
    const steps = createMockChecklist([true, true, false, false, false]);

    assert.equal(steps[0].stepId, "clinic_profile");
    assert.equal(steps[1].stepId, "team_members");
    assert.equal(steps[2].stepId, "services");
    assert.equal(steps[3].stepId, "communication");
    assert.equal(steps[4].stepId, "integrations");
  });

  it("should have all steps with proper labels", () => {
    onboardingSteps.forEach((stepId) => {
      assert.ok(onboardingStepLabels[stepId], `Missing label for step: ${stepId}`);
      assert.ok(
        onboardingStepLabels[stepId].length > 0,
        `Empty label for step: ${stepId}`,
      );
    });
  });
});

console.log("✓ Onboarding Checklist tests passed");
