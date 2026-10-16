// Pendências do diagnóstico (ICED-8): referências em tabela (valores atuais, sem fonte), ditado com 10 pseudopalavras
// (corte proporcional 2/5), RAN por ano, leitura proporcional descritiva e procedência. Nenhum valor clínico novo.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { DITADO_PSEUDO, scoreIced, fluencyAnchor, type IcedInput } from "../../client/src/features/dyslexia-risk/model";
import { DITADO_PSEUDO_LEGACY_TOTAL, DITADO_REFERENCE, FLUENCY_ANCHORS, ICED_PROVENANCE, RAN_REFERENCE, SCORE_REFERENCE, ranReferenceFor } from "../../client/src/features/dyslexia-risk/icedConfig";

const ok: IcedInput["controle"] = { esc: "sim", alf: "sim", freq: "sim", aud: "sim", vis: "sim", di: "sim", pers: "sim" };
function input(over: Partial<IcedInput>): IcedInput {
  return {
    ano: "2", controle: ok, palavrasAcertos: null, palavrasF: null, palavrasNorma: false, pseudoAcertos: null, pseudoLex: null, pseudoNorma: false,
    pcpm: null, fluenciaNorma: false, ditadoF: null, ditadoPseudoCertas: null, ditadoNorma: false, cfAcertos: null, cfNorma: false,
    ranSeg: null, ranErros: null, ranNorma: false, familiar: "", persistencia4: null, ...over,
  };
}
const pts = (r: ReturnType<typeof scoreIced>, id: string) => r.dominios.find((d) => d.id === id)!.pontos;

test("tabelas de referência guardam exatamente os valores históricos e declaram que não têm fonte", () => {
  assert.deepEqual([FLUENCY_ANCHORS["2"].pontuaAte, FLUENCY_ANCHORS["2"].descreveAte, FLUENCY_ANCHORS["3"].pontuaAte, FLUENCY_ANCHORS["3"].descreveAte], [42, 55, 70, 80]);
  assert.deepEqual([RAN_REFERENCE["2"].segundosAcima, RAN_REFERENCE["2"].errosMinimo], [45, 4]);
  assert.deepEqual([SCORE_REFERENCE.intermediaria, SCORE_REFERENCE.elevada, SCORE_REFERENCE.maximo], [5, 9, 15]);
  assert.equal(DITADO_REFERENCE.errosFonologicosMinimo, 4);
  for (const row of [FLUENCY_ANCHORS["2"], FLUENCY_ANCHORS["3"], RAN_REFERENCE.outro, DITADO_REFERENCE, SCORE_REFERENCE]) {
    assert.equal(row.fonte, null);
    assert.equal(row.status, "referencia_interna_sem_fonte");
  }
  assert.match(ICED_PROVENANCE, /sem fonte publicada nem validação em crianças brasileiras/);
  assert.equal(fluencyAnchor("2", 42).pontua, true);
  assert.equal(fluencyAnchor("2", 43).pontua, false);
  assert.equal(fluencyAnchor("3", 70).pontua, true);
  assert.match(fluencyAnchor("3", 75).detalhe, /71–80/);
});

test("ditado: 10 pseudopalavras (as 5 antigas primeiro) e corte proporcional 2/5 idêntico ao antigo com 5", () => {
  assert.equal(DITADO_PSEUDO.length, 10);
  assert.deepEqual([...DITADO_PSEUDO].slice(0, 5), ["mepa", "tulo", "falito", "bruneca", "crenuto"]);
  assert.equal(new Set(DITADO_PSEUDO).size, 10);
  assert.equal(DITADO_PSEUDO_LEGACY_TOTAL, 5);
  // sem o total (versão antiga) ou com total 5: ≤ 2 pontua, 3 não
  for (const total of [undefined, 5]) {
    assert.equal(pts(scoreIced(input({ ditadoPseudoCertas: 2, ditadoPseudoTotal: total })), "ortografia"), 3);
    assert.equal(pts(scoreIced(input({ ditadoPseudoCertas: 3, ditadoPseudoTotal: total })), "ortografia"), 0);
  }
  // total 10: ≤ 4 pontua (40%), 5 não
  assert.equal(pts(scoreIced(input({ ditadoPseudoCertas: 4, ditadoPseudoTotal: 10 })), "ortografia"), 3);
  assert.equal(pts(scoreIced(input({ ditadoPseudoCertas: 5, ditadoPseudoTotal: 10 })), "ortografia"), 0);
  assert.match(scoreIced(input({ ditadoPseudoCertas: 6, ditadoPseudoTotal: 10 })).dominios[1].detalhe, /6\/10/);
});

test("RAN por ano: tabela única hoje, com o mesmo corte para todos os anos", () => {
  for (const ano of ["2", "3", "outro", ""] as const) {
    assert.equal(ranReferenceFor(ano).segundosAcima, 45);
    assert.equal(pts(scoreIced(input({ ano, ranSeg: 46, ranErros: 0 })), "ran"), 1);
    assert.equal(pts(scoreIced(input({ ano, ranSeg: 45, ranErros: 3 })), "ran"), 0);
    assert.equal(pts(scoreIced(input({ ano, ranSeg: 30, ranErros: 4 })), "ran"), 1);
  }
});

test("leitura proporcional é só descritiva: aparece com domínios fora do alcance e não altera a faixa", () => {
  const partial = scoreIced(input({ ano: "outro", ditadoF: 5, pseudoAcertos: 8, cfAcertos: 3 }));
  assert.ok(partial.pontosExaminaveis < 15);
  assert.equal(partial.proporcaoPct, Math.round((partial.total / partial.pontosExaminaveis) * 100));
  assert.ok(partial.avisos.some((a) => /Leitura proporcional \(descritiva, NÃO altera a faixa\)/.test(a)));
  assert.ok(partial.avisos.some((a) => /decisão clínica do médico/.test(a)));
  // a faixa continua a regra absoluta: total < 9 não vira "elevada" só porque a proporção seria alta
  assert.ok(partial.total < 9 ? partial.faixa !== "elevada" : true);
  const full = scoreIced(input({ ano: "2", pcpm: 30, ditadoF: 5, pseudoAcertos: 8, palavrasAcertos: 10, cfAcertos: 3, ranSeg: 60, ranErros: 0, familiar: "sim", persistencia4: true }));
  assert.equal(full.pontosExaminaveis, 15);
  assert.ok(!full.avisos.some((a) => /Leitura proporcional/.test(a)));
  assert.equal(full.faixa, "elevada");
});

test("página e registro: ditado mostra só as pseudopalavras do rascunho e procedência aparece na tela e no PDF", () => {
  const page = readFileSync(new URL("../../client/src/pages/dyslexia-risk.tsx", import.meta.url), "utf8");
  const report = readFileSync(new URL("../../client/src/features/dyslexia-risk/report.ts", import.meta.url), "utf8");
  assert.match(page, /DITADO_PSEUDO\.slice\(0, s\.ditadoP\.length\)/);
  assert.match(page, /data-testid="iced-provenance"/);
  assert.match(report, /ditadoPseudoTotal: s\.ditadoP\.length/);
  assert.match(report, /ICED_DISCLAIMER, ICED_PROVENANCE/);
});
