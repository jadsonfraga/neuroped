import assert from "node:assert/strict";
import {
  CLINICAL_CORE_SAFETY_RULES,
  clinicalEventInputSchema,
} from "../../shared/clinical-core";

const base = {
  patientId: "patient-1",
  occurredAt: "2026-08-10T09:30:00-03:00",
  provenance: { kind: "observed" as const, source: "clinician" as const },
};

const observation = clinicalEventInputSchema.parse({
  ...base,
  eventType: "observation",
  data: {
    domain: "gait_balance",
    findingStatus: "not_assessed",
  },
});
assert.equal(observation.eventType, "observation");
assert.equal(observation.data.findingStatus, "not_assessed");

// Achado neurológico sem estado explícito é inválido: impede normalidade por omissão.
assert.equal(
  clinicalEventInputSchema.safeParse({
    ...base,
    eventType: "observation",
    data: { domain: "reflexes" },
  }).success,
  false,
);

// Hipótese/inferência precisa permanecer semanticamente marcada como inferência.
const inferredProblem = clinicalEventInputSchema.parse({
  ...base,
  provenance: { kind: "inferred", source: "clinician" },
  eventType: "problem",
  data: {
    action: "add",
    label: "Hipótese em investigação",
    certainty: "suspected",
    status: "active",
  },
});
assert.equal(inferredProblem.provenance.kind, "inferred");
assert.equal(inferredProblem.data.certainty, "suspected");

// Correção longitudinal é representada como novo evento que referencia o anterior.
const corrected = clinicalEventInputSchema.parse({
  ...base,
  supersedesEventId: "event-old",
  eventType: "outcome",
  data: {
    domain: "atenção",
    measure: "evolução clínica",
    valueText: "Registro corrigido após revisão documental",
    direction: "unknown",
  },
});
assert.equal(corrected.supersedesEventId, "event-old");

// Medicação documenta uma decisão/uso; o contrato não contém campo de recomendação automática.
const medication = clinicalEventInputSchema.parse({
  ...base,
  provenance: { kind: "decision", source: "clinician" },
  eventType: "medication",
  data: {
    action: "continue",
    genericName: "medicamento-teste",
    doseMg: 10,
    frequency: "12/12 h",
    indication: "registro de demonstração",
  },
});
assert.equal(medication.data.action, "continue");
assert.equal("recommendation" in medication.data, false);

assert.deepEqual(CLINICAL_CORE_SAFETY_RULES, {
  noNormalityByOmission: true,
  provenanceRequired: true,
  appendOnlyCorrections: true,
  autonomousPrescription: false,
  autonomousDiagnosis: false,
});

console.log("✓ Clinical Core: proveniência, não-normalidade por omissão e ledger append-only aprovados");
