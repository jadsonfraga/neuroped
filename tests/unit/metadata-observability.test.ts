import assert from "node:assert/strict";
import { test } from "node:test";
import Database from "better-sqlite3";
import { apiMetricGroup, writeApiMetric } from "../../functions/api/_observability";
import { onRequest } from "../../functions/api/_middleware";
import { signJwt } from "../../functions/api/auth/_crypto";
import { readTenantMetrics, onRequestGet } from "../../functions/api/tenants/[id]/metrics";

const user = { id: "owner-a", role: "professional", email: "owner@example.invalid", name: "Synthetic Owner", mustChangePassword: false };
// Ephemeral test-only key; never a committed application secret.
const secret = crypto.randomUUID() + crypto.randomUUID();
const fixedNow = new Date("2026-09-14T12:00:00Z");
function fixture() {
  const raw = new Database(":memory:");
  raw.exec(`CREATE TABLE clinics (id TEXT PRIMARY KEY, status TEXT NOT NULL);
    CREATE TABLE clinic_memberships (clinic_id TEXT, user_id TEXT, role TEXT, active INTEGER);
    CREATE TABLE saas_audit_log (clinic_id TEXT, actor_user_id TEXT, created_at TEXT, target_id TEXT, metadata_json TEXT);
    INSERT INTO clinics VALUES ('clinic-a','active'), ('clinic-b','active');
    INSERT INTO clinic_memberships VALUES ('clinic-a','owner-a','owner',1), ('clinic-b','owner-b','owner',1),
      ('clinic-a','professional-a','professional',1), ('clinic-a','admin-a','clinic_admin',1);
    INSERT INTO saas_audit_log VALUES
      ('clinic-a','owner-a','2026-09-14 01:00:00','PRIVATE_TARGET','PRIVATE_BODY'),
      ('clinic-a','owner-a','2026-09-14 02:00:00','PRIVATE_TARGET','PRIVATE_BODY'),
      ('clinic-a','professional-a','2026-09-14 03:00:00','PRIVATE_TARGET','PRIVATE_BODY'),
      ('clinic-a','older-actor','2026-09-04 03:00:00','PRIVATE_TARGET','PRIVATE_BODY'),
      ('clinic-a','excluded-old','2026-08-15 03:00:00','PRIVATE_TARGET','PRIVATE_BODY'),
      ('clinic-a','excluded-future','2026-09-15 03:00:00','PRIVATE_TARGET','PRIVATE_BODY'),
      ('clinic-b','owner-b','2026-09-14 01:00:00','PRIVATE_TARGET','PRIVATE_BODY');`);
  const db = { prepare(sql: string) { const stmt = raw.prepare(sql); return {
    bind(...args: unknown[]) { return { async first() { return stmt.get(...args) ?? null; } }; },
  }; } } as unknown as D1Database;
  return { raw, db };
}
function context(overrides: Record<string, unknown> = {}) {
  return { request: new Request("https://neuroped.pages.dev/api/tenants/clinic-a/metrics"),
    env: {}, data: { authUser: user }, params: { id: "clinic-a" }, ...overrides } as never;
}

