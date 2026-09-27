import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { onRequest as integrationsGate } from "../../functions/api/integrations/_middleware.ts";
import { onRequest as obs60 } from "../../functions/api/integrations/obs60/index.ts";

// Real handlers, real SQL/schema/migrations, synthetic identities and an
// in-memory SQLite adapter for D1. No remote session, Cloudflare or AI proof.
test("OBS60 integration authorization is fail-closed for two isolated clinics", async t => {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = OFF;");
  raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
  const superseded = [];
  for (const file of readdirSync("db/migrations").filter(f => f.endsWith(".sql")).sort()) {
    try { raw.exec(readFileSync(`db/migrations/${file}`, "utf8")); }
    catch (error) { assert.match(String(error), /duplicate column name/i, file); superseded.push(file); }
  }
  assert.deepEqual(superseded, ["0001_users_auth.sql", "0002_patient_ownership.sql"]);
  raw.exec("PRAGMA foreign_keys = ON;");
  const db = {
    prepare(sql) {
      const bound = args => ({
        async first() { return raw.prepare(sql).get(...args) ?? null; },
        async all() { return { results: raw.prepare(sql).all(...args) }; },
        async run() { const info = raw.prepare(sql).run(...args); return { meta: { changes: Number(info.changes) } }; },
      });
      return { bind: (...args) => bound(args), ...bound([]) };
    },
    async batch(statements) {
      raw.exec("BEGIN");
      try { const results = []; for (const s of statements) results.push(await s.run()); raw.exec("COMMIT"); return results; }
      catch (error) { raw.exec("ROLLBACK"); throw error; }
    },
  };
  const now = new Date().toISOString();
  for (const id of ["a", "b", "none"]) raw.prepare("INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')").run(`obs60-${id}`, `Synthetic ${id}`, `obs60-${id}@example.test`);
  for (const id of ["a", "b"]) {
    raw.prepare("INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?, ?)").run(`obs60-${id}`, `obs60-${id}`, `Synthetic clinic ${id}`, `obs60-${id}`, now, now);
    raw.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES (?, ?, 'professional', 1, ?, ?)").run(`obs60-${id}`, `obs60-${id}`, now, now);
  }
  const user = (id, role = "professional") => ({ id: `obs60-${id}`, name: `Synthetic ${id}`, email: `obs60-${id}@example.test`, role, mustChangePassword: false });
  const enabled = { OBS60_VIDEO_AI_ENABLED: "true", OBS60_PRIVACY_APPROVED: "true", OBS60_GEMINI_API_KEY: "synthetic-test-key-not-a-credential", OBS60_GEMINI_MODEL: "gemini-test-fixture" };
  const input = consent => ({ ageMonths: 36, windowSeconds: 1, consent, mime: "video/mp4", data: "AAAAAGZ0eXBpc29t" });
  async function invoke({ method = "GET", identity = user("a"), clinic = "obs60-a", config = {}, body, database = db } = {}) {
    const request = new Request("https://neuroped.test/api/integrations/obs60", { method, headers: { "Content-Type": "application/json", ...(clinic ? { "X-Tenant-Id": clinic } : {}) }, ...(method === "POST" ? { body: JSON.stringify(body ?? input(true)) } : {}) });
    const context = { request, env: { ...config, DB: database }, params: {}, data: identity ? { authUser: identity } : {}, next: () => obs60(context) };
    return integrationsGate(context);
  }
  const originalFetch = globalThis.fetch;
  let upstreamCalls = 0;
  globalThis.fetch = async () => { upstreamCalls++; throw new Error("Unexpected upstream call: authorization must stop before media transfer"); };
  try {
    await t.test("missing DB or authenticated identity never reaches provider", async () => {
      assert.equal((await invoke({ database: undefined })).status, 200); // default argument uses db
      const request = new Request("https://neuroped.test/api/integrations/obs60");
      assert.equal((await obs60({ request, env: {}, data: {}, params: {} })).status, 503);
      assert.equal((await invoke({ identity: null })).status, 401);
    });
    await t.test("each active clinic can read its own disabled capability", async () => {
      for (const id of ["a", "b"]) {
        const response = await invoke({ identity: user(id), clinic: `obs60-${id}` });
        assert.equal(response.status, 200);
        assert.equal((await response.json()).configured, false);
        assert.match(response.headers.get("Cache-Control"), /no-store/);
      }
    });
    await t.test("A cannot target B and B cannot target A, even with configuration enabled", async () => {
      for (const [id, target] of [["a", "b"], ["b", "a"]]) for (const method of ["GET", "POST"]) {
        const response = await invoke({ identity: user(id), clinic: `obs60-${target}`, method, config: enabled });
        assert.equal(response.status, 409);
        assert.equal((await response.json()).code, "BILLING_CLINIC_CONTEXT_REQUIRED");
      }
    });
    await t.test("global admin is not a foreign membership fallback", async () => {
      assert.equal((await invoke({ identity: user("a", "admin"), clinic: "obs60-b", config: enabled })).status, 409);
      assert.equal((await invoke({ identity: user("none"), clinic: null })).status, 409);
    });
    await t.test("operator cannot access clinical analysis despite clinic membership", async () => {
      assert.equal((await invoke({ identity: user("a", "operator"), config: enabled })).status, 403);
    });
    await t.test("disabled provider blocks POST without receiving media upstream", async () => {
      const response = await invoke({ method: "POST" });
      assert.equal(response.status, 503);
      assert.equal((await response.json()).code, "VIDEO_AI_UNAVAILABLE");
    });
    await t.test("configured provider still requires explicit consent in the real handler", async () => {
      const capability = await invoke({ config: enabled });
      assert.equal((await capability.json()).configured, true);
      const response = await invoke({ method: "POST", config: enabled, body: input(false) });
      assert.equal(response.status, 403);
      assert.equal((await response.json()).code, "CONSENT_REQUIRED");
    });
    await t.test("revoked membership is checked from persisted SQL on every request", async () => {
      raw.prepare("UPDATE clinic_memberships SET active = 0 WHERE clinic_id = 'obs60-a' AND user_id = 'obs60-a'").run();
      assert.equal((await invoke({ method: "POST", config: enabled })).status, 409);
      raw.prepare("UPDATE clinic_memberships SET active = 1 WHERE clinic_id = 'obs60-a' AND user_id = 'obs60-a'").run();
      assert.equal((await invoke()).status, 200);
    });
    await t.test("suspended billing blocks analysis without affecting the neighbor clinic", async () => {
      raw.prepare("UPDATE billing_customers SET status = 'past_due', grace_ends_at = NULL WHERE clinic_id = 'obs60-a'").run();
      assert.equal((await invoke({ method: "POST", config: enabled })).status, 402);
      assert.equal((await invoke({ identity: user("b"), clinic: "obs60-b" })).status, 200);
    });
    assert.equal(upstreamCalls, 0, "all rejection and availability paths precede video transfer");
  } finally { globalThis.fetch = originalFetch; raw.close(); }
});
