import { describe, it, expect } from "vitest";
import { directDomains, domainsForQueixas } from "@/data/directTasks";

describe("directDomains (sondagens recuperadas do legado)", () => {
  it("tem os domínios clínicos esperados", () => {
    const ids = directDomains.map((d) => d.id);
    expect(ids).toEqual(expect.arrayContaining([
      "linguagem", "social", "atencao", "escola", "cognicao", "visual", "sensorial", "emocional", "motor",
    ]));
  });
  it("todo domínio tem ao menos uma tarefa com instrução e o que observar", () => {
    for (const d of directDomains) {
      expect(d.tasks.length).toBeGreaterThan(0);
      for (const t of d.tasks) {
        expect(t.instrucao.length).toBeGreaterThan(0);
        expect(t.observar.length).toBeGreaterThan(0);
      }
    }
  });
  it("o domínio emocional inclui a checagem de segurança (risk)", () => {
    const emo = directDomains.find((d) => d.id === "emocional");
    expect(emo?.tasks.some((t) => t.risk)).toBe(true);
  });
});

describe("domainsForQueixas", () => {
  it("sem queixa retorna todos os domínios", () => {
    expect(domainsForQueixas([], null).length).toBe(directDomains.length);
  });
  it("filtra pela queixa selecionada", () => {
    const r = domainsForQueixas(["tdah"], 96);
    expect(r.some((d) => d.id === "atencao")).toBe(true);
  });
  it("respeita faixa etária aproximada", () => {
    // social vai até ~84 meses; aos 18 anos não deve aparecer
    const r = domainsForQueixas(["social"], 216);
    expect(r.some((d) => d.id === "social")).toBe(false);
  });
});
