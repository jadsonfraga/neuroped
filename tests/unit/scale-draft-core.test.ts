import assert from "node:assert/strict";
import { normalizeScaleDraftAnswers } from "../../client/src/hooks/useSecureScaleDraft";

const validOptions = { "0": 3, "1": 2, "2": 4 };

assert.deepEqual(
  normalizeScaleDraftAnswers(
    {
      "0": 2,
      "1": 1,
      "2": 4,
      orphan: 0,
      injected: "1",
    },
    validOptions,
  ),
  { "0": 2, "1": 1 },
  "deve manter apenas itens existentes e alternativas dentro da faixa",
);

assert.deepEqual(normalizeScaleDraftAnswers(null, validOptions), {});
assert.deepEqual(normalizeScaleDraftAnswers([], validOptions), {});
assert.deepEqual(
  normalizeScaleDraftAnswers({ "0": -1, "1": 1.5 }, validOptions),
  {},
);

console.log("✓ rascunhos de escalas são normalizados contra a definição atual");
