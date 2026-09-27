import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const orientation = read("client/src/features/obs10/Orientation.tsx");
const inventory = read("scripts/guards/audit-inventory.mjs");

// Exercise the production inventory predicate, not a looser test-only copy.
// This is a static integration regression, not a browser or clinical proof.
test("OBS60 is mounted through an import recognized by the unchanged inventory guard", () => {
  const start = inventory.indexOf("const escapeRegExp =");
  const end = inventory.indexOf("const orphanFeatures =", start);
  assert.ok(start >= 0 && end > start, "inventory predicate must remain discoverable");
  const matcher = vm.runInNewContext(`${inventory.slice(start, end)}\nfeatureImportSpecifier('obs60');`, {}, { timeout: 1000 });
  assert.equal(matcher.test(orientation), true, "actual mounted source must satisfy the release inventory");
  assert.equal(matcher.test('import { X } from "@/features/obs600/X";'), false);
  assert.equal(matcher.test('import { X } from "@/features/obs60-extra/X";'), false);
  const withoutImport = orientation.replace(/^import\s+\{\s*Obs60Launcher\s*\}\s+from\s+[^\n]+\n/m, "");
  assert.notEqual(withoutImport, orientation);
  assert.equal(matcher.test(withoutImport), false, "unmounting the external dependency must fail the guard");
  assert.match(orientation, /import\s+\{\s*Obs60Launcher\s*\}\s+from\s+"@\/features\/obs60\/Obs60Launcher"/);
  assert.match(orientation, /export function FirstTimeGuide\(\)[\s\S]*?<Obs60Launcher\s*\/>/);
  assert.ok(read("client/src/features/obs60/Obs60Launcher.tsx").includes('data-testid="obs60-launcher"'));
});

test("OBS60 remains lazy and the existing OBS10 first-time guide is preserved", () => {
  const launcher = read("client/src/features/obs60/Obs60Launcher.tsx");
  assert.match(launcher, /lazy\(\(\) => import\("\.\/Obs60Panel"\)\)/);
  assert.match(launcher, /open && <Suspense/);
  assert.match(orientation, /data-testid="obs10-first-time"/);
  assert.match(orientation, /FIRST_TIME_STEPS\.map/);
  assert.match(orientation, /TROUBLE\.map/);
});
