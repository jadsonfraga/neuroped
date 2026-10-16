// Registro de tempo/observações, instrumentos de coleta em docs/instrumentos e cobertura de pendências operacionais.
// Nada aqui define corte, nível ou comparação com referência.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { analyze, agreement, parseCsv } from "../tools/analise-planilhas";
import { inventarioJogo, inventarioSuper } from "../tools/inventario-itens";
import { BANDS, bandForAge, type BandBank } from "../../client/src/features/dyslexia-risk/game/bank";
import { ITEMS_PER_WORLD, WORLDS, cleanObservacoes, newGame, nextItemFor, OBSERVACOES_MAX, OBSERVATION_CHIPS, recordResponse, setObservacoes } from "../../client/src/features/dyslexia-risk/game/engine";
import { OBSERVATION_CHIPS as SUPER_CHIPS, OBSERVATIONS_MAX } from "../../client/src/features/super-neuropad/model";
import { icedObservations } from "../../client/src/features/dyslexia-risk/report";

test("inventários em docs/instrumentos estão em sincronia com o código", () => {
  assert.equal(readFileSync("docs/instrumentos/inventario-itens-super-neuropad.csv", "utf8"), inventarioSuper(), "regenere: node --import tsx tests/tools/inventario-itens.ts");
  assert.equal(readFileSync("docs/instrumentos/inventario-itens-jogo-letras-numeros.csv", "utf8"), inventarioJogo(), "regenere: node --import tsx tests/tools/inventario-itens.ts");
});

test("planilhas de coleta vêm vazias (sem dados inventados) e com os cabeçalhos que a análise espera", () => {
  for (const [file, col] of [["planilha-concordancia-examinadores.csv", "resultado_aplicadora_A"], ["planilha-medicao-tempo.csv", "tempo_ativo_s"], ["planilha-formas-ab.csv", "forma"]]) {
    const text = readFileSync(`docs/instrumentos/${file}`, "utf8");
    assert.equal(text.trim().split("\n").length, 1, `${file} deve ter só o cabeçalho`);
    assert.ok(text.split("\n")[0].split(",").includes(col), `${file}: coluna ${col}`);
    assert.notEqual(analyze(text).tipo, "desconhecido");
  }
});

test("análise de concordância: percentual e kappa calculados, sem rótulo", () => {
  const rows = parseCsv("sessao,id_item,resultado_aplicadora_A,resultado_aplicadora_B,observacao\ns1,i1,acerto,acerto,\ns1,i2,acerto,erro,\ns1,i3,erro,erro,\ns1,i4,acerto,acerto,\n");
  const r = agreement(rows);
  assert.equal(r.comparados, 4); assert.equal(r.iguais, 3); assert.equal(r.percentualCoincidencia, 75);
  assert.equal(r.kappa, 0.5); assert.deepEqual(r.divergentes, ["s1:i2"]);
  assert.deepEqual(Object.keys(r).sort(), ["comparados", "divergentes", "iguais", "kappa", "percentualCoincidencia"]);
});

test("análise de tempo e de formas A/B: só medianas e diferenças", () => {
  const t = analyze("codigo,instrumento,faixa,forma,tempo_previsto_s,tempo_ativo_s,duracao_sessao_s,pausas,encerrada_por_limite,observacao\nc1,super,2,,600,700,720,0,nao,\nc2,super,2,,600,500,520,1,nao,\n") as { grupos: Array<{ aplicacoes: number; mediana: number; diferencaMediana: number }> };
  assert.equal(t.grupos[0].aplicacoes, 2); assert.equal(t.grupos[0].mediana, 600); assert.equal(t.grupos[0].diferencaMediana, 0);
  const f = analyze("codigo,faixa,forma,ordem,intervalo_dias,compreensao_acertos,compreensao_total,fluencia_lidas,fluencia_erros,fluencia_segundos,observacao\nk1,7-8,A,1,7,3,4,50,2,60,\nk1,7-8,B,2,7,4,4,48,1,60,\n") as { criancasComAmbasFormas: number; medianaDiferencaAbsolutaCompreensao: number; medianaDiferencaAbsolutaFluencia: number };
  assert.equal(f.criancasComAmbasFormas, 1); assert.equal(f.medianaDiferencaAbsolutaCompreensao, 1); assert.equal(f.medianaDiferencaAbsolutaFluencia, 2);
});

