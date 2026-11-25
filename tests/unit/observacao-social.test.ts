import assert from "node:assert/strict";
import test from "node:test";
import { bands, domains } from "../../client/src/data/observacaoSocial.ts";

test("roteiro cobre de 1 a 19 anos com três situações distintas por faixa", () => {
  assert.deepEqual(bands.map(([range]) => range), ["1–2 anos","3–5 anos","6–9 anos","10–13 anos","14–19 anos"]);
  assert.equal(domains.length, 3);
  const titles = new Set<string>();
  for (const [, scenes] of bands) {
    assert.equal(scenes.length, domains.length);
    for (const [title, invitation, choices, guide] of scenes) {
      assert.ok(title && invitation && guide);
      assert.equal(new Set(choices).size, 2);
      titles.add(title);
    }
  }
  assert.equal(titles.size, 15);
});
