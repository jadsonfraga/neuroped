import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { onRequest as middleware } from "../../functions/api/_middleware";
import { onRequestPost as changePassword } from "../../functions/api/auth/change-password";
import { hashPassword, signJwt } from "../../functions/api/auth/_crypto";

interface FakeStatement {
  sql: string;
  args: unknown[];
  bind: (...args: unknown[]) => FakeStatement;
  first: () => Promise<unknown>;
}

const currentPassword = "Current!Password123";
const nextPassword = "Next!Password456";
const currentHash = await hashPassword(currentPassword);
const userRow = {
  id: "reader-1",
  name: "Pessoa Leitora",
  email: "reader@example.test",
  role: "reader",
  is_active: 1,
  password_hash: currentHash,
  must_change_password: 1,
  failed_login_attempts: 0,
  locked_until: null,
};

let batches: FakeStatement[][] = [];
const passwordDb = {
  prepare(sql: string): FakeStatement {
    const statement: FakeStatement = {
      sql,
      args: [],
      bind(...args: unknown[]) {
        statement.args = args;
        return statement;
      },
      async first() {
        return sql.includes("FROM users") ? userRow : null;
      },
    };
    return statement;
  },
  async batch(statements: FakeStatement[]) {
    batches.push(statements);
    return [
      { meta: { changes: 1 } },
      { meta: { changes: 1 } },
      { meta: { changes: 1 } },
    ];
  },
};

function changeContext(current: string, replacement: string) {
  return {
    request: new Request("https://neuroped.test/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.7" },
      body: JSON.stringify({ currentPassword: current, newPassword: replacement }),
    }),
    env: { DB: passwordDb },
    data: {
      authUser: {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        role: userRow.role,
        mustChangePassword: true,
      },
    },
  };
}

const success = await changePassword(changeContext(currentPassword, nextPassword) as never);
assert.equal(success.status, 200);
assert.deepEqual(await success.json(), { ok: true, logoutRequired: true });
assert.equal(batches.length, 1);
assert.equal(batches[0].length, 3);
assert.match(batches[0][0].sql, /must_change_password = 0/);
assert.match(batches[0][0].sql, /WHERE id = \? AND password_hash = \?/);
assert.match(batches[0][1].sql, /auth\.password\.change/);
assert.match(batches[0][1].sql, /WHERE changes\(\) = 1/);
assert.match(batches[0][2].sql, /revoke_reason = 'password_changed'/);
assert.match(batches[0][2].sql, /WHERE user_id = \? AND revoked_at IS NULL AND changes\(\) = 1/);
assert.notEqual(batches[0][0].args[0], currentHash, "hash novo não pode reutilizar a credencial atual");

const wrongPassword = await changePassword(changeContext("Wrong!Password123", nextPassword) as never);
assert.equal(wrongPassword.status, 401);
assert.equal((await wrongPassword.json() as { code: string }).code, "WRONG_PASSWORD");
assert.equal(batches.length, 1, "senha atual errada não pode abrir transação de mutação");

const reusedPassword = await changePassword(changeContext(currentPassword, currentPassword) as never);
assert.equal(reusedPassword.status, 409);
assert.equal((await reusedPassword.json() as { code: string }).code, "PASSWORD_REUSE_NOT_ALLOWED");
assert.equal(batches.length, 1);

const secret = "change-password-middleware-secret-123456789";
const token = await signJwt({
  sub: userRow.id,
  email: userRow.email,
  name: userRow.name,
  role: "reader",
  type: "access",
  sid: "session-change-password",
}, secret, 60);
const middlewareDb = {
  prepare(sql: string) {
    return {
      bind() {
        return {
          async first() {
            if (sql.includes("auth_refresh_sessions")) return { active: 1 };
            return userRow;
          },
        };
      },
    };
  },
};
const next = async () => new Response(JSON.stringify({ ok: true }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

async function throughMiddleware(path: string, method = "GET") {
  return middleware({
    request: new Request(`https://neuroped.test${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      ...(method === "POST" ? { body: JSON.stringify({}) } : {}),
    }),
    env: { DB: middlewareDb, NEUROPED_JWT_SECRET: secret },
    data: {},
    next,
  } as never);
}

const forcedBlock = await throughMiddleware("/api/patients");
assert.equal(forcedBlock.status, 428);
assert.equal((await forcedBlock.json() as { code: string }).code, "PASSWORD_CHANGE_REQUIRED");
assert.equal((await throughMiddleware("/api/auth/me")).status, 200, "usuário ainda pode consultar a própria sessão");
assert.equal(
  (await throughMiddleware("/api/auth/change-password", "POST")).status,
  200,
  "reader com senha temporária pode trocar a própria senha",
);

const publicWebhook = await middleware({
  request: new Request("https://neuroped.test/api/billing/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }),
  env: {},
  data: {},
  next,
} as never);
assert.equal(publicWebhook.status, 200, "Stripe chega ao handler sem credencial de usuário");

const sharedAuth = readFileSync(
  new URL("../../functions/api/auth/_shared.ts", import.meta.url),
  "utf8",
);
const routeGuard = readFileSync(
  new URL("../../client/src/components/RouteGuard.tsx", import.meta.url),
  "utf8",
);
assert.match(sharedAuth, /must_change_password = 1/);
assert.match(routeGuard, /user\?\.mustChangePassword/);
assert.match(routeGuard, /\/alterar-senha\?required=1/);

console.log("✓ change password: política forte, rotação obrigatória, CAS e revogação de sessões protegidos");
