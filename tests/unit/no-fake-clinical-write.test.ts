import assert from "node:assert/strict";
import { onRequestPost as createPatient } from "../../functions/api/patients/index";
import { onRequestPost as createConsultation } from "../../functions/api/consultations/index";
import { onRequestPost as createDocument } from "../../functions/api/documents/index";
import { onRequestPost as createScaleResult } from "../../functions/api/scales/results";
import { onRequestPost as createUiResult } from "../../functions/api/results";
import {
  onRequestPatch as updatePatient,
  onRequestDelete as deletePatient,
} from "../../functions/api/patients/[id]";
import { onRequestDelete as deleteScaleResult } from "../../functions/api/results/[id]";

type Handler = (context: any) => Promise<Response>;

async function expectDbRequired(
  name: string,
  handler: Handler,
  body: Record<string, unknown>,
): Promise<void> {
  const request = new Request(`https://neuroped.invalid/api/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const response = await handler({ env: {}, request, data: {} });
  const payload = await response.json() as { code?: string; error?: string };
  assert.equal(response.status, 503, `${name}: write sem DB deve falhar com 503`);
  assert.equal(payload.code, "DB_REQUIRED", `${name}: código deve ser DB_REQUIRED`);
  assert.match(payload.error ?? "", /persistência indisponível/i, `${name}: resposta deve ser honesta`);
}

await expectDbRequired("patients", createPatient, {
  name: "Paciente Fictício de Teste",
  birth_date: "2018-01-01",
});

await expectDbRequired("consultations", createConsultation, {
  patient_id: "demo-001",
  date: "2026-08-10",
  subjective: "Registro fictício",
});

await expectDbRequired("documents", createDocument, {
  patient_id: "demo-001",
  type: "laudo",
  title: "Documento fictício",
  content: "Conteúdo fictício de teste",
});

await expectDbRequired("scales-results", createScaleResult, {
  patient_id: "demo-001",
  scale_id: "teste-ficticio",
  scale_name: "Escala Fictícia",
  responses: [{ question: "Item fictício", answer: "Resposta" }],
});

await expectDbRequired("results", createUiResult, {
  patientId: "demo-001",
  scaleId: "teste-ficticio",
  scaleName: "Escala Fictícia",
  responses: [{ question: "Item fictício", answer: "Resposta" }],
});

async function expectMutationDbRequired(
  name: string,
  handler: Handler,
  method: "PATCH" | "DELETE",
  body?: Record<string, unknown>,
): Promise<void> {
  const request = new Request(`https://neuroped.invalid/api/${name}/demo-001`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const response = await handler({
    env: {},
    request,
    params: { id: "demo-001" },
    data: {},
  });
  const payload = await response.json() as { code?: string; error?: string; deleted?: boolean; updated?: boolean };
  assert.equal(response.status, 503, `${name}: ${method} sem DB deve falhar com 503`);
  assert.equal(payload.code, "DB_REQUIRED", `${name}: ${method} deve sinalizar DB_REQUIRED`);
  assert.notEqual(payload.deleted, true, `${name}: não pode declarar remoção sem persistência`);
  assert.notEqual(payload.updated, true, `${name}: não pode declarar atualização sem persistência`);
}

await expectMutationDbRequired("patients", updatePatient as Handler, "PATCH", { name: "Paciente Editado" });
await expectMutationDbRequired("patients", deletePatient as Handler, "DELETE");
await expectMutationDbRequired("results", deleteScaleResult as Handler, "DELETE");

console.log("✓ Escritas clínicas sem D1 falham fechado em POST, PATCH e DELETE");
