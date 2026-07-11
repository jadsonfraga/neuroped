import assert from "node:assert/strict";
import test from "node:test";

import {
  assertValidConfidence,
  canBeTreatedAsConfirmedFact,
  type ClinicalFact,
} from "../../shared/notes/domain";

const baseFact: ClinicalFact = {
  id: "fact-1",
  consultationId: "consultation-1",
  section: "language_development",
  text: "Primeiras palavras relatadas aos 18 meses.",
  provenance: {
    sourceType: "parent_report",
    speakerRole: "mother",
    recordedAt: "2026-07-11T12:00:00.000Z",
    reviewStatus: "confirmed",
  },
  createdAt: "2026-07-11T12:00:00.000Z",
  updatedAt: "2026-07-11T12:00:00.000Z",
};

test("confirmed non-AI information may be treated as a confirmed fact", () => {
  assert.equal(canBeTreatedAsConfirmedFact(baseFact), true);
});

test("AI inference is never treated as a confirmed clinical fact", () => {
  const aiFact: ClinicalFact = {
    ...baseFact,
    provenance: {
      ...baseFact.provenance,
      sourceType: "ai_inference",
      speakerRole: "unknown",
    },
  };

  assert.equal(canBeTreatedAsConfirmedFact(aiFact), false);
});

test("pending information is not treated as confirmed", () => {
  const pendingFact: ClinicalFact = {
    ...baseFact,
    provenance: {
      ...baseFact.provenance,
      reviewStatus: "pending",
    },
  };

  assert.equal(canBeTreatedAsConfirmedFact(pendingFact), false);
});

test("confidence accepts values from zero to one", () => {
  assert.doesNotThrow(() => assertValidConfidence(0));
  assert.doesNotThrow(() => assertValidConfidence(0.5));
  assert.doesNotThrow(() => assertValidConfidence(1));
  assert.doesNotThrow(() => assertValidConfidence(undefined));
});

test("confidence rejects invalid values", () => {
  assert.throws(() => assertValidConfidence(-0.01), RangeError);
  assert.throws(() => assertValidConfidence(1.01), RangeError);
  assert.throws(() => assertValidConfidence(Number.NaN), RangeError);
});
