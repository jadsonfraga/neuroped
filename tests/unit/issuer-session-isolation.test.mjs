import assert from "node:assert/strict";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Bundle the actual production cache; substitute only the authenticated transport.
// All identities and responses below are synthetic. No network is permitted.
const harness = { epoch: 1, token: "synthetic-a", clinic: "clinic-a", requests: [], fetch: null };
globalThis.__issuerTest = harness;
globalThis.sessionStorage = { getItem: () => harness.clinic };
const bundled = await build({
  stdin: { resolveDir: process.cwd(), contents: `
    import { createElement } from "react";
    import { renderToString } from "react-dom/server.browser";
    import { useIssuer } from "./client/src/lib/issuer.ts";
    export { loadIssuer, invalidateIssuerCache } from "./client/src/lib/issuer.ts";
    export function renderIssuer() {
      return renderToString(createElement(function View() {
        return createElement("span", null, useIssuer().issuer.doctorName);
      }));
    }
  ` }, bundle: true, write: false,
  platform: "node", format: "esm", plugins: [{ name: "authenticated-transport", setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/authClient$/ }, () => ({ path: "auth", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: `
      export const getAccessToken = () => globalThis.__issuerTest.token;
      export const getAuthSessionEpoch = () => globalThis.__issuerTest.epoch;
      export const authFetch = (url) => {
        globalThis.__issuerTest.requests.push(url);
        return globalThis.__issuerTest.fetch(url);
      };` }));
  } }],
});
const { loadIssuer, invalidateIssuerCache, renderIssuer } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);
const json = (body) => new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
const profile = (name) => json({ displayName: name, credentialsLine: "SYNTHETIC", specialty: "", documentEmail: "", configured: true });
const tenant = (name) => json({ name });
function deferred() { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; }
function reset() {
  harness.epoch += 1; harness.token = "synthetic"; harness.clinic = "clinic-a"; harness.requests = [];
  harness.fetch = () => { throw new Error("Unexpected transport call"); };
  invalidateIssuerCache();
}

await test("same clinic, different account cannot reuse the previous professional", async () => {
  reset();
  harness.fetch = async (url) => url.includes("/me/") ? profile("Professional A") : tenant("Clinic A");
  assert.equal((await loadIssuer()).doctorName, "Professional A");
  harness.epoch += 1;
  harness.fetch = async (url) => url.includes("/me/") ? profile("Professional B") : tenant("Clinic A");
  assert.equal((await loadIssuer()).doctorName, "Professional B");
  assert.equal(harness.requests.length, 4);
});
await test("same scope deduplicates calls and a normal token refresh preserves its cache", async () => {
  reset(); const pending = deferred();
  harness.fetch = async (url) => url.includes("/me/") ? pending.promise : tenant("Clinic A");
  const first = loadIssuer(); const second = loadIssuer();
  assert.equal(harness.requests.length, 1);
  pending.resolve(profile("Professional A"));
  assert.equal((await first).doctorName, "Professional A");
  assert.equal((await second).doctorName, "Professional A");
  harness.token = "synthetic-refreshed";
  assert.equal((await loadIssuer()).doctorName, "Professional A");
  assert.equal(harness.requests.length, 2);
});
await test("old account response neither contaminates nor cancels the new in-flight load", async () => {
  reset(); const oldProfile = deferred(); const newProfile = deferred();
  harness.fetch = () => oldProfile.promise;
  const oldLoad = loadIssuer();
  harness.epoch += 1;
  harness.fetch = async (url) => url.includes("/me/") ? newProfile.promise : tenant("Clinic B");
  const newLoad = loadIssuer();
  oldProfile.resolve(profile("Professional A"));
  assert.equal((await oldLoad).doctorName, "");
  const deduplicated = loadIssuer();
  assert.equal(harness.requests.length, 2);
  newProfile.resolve(profile("Professional B"));
  assert.equal((await newLoad).doctorName, "Professional B");
  assert.equal((await deduplicated).doctorName, "Professional B");
  assert.equal(harness.requests.length, 3);
});
await test("logout during profile loading prevents a subsequent clinic request", async () => {
  reset(); const pending = deferred(); harness.fetch = () => pending.promise;
  const loading = loadIssuer(); harness.token = null; harness.epoch += 1;
  pending.resolve(profile("Professional A"));
  assert.equal((await loading).doctorName, "");
  assert.equal((await loadIssuer()).clinicName, "");
  assert.equal(harness.requests.length, 1);
});
await test("invalidated tenant response cannot overwrite updated institutional data", async () => {
  reset(); const oldTenant = deferred(); const started = deferred();
  harness.fetch = async (url) => {
    if (url.includes("/me/")) return profile("Professional A");
    started.resolve(); return oldTenant.promise;
  };
  const stale = loadIssuer(); await started.promise;
  invalidateIssuerCache();
  harness.fetch = async (url) => url.includes("/me/") ? profile("Updated professional") : tenant("Updated clinic");
  assert.equal((await loadIssuer()).clinicName, "Updated clinic");
  oldTenant.resolve(tenant("Obsolete clinic"));
  assert.equal((await stale).clinicName, "");
  assert.equal((await loadIssuer()).doctorName, "Updated professional");
});
await test("clinic switch while a response body is pending discards the old identity", async () => {
  reset(); const body = deferred(); const started = deferred();
  harness.fetch = async () => ({ ok: true, json: () => { started.resolve(); return body.promise; } });
  const stale = loadIssuer(); await started.promise; harness.clinic = "clinic-b";
  body.resolve({ displayName: "Professional A", configured: true });
  assert.equal((await stale).doctorName, "");
  assert.equal(harness.requests.length, 1);
});
await test("session and clinic cleanup invalidate the issuer before awaiting other caches", () => {
  for (const [path, name] of [
    ["client/src/contexts/AuthContext.tsx", "clearSessionScopedClientState"],
    ["client/src/contexts/ClinicContext.tsx", "clearClinicalClientCaches"],
  ]) {
    const source = readFileSync(path, "utf8");
    assert.match(source, new RegExp(`async function ${name}\\(\\): Promise<void> \\{\\s*invalidateIssuerCache\\(\\);`));
  }
});

await test("first render after account change cannot display the cached professional", async () => {
  reset();
  harness.fetch = async (url) => url.includes("/me/") ? profile("Professional A") : tenant("Clinic A");
  await loadIssuer();
  assert.match(renderIssuer(), /Professional A/);
  harness.epoch += 1;
  assert.equal(renderIssuer(), "<span></span>");
  harness.token = null;
  assert.equal(renderIssuer(), "<span></span>");
});
