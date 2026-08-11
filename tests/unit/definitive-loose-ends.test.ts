import assert from "node:assert/strict";
import fs from "node:fs";
import { readBoundedIntEnv } from "../../server/lib/env";
import { onRequest } from "../../functions/api/_middleware";

const original = { ...process.env };
try {
  process.env.TEST_INT = "17";
  assert.equal(readBoundedIntEnv("TEST_INT", 5, 1, 20), 17);
  process.env.TEST_INT = "NaN";
  assert.equal(readBoundedIntEnv("TEST_INT", 5, 1, 20), 5);
  process.env.TEST_INT = "999";
  assert.equal(readBoundedIntEnv("TEST_INT", 5, 1, 20), 5);
  process.env.TEST_INT = "0";
  assert.equal(readBoundedIntEnv("TEST_INT", 5, 1, 20), 5);
} finally {
  for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
  Object.assign(process.env, original);
}

const privateNoDb = await onRequest({
  request: new Request("https://neuroped.test/api/patients"),
  env: {},
  next: async () => new Response("should-not-run", { status: 200 }),
  data: {},
} as never);
assert.equal(privateNoDb.status, 503);
assert.equal((await privateNoDb.json() as { code?: string }).code, "DB_REQUIRED");

const middleware = fs.readFileSync("functions/api/_middleware.ts", "utf8");
assert.match(middleware, /RATE_LIMIT_KV\.get\(sharedKey\)/);
assert.match(middleware, /RATE_LIMIT_KV\.put\(sharedKey/);
assert.match(middleware, /await checkRateLimit\(request, env\)/);

const cfLogin = fs.readFileSync("functions/api/auth/login.ts", "utf8");
assert.match(cfLogin, /DUMMY_PASSWORD_HASH/);
assert.match(cfLogin, /!user \|\| !user\.is_active \|\| locked \|\| !ok/);
assert.doesNotMatch(cfLogin, /code: "ACCOUNT_LOCKED"/);
assert.doesNotMatch(cfLogin, /code: "ACCOUNT_DISABLED"/);

const expressLogin = fs.readFileSync("server/auth/routes.ts", "utf8");
assert.match(expressLogin, /DUMMY_PASSWORD_HASH/);
assert.match(expressLogin, /!user \|\| !user\.isActive \|\| locked \|\| !valid/);
assert.doesNotMatch(expressLogin, /code: "AUTH_LOCKED"/);

const expressCore = fs.readFileSync("server/routes/clinical-core.ts", "utf8");
assert.match(expressCore, /status = 'active'/);
assert.match(expressCore, /STALE_SUPERSESSION/);
assert.match(expressCore, /correction\.changes !== 1/);

const d1Schema = fs.readFileSync("functions/api/clinical-core/_schema.ts", "utf8");
const d1Core = fs.readFileSync("functions/api/clinical-core/index.ts", "utf8");
const migration = fs.readFileSync("db/migrations/0006_clinical_core.sql", "utf8");
for (const source of [d1Schema, migration]) {
  assert.match(source, /trg_clinical_events_demo_active_supersession/);
  assert.match(source, /RAISE\(ABORT, 'STALE_SUPERSESSION'\)/);
}
assert.match(d1Core, /batchResults\[1\]\?\.meta\?\.changes/);
assert.match(d1Core, /STALE_SUPERSESSION/);

for (const path of ["server/index.ts", "server/lib/db.ts", "server/lib/db-enhanced.ts", "server/routes/files.ts"]) {
  const source = fs.readFileSync(path, "utf8");
  assert.doesNotMatch(source, /parseInt\(process\.env\./);
}

console.log("✓ pontas soltas definitivas: fail-closed, auth anti-enumeração, CAS clínico, KV e env numérico protegidos");
