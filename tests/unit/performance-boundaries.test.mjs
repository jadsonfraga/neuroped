import "./release-contract-hardening.test.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../..", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [home, metrics, layout, splash, mchat, cars, cbcl] = await Promise.all([
  read("client/src/pages/home.tsx"),
  read("client/src/data/appMetrics.ts"),
  read("client/src/components/Layout.tsx"),
  read("client/src/components/SplashScreen.tsx"),
  read("client/src/pages/mchat.tsx"),
  read("client/src/pages/cars.tsx"),
  read("client/src/pages/cbcl.tsx"),
]);

test("performance boundaries keep heavy clinical data out of the critical shell", () => {
  assert.doesNotMatch(home, /import \{ allScales \} from "@\/data\/scaleFilter"/);
  assert.match(home, /import\("@\/data\/scaleFilter"\)/);
  assert.doesNotMatch(metrics, /from "@\/data\/scaleFilter"/);
  assert.doesNotMatch(metrics, /from "@\/data\/farmacologia"/);
  assert.match(layout, /requestIdleCallback/);
  assert.match(layout, /renderedSections/);
  assert.match(splash, /src="\/dr-jadson-shield-logo\.svg"/);
  assert.doesNotMatch(splash, /drJadsonMasterShieldLogo/);
  assert.match(mchat, /@\/data\/mchat/);
  assert.doesNotMatch(mchat, /@\/data\/scales/);
  assert.match(cars, /@\/data\/cars/);
  assert.doesNotMatch(cars, /@\/data\/scales/);
  assert.match(cbcl, /@\/data\/cbcl/);
  assert.doesNotMatch(cbcl, /@\/data\/expandedScales/);
});
