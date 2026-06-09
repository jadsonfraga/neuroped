import { describe, expect, it } from "vitest";
import { buildFilterRanking, defaultPreConsultaCatalog } from "@/data/filterPipeline";

const knownRoutes = new Set([
  "/abc", "/aq10", "/asq3", "/brief2", "/cars", "/cbcl", "/cdi2", "/conners", "/cshq",
  "/cssrs", "/denver", "/eaah", "/ecar-si", "/gad7", "/gmfcs", "/ips", "/mchat",
  "/pdae", "/phqa", "/psc17", "/scared", "/sdq", "/snap", "/tde2", "/testes-academicos",
  "/testes-diretos", "/testes-reconhecimento", "/vanderbilt", "/vineland", "/ygtss",
  "/inventarios-escola", "/inventarios-auto", "/ahsd-tea", "/pant",
  "/bateria-jadson", "/caa", "/crafft", "/diario-alimentar", "/diario-escola",
  "/diario-sono", "/eaf", "/eai", "/easi", "/ecsm", "/edi", "/emdi", "/ems", "/epilepsia",
  "/escala-sonolencia-pediatrica", "/escalas-neuropsiquiatria", "/espasticidade",
  "/etare", "/pre-consulta", "/pre-retorno", "/qualidade", "/tea",
  "/tea-comportamentos",
]);

const catalog = defaultPreConsultaCatalog();

describe("filterPipeline final ranking", () => {
  const scenarios: Array<{
    name: string;
    age: string;
    queixas: string[];
    expectedTop: RegExp;
  }> = [
    { name: "TEA 2-4a", age: "2-4a", queixas: ["tea"], expectedTop: /M-CHAT|CARS|IPS/i },
    { name: "TEA + atraso 2-4a", age: "2-4a", queixas: ["tea", "atraso"], expectedTop: /M-CHAT/i },
    { name: "TDAH 6-12a", age: "6-12a", queixas: ["tdah"], expectedTop: /SNAP/i },
    { name: "TDAH + ansiedade 6-12a", age: "6-12a", queixas: ["tdah", "ansiedade"], expectedTop: /SNAP/i },
    { name: "TEA + TDAH 2-4a", age: "2-4a", queixas: ["tea", "tdah"], expectedTop: /M-CHAT/i },
    { name: "Aprendizagem + TDAH 6-12a", age: "6-12a", queixas: ["aprendizagem", "tdah"], expectedTop: /SNAP/i },
    { name: "Linguagem 2-4a", age: "2-4a", queixas: ["linguagem"], expectedTop: /ASQ|Denver|Testes Diretos/i },
    { name: "Cognicao 6-12a", age: "6-12a", queixas: ["cognicao"], expectedTop: /Testes Diretos/i },
    { name: "Aprendizagem 6-12a", age: "6-12a", queixas: ["aprendizagem"], expectedTop: /PDAE|Testes Acad/i },
    { name: "Depressao + suicidio 12-18a", age: "12-18a", queixas: ["depressao", "suicidio"], expectedTop: /C-SSRS/i },
    { name: "Ansiedade + depressao 12-18a", age: "12-18a", queixas: ["ansiedade", "depressao"], expectedTop: /SCARED/i },
    { name: "Comportamento + TDAH 6-12a", age: "6-12a", queixas: ["comportamento", "tdah"], expectedTop: /SNAP/i },
  ];

  it.each(scenarios)("$name keeps the pre-consulta contract", ({ age, queixas, expectedTop }) => {
    const result = buildFilterRanking(catalog, "", queixas, age);
    const tierScales = result.recommendations
      .filter((item) => ["Ouro", "Prata", "Bronze"].includes(item.slot))
      .map((item) => item.scale)
      .filter(Boolean);

    expect(result.pool.length).toBeGreaterThan(0);
    expect(result.recommendations[0].scale?.name).toMatch(expectedTop);
    expect(result.pool.every((scale) => scale.prioridade !== "monitorizacao")).toBe(true);
    expect(result.pool.every((scale) => !["/orientacao-parental", "/portal-familia"].includes(scale.appRoute || ""))).toBe(true);
    expect(new Set(tierScales.map((scale) => scale!.id)).size).toBe(tierScales.length);
    expect(result.pool.filter((scale) => scale.appRoute).every((scale) => knownRoutes.has(scale.appRoute!))).toBe(true);
  });
});
