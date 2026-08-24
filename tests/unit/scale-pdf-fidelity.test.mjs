import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildScaleResponseText,
  formatScaleResponseDateTime,
  normalizeScaleResponseItems,
} from "../../client/src/lib/scaleResponseReport.ts";
import {
  savedScaleAppliedAt,
  savedScaleName,
  savedScaleResponses,
} from "../../client/src/lib/savedScaleResult.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const literalItems = normalizeScaleResponseItems([
  { question: "Frequência", answer: "2 — Sempre" },
  { question: "Ocorrência", answer: "Nunca (0)" },
  { question: "Descrição", answer: "2 - vezes por semana" },
]);
assert.deepEqual(
  literalItems.map((item) => item.answer),
  ["2 — Sempre", "Nunca (0)", "2 - vezes por semana"],
  "o registro/PDF não pode reinterpretar nem remover partes do rótulo marcado",
);

const applicationDate = "2026-08-24T12:34:56.000Z";
const reportText = buildScaleResponseText(
  {
    scaleName: "ESCALA-SINTÉTICA",
    applicationDate,
    items: literalItems,
  },
  new Date("2035-01-01T00:00:00.000Z"),
);
assert.match(reportText, /24 de agosto de 2026 às 09:34:56/);
assert.doesNotMatch(reportText, /2035/);
assert.equal(
  formatScaleResponseDateTime(applicationDate),
  "24 de agosto de 2026 às 09:34:56",
);
for (const item of literalItems) assert.ok(reportText.includes(item.answer));

// Contrato LIVE real: o backend devolve cada item como
// { itemId, itemPosition, value: { question, answer } }. O paciente/PDF deve
// reconstruir exatamente as alternativas marcadas, na ordem clínica original.
const liveAssessment = {
  instrumentId: "escala-sintetica-v1",
  appliedAt: applicationDate,
  payload: { title: "ESCALA SINTÉTICA HUMANA" },
  responses: [
    {
      itemId: "q-2",
      itemPosition: 1,
      value: { question: "Ocorrência", answer: "Nunca (0)" },
    },
    {
      itemId: "q-1",
      itemPosition: 0,
      value: { question: "Frequência", answer: "2 — Sempre" },
    },
  ],
};
assert.equal(savedScaleName(liveAssessment), "ESCALA SINTÉTICA HUMANA");
assert.equal(savedScaleAppliedAt(liveAssessment), applicationDate);
assert.deepEqual(savedScaleResponses(liveAssessment), [
  { question: "Frequência", answer: "2 — Sempre" },
  { question: "Ocorrência", answer: "Nunca (0)" },
]);

const localAssessment = {
  scaleName: "LOCAL",
  responses: [
    { question: "Pergunta A", answer: "Marcado A" },
    { question: "Pergunta B", answer: "Marcado B" },
  ],
};
assert.deepEqual(savedScaleResponses(localAssessment), localAssessment.responses);

const generic = read("client/src/components/GenericScale.tsx");
const interactive = read("client/src/components/InteractiveScaleRunner.tsx");
const report = read("client/src/components/ClinicalReport.tsx");
const save = read("client/src/components/SaveToPatient.tsx");
const patientDetail = read("client/src/pages/paciente-detalhe.tsx");
const draftHook = read("client/src/hooks/useSecureScaleDraft.ts");

assert.match(generic, /function finishApplication\(\)/);
assert.match(generic, /setApplicationDate\(new Date\(\)\.toISOString\(\)\)/);
assert.match(generic, /<LazyClinicalReport[\s\S]*applicationDate=\{applicationDate \?\? undefined\}/);
assert.match(generic, /<LazySaveToPatient[\s\S]*applicationDate=\{applicationDate \?\? undefined\}/);
assert.match(interactive, /setApplicationDate\(new Date\(\)\.toISOString\(\)\)/);
assert.match(interactive, /<LazyClinicalReport[\s\S]*applicationDate=\{applicationDate \?\? undefined\}/);
assert.match(interactive, /<LazySaveToPatient[\s\S]*applicationDate=\{applicationDate \?\? undefined\}/);
assert.match(report, /applicationDate\?: string \| Date/);
assert.match(
  report,
  /const \[fallbackApplicationDate\] = useState\(\(\) => new Date\(\)\)/,
  "escala dedicada deve congelar a data ao montar o resultado, sem recalcular ao clicar PDF",
);
assert.match(
  report,
  /resolveApplicationDate\(\s*rawProps\.applicationDate,\s*fallbackApplicationDate,?\s*\)/,
);
assert.match(report, /Data da aplicação: \$\{formatClinicalDateTime\(applicationDate\)\}/);
assert.match(save, /applicationDate\?: string \| Date/);
assert.match(
  save,
  /const \[fallbackApplicationDate\] = useState\(\(\) => new Date\(\)\)/,
  "salvamento deve manter o mesmo fallback temporal durante re-renders",
);
assert.match(save, /appliedAt: applicationDate\.toISOString\(\)/);
assert.match(save, /Data da aplicação: \$\{formatClinicalDateTime\(applicationDate\)\}/);
assert.doesNotMatch(
  report,
  /Data de emissão:/,
  "o resultado da escala deve identificar a aplicação, não substituir pela hora de exportação",
);

// A tela do paciente e o PDF reemitido precisam consumir a MESMA normalização
// do snapshot persistido, nunca reconstruir LIVE por um parser paralelo.
assert.match(patientDetail, /savedScaleResponses as storedResponses/);
assert.match(patientDetail, /savedScaleName as resultScaleName/);
assert.match(patientDetail, /savedScaleAppliedAt as resultCreatedAt/);
assert.match(patientDetail, /buildDocumentPdf/);
assert.match(patientDetail, /resultado-salvo\.pdf/);

// Segurança + continuidade: LIVE não volta a persistir PHI em Storage; usa
// memória da sessão e sela o último snapshot em vez de apagá-lo ao concluir.
assert.match(draftHook, /const inMemoryScaleDrafts = new Map<string, unknown>\(\)/);
assert.match(draftHook, /browserPersistenceDenied\(key, "write"\)/);
assert.match(draftHook, /inMemoryScaleDrafts\.set\(key, value\)/);
assert.match(draftHook, /const sealed = sanitizeRef\.current\(latestValueRef\.current\)/);
assert.match(draftHook, /persistScaleDraft\(\{[\s\S]{0,500}value: sealed/);

console.log(
  "✓ escala/PDF: resposta marcada → snapshot salvo LIVE/local → histórico → PDF usa o mesmo dado literal",
);
