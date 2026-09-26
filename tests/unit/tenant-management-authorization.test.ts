/** Real global middleware, session verification, tenant handlers and SQLite migrations. */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { onRequest as globalMiddleware } from "../../functions/api/_middleware";
import { onRequest as membersMiddleware } from "../../functions/api/tenants/[id]/_middleware";
import { onRequestPatch as patchClinic } from "../../functions/api/tenants/[id]/index";
import { onRequestPost as updateMember, onRequestDelete as deleteMember } from "../../functions/api/tenants/[id]/members";
import { onRequestDelete as revokeInvitation, onRequestPost as inviteMember } from "../../functions/api/billing/invitations";
import { onRequestPost as startCheckout } from "../../functions/api/billing/checkout";
import { onRequestPost as changeLifecycle } from "../../functions/api/tenants/[id]/lifecycle";
import { createSessionTokens } from "../../functions/api/auth/_sessions";
import { getUserById } from "../../functions/api/auth/_shared";
import { decideRouteAccess } from "../../client/src/security/routeGuardPolicy";

const SECRET = "synthetic-tenant-management-session-secret-32chars";
const ALFA = "synthetic-clinic-alfa";
const BETA = "synthetic-clinic-beta";

async function fixture() {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = OFF");
  raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
  const superseded: string[] = [];
  for (const name of readdirSync("db/migrations").filter((name) => name.endsWith(".sql")).sort()) {
    try { raw.exec(readFileSync(`db/migrations/${name}`, "utf8")); }
    catch (error) {
      assert.match(String(error), /duplicate column name/);
      superseded.push(name);
    }
  }
  assert.deepEqual(superseded, ["0001_users_auth.sql", "0002_patient_ownership.sql"]);
  raw.exec("PRAGMA foreign_keys = ON");
  let beforeBatch: (() => void) | undefined;
  const prepare = (sql: string) => {
    const bound = (args: unknown[]) => ({
      async first<T>() { return (raw.prepare(sql).get(...args as never[]) as T | undefined) ?? null; },
      async all<T>() { return { results: raw.prepare(sql).all(...args as never[]) as T[] }; },
      async run() { return { meta: { changes: Number(raw.prepare(sql).run(...args as never[]).changes) } }; },
      sql,
    });
    return { ...bound([]), bind: (...args: unknown[]) => bound(args) };
  };
  const db = {
    prepare,
    async batch(statements: Array<{ run(): Promise<unknown>; sql: string }>) {
      if (statements.some((statement) => statement.sql.includes("UPDATE clinics"))) beforeBatch?.();
      raw.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        raw.exec("COMMIT");
        return results;
      } catch (error) { raw.exec("ROLLBACK"); throw error; }
    },
  } as unknown as D1Database;

  const roles = {
    "owner-a": "professional", "owner-b": "professional", "reader-owner": "reader",
    "operator-manager": "operator", "staff-a": "professional", "platform-admin": "admin",
  };
  for (const [id, role] of Object.entries(roles)) {
    raw.prepare("INSERT INTO users (id, name, email, role, is_active) VALUES (?, ?, ?, ?, 1)")
      .run(id, `Synthetic ${id}`, `${id}@example.test`, role);
  }
  for (const [id, owner] of [[ALFA, "owner-a"], [BETA, "owner-b"]]) {
    raw.prepare("INSERT INTO clinics (id, slug, name, created_by_user_id) VALUES (?, ?, ?, ?)")
      .run(id, id, id, owner);
    raw.prepare("UPDATE billing_subscriptions SET seats = 20 WHERE customer_id IN (SELECT id FROM billing_customers WHERE clinic_id = ?)").run(id);
    raw.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role) VALUES (?, ?, 'owner')").run(id, owner);
  }
  for (const [id, role] of [["reader-owner", "owner"], ["operator-manager", "clinic_admin"], ["staff-a", "assistant"]]) {
    raw.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role) VALUES (?, ?, ?)").run(ALFA, id, role);
  }
  for (const id of [ALFA, BETA]) {
    raw.prepare("INSERT INTO clinic_settings (clinic_id, display_name) VALUES (?, ?)").run(id, `Original ${id}`);
    raw.prepare(`INSERT INTO clinic_invitations (id, clinic_id, email, role, token_hash, status, expires_at)
      VALUES (?, ?, 'synthetic-invite@example.test', 'assistant', ?, 'pending', datetime('now', '+1 day'))`)
      .run(`invite-${id}`, id, `synthetic-hash-${id}`);
  }
  const tokens: Record<string, string> = {};
  for (const id of Object.keys(roles)) {
    const row = await getUserById(db, id);
    assert.ok(row);
    tokens[id] = (await createSessionTokens(db, row, SECRET)).accessToken;
  }
  const env = { DB: db, NEUROPED_JWT_SECRET: SECRET, ENVIRONMENT: "production" };
  let requestNumber = 0;
  async function call(userId: string, path: string, method = "PATCH", body: unknown = { name: "Changed Alfa", settings: { displayName: "Timbre Alfa" } }, tenantHeader = ALFA) {
    const url = new URL(path, "https://neuroped.test");
    const match = /^\/api\/tenants\/([^/]+)/.exec(url.pathname);
    const context = {
      request: new Request(url, {
        method,
        headers: { Authorization: `Bearer ${tokens[userId]}`, "Content-Type": "application/json", "X-Tenant-Id": tenantHeader, "CF-Connecting-IP": `203.0.${++requestNumber}.9` },
        body: ["GET", "DELETE"].includes(method) ? undefined : JSON.stringify(body),
      }),
      env, data: {}, params: { id: match?.[1] ?? "" },
      waitUntil: (_promise: Promise<unknown>) => undefined,
      next: async (): Promise<Response> => {
        if (/\/members$/.test(url.pathname)) {
          return membersMiddleware({ ...context, next: () => (method === "DELETE" ? deleteMember : updateMember)(context as never) } as never);
        }
        if (url.pathname === "/api/billing/invitations") return (method === "DELETE" ? revokeInvitation : inviteMember)(context as never);
        if (url.pathname === "/api/billing/checkout") return startCheckout(context as never);
        if (/\/lifecycle$/.test(url.pathname)) return changeLifecycle(context as never);
        if (match && method === "PATCH") return patchClinic(context as never);
        return new Response(JSON.stringify({ reached: true }), { status: 200 });
      },
    };
    return globalMiddleware(context as never);
  }
  function snapshot(clinicId: string) {
    return {
      clinic: raw.prepare("SELECT name, legal_name, timezone, updated_at FROM clinics WHERE id = ?").get(clinicId),
      settings: raw.prepare("SELECT * FROM clinic_settings WHERE clinic_id = ?").get(clinicId),
      audit: raw.prepare("SELECT * FROM saas_audit_log WHERE clinic_id = ? ORDER BY id").all(clinicId),
    };
  }
  return { raw, call, snapshot, setBeforeBatch: (fn: () => void) => { beforeBatch = fn; } };
}

