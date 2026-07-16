import assert from "node:assert/strict";
import { buildExpressHealth } from "../../server/lib/healthContract.ts";

const now = new Date("2026-07-16T12:00:00.000Z");
const configuredSecretFixture = "fixture-only".padEnd(64, "x");
const shortSecretFixture = "short";

const unconfigured = buildExpressHealth({}, now);
assert.deepEqual(unconfigured.authentication, {
  required: true,
  configured: false,
});
assert.equal(unconfigured.environment, "express");
assert.equal(unconfigured.timestamp, now.toISOString());

const configured = buildExpressHealth({
  NEUROPED_JWT_SECRET: configuredSecretFixture,
}, now);
assert.deepEqual(configured.authentication, {
  required: true,
  configured: true,
});
assert.equal(configured.database, "sqlite");

const tooShort = buildExpressHealth({ NEUROPED_JWT_SECRET: shortSecretFixture }, now);
assert.equal(tooShort.authentication.configured, false);

console.log("✓ health Express exige autenticação remota e sinaliza configuração JWT");
