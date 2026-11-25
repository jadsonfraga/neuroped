import assert from "node:assert/strict";
import { test } from "node:test";
import { examBands } from "../../client/src/data/exame-por-idade";
import { bands } from "../../client/src/data/observacaoSocial";
import { examExamples, socialAlternatives } from "../../client/src/data/clinicalAssistantGuide";

test("duas propostas distintas por faixa de exame, com fala, preparo e observação", () => {
  assert.deepEqual(Object.keys(examExamples), examBands.map(b => b.age));
  const titles = new Set<string>();
  for (const b of examBands) {
    const rows = examExamples[b.age];
    assert.equal(rows.length, 2);
    for (const row of rows) {
      assert.ok(row.title && row.material && row.say && row.observe && row.icon);
      assert.ok(!titles.has(row.title));
      titles.add(row.title);
    }
  }
});

test("toda idade na observação social tem alternativa presencial distinta, sem precisar de tela", () => {
  assert.deepEqual(Object.keys(socialAlternatives), bands.map(b => b[0]));
  assert.equal(new Set(Object.values(socialAlternatives)).size, bands.length);
});
