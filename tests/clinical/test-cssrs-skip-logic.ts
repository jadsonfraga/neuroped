import assert from "node:assert/strict";
import {
  getCssrsSkipLogicSummary,
  getVisibleCssrsQuestionIds,
  pruneCssrsAnswers,
} from "../../client/src/data/expandedScales";

assert.deepEqual(getVisibleCssrsQuestionIds({}), [1, 2]);
assert.deepEqual(getVisibleCssrsQuestionIds({ 1: false }), [1, 2]);
assert.deepEqual(getVisibleCssrsQuestionIds({ 1: false, 2: false }), [1, 2, 6]);
assert.deepEqual(
  getVisibleCssrsQuestionIds({ 1: false, 2: true }),
  [1, 2, 3, 4, 5, 6],
);
assert.deepEqual(
  getVisibleCssrsQuestionIds({ 1: true, 2: true, 3: false }),
  [1, 2, 3, 4, 5, 6],
);

assert.deepEqual(
  pruneCssrsAnswers({
    1: false,
    2: false,
    3: true,
    4: true,
    5: true,
    6: false,
  }),
  { 1: false, 2: false, 6: false },
);

const positiveFlow = { 1: true, 2: true, 3: true, 4: true, 5: true, 6: false };
assert.deepEqual(pruneCssrsAnswers({ ...positiveFlow, 2: false }), {
  1: true,
  2: false,
  6: false,
});

assert.match(
  getCssrsSkipLogicSummary({ 1: false, 2: false, 6: false }),
  /Q2 = Não; Q3-Q5 foram omitidas/,
);
assert.match(
  getCssrsSkipLogicSummary({ 1: false, 2: true, 6: false }),
  /Q2 = Sim; Q3-Q5 e Q6/,
);

console.log("✓ C-SSRS: Q1/Q2 obrigatórias, follow-up por Q2 e Q6 preservada");
