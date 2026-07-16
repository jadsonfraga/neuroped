import assert from "node:assert/strict";
import { onRequest } from "../../functions/api/_middleware";
import { signJwt } from "../../functions/api/auth/_crypto";
import { onRequestGet as healthCheck } from "../../functions/api/health";

const secret = "segredo-de-teste-com-comprimento-suficiente-123456";
const next = async () => new Response(JSON.stringify({ ok: true }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

async function call(path: string, env: Record<string, unknown>, token?: string, origin?: string) {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (origin) headers.set("Origin", origin);
  return onRequest({
    request: new Request(`https://neuroped.test${path}`, { headers }),
    env,
    next,
  } as never);
}

assert.equal((await call("/api/patients", {})).status, 200, "demo sem D1 permanece disponível");
assert.equal((await call("/api/patients", { DB: {} })).status, 503, "D1 sem segredo falha fechado");
assert.equal((await call("/api/patients", { DB: {}, NEUROPED_JWT_SECRET: secret })).status, 401);
assert.equal((await call("/api/health", { DB: {} })).status, 200, "health é público");

const unhealthyDb = {
  prepare: () => ({ first: async () => { throw new Error("database unavailable"); } }),
};
const healthResponse = await healthCheck({
  env: { DB: unhealthyDb, NEUROPED_JWT_SECRET: secret },
} as never);
const healthBody = await healthResponse.json() as {
  database: string;
  authentication: { required: boolean; configured: boolean };
};
assert.equal(healthBody.database, "error");
assert.deepEqual(
  healthBody.authentication,
  { required: true, configured: true },
  "binding D1 indisponível ainda deve falhar fechado no cliente",
);

const token = await signJwt(
  { sub: "user-1", email: "medico@example.com", name: "Médico", role: "professional", type: "access" },
  secret,
  60,
);
const authorized = await call(
  "/api/patients",
  { DB: {}, NEUROPED_JWT_SECRET: secret },
  token,
  "https://evil.example",
);
assert.equal(authorized.status, 200);
assert.equal(authorized.headers.get("Access-Control-Allow-Origin"), null, "CORS não abre por padrão");

const refreshToken = await signJwt(
  { sub: "user-1", email: "medico@example.com", name: "Médico", role: "professional", type: "refresh" },
  secret,
  60,
);
assert.equal(
  (await call("/api/patients", { DB: {}, NEUROPED_JWT_SECRET: secret }, refreshToken)).status,
  401,
  "refresh token nunca autoriza rota clínica",
);
console.log("✓ Functions clínicas exigem JWT quando D1 está ativo");
