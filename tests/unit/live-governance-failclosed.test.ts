import assert from "node:assert/strict";
import { onRequest } from "../../functions/api/live/governance/_middleware";

const next = async () => new Response(JSON.stringify({ ok: true }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

async function call(method: string, body?: string) {
  const headers = new Headers();
  if (body !== undefined) headers.set("Content-Type", "application/json");
  return onRequest({
    request: new Request("https://neuroped.test/api/live/governance", {
      method,
      headers,
      body: body !== undefined ? body : undefined,
    }),
    env: {},
    data: {},
    next,
  } as never);
}

const completed = await call("PATCH", JSON.stringify({
  clinicId: "clinic-1",
  requestType: "delete",
  requestId: "request-1",
  status: "completed",
}));
assert.equal(completed.status, 409, "admin não pode declarar conclusão material sem worker");
const completedBody = await completed.json() as Record<string, unknown>;
assert.equal(completedBody.code, "PHYSICAL_OPERATION_NOT_PROVEN");

const processing = await call("PATCH", JSON.stringify({
  clinicId: "clinic-1",
  requestType: "delete",
  requestId: "request-1",
  status: "processing",
}));
assert.equal(processing.status, 200, "transições administrativas anteriores a completed continuam disponíveis");

const rejected = await call("PATCH", JSON.stringify({
  clinicId: "clinic-1",
  requestType: "export",
  requestId: "request-2",
  status: "rejected",
}));
assert.equal(rejected.status, 200, "rejeição permanece disponível");

const invalidJson = await call("PATCH", "{");
assert.equal(invalidJson.status, 200, "JSON inválido deve seguir para a validação canônica do handler");

const get = await call("GET");
assert.equal(get.status, 200, "leituras não são alteradas pela trava de conclusão");

console.log("✓ Governança LGPD falha fechada: completed exige prova material do executor");
