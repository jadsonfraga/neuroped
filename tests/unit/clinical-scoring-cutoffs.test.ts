// Pontos de corte clínicos das escalas de rastreio.
// Migrado de client/src/data/clinicalScoring.test.ts, que importava `vitest`
// (dependência inexistente no projeto) e por isso nunca era executado.
// M-CHAT-R/F, SDQ, Vanderbilt e SCARED saíram do app em 17/10/2026 (licenciados):
// os classificadores foram removidos com os itens.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyCssrs,
  classifyPhqa,
  getCssrsSkipLogicSummary,
  getVisibleCssrsQuestionIds,
  hasPositivePhqaSelfHarm,
  pruneCssrsAnswers,
} from "../../client/src/data/expandedScales";

describe("clinical scoring cutoffs", () => {

  it("PHQ-A preserves depressive severity bands", () => {
    assert.equal(classifyPhqa(4).color, "emerald");
    assert.equal(classifyPhqa(5).color, "amber");
    assert.equal(classifyPhqa(10).color, "orange");
    assert.equal(classifyPhqa(15).color, "red");
    assert.equal(hasPositivePhqaSelfHarm({ 8: 0 }), false);
    assert.equal(hasPositivePhqaSelfHarm({ 8: 1 }), true);
  });

  it("C-SSRS escalates safety risk by highest positive item", () => {
    assert.equal(classifyCssrs({}).color, "emerald");
    assert.equal(classifyCssrs({ 1: true }).color, "amber");
    assert.equal(classifyCssrs({ 2: true }).color, "orange");
    assert.equal(classifyCssrs({ 5: true }).color, "red");
    assert.match(classifyCssrs({ 6: true }).classification, /Comportamento/i);
  });

  it("C-SSRS applies skip logic and prunes dependent answers", () => {
    assert.deepEqual(getVisibleCssrsQuestionIds({}), [1, 2]);
    assert.deepEqual(getVisibleCssrsQuestionIds({ 1: false }), [1, 2]);
    assert.deepEqual(getVisibleCssrsQuestionIds({ 1: false, 2: false }), [1, 2, 6]);
    assert.deepEqual(getVisibleCssrsQuestionIds({ 1: false, 2: true }), [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(getVisibleCssrsQuestionIds({ 1: true, 2: true, 3: false }), [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(
      pruneCssrsAnswers({ 1: false, 2: false, 3: true, 4: true, 5: true, 6: false }),
      { 1: false, 2: false, 6: false },
    );
    const previouslyPositive = { 1: true, 2: true, 3: true, 4: true, 5: true, 6: false };
    assert.deepEqual(pruneCssrsAnswers({ ...previouslyPositive, 2: false }), { 1: true, 2: false, 6: false });
    assert.match(getCssrsSkipLogicSummary({ 1: false, 2: false, 6: false }), /Q2 = Não; Q3-Q5 foram omitidas/);
    assert.match(getCssrsSkipLogicSummary({ 1: false, 2: true, 6: false }), /Q2 = Sim; Q3-Q5 e Q6/);
  });
});
