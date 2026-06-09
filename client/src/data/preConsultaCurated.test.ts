import { describe, expect, it } from "vitest";
import type { ScaleEntry } from "@/data/scaleFilter";
import {
  clinicianOnlyPenalty,
  curatedBoost,
  isPreConsulta,
  postConsultComplaints,
  unique,
} from "@/data/preConsultaCurated";

const baseScale: ScaleEntry = {
  id: "base",
  name: "Base",
  fullName: "Base scale",
  ageMin: 0,
  ageMax: 216,
  queixas: ["tdah"],
  respondente: ["pais"],
  prioridade: "triagem",
  tempo: "5 min",
  description: "Base",
};

function scale(overrides: Partial<ScaleEntry>): ScaleEntry {
  return { ...baseScale, ...overrides };
}

describe("preConsultaCurated", () => {
  it("excludes monitoring and psychoeducation from pre-consulta", () => {
    expect(isPreConsulta(scale({ prioridade: "monitorizacao" }))).toBe(false);
    expect(isPreConsulta(scale({ appRoute: "/orientacao-parental" }))).toBe(false);
    expect(isPreConsulta(scale({ appRoute: "/portal-familia" }))).toBe(false);
    expect(isPreConsulta(scale({ appRoute: "/snap" }))).toBe(true);
  });

  it("marks post-consult complaints for chip exclusion", () => {
    expect(postConsultComplaints.has("efeitos")).toBe(true);
    expect(postConsultComplaints.has("evolucao")).toBe(true);
    expect(postConsultComplaints.has("tdah")).toBe(false);
  });

  it("deduplicates by id and fullName while preserving distinct same acronym scales", () => {
    const items = [
      scale({ id: "aims", name: "AIMS", fullName: "Alberta Infant Motor Scale" }),
      scale({ id: "aims-copy", name: "AIMS", fullName: "Alberta Infant Motor Scale" }),
      scale({ id: "aims2", name: "AIMS", fullName: "Abnormal Involuntary Movement Scale" }),
      scale({ id: "aims2", name: "AIMS duplicate id", fullName: "Other" }),
    ];

    expect(unique(items).map((item) => item.fullName)).toEqual([
      "Alberta Infant Motor Scale",
      "Abnormal Involuntary Movement Scale",
    ]);
  });

  it("penalizes formal clinician-only diagnostic scales without routes", () => {
    expect(clinicianOnlyPenalty(undefined, ["clinico"], "diagnostica")).toBeLessThan(0);
    expect(clinicianOnlyPenalty("/cars", ["clinico"], "diagnostica")).toBe(0);
    expect(clinicianOnlyPenalty(undefined, ["pais", "clinico"], "diagnostica")).toBe(0);
  });

  const scenarios: Array<[string, string[], string]> = [
    ["TEA toddler", ["tea"], "/mchat"],
    ["TDAH school age", ["tdah"], "/snap"],
    ["TDAH plus anxiety", ["tdah", "ansiedade"], "/snap"],
    ["TEA plus TDAH", ["tea", "tdah"], "/mchat"],
    ["learning plus TDAH", ["aprendizagem", "tdah"], "/snap"],
    ["language", ["linguagem"], "/asq3"],
    ["cognition", ["cognicao"], "/testes-diretos"],
    ["learning", ["aprendizagem"], "/pdae"],
    ["depression plus suicide", ["depressao", "suicidio"], "/cssrs"],
    ["anxiety plus depression", ["ansiedade", "depressao"], "/scared"],
    ["behavior plus TDAH", ["comportamento", "tdah"], "/snap"],
    ["TEA plus language", ["tea", "linguagem"], "/mchat"],
  ];

  it.each(scenarios)("prioritizes curated first line for %s", (_name, queixas, expectedRoute) => {
    const expected = curatedBoost(expectedRoute, queixas);
    expect(expected).toBeGreaterThan(0);
    expect(expected).toBeGreaterThanOrEqual(curatedBoost("/ados2", queixas));
  });
});
