import assert from "node:assert/strict";

import {
  hasRegisteredRoute,
  normalizeRoutePath,
  routePatternMatches,
} from "../../scripts/guards/lib/route-matcher.mjs";

assert.equal(normalizeRoutePath("classificacao/macs/?debug=1#result"), "/classificacao/macs");
assert.equal(routePatternMatches("/classificacao/:id", "/classificacao/macs"), true);
assert.equal(routePatternMatches("/classificacao/:id", "/classificacao"), false);
assert.equal(routePatternMatches("/classificacao/:id", "/classificacao/macs/extra"), false);
assert.equal(routePatternMatches("/paciente/:id", "/outro/123"), false);
assert.equal(routePatternMatches("/docs/*", "/docs/clinical/guide"), true);
assert.equal(routePatternMatches("/docs/*", "/docs"), true);
assert.equal(hasRegisteredRoute(["/", "/generic-scale/:id"], "/generic-scale/mchat"), true);
assert.equal(hasRegisteredRoute(["/", "/generic-scale/:id"], "/missing/mchat"), false);

console.log("✓ correspondência de rotas estáticas, dinâmicas e curingas validada");
