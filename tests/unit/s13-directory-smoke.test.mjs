import assert from "node:assert/strict";
import { test } from "node:test";
import { getJson, runSmoke, validateDeployment, validateProviders } from "../../scripts/smoke-s13-directory.mjs";

const sha = "a".repeat(40);
const deployment = { app: "NeuroPed", provider: "cloudflare-pages", branch: "main", commit: sha, run_id: "123" };
const provider = { slug: "synthetic-provider", displayName: "Synthetic", specialty: null, locationLabel: "QA" };
const response = (value, status = 200, type = "application/json") => new Response(JSON.stringify(value), {
  status, headers: { "content-type": type },
});
const stub = (overrides = {}) => async (url, options) => {
  assert.equal(url.origin, "https://neuroped.pages.dev");
  assert.equal(options.method, "GET");
  assert.equal(options.redirect, "error");
  assert.ok(url.searchParams.get("_smoke"));
  if (url.pathname === "/deploy-check.json") return response(deployment);
  const known = url.searchParams.get("clinic") === "4126d150";
  return response(known ? (overrides.known ?? { providers: [provider] }) : (overrides.unknown ?? { providers: [] }));
};

test("offline contract: public envelope accepts an empty directory", () => {
  assert.equal(validateProviders({ providers: [] }).size, 0);
});
for (const [name, value, error] of [
  ["missing array", {}, "INVALID_PROVIDERS_ENVELOPE"],
  ["null body", null, "INVALID_PROVIDERS_ENVELOPE"],
  ["error envelope", { providers: [], error: "synthetic" }, "INVALID_PROVIDERS_ENVELOPE"],
  ["missing display name", { providers: [{ slug: "synthetic" }] }, "INVALID_PUBLIC_PROVIDER_SHAPE"],
  ["unexpected sensitive field", { providers: [{ ...provider, patientId: "synthetic" }] }, "INVALID_PUBLIC_PROVIDER_SHAPE"],
  ["duplicate provider", { providers: [provider, provider] }, "DUPLICATE_PROVIDER"],
]) {
  test(`offline contract: rejects ${name}`, () => assert.throws(() => validateProviders(value), new RegExp(error)));
}
for (const [field, value] of [["commit", "abc"], ["branch", "preview"], ["provider", "vercel"], ["run_id", null]]) {
  test(`offline contract: rejects invalid deployment ${field}`, () => {
    assert.throws(() => validateDeployment({ ...deployment, [field]: value }), /INVALID_DEPLOYMENT_SENTINEL/);
  });
}
test("offline contract: successful run records metadata only and does not claim A/B", async () => {
  const result = await runSmoke({ fetchImpl: stub(), expectedSha: sha });
  assert.equal(result.status, "PASSED");
  assert.equal(result.knownClinicProviders, 1);
  assert.equal(result.unknownClinicProviders, 0);
  assert.equal(result.abProof, "NOT_RUN_NO_AUTHORIZED_FIXTURE");
  assert.ok(!JSON.stringify(result).includes("synthetic-provider"));
});
test("offline contract: empty known clinic remains generic smoke, never A/B proof", async () => {
  const result = await runSmoke({ fetchImpl: stub({ known: { providers: [] } }) });
  assert.equal(result.knownClinicProviders, 0);
  assert.equal(result.abProof, "NOT_RUN_NO_AUTHORIZED_FIXTURE");
});
test("offline contract: unknown clinic cannot fall back to global directory", async () => {
  await assert.rejects(runSmoke({ fetchImpl: stub({ unknown: { providers: [provider] } }) }), /UNKNOWN_CLINIC_RETURNED_PROVIDERS/);
});
test("offline contract: expected SHA mismatch fails closed", async () => {
  await assert.rejects(runSmoke({ fetchImpl: stub(), expectedSha: "b".repeat(40) }), /DEPLOYMENT_SHA_MISMATCH/);
});
test("offline contract: deployment cannot change during smoke", async () => {
  let sentinelReads = 0;
  const fetchImpl = async (url, options) => {
    if (url.pathname === "/deploy-check.json" && ++sentinelReads === 2) return response({ ...deployment, commit: "b".repeat(40) });
    return stub()(url, options);
  };
  await assert.rejects(runSmoke({ fetchImpl }), /DEPLOYMENT_CHANGED_DURING_SMOKE/);
});
test("offline contract: invalid expected SHA rejected before any request", async () => {
  await assert.rejects(runSmoke({ expectedSha: "main", fetchImpl: () => assert.fail("must not fetch") }), /INVALID_EXPECTED_SHA/);
});
for (const status of [403, 404, 429, 500, 503]) {
  test(`offline contract: HTTP ${status} cannot turn green`, async () => {
    await assert.rejects(getJson("/api/public-booking", async () => response({}, status)), new RegExp(`UNEXPECTED_HTTP_${status}`));
  });
}
test("offline contract: HTML, broken JSON and oversized responses fail", async () => {
  await assert.rejects(getJson("/", async () => response({}, 200, "text/html")), /NON_JSON_CONTENT_TYPE/);
  await assert.rejects(getJson("/", async () => new Response("{", { headers: { "content-type": "application/json" } })), /INVALID_JSON/);
  await assert.rejects(getJson("/", async () => response("x".repeat(262145))), /RESPONSE_TOO_LARGE/);
});
test("offline contract: network errors are redacted", async () => {
  await assert.rejects(getJson("/", async () => { throw new Error("synthetic private detail"); }), /NETWORK_OR_REDIRECT_FAILURE/);
});
test("offline contract: only the canonical HTTPS origin is allowed", async () => {
  await assert.rejects(getJson("https://example.com/", () => assert.fail("must not fetch")), /NON_CANONICAL_ORIGIN/);
});
