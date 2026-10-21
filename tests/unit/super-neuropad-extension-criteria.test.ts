// Ampliação autoral dos 8 aos 17 anos: gabaritos conferíveis, critérios explícitos
// (cumpre / não cumpre), limiar rotulado como autoral e segurança nos itens motores.
import assert from "node:assert/strict";
import test from "node:test";
import { INTEGRATED_BANK, PHASE_ORDER, YEARS } from "../../client/src/features/super-neuropad/bank";

const extras = () => YEARS.filter((y) => y >= 8).flatMap((y) => PHASE_ORDER.map((p) => ({ y, p, item: INTEGRATED_BANK[y][p].find((item) => /ampliação autoral do jogo/.test(item.ref))! })));

test("o sexto desafio de cada mundo (8–17) é rotulado como ampliação autoral", () => {
  for (const { item } of extras()) assert.match(item.ref, /ampliação autoral do jogo/);
});

test("a contagem de cachorros bate com o gabarito", () => {
  for (const { item } of extras()) {
    if (item.kind !== "toque" || !item.stimulus?.includes("🐶")) continue;
    assert.equal(String([...item.stimulus.matchAll(/🐶/g)].length), item.answer);
  }
});

test("memória sequencial: opções distintas e a certa é a vista", () => {
  for (const { item } of extras()) {
    if (item.kind !== "toque" || !item.preview) continue;
    const labels = item.options.map((o) => o.label);
    assert.equal(new Set(labels).size, labels.length);
    assert.ok(labels.includes(item.answer));
  }
});

test("itens julgados novos dizem o que cumpre e o que não cumpre, ou dão o gabarito", () => {
  for (const { item } of extras()) {
    if (item.kind !== "fala" && item.kind !== "fazer") continue;
    if (item.kind === "fazer") assert.match(item.expected, /Cumpre:.*Não cumpre:/s, item.id);
  }
});

test("equilíbrio de olhos fechados traz instrução de segurança e saída por medo", () => {
  const item = INTEGRATED_BANK[8].corpo.find((item) => /ampliação autoral do jogo/.test(item.ref))!;
  assert.equal(item.kind, "fazer");
  assert.match(item.prompt, /Segurança:/);
  assert.match(item.prompt, /segurar/);
});

test("fluência traz regra do que conta e pede o registro da quantidade, sem corte", () => {
  for (const y of YEARS.filter((v) => v >= 8)) {
    const item = INTEGRATED_BANK[y].palavras.find((item) => /ampliação autoral do jogo/.test(item.ref))!;
    assert.match(item.prompt, /Não contam:/);
    assert.ok(item.kind === "fala" && /anote a quantidade/.test(item.expected) && !/pelo menos|piso|norma/i.test(item.expected));
  }
});
