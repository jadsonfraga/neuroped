import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../..", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [home, metrics, layout, splash, mchat, cars, cbcl, filtroShell, filtroEngine, fluxograma, caa, genericScale] = await Promise.all([
  read("client/src/pages/home.tsx"),
  read("client/src/data/appMetrics.ts"),
  read("client/src/components/Layout.tsx"),
  read("client/src/components/SplashScreen.tsx"),
  read("client/src/pages/mchat.tsx"),
  read("client/src/pages/cars.tsx"),
  read("client/src/pages/cbcl.tsx"),
  read("client/src/pages/filtro.tsx"),
  read("client/src/pages/filtro-engine.tsx"),
  read("client/src/pages/fluxograma.tsx"),
  read("client/src/pages/caa.tsx"),
  read("client/src/components/GenericScale.tsx"),
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
  assert.doesNotMatch(filtroShell, /@\/data\/(?:scaleFilter|advancedFilterLogic)/);
  assert.match(filtroShell, /import\("@\/pages\/filtro-engine"\)/);
  assert.match(filtroEngine, /@\/data\/scaleFilter/);
  assert.match(filtroEngine, /@\/data\/advancedFilterLogic/);
  assert.doesNotMatch(fluxograma, /@\/data\/(?:scaleFilter|advancedFilterLogic)/);
  assert.match(fluxograma, /resolveFluxoScaleRoute/);
  assert.match(cars, /CARS_INITIAL_VISIBLE_ITEMS/);
  assert.match(cars, /slice\(0, visibleItemCount\)/);
  assert.match(cbcl, /<GenericScale/);
  assert.match(genericScale, /INITIAL_VISIBLE_SCALE_ITEMS/);
  assert.match(genericScale, /Carregar próximas perguntas/);
  assert.match(caa, /CAA_INITIAL_VISIBLE_CARDS/);
  assert.match(caa, /renderedItems/);
  assert.match(caa, /caa-load-more/);
});
