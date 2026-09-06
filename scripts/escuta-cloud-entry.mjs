import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

// Actual D1 REST transport for this run's freshly created QA database only.
// No simulated database, provider, authentication or production handler.
// SQLite determines complete statements including nested CASE inside triggers.
const originalFetch = globalThis.fetch;
const run = process.env.GITHUB_RUN_ID;
assert(process.env.GITHUB_ACTIONS === "true" && /^\d+$/.test(run || ""));
const expectedName = `np-escuta-qa-${run}`;
let createdDatabaseId = null;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  const isCloudflare = url.origin === "https://api.cloudflare.com";
  if (isCloudflare && /\/d1\/database$/.test(url.pathname) && init?.method === "POST") {
    const payload = JSON.parse(String(init.body));
    assert.equal(payload.name, expectedName, "QA transport refuses any other database name");
    const response = await originalFetch(input, init);
    if (response.ok) { const data = await response.clone().json(); if (data.success) createdDatabaseId = data.result.uuid; }
    return response;
  }
  if (isCloudflare && /\/d1\/database\/[^/]+\/query$/.test(url.pathname) && init?.method === "POST") {
    assert(createdDatabaseId && url.pathname.endsWith(`/d1/database/${createdDatabaseId}/query`), "QA transport refuses uncreated or production database");
    const payload = JSON.parse(String(init.body));
    const statements = JSON.parse(execFileSync("python3", ["scripts/escuta-sql-transport.py"], {input: payload.sql, encoding: "utf8", timeout: 10000}));
    if (payload.params?.length) assert.equal(statements.length, 1, "Bound parameters require one complete statement");
    const results = [];
    for (const [index, statement] of statements.entries()) {
      // params:[] is deliberate HERE: each payload is now exactly one SQLite
      // statement, so D1 must prepare it intact rather than split trigger bodies.
      const response = await originalFetch(input, {...init, body: JSON.stringify({sql: statement, params: payload.params || []})});
      if (!response.ok) { console.error(`Isolated D1 statement ${index + 1}/${statements.length} failed; statement class: ${statement.split(/\s+/).slice(0,3).join(" ")}`); return response; }
      const parsed = await response.clone().json(); if (!parsed.success) return response;
      results.push(...parsed.result);
    }
    return Response.json({success: true, errors: [], messages: [], result: results});
  }
  return originalFetch(input, init);
};
try { await import("./escuta-cloud-qa.mjs"); }
finally { globalThis.fetch = originalFetch; }
