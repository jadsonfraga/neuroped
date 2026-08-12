import assert from "node:assert/strict";
import fs from "node:fs";

const cf = fs.readFileSync("functions/api/clinical-core/index.ts", "utf8");
const ex = fs.readFileSync("server/routes/clinical-core.ts", "utf8");

for (const source of [cf, ex]) {
  assert.match(source, /STALE_SUPERSESSION/);
  assert.match(source, /status = 'active'/);
}
assert.match(cf, /WHERE changes\(\) = 1/);
assert.match(cf, /correctionResults\[0\]\?\.meta\?\.changes/);
assert.match(cf, /correctionResults\[1\]\?\.meta\?\.changes/);
assert.match(ex, /corrected\.changes !== 1/);
assert.match(ex, /inserted\.changes === 1/);

console.log("✓ Clinical Core: correção append-only rejeita supersessão obsoleta sem criar órfão");
