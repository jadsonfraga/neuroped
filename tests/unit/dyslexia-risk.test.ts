import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { featuredNavigation, navSections } from "../../client/src/data/navigation";
import { scoreIced, type IcedInput } from "../../client/src/features/dyslexia-risk/model";

const empty: IcedInput = {
  ano: "3",
  controle: { esc: "sim", alf: "sim", freq: "sim", aud: "sim", vis: "sim", di: "sim", pers: "sim" },
  palavrasAcertos: 20, palavrasF: 0, palavrasNorma: false,
  pseudoAcertos: 16, pseudoLex: 0, pseudoNorma: false,
  pcpm: 110, fluenciaNorma: false,
  ditadoF: 0, ditadoPseudoCertas: 5, ditadoNorma: false,
  cfAcertos: 12, cfNorma: false,
  ranSeg: 30, ranErros: 0, ranNorma: false,
  familiar: "nao",
  persistencia4: false,
};

test("dyslexia risk entra no destaque fora do topo fixo e na triagem", () => {
  assert.equal(featuredNavigation.slice(0, 9).some((item) => item.href === "/dyslexia-risk"), false);
  const featured = featuredNavigation.filter((item) => item.href === "/dyslexia-risk");
  const section = navSections.flatMap((item) => item.items).filter((item) => item.href === "/dyslexia-risk");
  assert.equal(featured.length, 1);
  assert.equal(section.length, 1);
  assert.equal(featured[0].label, "dyslexia risk");
  assert.equal(section[0].label, "dyslexia risk");
  assert.equal(featured[0].tone, "priority");
});

test("trava do bloco 0 impede leitura de dislexia", () => {
  const result = scoreIced({ ...empty, controle: { ...empty.controle, aud: "nao" }, pcpm: 20, ditadoF: 8 });
  assert.equal(result.trava, true);
  assert.equal(result.faixa, "descritiva");
  assert.match(result.frase, /não constitui diagnóstico/);
});

test("9–15 sem núcleo reclassifica para intermediário", () => {
  const result = scoreIced({ ...empty, pseudoAcertos: 4, cfAcertos: 2, ranSeg: 70, familiar: "sim", persistencia4: true, pcpm: 110, ditadoF: 0, ditadoPseudoCertas: 5 });
  assert.equal(result.nucleo, "ausente");
  assert.equal(result.faixa, "intermediaria");
});

test("cabeçalho usa o escudo e a estética do Super NeuroPad", () => {
  const page = readFileSync("client/src/pages/dyslexia-risk.tsx", "utf8");
  assert.match(page, /dr-jadson-shield-badge\.webp/);
  assert.match(page, /super-neuropad-arcade\.css/);
  assert.match(page, /className="snp /);
});

test("fluência do 2º ano pontua só na âncora", () => {
  assert.equal(scoreIced({ ...empty, ano: "2", pcpm: 42 }).dominios[0].pontos, 3);
  assert.equal(scoreIced({ ...empty, ano: "2", pcpm: 50 }).dominios[0].pontos, 0);
  assert.equal(scoreIced({ ...empty, ano: "2", pcpm: 50 }).dominios[0].limítrofe, true);
});
