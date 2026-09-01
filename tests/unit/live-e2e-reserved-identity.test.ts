import assert from "node:assert/strict";
import { onRequest } from "../../functions/api/live/_middleware";

const e2eEmail = "sentinel@neuroped.invalid";
let nextCalls = 0;
const next = async () => {
  nextCalls += 1;
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

const response = await onRequest({
  request: new Request("https://neuroped.test/api/live/patients?clinicId=clinic-1"),
  env: {
    DB: {},
    NEUROPED_E2E_EMAIL: e2eEmail,
  },
  data: {
    authUser: {
      id: "e2e-1",
      email: e2eEmail.toUpperCase(),
      name: "Sentinela E2E",
      role: "reader",
      mustChangePassword: false,
    },
  },
  next,
} as never);

assert.equal(response.status, 403, "identidade E2E reservada deve falhar antes de resolver membership/billing");
assert.equal(nextCalls, 0, "Clinical LIVE nunca deve alcançar o handler para a identidade reservada");
const body = await response.json() as Record<string, unknown>;
assert.equal(body.code, "RESERVED_TECHNICAL_IDENTITY");

console.log("✓ Clinical LIVE bloqueia identidade E2E reservada antes de qualquer membership residual");
