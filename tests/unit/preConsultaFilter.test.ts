import { describe, it, expect } from "vitest";
import { isPreConsulta, dedupeScales } from "@/lib/preConsultaFilter";
import type { ScaleEntry } from "@/data/scaleFilter";

function scale(p: Partial<ScaleEntry>): ScaleEntry {
  return {
    id: "x", name: "X", fullName: "Instrumento X", ageMin: 0, ageMax: 216,
    queixas: ["tdah"], respondente: ["pais"], prioridade: "triagem", tempo: "5 min",
    ...p,
  } as ScaleEntry;
}

describe("isPreConsulta", () => {
  it("exclui instrumentos de monitorização (diários, QV, efeitos)", () => {
    expect(isPreConsulta(scale({ prioridade: "monitorizacao" }))).toBe(false);
  });
  it("exclui psicoeducação por rota", () => {
    expect(isPreConsulta(scale({ appRoute: "/orientacao-parental" }))).toBe(false);
    expect(isPreConsulta(scale({ appRoute: "/portal-familia" }))).toBe(false);
  });
  it("mantém triagem e diagnóstica de pré-consulta", () => {
    expect(isPreConsulta(scale({ prioridade: "triagem", appRoute: "/snap" }))).toBe(true);
    expect(isPreConsulta(scale({ prioridade: "diagnostica", appRoute: "/cars" }))).toBe(true);
  });
});

describe("dedupeScales", () => {
  it("colapsa duplicatas de mesmo fullName (bears/bears-new)", () => {
    const out = dedupeScales([
      scale({ id: "bears", name: "BEARS", fullName: "Bedtime, Excessive..." }),
      scale({ id: "bears-new", name: "BEARS", fullName: "Bedtime, Excessive..." }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("bears");
  });
  it("preserva siglas iguais com fullName diferente (as duas AIMS)", () => {
    const out = dedupeScales([
      scale({ id: "aims", name: "AIMS", fullName: "Alberta Infant Motor Scale" }),
      scale({ id: "aims-efeitos", name: "AIMS", fullName: "Abnormal Involuntary Movement Scale" }),
    ]);
    expect(out).toHaveLength(2);
  });
  it("deduplica por id repetido", () => {
    const out = dedupeScales([scale({ id: "a", fullName: "A" }), scale({ id: "a", fullName: "B" })]);
    expect(out).toHaveLength(1);
  });
});
