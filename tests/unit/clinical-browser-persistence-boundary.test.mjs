import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const main = read("client/src/main.tsx");
const policy = read("client/src/lib/clinicalBrowserPersistencePolicy.ts");
const persistent = read("client/src/lib/persistentSecureStorage.ts");
const sw = read("client/public/sw.js");

const installAt = main.indexOf("installClinicalBrowserPersistenceBoundary();");
const renderAt = main.indexOf("root.render(");
assert.ok(installAt >= 0 && renderAt > installAt, "browser boundary must start before app render");

for (const token of [
  "Storage.prototype.getItem",
  "Storage.prototype.setItem",
  "Storage.prototype.removeItem",
  '"cognitive-lab:sessions:v2": "CLINICAL_LONGITUDINAL"',
  '"caa:workspace:v3": "CLINICAL_LONGITUDINAL"',
  '"assinatura:registros:v2": "CLINICAL_LONGITUDINAL"',
  '"agenda:workspace:v1": "CLINICAL_LONGITUDINAL"',
  '["conecta:events:", "CLINICAL_LONGITUDINAL"]',
  '["diario:", "CLINICAL_LONGITUDINAL"]',
  '["scale-draft:", "CLINICAL_EPHEMERAL"]',
]) {
  assert.ok(policy.includes(token), `missing policy token: ${token}`);
}

for (const [signature, purpose] of [
  ["export async function persistentSecureSet", "write"],
  ["export async function persistentSecureGet", "read"],
  ["export async function persistentSecureClear", "remove"],
]) {
  const start = persistent.indexOf(signature);
  const guard = persistent.indexOf(`isRemoteClinicalPersistenceBlocked(key, "${purpose}")`, start);
  const openDb = persistent.indexOf("openDatabase()", start);
  assert.ok(start >= 0 && guard > start, `${signature} must use the central policy`);
  assert.ok(openDb < 0 || guard < openDb, `${signature} must deny before IndexedDB open`);
}

const clearAll = persistent.indexOf("export async function persistentSecureClearAll");
assert.ok(clearAll >= 0);
assert.equal(
  persistent.slice(clearAll).includes("isRemoteClinicalPersistenceBlocked"),
  false,
  "logout cleanup must remain able to destroy the encrypted browser vault",
);

const fetchHandler = sw.indexOf('self.addEventListener("fetch"');
const apiRule = sw.indexOf('url.pathname.startsWith("/api/")', fetchHandler);
const genericNetworkFirst = sw.indexOf("event.respondWith(networkFirst(request))", fetchHandler);
assert.ok(fetchHandler >= 0 && apiRule > fetchHandler && apiRule < genericNetworkFirst);

console.log("LIVE browser persistence boundary contract OK");
