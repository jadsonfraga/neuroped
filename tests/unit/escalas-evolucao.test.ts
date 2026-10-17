// Evolução de escalas: séries, faixas, alertas e pendências. Dados fictícios.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calcularEvolucao, faixasDe, INSTRUMENTOS_EVOLUCAO, instrumentoDe, AVISO_APOIO } from "../../client/src/lib/evolucaoEscalas";

const r = (scaleName: string, totalScore: number | null, createdAt: string, extra: Record<string, unknown> = {}) => ({ id: `${scaleName}-${createdAt}`, scaleName, totalScore, createdAt, ...extra });

describe("registro de instrumentos validados", () => {
  it("reconhece instrumentos e deixa fora os proprietários sem aplicação no app", () => {
    assert.equal(instrumentoDe("M-CHAT-R/F (rastreio)")?.id, "mchat");
    assert.equal(instrumentoDe("PHQ-A")?.id, "phqa");
    // CARS e CDI-2 viraram fichas de referência (17/10/2026): sem faixa inventada, registros antigos ficam pendentes.
    assert.equal(instrumentoDe("CARS"), null);
    assert.equal(instrumentoDe("CARS-2"), null);
    assert.equal(instrumentoDe("CDI-2"), null);
    assert.equal(instrumentoDe("SNAP-IV"), null);
  });

  it("faixas e cortes saem do classificador do app (sem tabela paralela)", () => {
    const phqa = faixasDe(instrumentoDe("PHQ-A")!);
    assert.deepEqual(phqa.map((f) => f.deEscore), [0, 5, 10, 15, 20]);
    const mchat = faixasDe(instrumentoDe("M-CHAT")!);
    assert.deepEqual(mchat.map((f) => f.deEscore), [0, 3, 8]);
    const cshq = faixasDe(instrumentoDe("CSHQ")!);
    assert.equal(cshq[1].deEscore, 42);
  });

  it("todo instrumento registrado cita a fonte no app", () => {
    for (const i of INSTRUMENTOS_EVOLUCAO) assert.match(i.fonte, /client\/src\/data\//);
  });
});

describe("calcularEvolucao", () => {
  it("ordena por data e calcula delta e faixa", () => {
    const { series } = calcularEvolucao([r("PHQ-A", 12, "2026-06-01"), r("PHQ-A", 4, "2026-03-01"), r("PHQ-A", 8, "2026-04-15")]);
    assert.equal(series.length, 1);
    assert.deepEqual(series[0].pontos.map((p) => [p.escore, p.faixa, p.delta]), [[4, "Mínima", null], [8, "Leve", 4], [12, "Moderada", 4]]);
  });

  it("alerta piora de faixa e melhora de faixa com nível correto", () => {
    const piora = calcularEvolucao([r("PHQ-A", 4, "2026-03-01"), r("PHQ-A", 11, "2026-05-01")]).series[0].alertas;
    assert.ok(piora.some((a) => a.codigo === "piora-de-faixa" && a.nivel === "atencao"));
    const melhora = calcularEvolucao([r("PHQ-A", 16, "2026-03-01"), r("PHQ-A", 6, "2026-05-01")]).series[0].alertas;
    assert.ok(melhora.some((a) => a.codigo === "melhora-de-faixa" && a.nivel === "informativo"));
    assert.ok(!melhora.some((a) => a.codigo === "piora-de-faixa"));
  });

  it("sem mudança de faixa nem variação grande, sem alerta", () => {
    const { series } = calcularEvolucao([r("PHQ-A", 5, "2026-03-01"), r("PHQ-A", 6, "2026-05-01")]);
    assert.deepEqual(series[0].alertas, []);
  });

  it("variação expressiva usa o limiar configurável e só com amplitude documentada", () => {
    const base = [r("PHQ-A", 5, "2026-03-01"), r("PHQ-A", 9, "2026-05-01")]; // +4 de 27 = 14,8%
    assert.ok(!calcularEvolucao(base).series[0].alertas.some((a) => a.codigo === "variacao-expressiva"));
    assert.ok(calcularEvolucao(base, { limiarAmplitude: 0.1 }).series[0].alertas.some((a) => a.codigo === "variacao-expressiva"));
  });

  it("versões diferentes não são comparadas", () => {
    const { series } = calcularEvolucao([r("PHQ-A", 4, "2026-03-01", { scaleVersion: "1.0" }), r("PHQ-A", 20, "2026-05-01", { scaleVersion: "2.0" })]);
    assert.deepEqual(series[0].alertas.map((a) => a.codigo), ["versao-diferente"]);
    assert.equal(series[0].pontos[1].delta, null);
  });

  it("escore fora do intervalo é excluído e sinalizado", () => {
    const { series } = calcularEvolucao([r("PHQ-A", 5, "2026-03-01"), r("PHQ-A", 99, "2026-05-01")]);
    assert.equal(series[0].pontos.length, 1);
    assert.ok(series[0].alertas.some((a) => a.codigo === "escore-fora-do-intervalo"));
  });

  it("intervalo curto gera nota informativa", () => {
    const { series } = calcularEvolucao([r("PHQ-A", 5, "2026-03-01"), r("PHQ-A", 6, "2026-03-05")]);
    assert.ok(series[0].alertas.some((a) => a.codigo === "intervalo-curto" && a.nivel === "informativo"));
  });

  it("nunca inventa escore: aplicação sem escore é ignorada", () => {
    const { series, pendentes } = calcularEvolucao([r("PHQ-A", null, "2026-03-01"), r("PHQ-A", 7, "2026-05-01")]);
    assert.equal(series[0].pontos.length, 1);
    assert.equal(pendentes.length, 0);
    const soNulos = calcularEvolucao([r("PHQ-A", null, "2026-03-01")]);
    assert.equal(soNulos.series.length, 0);
    assert.equal(soNulos.pendentes.length, 1);
  });

  it("instrumento sem regra validada fica pendente, sem alerta", () => {
    const { series, pendentes } = calcularEvolucao([r("SNAP-IV", 20, "2026-03-01"), r("SNAP-IV", 40, "2026-05-01")]);
    assert.equal(series.length, 0);
    assert.equal(pendentes.length, 1);
    assert.match(pendentes[0].motivo, /Sem regra de evolução validada/);
    assert.deepEqual(pendentes[0].aplicacoes.map((a) => a.escore), [20, 40]);
  });

  it("aceita formato LIVE (payload.title, appliedAt) e entrada inválida", () => {
    const live = { id: "x", instrumentId: "mchat", payload: { title: "M-CHAT-R/F" }, appliedAt: "2026-03-01T00:00:00Z", totalScore: 5 };
    assert.equal(calcularEvolucao([live]).series[0].instrumento.id, "mchat");
    assert.deepEqual(calcularEvolucao(null as unknown as unknown[]), { series: [], pendentes: [] });
  });

  it("aviso de apoio declara que não substitui o médico", () => {
    assert.match(AVISO_APOIO, /Não substituem o julgamento do médico/);
  });
});
