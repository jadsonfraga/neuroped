import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildScaleResponseText,
  formatScaleResponseDateTime,
  normalizeScaleResponseItems,
} from "../../client/src/lib/scaleResponseReport.ts";

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

const generic = read("client/src/components/GenericScale.tsx");
const interactive = read("client/src/components/InteractiveScaleRunner.tsx");
const report = read("client/src/components/ClinicalReport.tsx");
const save = read("client/src/components/SaveToPatient.tsx");

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

console.log(
  "✓ escala/PDF: respostas literais + instante estável de conclusão atravessam relatório, PDF e salvamento",
);
