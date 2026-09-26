// Banco dos Testes Cognitivos por Faixa Etária (1–19 anos): cada item precisa
// ser respondível só com o que está na tela, ter uma única resposta certa e
// nunca pedir instrumento de fora (lápis, papel, objeto real).
import assert from "node:assert/strict";
import test from "node:test";
import {
  COGNITIVE_BANK,
  COGNITIVE_DOMAINS,
  COGNITIVE_MAX_AGE,
  COGNITIVE_MIN_AGE,
  buildMatches,
  domainLabel,
  isCognitiveAge,
  itemsFor,
  type CognitiveItem,
} from "../../client/src/features/cognitive-age/bank";

const ages = Array.from({ length: COGNITIVE_MAX_AGE - COGNITIVE_MIN_AGE + 1 }, (_, i) => COGNITIVE_MIN_AGE + i);
const all: { age: number; domain: string; item: CognitiveItem }[] = ages.flatMap((age) =>
  COGNITIVE_DOMAINS.flatMap((domain) => itemsFor(age, domain).map((item) => ({ age, domain, item }))),
);
const text = (item: CognitiveItem) => [item.prompt, item.say, item.stimulus ?? "", item.kind === "say" ? item.expected : "", item.kind === "tap" ? item.options.join(" ") : ""].join(" ");

test("1 a 19 anos: 19 idades × 4 domínios × 4 itens, ids únicos", () => {
  assert.equal(COGNITIVE_MIN_AGE, 1);
  assert.equal(COGNITIVE_MAX_AGE, 19);
  assert.equal(all.length, 19 * 4 * 4);
  for (const age of ages) for (const domain of COGNITIVE_DOMAINS) assert.equal(itemsFor(age, domain).length, 4, `${age}/${domain}`);
  assert.equal(new Set(all.map((x) => x.item.id)).size, all.length);
  assert.equal(isCognitiveAge(0), false);
  assert.equal(isCognitiveAge(1), true);
  assert.equal(isCognitiveAge(19), true);
  assert.equal(isCognitiveAge(20), false);
  assert.deepEqual(itemsFor(20, "visual"), []);
  assert.equal(Object.keys(COGNITIVE_BANK).length, 19);
});

test("tudo na tela: nenhum item pede lápis, papel, brinquedo ou objeto de fora do aplicativo", () => {
  for (const { item } of all) {
    assert.doesNotMatch(text(item), /l[áa]pis e papel|com (o )?l[áa]pis|com (a )?caneta|no papel|folha de papel|brinquedo|objeto real|no chão|na mesa|fora da tela|rabisc|desenh/i, `${item.id}: ${item.prompt}`);
  }
});

test("cada item declara a fala do adulto e o registro, e tem uma única resposta certa conferível", () => {
  for (const { item } of all) {
    assert.ok(item.prompt.trim().length > 0 && item.say.trim().length > 0, item.id);
    if (item.kind === "tap") {
      assert.ok(item.options.length >= 2 && item.options.length <= 4, item.id);
      assert.equal(new Set(item.options).size, item.options.length, `alternativa repetida: ${item.id}`);
      assert.ok(item.options.includes(item.answer), `resposta fora das alternativas: ${item.id}`);
      assert.equal(typeof item.big, "boolean");
    } else if (item.kind === "say") {
      assert.ok(item.stimulus.trim().length > 0, `${item.id}: fala precisa de estímulo na tela`);
      assert.ok(item.expected.trim().length > 0, `${item.id}: fala precisa de resposta esperada escrita`);
    } else {
      assert.ok(item.target.length >= 3 && item.target.length <= 12, item.id);
      const pool = [...item.tiles];
      for (const letter of item.target) {
        const at = pool.indexOf(letter);
        assert.ok(at >= 0, `${item.id}: letra ${letter} não está nas peças`);
        pool.splice(at, 1);
      }
      assert.notEqual(item.tiles.join(""), item.target.join(""), `${item.id}: peças já na ordem certa`);
      assert.equal(buildMatches(item, item.target), true);
      assert.equal(buildMatches(item, [...item.target].reverse()), item.target.join("") === [...item.target].reverse().join(""));
      assert.equal(buildMatches(item, item.target.slice(1)), false);
      assert.equal(item.show, Boolean(item.stimulus));
    }
  }
});

