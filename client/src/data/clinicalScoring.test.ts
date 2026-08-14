import { describe, expect, it } from "vitest";
import { classifyMchat } from "@/data/scales";
import {
  classifyCdi2,
  classifyCssrs,
  classifyPhqa,
  classifyVanderbilt,
  getCssrsSkipLogicSummary,
  getVisibleCssrsQuestionIds,
  hasPositivePhqaSelfHarm,
  pruneCssrsAnswers,
} from "@/data/expandedScales";
import { classifyConners, classifyScared, classifySdq } from "@/data/newScales";

describe("clinical scoring cutoffs", () => {
  it("M-CHAT-R/F classifies low, moderate and high risk", () => {
    expect(classifyMchat(2).risk).toMatch(/Baixo/i);
    expect(classifyMchat(3).risk).toMatch(/Moderado/i);
    expect(classifyMchat(8).risk).toMatch(/Alto/i);
  });

  it("SDQ classifies total difficulty bands", () => {
    expect(
      classifySdq({
        emotional: 3,
        conduct: 2,
        hyperactivity: 4,
        peer: 3,
        prosocial: 8,
      }).classification,
    ).toBe("Normal");
    expect(
      classifySdq({
        emotional: 4,
        conduct: 3,
        hyperactivity: 6,
        peer: 3,
        prosocial: 6,
      }).classification,
    ).toMatch(/Lim/i);
    expect(
      classifySdq({
        emotional: 6,
        conduct: 5,
        hyperactivity: 8,
        peer: 5,
        prosocial: 4,
      }).classification,
    ).toBe("Anormal");
  });

  it("Vanderbilt flags domains at established item-count thresholds", () => {
    const results = classifyVanderbilt(6, 6, 4);
    expect(
      results.find((item) => item.domain.includes("Desaten"))?.positive,
    ).toBe(true);
    expect(
      results.find((item) => item.domain.includes("Hiperatividade"))?.positive,
    ).toBe(true);
    expect(
      results.find((item) => item.domain.includes("Conduta"))?.positive,
    ).toBe(true);
    expect(
      classifyVanderbilt(5, 5, 3).every((item) => item.positive === false),
    ).toBe(true);
  });

  it("SCARED classifies anxiety bands and subscale positivity", () => {
    expect(classifyScared(24, {}).classification).toMatch(/Sem indicativo/i);
    expect(classifyScared(25, { gad: 9 }).classification).toMatch(/Poss/i);
    const high = classifyScared(30, { gad: 9 });
    expect(high.classification).toMatch(/Prov/i);
    expect(
      high.subscaleResults.find((item) => item.name.includes("Generalizada"))
        ?.positive,
    ).toBe(true);
  });

  it("CDI-2 and PHQ-A preserve depressive severity bands", () => {
    expect(classifyCdi2(13).color).toBe("emerald");
    expect(classifyCdi2(14).color).toBe("amber");
    expect(classifyCdi2(20).color).toBe("orange");
    expect(classifyCdi2(26).color).toBe("red");

    expect(classifyPhqa(4).color).toBe("emerald");
    expect(classifyPhqa(5).color).toBe("amber");
    expect(classifyPhqa(10).color).toBe("orange");
    expect(classifyPhqa(15).color).toBe("red");
    expect(hasPositivePhqaSelfHarm({ 8: 0 })).toBe(false);
    expect(hasPositivePhqaSelfHarm({ 8: 1 })).toBe(true);
  });

  it("C-SSRS escalates safety risk by highest positive item", () => {
    expect(classifyCssrs({}).color).toBe("emerald");
    expect(classifyCssrs({ 1: true }).color).toBe("amber");
    expect(classifyCssrs({ 2: true }).color).toBe("orange");
    expect(classifyCssrs({ 5: true }).color).toBe("red");
    expect(classifyCssrs({ 6: true }).classification).toMatch(/Comportamento/i);
  });

  it("C-SSRS applies skip logic and prunes dependent answers", () => {
    expect(getVisibleCssrsQuestionIds({})).toEqual([1, 2]);
    expect(getVisibleCssrsQuestionIds({ 1: false })).toEqual([1, 2]);
    expect(getVisibleCssrsQuestionIds({ 1: false, 2: false })).toEqual([
      1, 2, 6,
    ]);
    expect(getVisibleCssrsQuestionIds({ 1: false, 2: true })).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(getVisibleCssrsQuestionIds({ 1: true, 2: true, 3: false })).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(
      pruneCssrsAnswers({
        1: false,
        2: false,
        3: true,
        4: true,
        5: true,
        6: false,
      }),
    ).toEqual({ 1: false, 2: false, 6: false });
    const previouslyPositive = {
      1: true,
      2: true,
      3: true,
      4: true,
      5: true,
      6: false,
    };
    expect(pruneCssrsAnswers({ ...previouslyPositive, 2: false })).toEqual({
      1: true,
      2: false,
      6: false,
    });
    expect(getCssrsSkipLogicSummary({ 1: false, 2: false, 6: false })).toMatch(
      /Q2 = Não; Q3-Q5 foram omitidas/,
    );
    expect(getCssrsSkipLogicSummary({ 1: false, 2: true, 6: false })).toMatch(
      /Q2 = Sim; Q3-Q5 e Q6/,
    );
  });

  it("Conners flags normal, attention and clinically significant ranges", () => {
    expect(classifyConners(41, {}).classification).toMatch(/Normalidade/i);
    expect(classifyConners(42, {}).classification).toMatch(/Aten/i);
    expect(classifyConners(59, {}).classification).toMatch(/Significativo/i);
  });
});