test("actual SQLite aggregates distinct actors, bounded UTC days and tenant scope", async () => {
  const { raw, db } = fixture();
  try {
    const result = await readTenantMetrics(db, "clinic-a", "owner-a", fixedNow);
    assert.ok(result); assert.equal(result.auditedActorsToday, 2);
    assert.equal(result.auditedActors7Days, 2); assert.equal(result.auditedActors30Days, 3);
    assert.equal(result.auditedEvents30Days, 4); assert.equal(result.daily.length, 2);
    assert.equal(result.window.from, "2026-08-16"); assert.equal(result.window.toExclusive, "2026-09-15");
    assert.equal(result.coverage.retention, null); assert.equal(result.coverage.fullProductDau, null);
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_|owner-a|professional-a|owner-b|older-actor|excluded/);
  } finally { raw.close(); }
});
test("cross-tenant access, SQL injection and nonexistent tenant fail closed", async () => {
  const { raw, db } = fixture();
  try {
    for (const id of ["clinic-b", "missing", "' OR 1=1 --"]) {
      assert.equal(await readTenantMetrics(db, id, "owner-a", fixedNow), null);
    }
  } finally { raw.close(); }
});
test("only active owners and clinic admins can read, without global-admin bypass", async () => {
  const { raw, db } = fixture();
  try {
    assert.equal(await readTenantMetrics(db, "clinic-a", "professional-a", fixedNow), null);
    assert.ok(await readTenantMetrics(db, "clinic-a", "admin-a", fixedNow));
    const response = await onRequestGet(context({ env: { DB: db }, data: { authUser: { ...user, id: "platform-admin", role: "admin" } } }));
    assert.equal(response.status, 404);
    raw.exec("UPDATE clinic_memberships SET active=0 WHERE user_id='owner-a'");
    assert.equal(await readTenantMetrics(db, "clinic-a", "owner-a", fixedNow), null);
  } finally { raw.close(); }
});
test("suspended/closed clinics do not return aggregates", async () => {
  const { raw, db } = fixture();
  try {
    for (const status of ["suspended", "closed"]) {
      raw.prepare("UPDATE clinics SET status=? WHERE id='clinic-a'").run(status);
      assert.equal(await readTenantMetrics(db, "clinic-a", "owner-a", fixedNow), null);
    }
  } finally { raw.close(); }
});
test("empty authorized source is zero, but absent storage/schema is unavailable", async () => {
  const { raw, db } = fixture();
  try {
    raw.exec("DELETE FROM saas_audit_log");
    const empty = await readTenantMetrics(db, "clinic-a", "owner-a", fixedNow);
    assert.ok(empty); assert.equal(empty.auditedEvents30Days, 0); assert.deepEqual(empty.daily, []);
    raw.exec("DROP TABLE saas_audit_log");
    const broken = await onRequestGet(context({ env: { DB: db } }));
    assert.equal(broken.status, 503); assert.doesNotMatch(await broken.text(), /no such table|saas_audit_log|PRIVATE/);
    assert.equal((await onRequestGet(context())).status, 503);
  } finally { raw.close(); }
});
test("endpoint rejects unauthenticated, ambiguous IDs and query-scope override", async () => {
  assert.equal((await onRequestGet(context({ data: {} }))).status, 401);
  assert.equal((await onRequestGet(context({ params: { id: ["clinic-a", "clinic-b"] } }))).status, 404);
  assert.equal((await onRequestGet(context({ request: new Request("https://neuroped.pages.dev/api/tenants/clinic-a/metrics?clinic_id=clinic-b") }))).status, 400);
});
test("authorized response is no-store and exposes configuration, not delivery proof", async () => {
  const { raw, db } = fixture();
  try {
    const response = await onRequestGet(context({ env: { DB: db } }));
    assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json() as Record<string, unknown>;
    assert.equal(body.apiInstrumentationBindingPresent, false);
    assert.doesNotMatch(JSON.stringify(body), /PRIVATE_|owner-a|owner-b/);
  } finally { raw.close(); }
});
test("metric group is allowlisted and excludes public routes, preview and prototype keys", () => {
  for (const url of ["https://neuroped.pages.dev/api/public-scale?token=PRIVATE_TOKEN", "https://preview.neuroped.pages.dev/api/live/x", "http://neuroped.pages.dev/api/live/x", "https://neuroped.pages.dev/api/__proto__", "https://neuroped.pages.dev/api/constructor", "https://neuroped.pages.dev/api/liveevil"]) {
    assert.equal(apiMetricGroup(new Request(url)), null);
  }
  assert.equal(apiMetricGroup(new Request("https://neuroped.pages.dev/api/live/PRIVATE_TARGET?token=PRIVATE_TOKEN")), "clinical_live");
});
test("telemetry transmits only fixed dimensions and numeric values, not request/identity", () => {
  const points: unknown[] = [];
  writeApiMetric({ request: new Request("https://neuroped.pages.dev/api/live/PRIVATE_TARGET?token=PRIVATE_TOKEN", {
    method: "POST", headers: { Authorization: "Bearer PRIVATE_SECRET" }, body: "PRIVATE_BODY" }),
    data: { authUser: user }, env: { API_METRICS: { writeDataPoint(point: unknown) { points.push(point); } } as AnalyticsEngineDataset },
  }, performance.now(), 201, "response");
  assert.equal(points.length, 1);
  const point = points[0] as { indexes: string[]; blobs: string[]; doubles: number[] };
  assert.deepEqual(Object.keys(point).sort(), ["blobs", "doubles", "indexes"]);
  assert.deepEqual(point.blobs, ["api-v1", "clinical_live", "POST", "response"]);
  assert.deepEqual(point.indexes, ["clinical_live"]); assert.equal(point.doubles[1], 201);
  assert.doesNotMatch(JSON.stringify(point), /PRIVATE|owner|example|clinic-a|Bearer|https/);
});
test("anonymous requests never write metrics; bad timers/statuses are bounded", () => {
  const points: unknown[] = [];
  const env = { API_METRICS: { writeDataPoint(point: unknown) { points.push(point); } } as AnalyticsEngineDataset };
  const request = new Request("https://neuroped.pages.dev/api/live/x");
  writeApiMetric({ request, env, data: {} }, 0, 200, "response"); assert.equal(points.length, 0);
  writeApiMetric({ request, env, data: { authUser: user } }, Number.NaN, Number.NaN, "exception");
  assert.deepEqual((points[0] as { doubles: number[] }).doubles, [0, 500, 1]);
  assert.doesNotThrow(() => writeApiMetric({ request, data: { authUser: user }, env: {
    API_METRICS: { writeDataPoint() { throw new Error("PRIVATE_SINK_ERROR"); } } as unknown as AnalyticsEngineDataset,
  } }, 0, 200, "response"));
});
test("actual global middleware preserves body, headers and thrown error with instrumentation wired", async () => {
  const points: unknown[] = [];
  const authDb = { prepare(sql: string) { return { bind() { return { async first() {
    return sql.includes("auth_refresh_sessions") ? { active: 1 } : {
      id: user.id, role: "professional", email: user.email, name: user.name, is_active: 1,
      must_change_password: 0, password_hash: "synthetic", failed_login_attempts: 0, locked_until: null,
    };
  } }; } }; } };
  const token = await signJwt({ sub: user.id, email: user.email, name: user.name, role: "professional", type: "access", sid: "synthetic-session" }, secret, 60);
  const ctx = { request: new Request("https://neuroped.pages.dev/api/patients/PRIVATE_TARGET?x=PRIVATE_TOKEN", { headers: { Authorization: `Bearer ${token}` } }),
    env: { DB: authDb, NEUROPED_JWT_SECRET: secret, API_METRICS: { writeDataPoint(point: unknown) { points.push(point); } } },
    data: {}, next: async () => new Response("PRIVATE_BODY", { status: 202 }),
  };
  const response = await onRequest(ctx as never);
  assert.equal(response.status, 202); assert.equal(await response.text(), "PRIVATE_BODY");
  assert.equal(response.headers.get("Cache-Control"), "no-store, no-cache, must-revalidate");
  assert.equal(points.length, 1);
  const original = new Error("PRIVATE_ORIGINAL_EXCEPTION");
  await assert.rejects(() => onRequest({ ...ctx, data: {}, next: async () => { throw original; } } as never), (error: unknown) => error === original);
  assert.equal(points.length, 2);
  assert.doesNotMatch(JSON.stringify(points), /PRIVATE_|owner-a|synthetic-session/);
});
