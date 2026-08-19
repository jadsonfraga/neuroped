import assert from "node:assert/strict";
import {
  CLINICAL_INPUT_LIMITS,
} from "../../functions/api/_clinicalValidation";
import { AUTH_INPUT_LIMITS } from "../../functions/api/auth/_limits";
import { onRequestPost as login } from "../../functions/api/auth/login";
import { onRequestPost as logout } from "../../functions/api/auth/logout";
import { onRequestPost as refresh } from "../../functions/api/auth/refresh";
import { onRequestPost as createConsultation } from "../../functions/api/consultations/index";
import { onRequestPost as createDocument } from "../../functions/api/documents/index";
import { onRequestGet as searchMemory } from "../../functions/api/memory/search";
import { onRequestPost as createResult } from "../../functions/api/results";
import { onRequestDelete as deleteResult } from "../../functions/api/results/[id]";
import {
  onRequestGet as listScaleResults,
  onRequestPost as createScaleResult,
} from "../../functions/api/scales/results";

const secret = "segredo-de-validacao-com-mais-de-trinta-e-dois-caracteres";
const uuidPattern = /^[a-z]+-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

async function post(
  handler: PagesFunction<Record<string, unknown>>,
  payload: unknown,
  env: Record<string, unknown> = {},
) {
  return handler({
    request: new Request("https://neuroped.test/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    env,
    params: {},
    data: {},
  } as never);
}

async function get(
  handler: PagesFunction<Record<string, unknown>>,
  path: string,
  env: Record<string, unknown> = {},
) {
  return handler({
    request: new Request(`https://neuroped.test${path}`),
    env,
    params: {},
    data: {},
  } as never);
}

const extensiveResponses = Array.from({ length: 150 }, (_, index) => ({
  question: `Pergunta clínica ${index + 1}`,
  answer: `Resposta entregue ${index + 1}`,
}));

const resultResponse = await post(createResult as never, {
  patientId: "",
  scaleName: "Instrumento extenso",
  responses: extensiveResponses,
  applied_at: "2026-07-16T12:30:00.000Z",
});
assert.equal(resultResponse.status, 200, "mais de 100 itens continuam aceitos");
const resultBody = await resultResponse.json() as {
  id: string;
  responses: Array<{ question: string; answer: string }>;
};
assert.match(resultBody.id, uuidPattern);
assert.deepEqual(resultBody.responses, extensiveResponses, "pergunta + resposta chegam integrais");

const scaleResponse = await post(createScaleResult as never, {
  patient_id: "demo-001",
  scale_id: "instrumento-extenso",
  scale_name: "Instrumento extenso",
  responses: extensiveResponses,
  applied_at: "2026-07-16T09:30:00-03:00",
});
assert.equal(
  scaleResponse.status,
  503,
  "payload extenso válido passa pela validação e falha fechado sem D1",
);
const scaleBody = await scaleResponse.json() as { code?: string };
assert.equal(scaleBody.code, "DB_REQUIRED");

const tooManyResponses = Array.from(
  { length: CLINICAL_INPUT_LIMITS.responseItems + 1 },
  () => ({ question: "Pergunta", answer: "Resposta" }),
);
assert.equal(
  (await post(createResult as never, { responses: tooManyResponses })).status,
  400,
);
assert.equal(
  (await post(createScaleResult as never, {
    patient_id: "demo-001",
    scale_id: "x",
    scale_name: "X",
    responses: [{
      question: "Pergunta",
      answer: "R".repeat(CLINICAL_INPUT_LIMITS.responseAnswer + 1),
    }],
  })).status,
  400,
);
for (const handler of [createResult, createScaleResult]) {
  const payload = handler === createResult
    ? { responses: extensiveResponses, applied_at: "2026-02-30T10:00:00Z" }
    : {
        patient_id: "demo-001",
        scale_id: "x",
        scale_name: "X",
        responses: extensiveResponses,
        applied_at: "2026-02-30T10:00:00Z",
      };
  assert.equal((await post(handler as never, payload)).status, 400, "data impossível é rejeitada");
}

const documentResponse = await post(createDocument as never, {
  patient_id: "demo-001",
  type: "laudo",
  title: "Documento clínico",
  content: "Conteúdo integral",
});
assert.equal(documentResponse.status, 503);
assert.equal(
  (await documentResponse.json() as { code?: string }).code,
  "CLINICAL_DOCUMENTS_BACKEND_UNAVAILABLE",
);
assert.equal(
  (await post(createDocument as never, {
    patient_id: "demo-001",
    type: "laudo",
    title: "T".repeat(CLINICAL_INPUT_LIMITS.documentTitle + 1),
    content: "Conteúdo",
  })).status,
  503,
  "payload não deve alcançar uma persistência demo enquanto o backend permanente não existe",
);
assert.equal(
  (await post(createDocument as never, {
    patient_id: "demo-001",
    type: "laudo",
    title: "Documento clínico",
    content: "C".repeat(CLINICAL_INPUT_LIMITS.documentContent + 1),
  })).status,
  503,
  "conteúdo clínico não deve ser aceito por um endpoint sem storage permanente",
);

const consultationResponse = await post(createConsultation as never, {
  patient_id: "demo-001",
  date: "2026-07-16",
  subjective: "Relato integral",
});
assert.equal(consultationResponse.status, 503);
assert.equal((await consultationResponse.json() as { code?: string }).code, "DB_REQUIRED");
assert.equal(
  (await post(createConsultation as never, {
    patient_id: "demo-001",
    date: "2026-13-01",
  })).status,
  400,
);
assert.equal(
  (await post(createConsultation as never, {
    patient_id: "demo-001",
    subjective: "S".repeat(CLINICAL_INPUT_LIMITS.consultationSection + 1),
  })).status,
  400,
);

const authEnv = { DB: {}, NEUROPED_JWT_SECRET: secret };
assert.equal(
  (await post(login as never, {
    email: "e".repeat(AUTH_INPUT_LIMITS.email + 1),
    password: "senha",
  }, authEnv)).status,
  400,
);
assert.equal(
  (await post(login as never, {
    email: "usuario@example.com",
    password: "p".repeat(AUTH_INPUT_LIMITS.password + 1),
  }, authEnv)).status,
  400,
);
for (const handler of [refresh, logout]) {
  assert.equal(
    (await post(handler as never, {
      refreshToken: "x".repeat(AUTH_INPUT_LIMITS.jwt + 1),
    }, authEnv)).status,
    400,
  );
}

assert.equal((await get(searchMemory as never, "/api/memory/search?q=teste&limit=abc")).status, 400);
assert.equal((await get(searchMemory as never, "/api/memory/search?q=teste&min_score=NaN")).status, 400);
assert.equal((await get(
  searchMemory as never,
  `/api/memory/search?q=${"q".repeat(301)}`,
)).status, 400);
assert.equal(
  (await get(searchMemory as never, "/api/memory/search?q=mchat&limit=999&min_score=0")).status,
  200,
  "limite inteiro grande é reduzido ao teto seguro",
);

assert.equal(
  (await get(listScaleResults as never, `/api/scales/results?patient_id=${"x".repeat(129)}`)).status,
  400,
);
assert.equal(
  (await deleteResult({
    request: new Request("https://neuroped.test/api/results/x"),
    env: {},
    params: { id: "x".repeat(129) },
    data: {},
  } as never)).status,
  400,
);

console.log("✓ Cloudflare Functions aplicam tetos, UUIDs e datas ISO sem truncar escalas extensas");
