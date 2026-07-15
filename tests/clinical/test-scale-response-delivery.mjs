import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  buildScaleResponsePrintHtml,
  buildScaleResponseText,
  formatScaleResponseAnswer,
  responseItemsFromLegacySections,
} from "../../client/src/lib/scaleResponseReport.ts";

function source(path) {
  return readFileSync(path, "utf8");
}

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

const report = {
  scaleName: "Escala de teste",
  scaleFullName: "Instrumento fictício",
  patientAge: "8 anos",
  items: [
    { question: "Consegue aguardar a sua vez?", answer: "Às vezes (1)" },
    { question: "Conclui as tarefas propostas?", answer: "2 — Frequentemente" },
  ],
};

const professional = {
  name: "Profissional",
  specialty: "Especialidade",
  registry: "Registro",
  service: "Serviço",
};

const fixedDate = new Date("2026-07-15T12:00:00-03:00");
const text = buildScaleResponseText(report, fixedDate);
const html = buildScaleResponsePrintHtml(report, professional, fixedDate);

for (const expected of [
  "Consegue aguardar a sua vez?",
  "Resposta: Às vezes",
  "Conclui as tarefas propostas?",
  "Resposta: Frequentemente",
]) {
  assert.ok(text.includes(expected), `texto deve conter: ${expected}`);
  assert.ok(
    html.includes(expected.replace("Resposta: ", "")),
    `HTML deve conter: ${expected}`,
  );
}

assert.equal(formatScaleResponseAnswer("Nunca (0)"), "Nunca");
assert.equal(formatScaleResponseAnswer("2 — Sempre"), "Sempre");
assert.equal(
  formatScaleResponseAnswer("Raramente (0-1x/sem)"),
  "Raramente (0-1x/sem)",
  "frequência que faz parte da resposta deve ser preservada",
);

const forbiddenOutput =
  /Pontua(?:c|ç)[aã]o|Escore|Classifica(?:c|ç)[aã]o|Interpreta(?:c|ç)[aã]o|<th[^>]*>Valor<|\bpontos\b/i;
assert.doesNotMatch(text, forbiddenOutput);
assert.doesNotMatch(html, forbiddenOutput);

const legacy = responseItemsFromLegacySections([
  { title: "Pergunta respondida", content: "Resposta registrada" },
  { title: "Interpretação clínica", content: "Conteúdo automático" },
  { title: "Pontuação", content: "99" },
]);
assert.deepEqual(legacy, [
  { question: "Pergunta respondida", answer: "Resposta registrada" },
]);

const clinicalReportSource = source("client/src/components/ClinicalReport.tsx");
const whatsAppSource = source("client/src/components/WhatsAppShare.tsx");
const saveSource = source("client/src/components/SaveToPatient.tsx");
const patientSource = source("client/src/pages/paciente-detalhe.tsx");
const genericSource = source("client/src/components/GenericScale.tsx");
const runnerSource = source("client/src/components/InteractiveScaleRunner.tsx");

assert.match(clinicalReportSource, /props\.items\.map/);
assert.doesNotMatch(
  clinicalReportSource,
  /RadarChart|totalScore|maxScore|domainResults|generateInterpretation/,
);
assert.match(clinicalReportSource, /encodeURIComponent\(reportText\)/);
assert.doesNotMatch(clinicalReportSource, /reportText\.slice/);
assert.doesNotMatch(whatsAppSource, /scoreLine|reportText\.slice|totalScore/);

assert.match(saveSource, /responses:\s*ScaleResponseItem\[\]/);
assert.match(saveSource, /normalizeScaleResponseItems\(rawProps\.responses\)/);
assert.match(saveSource, /responses,\s*answers:\s*responses,/);
assert.doesNotMatch(
  saveSource,
  /latestScaleResponses|totalScore|classification|domainScores/,
);
assert.doesNotMatch(patientSource, /r\.totalScore|r\.classification|\.score\b/);

assert.doesNotMatch(
  genericSource,
  /config\.onCalculate\s*\(/,
  "executor genérico não deve calcular resultado",
);
assert.doesNotMatch(runnerSource, /totalScore|classification|domainResults/);

const scaleUiSource = sourceFiles("client/src/pages")
  .map((path) => source(path))
  .filter((content) => /<(?:ClinicalReport|SaveToPatient)\b/.test(content))
  .join("\n");

assert.doesNotMatch(
  scaleUiSource,
  /\b(?:totalScore|maxScore|classification|domainResults|domainScores|hideScore)=/,
  "telas de resultado não devem passar cálculo ou análise aos entregáveis",
);
assert.doesNotMatch(scaleUiSource, /sections=\{/);

for (const match of scaleUiSource.matchAll(/<SaveToPatient\b[\s\S]*?\/>/g)) {
  assert.match(
    match[0],
    /responses=/,
    "cada ação de salvar deve receber sua transcrição explícita",
  );
}

const patientsSource = source("client/src/pages/pacientes.tsx");
assert.match(patientsSource, /responses,\s*answers:\s*responses,/);
assert.doesNotMatch(
  patientsSource,
  /r\.totalScore|r\.classification|r\.domainScores/,
  "backup antigo não pode reintroduzir pontuação",
);

for (const apiPath of [
  "functions/api/results.ts",
  "functions/api/scales/results.ts",
  "server/routes.ts",
]) {
  const apiSource = source(apiPath);
  assert.match(apiSource, /RESPONSES_REQUIRED/);
  assert.doesNotMatch(
    apiSource,
    /body\.(?:totalScore|classification|domainScores)/,
  );
}

for (const patientApiPath of [
  "functions/api/patients/[id].ts",
  "functions/api/patients/[id]/results.ts",
]) {
  const apiSource = source(patientApiPath);
  assert.doesNotMatch(apiSource, /SELECT[^;]*(?:score|interpretation)/i);
}

console.log(
  "✓ Entrega de escalas: perguntas + respostas integrais, sem cálculo ou análise.",
);
