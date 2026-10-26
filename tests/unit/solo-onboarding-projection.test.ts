import assert from "node:assert/strict";
import { test } from "node:test";
import {
  projectSoloOnboarding,
  SOLO_ONBOARDING_KEYS,
} from "../../client/src/lib/soloOnboarding";
import {
  onboardingMilestoneDefinitions,
  type TenantOnboardingSnapshot,
} from "../../shared/onboarding";

function blockedSnapshot(): TenantOnboardingSnapshot {
  const completedKeys = new Set([
    "account_created",
    "email_verified",
    "clinic_created",
    "plan_selected",
  ]);
  return {
    clinicId: "clinic-solo-sintetica",
    generatedAt: "2026-10-25T12:00:00.000Z",
    progress: { completed: 4, total: 10, percent: 40 },
    billingEvidence: {
      status: "BLOCKED_EXTERNAL",
      provider: "asaas",
      environment: null,
      confirmedAt: null,
      source: null,
      limitation: "Cobrança externa ainda não confirmada.",
    },
    milestones: onboardingMilestoneDefinitions.map((definition) => ({
      ...definition,
      status: completedKeys.has(definition.key) ? "completed" : "pending",
      completedAt: completedKeys.has(definition.key)
        ? "2026-10-25T11:00:00.000Z"
        : null,
    })),
  };
}

test("projeta o snapshot canônico de dez marcos nos cinco passos Solo", () => {
  const snapshot = blockedSnapshot();
  const original = structuredClone(snapshot);

  const projected = projectSoloOnboarding(snapshot);

  assert.deepEqual(SOLO_ONBOARDING_KEYS, [
    "account_created",
    "email_verified",
    "clinic_created",
    "first_patient",
    "first_document",
  ]);
  assert.deepEqual(
    projected.milestones.map((milestone) => milestone.key),
    SOLO_ONBOARDING_KEYS,
  );
  assert.deepEqual(projected.progress, { completed: 3, total: 5, percent: 60 });
  assert.equal(
    projected.milestones.some((milestone) => milestone.key === "first_member"),
    false,
  );
  assert.deepEqual(snapshot, original, "a projeção não pode alterar o snapshot do servidor");
});