test("documentos de instrumentos não definem limite de aceitação nem classificação", () => {
  for (const file of ["README.md", "PROTOCOLO_CONCORDANCIA_EXAMINADORES.md", "PROTOCOLO_MEDICAO_TEMPO.md", "PROTOCOLO_EQUIVALENCIA_FORMAS_AB.md", "PROTOCOLO_PILOTO_CRIANCAS.md"]) {
    const text = readFileSync(`docs/instrumentos/${file}`, "utf8");
    assert.doesNotMatch(text, /ponto de corte|limiar|percentil|\bnormativ|kappa\s*[>≥<≤]|≥\s*0[,.]\d|nível de concordância/i, file);
  }
});

test("observações: limpeza, limite e atalhos descrevem fatos (JLN, ICED e Super NeuroPad)", () => {
  assert.equal(cleanObservacoes("  a   b \n c "), "a b c");
  assert.equal(cleanObservacoes("x".repeat(OBSERVACOES_MAX + 50)).length, OBSERVACOES_MAX);
  assert.equal(OBSERVACOES_MAX, OBSERVATIONS_MAX);
  assert.equal(setObservacoes(newGame({ idade: 8 }), "  oi  ").observacoes, "oi");
  assert.equal(icedObservations({ observacoes: undefined }), "");
  assert.equal(icedObservations({ observacoes: " a   b " }), "a b");
  for (const chips of [OBSERVATION_CHIPS, SUPER_CHIPS]) {
    assert.ok(chips.some((c) => /repet|reformul/i.test(c)), "atalho de mediação");
    assert.ok(chips.some((c) => /ruído|ambiente|acompanhante/i.test(c)), "atalho de condições");
    assert.equal(new Set(chips).size, chips.length);
  }
});

test("rascunho antigo sem observações continua válido", () => {
  const old = newGame({ idade: 8 }) as Record<string, unknown>;
  delete old.observacoes;
  assert.equal(cleanObservacoes((old as { observacoes?: string }).observacoes ?? ""), "");
});

test("escada adaptativa: em nenhuma faixa o conjunto de itens se esgota antes do número de itens de cada mundo", () => {
  for (const band of BANDS) {
    for (const correct of [true, false, true]) {
      for (const world of ["ditado", "decodificacao", "aritmetica"] as const) {
        let g = newGame({ idade: band.minAge });
        const seen = new Set<string>();
        for (let item = nextItemFor(g, world, band as BandBank); item; item = nextItemFor(g, world, band as BandBank)) {
          assert.equal(seen.has(item.id), false, `${band.band} ${world}: item repetido`);
          seen.add(item.id);
          g = recordResponse(g, { world, itemId: item.id, level: (item as { level: 1 | 2 | 3 }).level, prompt: "p", expected: "e", given: correct ? "e" : "z", outcome: correct ? "correto" : "erro", ms: 1000 }, band as BandBank);
          if (seen.size > 40) break;
        }
        assert.equal(seen.size, ITEMS_PER_WORLD[world], `${band.band} ${world} (${correct ? "acertos" : "erros"})`);
      }
    }
  }
  assert.ok(WORLDS.length > 0 && bandForAge(15)?.band === "15-18");
});

test("a página do Super NeuroPad avisa antes de sair com partida em andamento ou resultado não guardado", () => {
  const page = readFileSync("client/src/pages/super-neuropad-game.tsx", "utf8");
  assert.match(page, /addEventListener\("beforeunload"/);
  assert.match(page, /removeEventListener\("beforeunload"/);
});

test("a tela do Dyslexia Risk tem campo de observações do examinador e o jogo mostra tempos medidos", () => {
  assert.match(readFileSync("client/src/pages/dyslexia-risk.tsx", "utf8"), /data-testid="iced-observacoes"/);
  const game = readFileSync("client/src/features/dyslexia-risk/game/DyslexiaGame.tsx", "utf8");
  assert.match(game, /data-testid="drx-game-observations"/);
  assert.match(game, /data-testid="drx-game-timing"/);
});
