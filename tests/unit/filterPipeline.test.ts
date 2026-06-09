import { describe, it, expect } from "vitest";
import { allScales } from "@/data/scaleFilter";
import { mergeFilterableCatalog } from "@/data/filterableCatalog";
import { isPreConsulta, dedupeScales } from "@/lib/preConsultaFilter";
import { firstLineByQueixa } from "@/data/preConsultaCurated";

// Catálogo de pré-consulta como o filtro monta (sem as escalas mundiais, que
// são carregadas em runtime): núcleo + suplementares, dedup e exclusão.
const catalog = dedupeScales(mergeFilterableCatalog(allScales)).filter(isPreConsulta);

describe("pipeline do catálogo de pré-consulta", () => {
  it("não contém NENHUM instrumento de monitorização/acompanhamento", () => {
    expect(catalog.filter((s) => s.prioridade === "monitorizacao")).toHaveLength(0);
  });

  it("não contém psicoeducação (orientação parental / portal família)", () => {
    const rotas = catalog.map((s) => s.appRoute);
    expect(rotas).not.toContain("/orientacao-parental");
    expect(rotas).not.toContain("/portal-familia");
  });

  it("não tem fullName duplicado (dedup eficaz)", () => {
    const nomes = catalog.map((s) => (s.fullName || s.name).toLowerCase().trim());
    expect(new Set(nomes).size).toBe(nomes.length);
  });

  it("inclui os testes diretos recuperados do legado", () => {
    expect(catalog.some((s) => s.appRoute === "/testes-diretos")).toBe(true);
  });

  it("traz a primeira-linha clínica esperada por queixa", () => {
    const rotas = new Set(catalog.map((s) => s.appRoute));
    expect(rotas).toContain("/mchat");   // TEA
    expect(rotas).toContain("/snap");    // TDAH
    expect(rotas).toContain("/scared");  // ansiedade
    expect(rotas).toContain("/cdi2");    // depressão
  });

  it("as rotas com aplicação citadas na curadoria existem no catálogo", () => {
    const rotasCatalogo = new Set(catalog.map((s) => s.appRoute).filter(Boolean));
    const faltando: string[] = [];
    for (const [, rotas] of Object.entries(firstLineByQueixa)) {
      for (const r of rotas) {
        if (!rotasCatalogo.has(r)) faltando.push(r);
      }
    }
    // Curadoria não deve apontar para rota que não está no catálogo de pré-consulta.
    expect(faltando).toEqual([]);
  });
});
