// Pontos de corte clínicos das escalas de rastreio.
// Migrado de client/src/data/clinicalScoring.test.ts, que importava `vitest`
// (dependência inexistente no projeto) e por isso nunca era executado.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyMchat } from "../../client/src/data/scales";
import {
  classifyCdi2,
  classifyCssrs,
  classifyPhqa,
  classifyVanderbilt,
  getCssrsSkipLogicSummary,
  getVisibleCssrsQuestionIds,
  hasPositivePhqaSelfHarm,
  pruneCssrsAnswers,
} from "../../client/src/data/expandedScales";
import { classifyConners, classifyScared, classifySdq } from "../../client/src/data/newScales";

describe("clinical scoring cutoffs", () => {
  it("M-CHAT-R/F classifies low, moderate and high risk", () => {
    assert.match(classifyMchat(2).risk, /Baixo/i);
    assert.match(classifyMchat(3).risk, /Moderado/i);
    assert.match(classifyMchat(8).risk, /Alto/i);
  });

  it("SDQ classifies total difficulty bands", () => {
    assert.equal(
      classifySdq({ emotional: 3, conduct: 2, hyperactivity: 4, peer: 3, prosocial: 8 }).classification,
      "Normal",
    );
    assert.match(
      classifySdq({ emotional: 4, conduct: 3, hyperactivity: 6, peer: 3, prosocial: 6 }).classification,
      /Lim/i,
    );
    assert.equal(
      classifySdq({ emotional: 6, conduct: 5, hyperactivity: 8, peer: 5, prosocial: 4 }).classification,
      "Anormal",
    );
  });

  it("Vanderbilt flags domains at established item-count thresholds", () => {
    const results = classifyVanderbilt(6, 6, 4);
    assert.equal(results.find((item) => item.domain.includes("Desaten"))?.positive, true);
    assert.equal(results.find((item) => item.domain.includes("Hiperatividade"))?.positive, true);
    assert.equal(results.find((item) => item.domain.includes("Conduta"))?.positive, true);
    assert.equal(classifyVanderbilt(5, 5, 3).every((item) => item.positive === false), true);
  });

  it("SCARED classifies anxiety bands and subscale positivity", () => {
    assert.match(classifyScared(24, {}).classification, /Sem indicativo/i);
    assert.match(classifyScared(25, { gad: 9 }).classification, /Poss/i);
    const high = classifyScared(30, { gad: 9 });
    assert.match(high.classification, /Prov/i);
    assert.equal(high.subscaleResults.find((item) => item.name.includes("Generalizada"))?.positive, true);
  });

  it("CDI-2 and PHQ-A preserve depressive severity bands", () => {
    assert.equal(classifyCdi2(13).color, "emerald");
    assert.equal(classifyCdi2(14).color, "amber");
    assert.equal(classifyCdi2(20).color, "orange");
    assert.equal(classifyCdi2(26).color, "red");

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

  it("Conners flags normal, attention and clinically significant ranges", () => {
    assert.match(classifyConners(41, {}).classification, /Normalidade/i);
    assert.match(classifyConners(42, {}).classification, /Aten/i);
    assert.match(classifyConners(59, {}).classification, /Significativo/i);
  });
});
