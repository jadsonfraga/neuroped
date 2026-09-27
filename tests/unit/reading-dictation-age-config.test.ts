// Configuração da aba Por Faixa Etária (ditado e leitura, 5–19 anos): trava o
// recorte de idade e de domínios sobre o banco autoral dos Testes Cognitivos
// por Faixa Etária, para que uma mudança em bank.ts não deixe a aba sem itens
// silenciosamente.
import assert from "node:assert/strict";
import test from "node:test";
import { COGNITIVE_MAX_AGE, COGNITIVE_MIN_AGE, itemsFor } from "../../client/src/features/cognitive-age/bank";
import { BLOCK_DOMAINS, MAX_AGE, MIN_AGE, isValidAge } from "../../client/src/features/reading-dictation-age/config";

test("recorte de idade: 5 a 19 anos, dentro da faixa do banco autoral (1–19)", () => {
  assert.equal(MIN_AGE, 5);
  assert.equal(MAX_AGE, 19);
  assert.ok(MIN_AGE >= COGNITIVE_MIN_AGE, "o piso não pode ficar abaixo do banco autoral");
  assert.ok(MAX_AGE <= COGNITIVE_MAX_AGE, "o teto não pode passar do banco autoral");
});

test("isValidAge: só inteiros de 5 a 19", () => {
  assert.equal(isValidAge(4), false);
  assert.equal(isValidAge(5), true);
  assert.equal(isValidAge(19), true);
  assert.equal(isValidAge(20), false);
  assert.equal(isValidAge(8.5), false);
  assert.equal(isValidAge(Number.NaN), false);
});

test("blocos restritos a leitura e escrita/ditado, nunca visual ou aritmética", () => {
  assert.deepEqual(BLOCK_DOMAINS, ["leitura", "escrita"]);
});

test("todas as idades de 5 a 19 têm itens de leitura e de escrita/ditado no banco", () => {
  for (let age = MIN_AGE; age <= MAX_AGE; age++) {
    for (const domain of BLOCK_DOMAINS) {
      assert.ok(itemsFor(age, domain).length > 0, `${age} anos · ${domain} sem itens`);
    }
  }
});