test("tenant managers operate by membership without global promotion; client zero preserved", async () => {
  const f = await fixture();
  try {
    const beta = f.snapshot(BETA);
    for (const user of ["owner-a", "reader-owner", "operator-manager"]) {
      const response = await f.call(user, `/api/tenants/${ALFA}`);
      assert.equal(response.status, 200, `${user}: tenant permission governs settings`);
    }
    assert.equal(f.raw.prepare("SELECT display_name FROM clinic_settings WHERE clinic_id = ?").get(ALFA)?.display_name, "Timbre Alfa");
    assert.deepEqual(f.snapshot(BETA), beta);
    assert.equal(f.raw.prepare("SELECT role FROM users WHERE id = 'reader-owner'").get()?.role, "reader");
    assert.equal(f.raw.prepare("SELECT role FROM users WHERE id = 'operator-manager'").get()?.role, "operator");
  } finally { f.raw.close(); }
});

test("cross-tenant path, body and header attacks never authorize management", async () => {
  const f = await fixture();
  try {
    const alfa = f.snapshot(ALFA), beta = f.snapshot(BETA);
    for (const [actor, target] of [["owner-a", BETA], ["owner-b", ALFA], ["staff-a", ALFA], ["platform-admin", ALFA]]) {
      const response = await f.call(actor, `/api/tenants/${target}`, "PATCH", { clinicId: ALFA, name: "FORBIDDEN" }, ALFA);
      assert.equal(response.status, 403);
    }
    assert.deepEqual(f.snapshot(ALFA), alfa);
    assert.deepEqual(f.snapshot(BETA), beta);
    const missing = await f.call("reader-owner", "/api/tenants/unknown-clinic");
    const foreign = await f.call("reader-owner", `/api/tenants/${BETA}`);
    assert.equal(missing.status, foreign.status);
    assert.deepEqual(await missing.json(), await foreign.json());
  } finally { f.raw.close(); }
});

