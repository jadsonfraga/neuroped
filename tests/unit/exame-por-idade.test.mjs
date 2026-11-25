import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { examBands } from "../../client/src/data/exame-por-idade.ts";

assert.equal(examBands.length, 12);
assert.equal(new Set(examBands.map(band => band.age)).size, 12);
for (const band of examBands) {
  assert.ok(band.setup.trim());
  assert.equal(new Set(band.steps.map(item => item.title)).size, 6);
  for (const item of band.steps) {
    assert.ok(item.action.trim() && item.observe.trim());
  }
}
for (const file of ["App.tsx", "data/navigation.ts", "security/routeGuardPolicy.ts"]) {
  assert.ok(readFileSync(new URL("../../client/src/" + file, import.meta.url), "utf8").includes('"/exame-neurologico-mental"'));
}
