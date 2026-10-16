/** Fixture compartilhada (SQLite real: schema + todas as migrations; node:sqlite, Node >= 22). Dados fictícios. */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { onRequest as globalMiddleware } from "../../functions/api/_middleware";
import { createSessionTokens } from "../../functions/api/auth/_sessions";
import { getUserById } from "../../functions/api/auth/_shared";

const SECRET = "synthetic-multiclinic-session-secret-32chars-min";
export const ALFA = "clinica-alfa-sintetica";
export const BETA = "clinica-beta-sintetica";
const PNG_1PX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export async function fixture() {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = OFF");
  raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
  for (const name of readdirSync("db/migrations").filter((n) => n.endsWith(".sql")).sort()) {
    try { raw.exec(readFileSync(`db/migrations/${name}`, "utf8")); } catch (e) { assert.match(String(e), /duplicate column name/); }
  }
  raw.exec("PRAGMA foreign_keys = ON");
  const prepare = (sql: string) => {
    const bound = (args: unknown[]) => ({
      async first<T>() { return (raw.prepare(sql).get(...args as never[]) as T | undefined) ?? null; },
      async all<T>() { return { results: raw.prepare(sql).all(...args as never[]) as T[] }; },
      async run() { return { meta: { changes: Number(raw.prepare(sql).run(...args as never[]).changes) } }; },
      sql,
      args,
    });
    return { ...bound([]), bind: (...args: unknown[]) => bound(args) };
  };
  const db = {
    prepare,
    async batch(statements: Array<{ sql: string; args: unknown[] }>) {
      raw.exec("BEGIN");
      try {
        const out = [];
        for (const st of statements) {
          const stmt = raw.prepare(st.sql);
          if (stmt.columns().length > 0) out.push({ success: true, results: stmt.all(...st.args as never[]), meta: { changes: 0 } });
          else out.push({ success: true, results: [], meta: { changes: Number(stmt.run(...st.args as never[]).changes) } });
        }
        raw.exec("COMMIT");
        return out;
      } catch (e) { raw.exec("ROLLBACK"); throw e; }
    },
  } as unknown as D1Database;

  const users: Record<string, string> = { "owner-a": "professional", "owner-b": "professional", "prof-a": "professional", "sec-a": "operator", "prof-b": "professional", "admin-a": "professional", "fin-a": "reader" };
  for (const [id, role] of Object.entries(users)) {
    raw.prepare("INSERT INTO users (id, name, email, role, is_active) VALUES (?, ?, ?, ?, 1)").run(id, `Fictício ${id}`, `${id}@example.test`, role);
  }
  for (const [id, owner] of [[ALFA, "owner-a"], [BETA, "owner-b"]]) {
    raw.prepare("INSERT INTO clinics (id, slug, name, created_by_user_id) VALUES (?, ?, ?, ?)").run(id, id, id, owner);
    raw.prepare("UPDATE billing_subscriptions SET seats = 20 WHERE customer_id IN (SELECT id FROM billing_customers WHERE clinic_id = ?)").run(id);
    raw.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role) VALUES (?, ?, 'owner')").run(id, owner);
  }
  for (const [clinic, user, role] of [[ALFA, "prof-a", "professional"], [ALFA, "sec-a", "assistant"], [ALFA, "admin-a", "clinic_admin"], [ALFA, "fin-a", "financial"], [BETA, "prof-b", "professional"]]) {
    raw.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role) VALUES (?, ?, ?)").run(clinic, user, role);
  }
  for (const [pid, clinic, who] of [["paciente-alfa", ALFA, "prof-a"], ["paciente-beta", BETA, "prof-b"]]) {
    raw.prepare("INSERT INTO live_patients (id, clinic_id, created_by_user_id, profile_encrypted) VALUES (?, ?, ?, 'cifrado-ficticio')").run(pid, clinic, who);
  }
  const tokens: Record<string, string> = {};
  for (const id of Object.keys(users)) {
    const row = await getUserById(db, id);
    assert.ok(row);
    tokens[id] = (await createSessionTokens(db, row, SECRET)).accessToken;
  }
  const env = {
    DB: db, NEUROPED_JWT_SECRET: SECRET, ENVIRONMENT: "production", CLINICAL_LIVE_ENABLED: "true",
    CLINICAL_DATA_KEY: "multiclinic-data-key-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ", CLINICAL_DATA_KEY_ID: "k-mc-1",
    CLINICAL_INDEX_KEY: "multiclinic-index-key-9876543210-ZYXWVUTSRQPONMLKJIHGFEDCBA",
  };
  let n = 0;
  async function call(user: string, handler: (c: never) => Promise<Response> | Response, path: string, method = "GET", body?: unknown, tenantHeader?: string) {
    const url = new URL(path, "https://neuroped.test");
    const match = /^\/api\/tenants\/([^/]+)/.exec(url.pathname);
    const context = {
      request: new Request(url, {
        method,
        headers: { Authorization: `Bearer ${tokens[user]}`, "Content-Type": "application/json", ...(tenantHeader ? { "X-Tenant-Id": tenantHeader } : {}), "CF-Connecting-IP": `203.0.${++n}.9` },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      env, data: {}, params: { id: match?.[1] ?? "" }, waitUntil: () => undefined,
      next: async () => handler(context as never),
    };
    return globalMiddleware(context as never);
  }
  return { raw, call, env };
}

