import assert from "node:assert/strict";
import { test } from "node:test";
import { onRequestGet } from "../../functions/api/health";
import { onRequestGet as clinicalCryptoDiagnostic } from "../../functions/api/admin/clinical-crypto-readiness";
import { clinicalCryptoStatus } from "../../functions/api/tenant/_crypto";
import { resolvePrivateArtifactStore } from "../../functions/api/live/governance/_artifactStore";
// Ephemeral test-only key; never a committed application secret.
const secret = crypto.randomUUID() + crypto.randomUUID();
function db(mode = "ready") {
  return { prepare(sql: string) { return { async first() {
    if (mode === "error") throw new Error("PRIVATE_DETAIL_NOT_TO_BE_EXPOSED");
    if (mode === "auth-session-schema" && sql.includes("FROM auth_refresh_sessions WHERE 0")) throw new Error("AUTH_SESSION_SCHEMA_GAP");
    if (sql.includes("pragma_table_info('users')")) return { present: mode === "schema" ? 4 : 5 };
    if (sql.includes("pragma_table_info('auth_refresh_sessions')") && sql.includes("pk = 1")) return { present: mode === "auth-session-pk" ? 0 : 1 };
    if (sql.includes("pragma_index_list('auth_refresh_sessions')")) return { present: mode === "auth-session-unique" ? 0 : 1 };
    if (mode === "lgpd-schema" && sql.includes("FROM live_export_requests WHERE 0")) throw new Error("LGPD_SCHEMA_GAP");
    if (mode === "billing-schema" && sql.includes("FROM billing_customers WHERE 0") && sql.includes("grace_ends_at")) throw new Error("BILLING_SCHEMA_GAP");
    if (mode === "audit-schema" && sql.includes("FROM saas_audit_log WHERE 0") && sql.includes("metadata_json")) throw new Error("AUDIT_SCHEMA_GAP");
    if (mode === "worker-schema" && sql.includes("FROM live_lgpd_worker_jobs WHERE 0") && sql.includes("SELECT id,")) throw new Error("WORKER_SCHEMA_GAP");
    if (sql.includes("type = 'trigger'")) return { present: mode === "lgpd-trigger" ? 6 : 7 };
    if (sql.includes("pragma_table_info('live_lgpd_worker_jobs')") && sql.includes("pk = 1")) return { present: mode === "worker-pk" ? 0 : 1 };
    if (sql.includes("pragma_index_list('live_lgpd_worker_jobs')")) return { present: mode === "worker-unique" ? 0 : 1 };
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
    readiness: { coreReady: boolean; clinicalCryptoConfigured: boolean; lgpdSchemaReady: boolean | null; blockers: string[];
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
  for (const environment of ["production", "Production", "PRODUCTION"]) {
    const { response, body } = await health({ DB: undefined, ENVIRONMENT: environment });
    assert.equal(response.status, 503);
    assert.deepEqual(body.authentication, { required: true, configured: false });
  }
});
test("schema and signing-key failures are not healthy", async () => {
  for (const extra of [{ DB: db("schema") }, { NEUROPED_JWT_SECRET: secret.slice(0, 5) }]) {
    const { response, body } = await health(extra);
    assert.equal(response.status, 503); assert.equal(body.readiness.coreReady, false);
  }
});
test("refresh-session required columns fail closed", async () => {
  const { response, body } = await health({ DB: db("auth-session-schema") });
  assert.equal(response.status, 503);
  assert.equal(body.readiness.coreReady, false);
  assert.ok(body.readiness.blockers.includes("AUTH_SCHEMA_NOT_READY"));
});
test("refresh-session id must remain the primary key", async () => {
  const { response, body } = await health({ DB: db("auth-session-pk") });
  assert.equal(response.status, 503);
  assert.equal(body.readiness.coreReady, false);
  assert.ok(body.readiness.blockers.includes("AUTH_SCHEMA_NOT_READY"));
});
test("refresh-session token hash must remain unique", async () => {
  const { response, body } = await health({ DB: db("auth-session-unique") });
  assert.equal(response.status, 503);
  assert.equal(body.readiness.coreReady, false);
  assert.ok(body.readiness.blockers.includes("AUTH_SCHEMA_NOT_READY"));
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

test("export readiness includes the same LIVE feature gate as run-export", async () => {
  const bucket = { async put() {}, async get() { return null; }, async delete() {} };
  const configured = {
    LGPD_EXPORT_BUCKET: bucket,
    CLINICAL_DATA_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_INDEX_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_DATA_KEY_ID: "readiness-test",
  };
  for (const flag of [undefined, "false", "true"]) {
    const { body } = await health({ ...configured, CLINICAL_LIVE_ENABLED: flag });
    assert.equal(body.readiness.clinicalCryptoConfigured, true);
    assert.equal(body.readiness.lgpdExport.storageBindingPresent, true);
    assert.equal(body.readiness.lgpdExport.configured, flag === "true");
    assert.equal(body.readiness.blockers.includes("CLINICAL_LIVE_DISABLED"), flag !== "true");
    assert.equal(body.readiness.lgpdExport.executionVerified, false);
  }
});

test("export readiness fails closed when LGPD/LIVE schema is incomplete", async () => {
  const bucket = { async put() {}, async get() { return null; }, async delete() {} };
  const { body } = await health({
    DB: db("lgpd-schema"),
    CLINICAL_LIVE_ENABLED: "true",
    LGPD_EXPORT_BUCKET: bucket,
    CLINICAL_DATA_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_INDEX_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_DATA_KEY_ID: "schema-test",
  });
  assert.equal(body.readiness.coreReady, true);
  assert.equal(body.readiness.clinicalCryptoConfigured, true);
  assert.equal(body.readiness.lgpdSchemaReady, false);
  assert.equal(body.readiness.lgpdExport.storageBindingPresent, true);
  assert.equal(body.readiness.lgpdExport.configured, false);
  assert.ok(body.readiness.blockers.includes("LGPD_SCHEMA_NOT_READY"));
});

test("export readiness fails closed when 0017 completion triggers are incomplete", async () => {
  const bucket = { async put() {}, async get() { return null; }, async delete() {} };
  const { body } = await health({
    DB: db("lgpd-trigger"),
    CLINICAL_LIVE_ENABLED: "true",
    LGPD_EXPORT_BUCKET: bucket,
    CLINICAL_DATA_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_INDEX_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_DATA_KEY_ID: "trigger-test",
  });
  assert.equal(body.readiness.coreReady, true);
  assert.equal(body.readiness.clinicalCryptoConfigured, true);
  assert.equal(body.readiness.lgpdSchemaReady, false);
  assert.equal(body.readiness.lgpdExport.storageBindingPresent, true);
  assert.equal(body.readiness.lgpdExport.configured, false);
  assert.ok(body.readiness.blockers.includes("LGPD_SCHEMA_NOT_READY"));
});

test("export readiness fails closed when billing export columns from 0013 are missing", async () => {
  const bucket = { async put() {}, async get() { return null; }, async delete() {} };
  const { body } = await health({
    DB: db("billing-schema"),
    CLINICAL_LIVE_ENABLED: "true",
    LGPD_EXPORT_BUCKET: bucket,
    CLINICAL_DATA_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_INDEX_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_DATA_KEY_ID: "billing-schema-test",
  });
  assert.equal(body.readiness.coreReady, true);
  assert.equal(body.readiness.clinicalCryptoConfigured, true);
  assert.equal(body.readiness.lgpdSchemaReady, false);
  assert.equal(body.readiness.lgpdExport.storageBindingPresent, true);
  assert.equal(body.readiness.lgpdExport.configured, false);
  assert.ok(body.readiness.blockers.includes("LGPD_SCHEMA_NOT_READY"));
});

test("export readiness fails closed when the SaaS audit schema is incomplete", async () => {
  const bucket = { async put() {}, async get() { return null; }, async delete() {} };
  const { body } = await health({
    DB: db("audit-schema"),
    CLINICAL_LIVE_ENABLED: "true",
    LGPD_EXPORT_BUCKET: bucket,
    CLINICAL_DATA_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_INDEX_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_DATA_KEY_ID: "audit-schema-test",
  });
  assert.equal(body.readiness.coreReady, true);
  assert.equal(body.readiness.clinicalCryptoConfigured, true);
  assert.equal(body.readiness.lgpdSchemaReady, false);
  assert.equal(body.readiness.lgpdExport.storageBindingPresent, true);
  assert.equal(body.readiness.lgpdExport.configured, false);
  assert.ok(body.readiness.blockers.includes("LGPD_SCHEMA_NOT_READY"));
});

test("export readiness fails closed when the worker ledger id column is missing", async () => {
  const bucket = { async put() {}, async get() { return null; }, async delete() {} };
  const { body } = await health({
    DB: db("worker-schema"),
    CLINICAL_LIVE_ENABLED: "true",
    LGPD_EXPORT_BUCKET: bucket,
    CLINICAL_DATA_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_INDEX_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_DATA_KEY_ID: "worker-schema-test",
  });
  assert.equal(body.readiness.coreReady, true);
  assert.equal(body.readiness.clinicalCryptoConfigured, true);
  assert.equal(body.readiness.lgpdSchemaReady, false);
  assert.equal(body.readiness.lgpdExport.storageBindingPresent, true);
  assert.equal(body.readiness.lgpdExport.configured, false);
  assert.ok(body.readiness.blockers.includes("LGPD_SCHEMA_NOT_READY"));
});

test("export readiness requires worker id primary-key integrity", async () => {
  const bucket = { async put() {}, async get() { return null; }, async delete() {} };
  const { body } = await health({
    DB: db("worker-pk"),
    CLINICAL_LIVE_ENABLED: "true",
    LGPD_EXPORT_BUCKET: bucket,
    CLINICAL_DATA_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_INDEX_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_DATA_KEY_ID: "worker-pk-test",
  });
  assert.equal(body.readiness.coreReady, true);
  assert.equal(body.readiness.lgpdSchemaReady, false);
  assert.equal(body.readiness.lgpdExport.configured, false);
  assert.ok(body.readiness.blockers.includes("LGPD_SCHEMA_NOT_READY"));
});

test("export readiness requires one job per request", async () => {
  const bucket = { async put() {}, async get() { return null; }, async delete() {} };
  const { body } = await health({
    DB: db("worker-unique"),
    CLINICAL_LIVE_ENABLED: "true",
    LGPD_EXPORT_BUCKET: bucket,
    CLINICAL_DATA_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_INDEX_KEY: crypto.randomUUID() + crypto.randomUUID(),
    CLINICAL_DATA_KEY_ID: "worker-unique-test",
  });
  assert.equal(body.readiness.coreReady, true);
  assert.equal(body.readiness.lgpdSchemaReady, false);
  assert.equal(body.readiness.lgpdExport.configured, false);
  assert.ok(body.readiness.blockers.includes("LGPD_SCHEMA_NOT_READY"));
});


test("clinical keyring status returns only allowlisted failure codes", () => {
  const dataKey = crypto.randomUUID() + crypto.randomUUID();
  const indexKey = crypto.randomUUID() + crypto.randomUUID();
  const previousKey = crypto.randomUUID() + crypto.randomUUID();
  const cases: Array<[Record<string, unknown>, string]> = [
    [{}, "CLINICAL_CRYPTO_NOT_CONFIGURED"],
    [{ CLINICAL_DATA_KEY: dataKey }, "CLINICAL_INDEX_KEY_NOT_CONFIGURED"],
    [{
      CLINICAL_DATA_KEY: dataKey,
      CLINICAL_DATA_KEY_ID: "id invalido",
      CLINICAL_INDEX_KEY: indexKey,
    }, "CLINICAL_KEY_ID_INVALID"],
    [{
      CLINICAL_DATA_KEY: dataKey,
      CLINICAL_DATA_KEY_ID: "k1",
      CLINICAL_DATA_KEY_PREVIOUS: previousKey,
      CLINICAL_DATA_KEY_PREVIOUS_ID: "k1",
      CLINICAL_INDEX_KEY: indexKey,
    }, "CLINICAL_KEY_ID_COLLISION"],
    [{
      CLINICAL_DATA_KEY: dataKey,
      CLINICAL_DATA_KEY_ID: "k1",
      CLINICAL_INDEX_KEY: dataKey,
    }, "CLINICAL_KEY_SEPARATION_REQUIRED"],
  ];

  for (const [env, expectedCode] of cases) {
    const status = clinicalCryptoStatus(env as never);
    assert.equal(status.configured, false);
    assert.equal(status.configured ? null : status.code, expectedCode);
    const serialized = JSON.stringify(status);
    for (const secretValue of [dataKey, indexKey, previousKey]) {
      assert.equal(serialized.includes(secretValue), false);
      assert.equal(serialized.includes(secretValue.slice(0, 12)), false);
      assert.equal(serialized.includes(secretValue.slice(-12)), false);
    }
  }

  assert.deepEqual(
    clinicalCryptoStatus({
      CLINICAL_DATA_KEY: dataKey,
      CLINICAL_DATA_KEY_ID: "k-current",
      CLINICAL_INDEX_KEY: indexKey,
    } as never),
    { configured: true },
  );
});

test("clinical crypto diagnostic is restricted to admin or reserved technical sentinel", async () => {
  const dataKey = crypto.randomUUID() + crypto.randomUUID();
  const indexKey = crypto.randomUUID() + crypto.randomUUID();
  const env = {
    CLINICAL_DATA_KEY: dataKey,
    CLINICAL_DATA_KEY_ID: "k-current",
    CLINICAL_INDEX_KEY: indexKey,
    NEUROPED_E2E_EMAIL: "sentinela@example.test",
  };
  const user = (email: string, role: string) => ({
    id: "u-test",
    name: "Teste",
    email,
    role,
    mustChangePassword: false,
  });

  const unauthenticated = await clinicalCryptoDiagnostic({ env, data: {} } as never);
  assert.equal(unauthenticated.status, 401);

  const professional = await clinicalCryptoDiagnostic({
    env,
    data: { authUser: user("medico@example.test", "professional") },
  } as never);
  assert.equal(professional.status, 403);

  const unrelatedReader = await clinicalCryptoDiagnostic({
    env,
    data: { authUser: user("reader@example.test", "reader") },
  } as never);
  assert.equal(unrelatedReader.status, 403);

  const sentinel = await clinicalCryptoDiagnostic({
    env,
    data: { authUser: user("sentinela@example.test", "reader") },
  } as never);
  assert.equal(sentinel.status, 200);
  assert.deepEqual(await sentinel.json(), { configured: true });

  const admin = await clinicalCryptoDiagnostic({
    env,
    data: { authUser: user("admin@example.test", "admin") },
  } as never);
  assert.equal(admin.status, 200);
});

test("clinical crypto diagnostic never returns key material on failure", async () => {
  const sharedSecret = crypto.randomUUID() + crypto.randomUUID();
  const response = await clinicalCryptoDiagnostic({
    env: {
      CLINICAL_DATA_KEY: sharedSecret,
      CLINICAL_DATA_KEY_ID: "k-current",
      CLINICAL_INDEX_KEY: sharedSecret,
      NEUROPED_E2E_EMAIL: "sentinela@example.test",
    },
    data: {
      authUser: {
        id: "e2e",
        name: "Sentinela",
        email: "sentinela@example.test",
        role: "reader",
        mustChangePassword: false,
      },
    },
  } as never);
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /CLINICAL_KEY_SEPARATION_REQUIRED/);
  assert.equal(body.includes(sharedSecret), false);
  assert.equal(body.includes(sharedSecret.slice(0, 12)), false);
  assert.equal(body.includes(sharedSecret.slice(-12)), false);
});
