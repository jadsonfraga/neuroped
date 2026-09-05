import assert from "node:assert/strict";
import { verifySdgDeployment } from "../../scripts/check-sdg-deployment.mjs";
const sha = "a".repeat(40);
const manifest = { schemaVersion: 1, instruments: [{ id: "sintetico", version: "1.0" }] };
const healthy = {
  cloudflare: { sentinel: { provider: "cloudflare-pages", status: "deployed", commit: sha }, manifest },
  vercel: { sentinel: { provider: "vercel", status: "deployed", commit: sha.slice(0, 12) }, manifest },
  health: { database: "ok", authentication: { required: true, configured: true } },
};
assert.equal(verifySdgDeployment(sha, manifest, healthy).ok, true);
for (const mutate of [
  (p) => { p.cloudflare.sentinel.commit = "b".repeat(40); },
  (p) => { p.vercel.sentinel.commit = "b".repeat(12); },
  (p) => { p.cloudflare.manifest.instruments = []; },
  (p) => { p.vercel.manifest.instruments[0].version = "0.9"; },
  (p) => { p.health.database = "error"; },
  (p) => { p.health.authentication.required = false; },
  (p) => { p.health.authentication.configured = false; },
  (p) => { p.vercel.sentinel.provider = "cloudflare-pages"; },
  (p) => { p.cloudflare.sentinel.status = "queued"; },
]) {
  const payload = structuredClone(healthy);
  mutate(payload);
  assert.equal(verifySdgDeployment(sha, manifest, payload).ok, false, "Nunca aceitar deploy divergente, incompleto ou sem autenticação");
}
assert.equal(verifySdgDeployment(sha, manifest, {}).ok, false);
assert.throws(() => verifySdgDeployment("main", manifest, healthy));
console.log("[SDG deploy] 12 contratos de confirmação/rejeição aprovados.");
