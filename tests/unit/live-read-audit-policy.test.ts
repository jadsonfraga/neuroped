import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  clinicalLiveReadAuditTarget,
  shouldAuditClinicalLiveRead,
} from "../../functions/api/live/_middleware";

const patientRead = new Request(
  "https://neuroped.test/api/live/patients/patient-sensitive-id?clinicId=clinic-sensitive-id&search=nome",
  { method: "GET" },
);

assert.equal(
  clinicalLiveReadAuditTarget(patientRead),
  "live_patients",
  "audit target deve registrar apenas a classe da superfície",
);
assert.equal(
  clinicalLiveReadAuditTarget(patientRead).includes("patient-sensitive-id"),
  false,
  "audit target não pode carregar identificador de paciente",
);
assert.equal(
  clinicalLiveReadAuditTarget(patientRead).includes("clinic-sensitive-id"),
  false,
  "audit target não pode carregar query string/identificador de clínica derivado da URL",
);

assert.equal(
  shouldAuditClinicalLiveRead(patientRead, new Response(null, { status: 200 })),
  true,
  "GET clínico bem-sucedido deve ser auditado",
);
assert.equal(
  shouldAuditClinicalLiveRead(patientRead, new Response(null, { status: 404 })),
  false,
  "leitura que não retornou sucesso não deve virar evento clínico de leitura",
);
assert.equal(
  shouldAuditClinicalLiveRead(
    new Request("https://neuroped.test/api/live/patients", { method: "POST" }),
    new Response(null, { status: 201 }),
  ),
  false,
  "writes continuam auditados pelos handlers e não podem ser duplicados pelo middleware de leitura",
);

const source = readFileSync("functions/api/live/_middleware.ts", "utf8");
assert.match(
  source,
  /context\.waitUntil\([\s\S]*writeSaasAudit/,
  "escrita de auditoria deve ocorrer via waitUntil para não bloquear a resposta clínica",
);
assert.match(
  source,
  /writeSaasAudit\([\s\S]*action:\s*"clinical\.read"/,
  "evento deve usar ação clínica de leitura estável",
);
assert.doesNotMatch(
  source,
  /metadata:\s*\{[^}]*url:/s,
  "metadata não pode persistir URL clínica",
);
assert.doesNotMatch(
  source,
  /metadata:\s*\{[^}]*path:/s,
  "metadata não pode persistir path clínico",
);

console.log("✓ leituras Clinical LIVE têm auditoria metadata-only, assíncrona e não bloqueante");
