import assert from "node:assert/strict";
import { onRequest } from "../../functions/api/_middleware";
import { signJwt } from "../../functions/api/auth/_crypto";

const secret = "must-change-password-test-secret-with-adequate-length-123";

function dbWithRequiredPasswordChange() {
  return {
    prepare: (sql: string) => ({
      bind: () => ({
        first: async () => sql.includes("auth_refresh_sessions")
          ? { active: 1 }
          : {
              id: "user-must-change",
              name: "Synthetic User",
              email: "synthetic@example.test",
              role: "professional",
              is_active: 1,
              password_hash: "synthetic-hash",
              must_change_password: 1,
              failed_login_attempts: 0,
              locked_until: null,
            },
      }),
    }),
  } as unknown as D1Database;
}

const token = await signJwt(
  {
    sub: "user-must-change",
    email: "synthetic@example.test",
    name: "Synthetic User",
    role: "professional",
    type: "access",
    sid: "session-must-change",
  },
  secret,
  60,
);

async function request(path: string, method = "GET") {
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  if (["POST", "PATCH", "PUT"].includes(method)) headers.set("Content-Type", "application/json");
  return onRequest({
    request: new Request(`https://neuroped.test${path}`, {
      method,
      headers,
      body: ["POST", "PATCH", "PUT"].includes(method) ? "{}" : undefined,
    }),
    env: { DB: dbWithRequiredPasswordChange(), NEUROPED_JWT_SECRET: secret },
    next: async () => new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
    data: {},
  } as never);
}

for (const [path, method] of [
  ["/api/patients", "GET"],
  ["/api/patients", "POST"],
  ["/api/tenants", "GET"],
  ["/api/live/patients", "GET"],
  ["/api/audit-log", "GET"],
] as const) {
  const response = await request(path, method);
  assert.equal(response.status, 403, `${method} ${path} deve falhar fechado enquanto a senha é obrigatória`);
  const payload = await response.json() as { code?: string };
  assert.equal(payload.code, "PASSWORD_CHANGE_REQUIRED");
}

assert.equal(
  (await request("/api/auth/me")).status,
  200,
  "a UI precisa conseguir revalidar a identidade enquanto exige a troca de senha",
);
assert.equal(
  (await request("/api/auth/change-password", "POST")).status,
  200,
  "o próprio endpoint de troca deve atravessar o middleware",
);

console.log("✓ must_change_password bloqueia APIs clínicas no middleware Cloudflare até rotação da senha");