test("tenant owner can manage existing team and revoke invitations after trial expiry", async () => {
  const f = await fixture();
  try {
    const updated = await f.call("reader-owner", `/api/tenants/${ALFA}/members`, "POST", { email: "staff-a@example.test", role: "financial" });
    assert.equal(updated.status, 201);
    assert.equal(f.raw.prepare("SELECT role FROM clinic_memberships WHERE clinic_id = ? AND user_id = 'staff-a'").get(ALFA)?.role, "financial");
    f.raw.prepare("UPDATE billing_customers SET status = 'suspended' WHERE clinic_id = ?").run(ALFA);
    assert.equal((await f.call("reader-owner", `/api/tenants/${ALFA}/members`, "POST", { email: "staff-a@example.test", role: "assistant" })).status, 402);
    const revoked = await f.call("reader-owner", `/api/billing/invitations?clinicId=${ALFA}&invitationId=invite-${ALFA}`, "DELETE");
    assert.equal(revoked.status, 200);
    assert.equal(f.raw.prepare("SELECT status FROM clinic_invitations WHERE id = ?").get(`invite-${ALFA}`)?.status, "revoked");
    assert.equal((await f.call("reader-owner", `/api/billing/invitations?clinicId=${BETA}&invitationId=invite-${BETA}`, "DELETE")).status, 403);
    assert.equal(f.raw.prepare("SELECT status FROM clinic_invitations WHERE id = ?").get(`invite-${BETA}`)?.status, "pending");
    const removed = await f.call("reader-owner", `/api/tenants/${ALFA}/members?userId=staff-a`, "DELETE");
    assert.equal(removed.status, 200);
    assert.equal(f.raw.prepare("SELECT active FROM clinic_memberships WHERE clinic_id = ? AND user_id = 'staff-a'").get(ALFA)?.active, 0);
  } finally { f.raw.close(); }
});

test("body-scoped invitation and checkout retain delivery/provider gates and reject header spoofing", async () => {
  const f = await fixture();
  try {
    const beta = f.snapshot(BETA);
    for (const [path, body, code] of [
      ["/api/billing/invitations", { clinicId: ALFA, email: "new-member@example.test", role: "assistant" }, "INVITATION_DELIVERY_NOT_CONFIGURED"],
      ["/api/billing/checkout", { clinicId: ALFA, seats: 20 }, "BILLING_PROVIDER_UNAVAILABLE"],
    ] as const) {
      const allowed = await f.call("reader-owner", path, "POST", body);
      assert.equal(allowed.status, 503, "authorized management does not invent an integration");
      assert.equal((await allowed.json() as { code: string }).code, code);
      const denied = await f.call("reader-owner", path, "POST", { ...body, clinicId: BETA }, ALFA);
      assert.equal(denied.status, 403, "header cannot override body ownership");
      assert.equal((await f.call("reader-owner", path, "POST", null)).status, 400);
    }
    assert.deepEqual(f.snapshot(BETA), beta);
    assert.equal(f.raw.prepare("SELECT COUNT(*) AS n FROM clinic_invitations").get()?.n, 2);
  } finally { f.raw.close(); }
});

