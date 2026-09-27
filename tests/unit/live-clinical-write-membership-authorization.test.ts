/**
 * S10 (docs/saas/spiral/BACKLOG.md) — modelo de papel duplo e incoerente.
 *
 * O middleware global (functions/api/_middleware.ts, roleFailure) só permite
 * ESCRITA a quem tem `users.role` global "admin"/"professional"
 * (canWriteClinicalData). O Clinical Core LIVE (functions/api/live/**),
 * porém, decide por MEMBERSHIP da clínica: `requireBillingEntitlement(...,
 * "clinical")` e os handlers (`membershipCanWriteClinical`) já concedem
 * corretamente a quem é owner/clinic_admin/professional NA CLÍNICA — mesmo
 * que o papel global da conta seja outro. Isso não é hipotético: em
 * `functions/api/billing/accept.ts`, quem aceita convite pela PRIMEIRA vez
 * como "financial" ganha papel global "reader" (linha ~140); se a MESMA
 * conta for depois convidada para OUTRA clínica como "professional", a
 * membership nasce correta ali, mas o papel global nunca é promovido — o
 * bloco `if (!existing)` só roda na primeira conta criada.
 *
 * Resultado: um profissional com membership `professional` (clinical.write
 * concedido, entitlement de clínica ativo, sem nenhum motivo de negócio para
 * negar) é barrado com 403 pelo middleware global antes de a requisição
 * sequer chegar ao Clinical Core LIVE, cujas próprias checagens de
 * membership já o autorizariam. Papel global e membership de clínica
 * decidem coisas diferentes e podem discordar — a pessoa certa não consegue
 * operar na própria clínica.
 *
 * Este teste roda sobre o `onRequest` REAL do middleware global encadeado
 * com o `onRequest` REAL de functions/api/live/_middleware.ts, schema e
 * migrações reais (SQLite in-memory), sem mock de SQL — mesma política de
 * tests/unit/tenant-management-authorization.test.ts.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { onRequest as globalMiddleware } from "../../functions/api/_middleware";
import { onRequest as liveMiddleware } from "../../functions/api/live/_middleware";
import { createSessionTokens } from "../../functions/api/auth/_sessions";
import { getUserById } from "../../functions/api/auth/_shared";

const SECRET = "synthetic-live-role-membership-mismatch-secret-32c";
const BETA = "synthetic-clinic-beta-s10";

async function fixture() {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = OFF");
  raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
  const superseded: string[] = [];
  for (const name of readdirSync("db/migrations").filter((n) => n.endsWith(".sql")).sort()) {
    try { raw.exec(readFileSync(`db/migrations/${name}`, "utf8")); }
    catch (error) {
      assert.match(String(error), /duplicate column name/);
      superseded.push(name);
    }
  }
  assert.deepEqual(superseded, ["0001_users_auth.sql", "0002_patient_ownership.sql"]);
  raw.exec("PRAGMA foreign_keys = ON");

  const prepare = (sql: string) => {
    const bound = (args: unknown[]) => ({
      async first<T>() { return (raw.prepare(sql).get(...args as never[]) as T | undefined) ?? null; },
      async all<T>() { return { results: raw.prepare(sql).all(...args as never[]) as T[] }; },
      async run() { return { meta: { changes: Number(raw.prepare(sql).run(...args as never[]).changes) } }; },
    });
    return { ...bound([]), bind: (...args: unknown[]) => bound(args) };
  };
  const db = {
    prepare,
    async batch(statements: Array<{ run(): Promise<unknown> }>) {
      raw.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        raw.exec("COMMIT");
        return results;
      } catch (error) { raw.exec("ROLLBACK"); throw error; }
    },
  } as unknown as D1Database;

  // "prof-b": ganhou papel global "reader" ao aceitar um PRIMEIRO convite
  // como "financial" em outra clínica (reproduz functions/api/billing/
  // accept.ts linha ~140: invitation.role === "financial" → globalRole "reader").
  // Depois é convidado para a clínica BETA como "professional" — a membership
  // nasce correta; o papel global nunca é revisitado.
  raw.prepare("INSERT INTO users (id, name, email, role, is_active) VALUES (?, ?, ?, 'reader', 1)")
    .run("prof-b", "Synthetic prof-b", "prof-b@example.test");
  raw.prepare("INSERT INTO users (id, name, email, role, is_active) VALUES (?, ?, ?, 'professional', 1)")
    .run("owner-b", "Synthetic owner-b", "owner-b@example.test");

  raw.prepare("INSERT INTO clinics (id, slug, name, created_by_user_id) VALUES (?, ?, ?, ?)")
    .run(BETA, BETA, BETA, "owner-b");
  raw.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role) VALUES (?, ?, 'owner')").run(BETA, "owner-b");
  raw.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role) VALUES (?, ?, 'professional')").run(BETA, "prof-b");

  const tokens: Record<string, string> = {};
  for (const id of ["prof-b", "owner-b"]) {
    const row = await getUserById(db, id);
    assert.ok(row);
    tokens[id] = (await createSessionTokens(db, row, SECRET)).accessToken;
  }
  const env = { DB: db, NEUROPED_JWT_SECRET: SECRET, ENVIRONMENT: "production" };

  async function call(userId: string, path: string, method: string, tenantHeader = BETA) {
    const url = new URL(path, "https://neuroped.test");
    const context = {
      request: new Request(url, {
        method,
        headers: {
          Authorization: `Bearer ${tokens[userId]}`,
          "Content-Type": "application/json",
          "X-Tenant-Id": tenantHeader,
          "CF-Connecting-IP": "203.0.113.9",
        },
        body: method === "GET" ? undefined : JSON.stringify({}),
      }),
      env,
      data: {},
      params: {},
      waitUntil: (_promise: Promise<unknown>) => undefined,
      next: async (): Promise<Response> => {
        return liveMiddleware({
          ...context,
          next: async () => new Response(JSON.stringify({ reached: true }), { status: 200 }),
        } as never);
      },
    };
    return globalMiddleware(context as never);
  }

  return { raw, call };
}

test("S10 RED: membership professional na clínica alvo é barrado por papel global desatualizado", async () => {
  const f = await fixture();
  try {
    // A própria membership (fonte de verdade da clínica) já concede clinical.write.
    const membership = f.raw.prepare(
      "SELECT role, active FROM clinic_memberships WHERE clinic_id = ? AND user_id = ?",
    ).get(BETA, "prof-b") as { role: string; active: number };
    assert.equal(membership.role, "professional");
    assert.equal(membership.active, 1);

    const response = await f.call("prof-b", "/api/live/patients", "POST");
    const body = await response.json().catch(() => null);
    assert.equal(
      response.status,
      200,
      `esperado 200 (handler LIVE alcançado via membership válida); recebido ${response.status} ${JSON.stringify(body)}`,
    );
  } finally { f.raw.close(); }
});

test("controle: membership sem clinical.write continua barrada mesmo com papel global alto", async () => {
  const f = await fixture();
  try {
    f.raw.prepare("UPDATE clinic_memberships SET role = 'financial' WHERE clinic_id = ? AND user_id = ?")
      .run(BETA, "prof-b");
    f.raw.prepare("UPDATE users SET role = 'professional' WHERE id = 'prof-b'").run();
    const response = await f.call("prof-b", "/api/live/patients", "POST");
    assert.notEqual(response.status, 200);
  } finally { f.raw.close(); }
});
