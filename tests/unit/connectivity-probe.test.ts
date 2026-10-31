import assert from "node:assert/strict";
import { probePublicApiConnectivity } from "../../client/src/lib/connectivityProbe";

const seen: Array<{ input: string; credentials?: RequestCredentials; cache?: RequestCache }> = [];
function simulated(status: number): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    seen.push({ input: String(input), credentials: init?.credentials, cache: init?.cache });
    return new Response(null, { status });
  }) as typeof fetch;
}
assert.equal(await probePublicApiConnectivity(simulated(200)), "reachable");
assert.equal(await probePublicApiConnectivity(simulated(401)), "reachable",
  "ausência de sessão é resposta HTTP, não modo offline");
assert.equal(await probePublicApiConnectivity(simulated(503)), "server_unavailable",
  "backend degradado não pode ser rotulado como sem rede");
assert.equal(await probePublicApiConnectivity(
  (async () => { throw new TypeError("network failure"); }) as typeof fetch,
), "unreachable");
for (const probe of seen) {
  assert.equal(probe.input, "/api/health");
  assert.equal(probe.cache, "no-store");
  assert.equal(probe.credentials, "omit", "sonda não transmite credenciais");
}
console.log("✓ Banner offline distingue HTTP alcançável, backend 5xx e rede inacessível");
