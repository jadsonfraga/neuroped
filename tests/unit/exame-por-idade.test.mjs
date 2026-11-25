import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { examBands } from "../../client/src/data/exame-por-idade.ts";

assert.deepEqual(examBands.map(band => band.age), [
  "Nascimento a 27 dias",
  "28 dias a 2 meses",
  "3 a 5 meses",
  "6 a 8 meses",
  "9 a 11 meses",
  "12 a 14 meses",
  "15 a 17 meses",
  "18 a 23 meses",
  "2 anos",
  "3 anos",
  "4 anos",
  "5 anos",
  "6 a 8 anos",
  "9 a 11 anos",
  "12 a 14 anos",
  "15 a 17 anos",
  "18 a 19 anos"
]);
assert.equal(new Set(examBands.map(band => band.adapt)).size, examBands.length);
for (const band of examBands) {
  assert.ok(band.setup.trim() && band.adapt.trim());
  assert.equal(new Set(band.steps.map(item => item.title)).size, 6);
  for (const item of band.steps) {
    assert.ok(item.action.trim() && item.observe.trim());
  }
}
for (const file of ["App.tsx", "data/navigation.ts", "security/routeGuardPolicy.ts"]) {
  assert.ok(readFileSync(new URL("../../client/src/" + file, import.meta.url), "utf8").includes('"/exame-neurologico-mental"'));
}

