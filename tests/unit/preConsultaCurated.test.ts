import { describe, it, expect } from "vitest";
import { curatedBoost, clinicianOnlyPenalty, crossedKey, firstLineByQueixa } from "@/data/preConsultaCurated";

describe("crossedKey", () => {
  it("ordena as queixas alfabeticamente", () => {
    expect(crossedKey(["tdah", "ansiedade"])).toBe("ansiedade+tdah");
    expect(crossedKey(["tea", "tdah"])).toBe("tdah+tea");
  });
});

describe("curatedBoost", () => {
  it("não pontua sem queixa ou sem rota", () => {
    expect(curatedBoost("/snap", [])).toBe(0);
    expect(curatedBoost(undefined, ["tdah"])).toBe(0);
  });
  it("prioriza a primeira-linha por ordem (primeiro > segundo)", () => {
    const first = curatedBoost("/snap", ["tdah"]); // posição 0
    const later = curatedBoost("/sdq", ["tdah"]);   // posição posterior
    expect(first).toBeGreaterThan(0);
    expect(first).toBeGreaterThan(later);
  });
  it("comorbidade (bateria cruzada) pontua acima da queixa isolada", () => {
    const crossed = curatedBoost("/snap", ["tdah", "ansiedade"]);
    const single = curatedBoost("/snap", ["tdah"]);
    expect(crossed).toBeGreaterThanOrEqual(single);
  });
  it("rota fora da curadoria não recebe boost", () => {
    expect(curatedBoost("/rota-inexistente", ["tdah"])).toBe(0);
  });
});

describe("clinicianOnlyPenalty", () => {
  it("não penaliza instrumentos com rota no app", () => {
    expect(clinicianOnlyPenalty("/snap", ["clinico"], "diagnostica")).toBe(0);
  });
  it("afunda avaliação formal do médico (sem rota, só clínico, diagnóstica)", () => {
    expect(clinicianOnlyPenalty(undefined, ["clinico"], "diagnostica")).toBe(-6);
  });
  it("penaliza levemente sem rota e só clínico", () => {
    expect(clinicianOnlyPenalty(undefined, ["clinico"], "triagem")).toBe(-2);
  });
  it("não penaliza quando há respondente família/escola", () => {
    expect(clinicianOnlyPenalty(undefined, ["pais", "professor"], "diagnostica")).toBe(0);
  });
});

describe("firstLineByQueixa", () => {
  it("cobre as queixas centrais com testes diretos onde a criança é avaliada", () => {
    expect(firstLineByQueixa.tdah).toContain("/testes-diretos");
    expect(firstLineByQueixa.aprendizagem).toContain("/testes-diretos");
    expect(firstLineByQueixa.tea[0]).toBe("/mchat");
  });
});
