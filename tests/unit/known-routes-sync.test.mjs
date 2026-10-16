// Garante que security/knownRoutes.ts acompanha as rotas declaradas em App.tsx.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const app = readFileSync("client/src/App.tsx", "utf8");
const known = readFileSync("client/src/security/knownRoutes.ts", "utf8");
const declared = [...app.matchAll(/<Route\s+path="([^"]*)"/g)].map((m) => m[1]);
assert.ok(declared.length > 100, "nenhuma rota lida de App.tsx");
const missing = declared.filter((p) => !known.includes(`"${p}"`));
assert.deepEqual(missing, [], `Rotas de App.tsx ausentes em knownRoutes.ts: ${missing.join(", ")}`);
console.log(`known-routes-sync ok (${declared.length} rotas)`);
