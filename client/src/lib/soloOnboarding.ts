import {
  type OnboardingMilestone,
  type OnboardingMilestoneKey,
  type TenantOnboardingSnapshot,
} from "../../../shared/onboarding";

export const SOLO_ONBOARDING_KEYS = [
  "account_created",
  "email_verified",
  "clinic_created",
  "first_patient",
  "first_document",
] as const satisfies readonly OnboardingMilestoneKey[];

export function projectSoloOnboarding(
  snapshot: TenantOnboardingSnapshot,
): {
  milestones: OnboardingMilestone[];
  progress: { completed: number; total: 5; percent: number };
} {
  const milestones = SOLO_ONBOARDING_KEYS.map((key) => {
    const milestone = snapshot.milestones.find((candidate) => candidate.key === key);
    if (!milestone) {
      throw new Error(`Marco canônico ausente no onboarding: ${key}`);
    }
    return milestone;
  });
  const completed = milestones.filter(
    (milestone) => milestone.status === "completed",
  ).length;

  return {
    milestones,
    progress: {
      completed,
      total: 5,
      percent: Math.round((completed / 5) * 100),
    },
  };
}
