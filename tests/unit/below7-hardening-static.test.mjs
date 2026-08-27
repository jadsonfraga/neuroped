import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const app = read("client/src/App.tsx");
const routeBoundary = read("client/src/components/RouteRecoveryBoundary.tsx");
const genericScale = read("client/src/pages/generic-scale.tsx");
const availability = read("tests/e2e/published-route-availability.mjs");
const workflow = read(".github/workflows/deploy-cloudflare.yml");

assert.match(app, /RouteRecoveryBoundary/);
assert.match(app, /<RouteRecoveryBoundary key=\{location\} route=\{location\}>/);
assert.match(routeBoundary, /window\.location\.reload\(\)/);
assert.match(routeBoundary, /caches\.delete/);
assert.match(routeBoundary, /Nenhum dado clínico foi perdido/);
assert.doesNotMatch(routeBoundary, /localStorage\.setItem/);

assert.match(genericScale, /Promise\.all\(\[/);
assert.match(genericScale, /import\("@\/data\/scaleFilter"\)/);
assert.match(genericScale, /import\("@\/data\/interactiveScaleItems"\)/);
assert.match(genericScale, /import\("@\/data\/interactiveScales"\)/);
assert.match(genericScale, /Carregando a ficha clínica segura/);
assert.match(genericScale, /Nenhum dado clínico foi perdido/);
assert.doesNotMatch(genericScale, /const \{ allScales, queixas \} = await/);

assert.match(availability, /const routes = \[/);
for (const marker of ["brincando-e-aprendendo", "missao-saude", "eletroencefalograma", "portal-familia", "ajuda", "sobre-neuroped"]) {
  assert.match(availability, new RegExp(marker));
}
assert.match(availability, /hasGlobalError/);
assert.match(availability, /pageErrors/);
assert.match(availability, /badResponses/);
assert.match(availability, /process\.exit\(1\)/);

assert.match(workflow, /playwright install --with-deps chromium/);
assert.match(workflow, /test:e2e:published-availability/);
assert.match(workflow, /https:\/\/neuroped\.pages\.dev/);

console.log("[below7-hardening] ✓ recovery por rota, code-splitting e smoke pós-publicação protegidos");