test("lifecycle keeps owner-only authorization while suspended, and settings remain blocked", async () => {
  const f = await fixture();
  try {
    const path = `/api/tenants/${ALFA}/lifecycle`;
    const request = { action: "request_closure", confirmSlug: "incorrect-confirmation" };
    assert.equal((await f.call("operator-manager", path, "POST", request)).status, 403);
    f.raw.prepare("UPDATE clinics SET status = 'suspended' WHERE id = ?").run(ALFA);
    const response = await f.call("reader-owner", path, "POST", request);
    assert.equal(response.status, 400);
    assert.equal((await response.json() as { code: string }).code, "TENANT_CLOSURE_CONFIRMATION_MISMATCH");
    assert.equal((await f.call("reader-owner", `/api/tenants/${ALFA}`)).status, 403);
  } finally { f.raw.close(); }
});

test("membership removal and revoked sessions fail closed; clinical and platform guards remain", async () => {
  const f = await fixture();
  try {
    for (const path of ["/api/patients", "/api/results", "/api/consultations", "/api/admin/go-live", "/api/tenants", `/api/tenants/${ALFA}/future-endpoint`]) {
      assert.equal((await f.call("reader-owner", path, "POST", {})).status, 403, path);
    }
    f.raw.prepare("UPDATE clinic_memberships SET active = 0 WHERE clinic_id = ? AND user_id = 'operator-manager'").run(ALFA);
    assert.equal((await f.call("operator-manager", `/api/tenants/${ALFA}`)).status, 403);
    f.raw.prepare("UPDATE auth_refresh_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = 'reader-owner'").run();
    assert.equal((await f.call("reader-owner", `/api/tenants/${ALFA}`)).status, 401);
  } finally { f.raw.close(); }
});

for (const failure of ["clinic_update", "settings_update", "audit_insert"]) {
  test(`settings, clinic and audit roll back together on ${failure}`, async () => {
    const f = await fixture();
    try {
      const before = f.snapshot(ALFA), beta = f.snapshot(BETA);
      const triggerTarget = { clinic_update: "BEFORE UPDATE ON clinics", settings_update: "BEFORE UPDATE ON clinic_settings", audit_insert: "BEFORE INSERT ON saas_audit_log" }[failure];
      f.raw.exec(`CREATE TRIGGER synthetic_write_failure ${triggerTarget} BEGIN SELECT RAISE(ABORT, 'synthetic_failure'); END`);
      const response = await f.call("owner-a", `/api/tenants/${ALFA}`);
      assert.equal(response.status, 500);
      assert.deepEqual(f.snapshot(ALFA), before, "no partial branding update without audit");
      assert.deepEqual(f.snapshot(BETA), beta);
    } finally { f.raw.close(); }
  });
}

test("revocation between authorization and transaction cannot write settings", async () => {
  const f = await fixture();
  try {
    const before = f.snapshot(ALFA);
    f.setBeforeBatch(() => f.raw.prepare("UPDATE clinic_memberships SET active = 0 WHERE clinic_id = ? AND user_id = 'operator-manager'").run(ALFA));
    const response = await f.call("operator-manager", `/api/tenants/${ALFA}`);
    assert.equal(response.status, 403);
    assert.deepEqual(f.snapshot(ALFA), before);
  } finally { f.raw.close(); }
});

test("settings route admits authenticated account roles while clinical routes stay restricted", () => {
  for (const userRole of ["reader", "operator"] as const) {
    const input = { accessMode: "remote", isAuthenticated: true, isLoading: false, userRole } as const;
    assert.equal(decideRouteAccess({ ...input, path: "/configuracoes" }), "allow");
    assert.equal(decideRouteAccess({ ...input, path: "/configuracoes", isAuthenticated: false }), "login");
    assert.equal(decideRouteAccess({ ...input, path: "/prontuario" }), "forbidden");
  }
});
