// Banco objetivo do Modo Fácil (Sonda 10 e OBS-10), de 1 a 19 anos.
// Invariantes: toda idade coberta; 20 itens por faixa, 10 para cada aplicação
// sem sobreposição; opções distintas com a resposta entre elas; posição da
// resposta variando; quantidade de opções crescendo com a idade; domínios
// adequados à idade; nada pede objeto, papel ou pessoa fora do aplicativo.
import assert from "node:assert/strict";
import test from "node:test";
import {
  OBJECTIVE_BANDS,
  OBJECTIVE_MAX_YEARS,
  OBJECTIVE_MIN_YEARS,
  objectiveBandForYears,
  objectiveItems,
  type ObjectiveDomain,
} from "../../client/src/components/jogo-facil/objectiveBank";

const ages = Array.from({ length: OBJECTIVE_MAX_YEARS - OBJECTIVE_MIN_YEARS + 1 }, (_, i) => OBJECTIVE_MIN_YEARS + i);

test("toda idade de 1 a 19 cai em exatamente uma faixa; fora disso, nenhuma", () => {
  for (const age of ages) {
    const bands = OBJECTIVE_BANDS.filter((b) => age >= b.minYears && age <= b.maxYears);
    assert.equal(bands.length, 1, `${age} anos`);
    assert.equal(objectiveBandForYears(age)?.id, bands[0].id);
  }
  assert.equal(objectiveBandForYears(0), undefined);
  assert.equal(objectiveBandForYears(20), undefined);
  assert.equal(objectiveBandForYears(4.5), undefined);
});

test("20 itens por faixa: 10 para a Sonda 10 e 10 para o OBS-10, sem repetição", () => {
  for (const band of OBJECTIVE_BANDS) {
    assert.equal(band.items.length, 20, band.id);
    const sonda = objectiveItems("sonda", band.minYears);
    const obs = objectiveItems("obs10", band.minYears);
    assert.equal(sonda.length, 10, band.id);
    assert.equal(obs.length, 10, band.id);
    const says = new Set([...sonda, ...obs].map((i) => `${i.say}|${i.options.join(",")}`));
    assert.equal(says.size, 20, `itens repetidos em ${band.id}`);
    // Cada aplicação cobre os mesmos domínios da faixa.
    const domains = (list: { domain: ObjectiveDomain }[]) => [...new Set(list.map((i) => i.domain))].sort().join(",");
    assert.equal(domains(sonda), domains(obs), `cobertura diferente em ${band.id}`);
  }
});

test("cada item: opções distintas, resposta entre elas, sem enunciado vazio", () => {
  for (const band of OBJECTIVE_BANDS) {
    for (const item of band.items) {
      assert.ok(item.say.trim().length > 3, `${band.id}: ${item.say}`);
      assert.equal(new Set(item.options).size, item.options.length, `${band.id}: opção repetida em "${item.say}"`);
      assert.ok(item.options.includes(item.answer), `${band.id}: resposta fora das opções em "${item.say}"`);
    }
  }
});

test("posição da resposta varia dentro de cada faixa (gabarito não previsível)", () => {
  for (const band of OBJECTIVE_BANDS) {
    const positions = new Set(band.items.map((i) => i.options.indexOf(i.answer)));
    assert.ok(positions.size >= 2, `${band.id}: resposta sempre na mesma posição`);
    assert.ok(!band.items.every((i) => i.options.indexOf(i.answer) === 0), `${band.id}: sempre na primeira`);
  }
});

test("quantidade de opções cresce com a idade: 2 aos 1 ano, até 3 aos 2 anos, 4 a partir de 3 anos", () => {
  for (const band of OBJECTIVE_BANDS) {
    for (const item of band.items) {
      const n = item.options.length;
      if (band.minYears === 1) assert.equal(n, 2, `${band.id}: "${item.say}"`);
      else if (band.minYears === 2) assert.ok(n === 2 || n === 3, `${band.id}: "${item.say}"`);
      else if (band.minYears <= 5) assert.ok(n === 3 || n === 4, `${band.id}: "${item.say}"`);
      else assert.equal(n, 4, `${band.id}: "${item.say}"`);
    }
  }
});

test("domínios adequados à idade: figuras antes de letras; letras e números a partir de 3; leitura e escrita a partir de 5", () => {
  const has = (age: number, d: ObjectiveDomain) => objectiveBandForYears(age)!.items.some((i) => i.domain === d);
  assert.ok(has(1, "figuras") && !has(1, "letras") && !has(1, "leitura") && !has(1, "escrita"));
  assert.ok(has(2, "figuras") && !has(2, "letras") && !has(2, "leitura"));
  for (const age of [3, 4]) assert.ok(has(age, "letras") && has(age, "numeros") && !has(age, "leitura"), `${age} anos`);
  for (const age of [5, 6]) assert.ok(has(age, "letras") && has(age, "leitura") && has(age, "escrita") && has(age, "numeros"), `${age} anos`);
  for (const age of [7, 9, 12, 15, 19]) assert.ok(has(age, "leitura") && has(age, "escrita") && has(age, "numeros"), `${age} anos`);
});

test("nada fora do aplicativo: nenhum item pede objeto, papel, lápis, câmera ou ação de quem aplica", () => {
  const external = /\b(lápis|papel|caneta|giz|bloco|colchonete|câmera|filme|filmar|pegue|entregue|mostre o objeto|no chão|na sala|aponte para|imite|desenhe|escreva no|fale|diga em voz alta|repita)\b/iu;
  for (const band of OBJECTIVE_BANDS) {
    for (const item of band.items) {
      assert.doesNotMatch(item.say, external, `${band.id}: "${item.say}"`);
    }
  }
});

test("Sonda 10 e OBS-10 recebem itens diferentes da mesma faixa", () => {
  for (const age of [1, 5, 10, 19]) {
    const key = (i: { say: string; options: string[] }) => `${i.say}|${i.options.join(",")}`;
    const a = objectiveItems("sonda", age).map(key);
    const b = new Set(objectiveItems("obs10", age).map(key));
    assert.ok(a.every((k) => !b.has(k)), `${age} anos`);
  }
});
