import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { consumeTenantRateLimit, enforceTenantRateLimit } from "../../functions/api/saas/_rate-limit.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const migration = fs.readFileSync(path.join(root, "db/migrations/0024_saas_rate_limit_buckets.sql"), "utf8");
const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
sqlite.exec("CREATE TABLE clinics (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL, status TEXT NOT NULL);");
sqlite.exec("INSERT INTO clinics(id, name, slug, status) VALUES ('clinic-a', 'A', 'a', 'active'), ('clinic-b', 'B', 'b', 'active');");
sqlite.exec(migration);

const d1 = {
  prepare(sql) {
    return {
      bind(...bindings) {
        return {
          async first() {
            return sqlite.prepare(sql).get(...bindings);
          },
        };
      },
    };
  },
};

const first = await consumeTenantRateLimit(d1, "clinic-a", "saas:invites:write", 2, 60);
assert.deepEqual(first, { allowed: true, remaining: 1, retryAfterSeconds: 0 });
const second = await consumeTenantRateLimit(d1, "clinic-a", "saas:invites:write", 2, 60);
assert.deepEqual(second, { allowed: true, remaining: 0, retryAfterSeconds: 0 });
const third = await consumeTenantRateLimit(d1, "clinic-a", "saas:invites:write", 2, 60);
assert.equal(third.allowed, false);
assert.equal(third.remaining, 0);
assert.ok(third.retryAfterSeconds > 0);

const otherTenant = await consumeTenantRateLimit(d1, "clinic-b", "saas:invites:write", 2, 60);
assert.deepEqual(otherTenant, { allowed: true, remaining: 1, retryAfterSeconds: 0 });
assert.equal(sqlite.prepare("SELECT request_count FROM saas_rate_limit_buckets WHERE clinic_id = 'clinic-b' AND bucket_key = 'saas:invites:write'").get().request_count, 1);

sqlite.prepare("UPDATE saas_rate_limit_buckets SET window_expires_at = datetime('now', '-1 second') WHERE clinic_id = 'clinic-a' AND bucket_key = 'saas:invites:write'").run();
const afterExpiry = await consumeTenantRateLimit(d1, "clinic-a", "saas:invites:write", 2, 60);
assert.deepEqual(afterExpiry, { allowed: true, remaining: 1, retryAfterSeconds: 0 });

const allowedResponse = await enforceTenantRateLimit(d1, "clinic-a", "saas:test", 1, 60);
assert.equal(allowedResponse, null);
const limitedResponse = await enforceTenantRateLimit(d1, "clinic-a", "saas:test", 1, 60);
assert.ok(limitedResponse);
assert.equal(limitedResponse.status, 429);
assert.ok(Number(limitedResponse.headers.get("Retry-After")) > 0);
assert.deepEqual(await limitedResponse.json(), { error: "Limite operacional temporariamente excedido.", code: "TENANT_RATE_LIMITED" });

sqlite.close();
console.log("[saas-rate-limit] ✓ janela, Retry-After, expiração, isolamento por tenant e fail-closed validados");