test("a posição da resposta certa varia entre os itens de toque (gabarito não previsível)", () => {
  const positions = new Set(all.filter((x) => x.item.kind === "tap").map((x) => (x.item as { options: string[]; answer: string }).options.indexOf((x.item as { answer: string }).answer)));
  assert.deepEqual([...positions].sort(), [0, 1, 2, 3]);
});

test("gradação: 1–2 anos só toque em figuras grandes (2–3 opções) ou fala; letras e números entram até os 3 anos", () => {
  for (const { age, item } of all.filter((x) => x.age <= 2)) {
    assert.ok(item.kind === "tap" || item.kind === "say", `${item.id}: sem montagem antes de 3 anos`);
    if (item.kind === "tap") {
      assert.ok(item.options.length <= 3, `${item.id}: ${age} anos com mais de 3 opções`);
      assert.equal(item.big, true, `${item.id}: opções precisam ser gigantes`);
    }
  }
  for (const age of [3, 4, 5, 6, 7]) {
    const letters = itemsFor(age, "escrita");
    assert.ok(letters.some((i) => /letra|palavra/i.test(i.prompt)), `${age} anos: alfabeto presente`);
    const numbers = itemsFor(age, "aritmetica");
    assert.ok(numbers.some((i) => /\d/.test(text(i)) || /quant/i.test(i.prompt)), `${age} anos: números presentes`);
  }
});

test("fala antes dos 6 anos; leitura em voz alta e texto na própria tela a partir dos 6", () => {
  for (const age of ages.filter((a) => a < 6)) {
    assert.ok(itemsFor(age, "leitura").some((i) => i.kind === "say"), `${age} anos: item de fala`);
    assert.equal(domainLabel("leitura", age), "Fala e linguagem");
  }
  for (const age of ages.filter((a) => a >= 6)) {
    const reading = itemsFor(age, "leitura");
    assert.ok(reading.some((i) => i.kind === "say" && /leia/i.test(i.prompt)), `${age} anos: leitura em voz alta`);
    for (const item of reading.filter((i) => i.kind === "tap" && /texto|leia/i.test(i.prompt))) {
      assert.ok(item.stimulus && item.stimulus.length > 10, `${item.id}: pergunta sobre texto sem o texto na tela`);
    }
    assert.equal(domainLabel("leitura", age), "Leitura");
  }
  for (const age of ages.filter((a) => a >= 5)) {
    assert.ok(itemsFor(age, "escrita").some((i) => i.kind === "build"), `${age} anos: escrita montando a palavra na tela`);
  }
});

test("sem meta-pergunta abstrata, sem '(mesmo texto)', toda sequência mostra a lacuna", () => {
  for (const { item } of all) {
    assert.doesNotMatch(item.prompt, /estrutura argumentativa|viés|inferência válida|síntese|regra abstrata|duas regras|tese\?$|\(mesmo texto\)/i, item.id);
    if (/vem depois|continua a sequência/i.test(item.prompt)) {
      assert.ok(item.stimulus && /__/.test(item.stimulus), `${item.id}: sequência sem lacuna visível`);
    }
  }
});

test("nível sobe: aritmética de 1–2 anos é quantidade, 6–8 soma e subtração, 14+ porcentagem, equação ou média", () => {
  for (const age of [1, 2]) for (const item of itemsFor(age, "aritmetica")) assert.match(item.prompt, /MAIS|MENOS|UM|UMA|DOIS|MUITAS/, item.id);
  for (const age of [6, 7, 8]) assert.ok(itemsFor(age, "aritmetica").some((i) => /[+−]/.test(i.prompt)), `${age} anos`);
  for (const age of [14, 15, 16, 17, 18, 19]) assert.ok(itemsFor(age, "aritmetica").some((i) => /%|x|média|Média|juros|Probabilidade|Área/i.test(i.prompt)), `${age} anos`);
});
