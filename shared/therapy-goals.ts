import type { ClinicalEvent } from "./clinical-core";

export type TherapyGoalPlanEvent = Extract<ClinicalEvent, { eventType: "plan" }>;
export type TherapyGoalOutcomeEvent = Extract<ClinicalEvent, { eventType: "outcome" }>;

export interface TherapyGoalSnapshot {
  goalId: string;
  plan: TherapyGoalPlanEvent;
  measurements: TherapyGoalOutcomeEvent[];
  latestMeasurement?: TherapyGoalOutcomeEvent;
  numericProgressPercent: number | null;
}

export const therapyGoalStatusLabels = {
  planned: "Planejada",
  in_progress: "Em acompanhamento",
  completed: "Concluída",
  cancelled: "Encerrada",
} as const;

export function isTherapyGoalPlan(event: ClinicalEvent): event is TherapyGoalPlanEvent {
  return (
    event.status === "active" &&
    event.eventType === "plan" &&
    event.data.kind === "therapy" &&
    typeof event.data.goalId === "string" &&
    event.data.goalId.trim().length > 0
  );
}

export function isGoalOutcome(event: ClinicalEvent): event is TherapyGoalOutcomeEvent {
  return (
    event.status === "active" &&
    event.eventType === "outcome" &&
    typeof event.data.goalId === "string" &&
    event.data.goalId.trim().length > 0
  );
}

export function numericGoalProgressPercent(
  plan: TherapyGoalPlanEvent,
  latestMeasurement?: TherapyGoalOutcomeEvent,
): number | null {
  const baseline = plan.data.baselineValue;
  const target = plan.data.targetValue;
  const latest = latestMeasurement?.data.valueNumber;
  if (
    typeof baseline !== "number" ||
    typeof target !== "number" ||
    typeof latest !== "number" ||
    !Number.isFinite(baseline) ||
    !Number.isFinite(target) ||
    !Number.isFinite(latest) ||
    target === baseline
  ) {
    return null;
  }

  const raw = ((latest - baseline) / (target - baseline)) * 100;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function deriveTherapyGoals(events: ClinicalEvent[]): TherapyGoalSnapshot[] {
  const latestPlanByGoal = new Map<string, TherapyGoalPlanEvent>();
  const planEvents = events
    .filter(isTherapyGoalPlan)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  for (const event of planEvents) {
    const goalId = event.data.goalId!;
    if (!latestPlanByGoal.has(goalId)) latestPlanByGoal.set(goalId, event);
  }

  const outcomesByGoal = new Map<string, TherapyGoalOutcomeEvent[]>();
  for (const event of events.filter(isGoalOutcome)) {
    const goalId = event.data.goalId!;
    const current = outcomesByGoal.get(goalId) ?? [];
    current.push(event);
    outcomesByGoal.set(goalId, current);
  }

  return [...latestPlanByGoal.entries()]
    .map(([goalId, plan]) => {
      const measurements = [...(outcomesByGoal.get(goalId) ?? [])].sort(
        (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
      );
      const latestMeasurement = measurements.at(-1);
      return {
        goalId,
        plan,
        measurements,
        latestMeasurement,
        numericProgressPercent: numericGoalProgressPercent(plan, latestMeasurement),
      } satisfies TherapyGoalSnapshot;
    })
    .sort((a, b) => new Date(b.plan.occurredAt).getTime() - new Date(a.plan.occurredAt).getTime());
}
