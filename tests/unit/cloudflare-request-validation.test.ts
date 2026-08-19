import assert from "node:assert/strict";
import { onRequestPost as createPatient } from "../../functions/api/patients/index";
import { onRequestPatch as patchPatient } from "../../functions/api/patients/[id]";
import { onRequestPost as createResult } from "../../functions/api/results";
import { onRequestPost as createScaleResult } from "../../functions/api/scales/results";
import { onRequestPost as createDocument } from "../../functions/api/documents/index";
import { onRequestPost as createConsultation } from "../../functions/api/consultations/index";
import { onRequestPost as login } from "../../functions/api/auth/login";
import { onRequestPost as refresh } from "../../functions/api/auth/refresh";
import { onRequestPost as logout } from "../../functions/api/auth/logout";

const secret = "segredo-de-validacao-com-mais-de-trinta-e-dois-caracteres";

async function invoke(
  handler: PagesFunction<Record<string, unknown>>,
  payload: unknown,
  options: { env?: Record<string, unknown>; params?: Record<string, string> } = {},
) {
  return handler({
    request: new Request("https://neuroped.test/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    env: options.env ?? {},
    params: options.params ?? {},
    data: {},
  } as never);
}

const plainObjectHandlers = [
  [createPatient, {}],
  [patchPatient, { params: { id: "demo-001" } }],
  [createResult, {}],
  [createScaleResult, {}],
  [createConsultation, {}],
] as const;

for (const invalidBody of [null, [], ["objeto"]]) {
  for (const [handler, options] of plainObjectHandlers) {
    const response = await invoke(handler as never, invalidBody, options);
    assert.equal(response.status, 400, "null/array nunca causa 500 em rota clínica");
    const body = await response.json() as { code?: string };
    assert.equal(body.code, "INVALID_JSON");
  }
}

const invalidFieldCases: Array<[
  PagesFunction<Record<string, unknown>>,
  Record<string, unknown>,
  { params?: Record<string, string> },
]> = [
  [createPatient as never, { name: { nested: true } }, {}],
  [patchPatient as never, { notes: ["nested"] }, { params: { id: "demo-001" } }],
  [createResult as never, {
    patientId: 123,
    responses: [{ question: "Pergunta", answer: "Resposta" }],
  }, {}],
  [createResult as never, {
    responses: [{ question: { nested: true }, answer: [] }],
  }, {}],
  [createScaleResult as never, {
    patient_id: 123,
    scale_id: "x",
    scale_name: "X",
    responses: [{ question: "Pergunta", answer: "Resposta" }],
  }, {}],
  [createScaleResult as never, {
    patient_id: "demo-001",
    scale_id: "x",
    scale_name: "X",
    responses: [{ question: [], answer: {} }],
  }, {}],
  [createConsultation as never, { patient_id: 123 }, {}],
  [createConsultation as never, {
    patient_id: "demo-001",
    subjective: { nested: true },
  }, {}],
];

for (const [handler, payload, options] of invalidFieldCases) {
  const response = await invoke(handler, payload, options);
  assert.equal(response.status, 400, "tipo de campo inválido responde 400, nunca 500");
}

const unavailableDocument = await invoke(createDocument as never, null);
assert.equal(unavailableDocument.status, 503);
assert.equal(
  (await unavailableDocument.json() as { code?: string }).code,
  "CLINICAL_DOCUMENTS_BACKEND_UNAVAILABLE",
);

for (const handler of [login, refresh, logout]) {
  const response = await invoke(handler as never, null, {
    env: { DB: {}, NEUROPED_JWT_SECRET: secret },
  });
  assert.equal(response.status, 400, "auth também rejeita null como JSON inválido");
}

console.log("✓ payloads null, array e tipos aninhados falham com 400; documentos demo falham fechado");
