import assert from "node:assert/strict";
import { test } from "node:test";
import { onRequestGet } from "../../functions/api/health";
import { resolvePrivateArtifactStore } from "../../functions/api/live/governance/_artifactStore";
// Ephemeral test-only key; never a committed application secret.
const secret = crypto.randomUUID() + crypto.randomUUID();
function db(mode = "ready") {
  return { prepare(sql: string) { return { async first() {
    if (mode === "error") throw new Error("PRIVATE_DETAIL_NOT_TO_BE_EXPOSED");
    if (sql.includes("pragma_table_info")) return { present: mode === "schema" ? 4 : 5 };
    return { present: 1 };
  } }; } };
}
async function health(extra: Record<string, unknown> = {}) {
  const response = await onRequestGet({ env: {
    ENVIRONMENT: "production", DB: db(), NEUROPED_JWT_SECRET: secret, ...extra,
  } } as never);
  const body = await response.json() as { status: string;
    authentication: { required: boolean; configured: boolean };
    escuta: { enabled: boolean; configured: boolean };
    readiness: { coreReady: boolean; clinicalCryptoConfigured: boolean; blockers: string[];
      lgpdExport: { configured: boolean; storageBindingPresent: boolean; executionVerified: boolean } } };
  return { response, body };
}
test("healthy core is not proof of clinical/export readiness", async () => {
  const { response, body } = await health();
  assert.equal(response.status, 200); assert.equal(body.status, "ok");
  assert.equal(body.readiness.coreReady, true);
  assert.equal(body.readiness.lgpdExport.configured, false);
  assert.equal(body.readiness.lgpdExport.executionVerified, false);
});
test("database failure returns 503 without releasing remote authentication", async () => {
  const { response, body } = await health({ DB: db("error") });
  assert.equal(response.status, 503); assert.equal(body.status, "degraded");
  assert.deepEqual(body.authentication, { required: true, configured: true });
  assert.equal(body.readiness.coreReady, false);
  assert.doesNotMatch(JSON.stringify(body), /PRIVATE_DETAIL/);
});
test("production with no DB cannot advertise local auth", async () => {
  const { response, body } = await health({ DB: undefined });
  assert.equal(response.status, 503);
  assert.deepEqual(body.authentication, { required: true, configured: false });
});
test("schema and signing-key failures are not healthy", async () => {
  for (const extra of [{ DB: db("schema") }, { NEUROPED_JWT_SECRET: "short" }]) {
    const { response, body } = await health(extra);
    assert.equal(response.status, 503); assert.equal(body.readiness.coreReady, false);
  }
});
test("enabled feature with absent encryption is explicitly blocked", async () => {
  const { body } = await health({ CLINICAL_LIVE_ENABLED: "true", ESCUTA_ENABLED: "true" });
  assert.equal(body.escuta.enabled, true); assert.equal(body.escuta.configured, false);
  assert.ok(body.readiness.blockers.includes("CLINICAL_CRYPTO_NOT_READY"));
});
test("partial R2 bindings fail closed and bucket alone is insufficient", async () => {
  for (const binding of [undefined, {}, { put() {} }, { put() {}, get() {} }]) {
    assert.equal(resolvePrivateArtifactStore({ LGPD_EXPORT_BUCKET: binding } as never), null);
  }
  const bucket = { async put() {}, async get() { return null; }, async delete() {} };
  assert.notEqual(resolvePrivateArtifactStore({ LGPD_EXPORT_BUCKET: bucket } as never), null);
  const { body } = await health({ LGPD_EXPORT_BUCKET: bucket });
  assert.equal(body.readiness.lgpdExport.storageBindingPresent, true);
  assert.equal(body.readiness.lgpdExport.configured, false);
});
