import assert from "node:assert/strict";
import { clinicalEventInputSchema, type ClinicalEvent } from "../../shared/clinical-core";
import { deriveTherapyGoals, numericGoalProgressPercent } from "../../shared/therapy-goals";

function event(input: unknown, id: string, status: ClinicalEvent["status"] = "active"): ClinicalEvent {
  const parsed = clinicalEventInputSchema.parse(input);
  return {
    id,
    ...parsed,
    status,
    createdAt: parsed.occurredAt,
    authorUserId: "user-test",
  } as ClinicalEvent;
}

const goal = event(
  {
    patientId: "patient-1",
    eventType: "plan",
    occurredAt: "2026-08-01T12:00:00.000Z",
    provenance: { kind: "decision", source: "clinician" },
    data: {
      kind: "therapy",
      target: "Ampliar comunicação funcional",
      status: "in_progress",
      priority: "routine",
      goalId: "goal-communication-1",
      goalDomain: "communication",
      baselineValue: 20,
      baselineUnit: "%",
      targetValue: 80,
      targetUnit: "%",
      measurementMethod: "percentual de oportunidades independentes",
      successCriterion: "80% em observações repetidas",
    },
  },
  "plan-1",
);

const measurement1 = event(
  {
    patientId: "patient-1",
    eventType: "outcome",
    occurredAt: "2026-08-05T12:00:00.000Z",
    provenance: { kind: "measured", source: "clinician" },
    data: {
      domain: "communication",
      measure: "percentual de oportunidades independentes",
      valueNumber: 35,
      unit: "%",
      direction: "improved",
      goalId: "goal-communication-1",
      context: "therapy",
    },
  },
  "outcome-1",
);

const measurement2 = event(
  {
    patientId: "patient-1",
    eventType: "outcome",
    occurredAt: "2026-08-10T12:00:00.000Z",
    provenance: { kind: "measured", source: "clinician" },
    data: {
      domain: "communication",
      measure: "percentual de oportunidades independentes",
      valueNumber: 50,
      unit: "%",
      direction: "improved",
      goalId: "goal-communication-1",
      context: "clinic",
    },
  },
  "outcome-2",
);

const snapshots = deriveTherapyGoals([goal, measurement2, measurement1]);
assert.equal(snapshots.length, 1);
assert.equal(snapshots[0].goalId, "goal-communication-1");
assert.equal(snapshots[0].measurements.length, 2);
assert.equal(snapshots[0].latestMeasurement?.id, "outcome-2");
assert.equal(snapshots[0].numericProgressPercent, 50);

const decreasingGoal = event(
  {
    patientId: "patient-1",
    eventType: "plan",
    occurredAt: "2026-08-01T12:00:00.000Z",
    provenance: { kind: "decision", source: "clinician" },
    data: {
      kind: "therapy",
      target: "Reduzir episódios funcionais definidos",
      status: "in_progress",
      priority: "routine",
      goalId: "goal-decrease-1",
      baselineValue: 10,
      targetValue: 0,
    },
  },
  "plan-2",
) as Extract<ClinicalEvent, { eventType: "plan" }>;

const decreasingMeasure = event(
  {
    patientId: "patient-1",
    eventType: "outcome",
    occurredAt: "2026-08-10T12:00:00.000Z",
    provenance: { kind: "measured", source: "clinician" },
    data: {
      domain: "behavior",
      measure: "episódios por período",
      valueNumber: 5,
      goalId: "goal-decrease-1",
    },
  },
  "outcome-3",
) as Extract<ClinicalEvent, { eventType: "outcome" }>;

assert.equal(numericGoalProgressPercent(decreasingGoal, decreasingMeasure), 50);

const correctedGoal = { ...goal, id: "plan-corrected", status: "corrected" as const };
assert.equal(deriveTherapyGoals([correctedGoal, measurement1]).length, 0);

console.log("therapy goals: ok");
