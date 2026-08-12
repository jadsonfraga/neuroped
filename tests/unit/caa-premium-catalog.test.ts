import assert from "node:assert/strict";
import {
  CAA_FULL_CATEGORIES,
  CAA_FULL_QUICK,
  CAA_SYMBOL_COUNT,
} from "../../client/src/data/caaExpandedBoard.ts";

const categoryEntries = Object.entries(CAA_FULL_CATEGORIES);
assert.ok(categoryEntries.length >= 27, `esperado >= 27 categorias; atual=${categoryEntries.length}`);
assert.ok(CAA_SYMBOL_COUNT >= 334, `esperado >= 334 cartões; atual=${CAA_SYMBOL_COUNT}`);
assert.ok(CAA_FULL_QUICK.length >= 40, `esperado >= 40 mensagens rápidas; atual=${CAA_FULL_QUICK.length}`);

for (const [categoryName, category] of categoryEntries) {
  assert.ok(categoryName.trim().length > 0, "categoria sem nome");
  assert.ok(category.icon.trim().length > 0, `${categoryName}: ícone ausente`);
  assert.ok(category.items.length > 0, `${categoryName}: categoria vazia`);
  for (const [icon, label, speech] of category.items) {
    assert.ok(icon.trim().length > 0, `${categoryName}: cartão sem figura/emoji`);
    assert.ok(label.trim().length > 0, `${categoryName}: cartão sem rótulo`);
    assert.ok(speech.trim().length > 0, `${categoryName}: cartão sem fala`);
  }
}

for (const [icon, message] of CAA_FULL_QUICK) {
  assert.ok(icon.trim().length > 0, "mensagem rápida sem figura/emoji");
  assert.ok(message.trim().length > 0, "mensagem rápida sem fala");
}

console.log(
  `[caa-premium] ✓ ${CAA_SYMBOL_COUNT} cartões com voz, ${categoryEntries.length} categorias e ${CAA_FULL_QUICK.length} mensagens rápidas.`,
);
