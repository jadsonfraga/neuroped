// Perfis graduados 6–13 dos Testes Cognitivos por Faixa Etária: cada item
// precisa ser respondível sozinho, com o estímulo visível na pergunta.
// Regressão: "Se a regra é alternar direção e cor, qual é o próximo símbolo?"
// (12 anos, visual) não mostrava sequência alguma e era impossível responder.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("client/src/pages/testes-cognitivos-faixa-etaria.tsx", "utf8");
const start = page.indexOf("const COGNITIVE_AGE_BANKS");
const end = page.indexOf("function getQuestionsForAge(");
assert.ok(start > 0 && end > start, "bloco COGNITIVE_AGE_BANKS não encontrado");
const banks = page.slice(start, end);

interface Item {
  age: number;
  domain: string;
  prompt: string;
  options: string[];
  answer: string;
}

const items: Item[] = [];
{
  let age = 0;
  let domain = "";
  const token =
    /^\s*(\d+): \{$|^\s*(visual|leitura|escrita|aritmetica): \[$|ageMcq\(\s*("(?:[^"\\]|\\.)*"),\s*\[([\s\S]*?)\],\s*("(?:[^"\\]|\\.)*"),?\s*\)/gm;
  for (const m of banks.matchAll(token)) {
    if (m[1]) age = Number(m[1]);
    else if (m[2]) domain = m[2];
    else {
      const prompt = JSON.parse(m[3]) as string;
      const options = JSON.parse(`[${m[4].trim().replace(/,\s*$/, "")}]`) as string[];
      const answer = JSON.parse(m[5]) as string;
      items.push({ age, domain, prompt, options, answer });
    }
  }
}

test("8 idades × 4 domínios × 4 itens, sem item fora de lugar", () => {
  assert.equal(items.length, 128);
  for (const age of [6, 7, 8, 9, 10, 11, 12, 13]) {
    for (const domain of ["visual", "leitura", "escrita", "aritmetica"]) {
      assert.equal(items.filter((i) => i.age === age && i.domain === domain).length, 4, `${age}/${domain}`);
    }
  }
});

test("cada item tem 4 alternativas distintas e a resposta é uma delas", () => {
  for (const it of items) {
    assert.equal(it.options.length, 4, it.prompt);
    assert.equal(new Set(it.options).size, 4, `alternativa repetida: ${it.prompt}`);
    assert.ok(it.options.includes(it.answer), `resposta fora das alternativas: ${it.prompt}`);
  }
});

test("a posição da resposta certa varia (gabarito não previsível)", () => {
  const positions = new Set(items.map((it) => it.options.indexOf(it.answer)));
  assert.deepEqual([...positions].sort(), [0, 1, 2, 3]);
});

test("pergunta de sequência mostra a sequência e o espaço a preencher", () => {
  const sequence = items.filter((it) => /vem depois/i.test(it.prompt));
  assert.ok(sequence.length >= 12);
  for (const it of sequence) {
    assert.match(it.prompt, /__/, `sem lacuna visível: ${it.prompt}`);
    assert.match(it.prompt, /\?\s*.+__/, `sem estímulo antes da lacuna: ${it.prompt}`);
  }
  assert.doesNotMatch(banks, /Se a regra é alternar/);
  assert.doesNotMatch(banks, /\(mesmo texto\)/);
});

test("leitura 8–13: todo item traz o texto na própria pergunta", () => {
  for (const it of items.filter((i) => i.domain === "leitura" && i.age >= 8)) {
    assert.match(it.prompt, /^Leia: '.+'\n/, `texto ausente: ${it.prompt}`);
  }
});

test("sem meta-pergunta abstrata sobre estrutura de texto ou argumento", () => {
  for (const it of items) {
    assert.doesNotMatch(
      it.prompt,
      /estrutura argumentativa|viés|inferência válida|síntese é mais completa|regra abstrata|duas regras simultâneas|tese\?$/i,
      it.prompt,
    );
  }
});
