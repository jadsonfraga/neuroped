import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  buildScaleResponsePrintHtml,
  buildScaleResponseText,
  formatScaleResponseAnswer,
  responseItemsFromLegacySections,
} from "../../client/src/lib/scaleResponseReport.ts";
import { buildDirectSessionItems } from "../../client/src/lib/directResponseReport.ts";
import { buildPantBlankFormText } from "../../client/src/lib/pantBlankForm.ts";
import {
  pantDomains,
  pantLevelLabels,
  pantScales,
} from "../../client/src/data/pantScales.ts";

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
  /Pontua(?:c|ç)[aã]o|Escore|Classifica(?:c|ç)[aã]o|Interpreta(?:c|ç)[aã]o|An[aá]lise|Ponto de corte|Valor de corte|Cutoff|Percentual|<th[^>]*>Valor<|\bpontos\b/i;
assert.doesNotMatch(text, forbiddenOutput);
assert.doesNotMatch(html, forbiddenOutput);

const directItems = buildDirectSessionItems(
  {
    visual: {
      id: "visual",
      label: "Atenção visual",
      responses: [
        {
          question: "Toque no símbolo-alvo 🦋",
          answer: "Símbolo selecionado: 🐝",
        },
        {
          question: "Toque no símbolo-alvo 🐶",
          answer: "Símbolo selecionado: 🐶",
        },
      ],
    },
    linguagem: {
      id: "linguagem",
      label: "Linguagem",
      responses: [{ question: "Qual palavra rima com PÃO?", answer: "MÃO" }],
    },
  },
  ["visual", "linguagem"],
);

assert.deepEqual(directItems, [
  {
    question: "[Atenção visual · tentativa 1] Toque no símbolo-alvo 🦋",
    answer: "Símbolo selecionado: 🐝",
  },
  {
    question: "[Atenção visual · tentativa 2] Toque no símbolo-alvo 🐶",
    answer: "Símbolo selecionado: 🐶",
  },
  {
    question: "[Linguagem · tentativa 1] Qual palavra rima com PÃO?",
    answer: "MÃO",
  },
]);

const directReportText = buildScaleResponseText({
  scaleName: "Testes Diretos",
  items: directItems,
});
for (const item of directItems) {
  assert.ok(directReportText.includes(item.question));
  assert.ok(directReportText.includes(item.answer));
}
assert.doesNotMatch(directReportText, forbiddenOutput);

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
const scaleFichaSource = source("client/src/components/ScaleFichaPage.tsx");
const directTestsSource = source("client/src/pages/testes-diretos.tsx");
const pantSource = source("client/src/pages/pant.tsx");

assert.match(clinicalReportSource, /props\.items\.map/);
assert.doesNotMatch(
  clinicalReportSource,
  /RadarChart|totalScore|maxScore|domainResults|generateInterpretation/,
);
assert.match(
  clinicalReportSource,
  /shareTextDocument\(\{[\s\S]*?text:\s*reportText,/,
  "compartilhamento deve receber o relatório integral",
);
assert.doesNotMatch(clinicalReportSource, /reportText\.slice/);
assert.doesNotMatch(whatsAppSource, /scoreLine|reportText\.slice|totalScore/);
assert.doesNotMatch(whatsAppSource, /send-whatsapp|authFetch/);
assert.match(whatsAppSource, /window\.open\(whatsappUrl, "_blank"\)/);

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

assert.match(
  scaleFichaSource,
  /import \{ allScalesComFichas \} from "@\/data\/scaleFilter"/,
);
assert.match(
  scaleFichaSource,
  /allScalesComFichas\.find\(\(s\) => s\.id === scaleId\)/,
);
assert.doesNotMatch(
  scaleFichaSource,
  /\ballScales\.find\(/,
  "fichas dedicadas devem encontrar instrumentos documentados sem torná-los aplicáveis",
);

assert.match(directTestsSource, /buildDirectSessionItems\(\s*results/);
assert.match(
  directTestsSource,
  /sessionItems\.length > 0[\s\S]*?<ClinicalReport[\s\S]*?items=\{sessionItems\}/,
  "ações de entrega dos testes diretos só devem existir após uma conclusão",
);
assert.match(directTestsSource, /<Link\s+href=\{test\.route\}/);
assert.doesNotMatch(
  directTestsSource,
  /UNIFIED_TEST_COMPONENTS|SelectedUnifiedComponent/,
  "módulos legados devem abrir em rota dedicada",
);
assert.match(
  directTestsSource,
  /age < minimumAge \|\| age > maximumAge[\s\S]*?return null/,
  "idade fora de 2–19 deve ser rejeitada, não redirecionada para a última faixa",
);
assert.match(
  directTestsSource,
  /const ageIsInvalid = age !== null && selectedAgeBand === null/,
);
assert.match(
  directTestsSource,
  /role="alert"[\s\S]*?Informe uma idade entre 2 e 19 anos/,
);
assert.doesNotMatch(directTestsSource, /Math\.max\(0, Math\.min\(18/);
assert.match(
  directTestsSource,
  /aria-label=\{`Símbolo \$\{a\}, linha \$\{row\}, coluna \$\{column\}`\}/,
  "cada célula visual deve anunciar símbolo e posição únicos",
);
assert.doesNotMatch(directTestsSource, /aria-label="célula"/);
assert.match(
  directTestsSource,
  /aria-label=\{`Figura \$\{a\}\$\{picked\.includes\(a\)/,
  "cada opção de memória visual deve anunciar a figura e seu estado",
);
assert.match(
  directTestsSource,
  /id: "avaliacao-cognitiva-infantil"[\s\S]{0,220}?ageMin: 2,[\s\S]{0,80}?ageMax: 19/,
  "a bateria cognitiva agregada deve preservar sua faixa de 2–19 anos",
);
assert.match(
  directTestsSource,
  /test\.ageMin <= age && test\.ageMax >= age/,
  "o catálogo deve filtrar pela idade exata, não pela mera sobreposição da faixa",
);
for (const [id, min, max] of [
  ["testes-reconhecimento", 2, 7],
  ["linguagem-fonologia", 3, 10],
  ["motricidade-teste", 2, 9],
  ["escrita-desenho", 3, 11],
  ["conhecimento-visual", 4, 11],
  ["conhecimentos-gerais", 5, 12],
  ["atencao-concentracao", 4, 12],
  ["funcoes-executivas", 4, 12],
  ["memoria-teste", 3, 12],
  ["processamento-visuoauditivo", 4, 12],
  ["academico-interativo", 6, 14],
  ["testes-academicos", 5, 14],
  ["tde2", 4, 14],
]) {
  assert.match(
    directTestsSource,
    new RegExp(`id: "${id}"[\\s\\S]{0,220}?ageMin: ${min},[\\s\\S]{0,80}?ageMax: ${max}`),
    `${id} deve anunciar exatamente ${min}–${max} anos`,
  );
}
assert.doesNotMatch(directTestsSource, forbiddenOutput);

assert.match(pantSource, /if \(!allAnswered\) return;/);
assert.match(
  pantSource,
  /if \(showResult\)[\s\S]*?<ClinicalReport[\s\S]*?items=\{responseItems\}/,
  "PANT deve oferecer o relatório integral somente no resultado concluído",
);
assert.match(pantSource, /<SaveToPatient[^>]*responses=\{responseItems\}/);
assert.match(
  pantSource,
  /buildPantBlankFormText\(\s*pantScales,\s*pantDomains,\s*pantLevelLabels,?\s*\)/,
);
assert.match(pantSource, /data-testid="button-print-pant-blank"/);
assert.doesNotMatch(pantSource, /hidden print:block/);
const pantBlankHandlerStart = pantSource.indexOf(
  "function handlePrintBlankForm",
);
const pantBlankHandlerEnd = pantSource.indexOf(
  "function domainProgress",
  pantBlankHandlerStart,
);
assert.ok(
  pantBlankHandlerStart >= 0 && pantBlankHandlerEnd > pantBlankHandlerStart,
);
assert.doesNotMatch(
  pantSource.slice(pantBlankHandlerStart, pantBlankHandlerEnd),
  /answers|responseItems|ClinicalReport|SaveToPatient/,
  "a impressão em branco deve permanecer independente das respostas preenchidas",
);

const pantBlankForm = buildPantBlankFormText(
  pantScales,
  pantDomains,
  pantLevelLabels,
);
assert.equal(
  pantBlankForm.split("\n").filter((line) => line.startsWith("Resposta: ☐ 0"))
    .length,
  pantScales.length,
  "o formulário em branco deve oferecer uma linha 0–4 para cada item",
);
for (const scale of pantScales) {
  assert.ok(
    pantBlankForm.includes(
      `${String(scale.number).padStart(2, "0")}. ${scale.name}`,
    ),
    `formulário em branco deve conter o item PANT ${scale.number}`,
  );
}
for (const level of [0, 1, 2, 3, 4]) {
  assert.ok(pantBlankForm.includes(`${level} — ${pantLevelLabels[level]}`));
  assert.ok(pantBlankForm.includes(`☐ ${level}`));
}
assert.doesNotMatch(pantBlankForm, forbiddenOutput);
assert.doesNotMatch(pantBlankForm, /Resposta:\s*[0-4]\b/);
const pantResultStart = pantSource.indexOf("if (showResult)");
const pantResultEnd = pantSource.indexOf("\n  return (", pantResultStart);
assert.ok(pantResultStart >= 0 && pantResultEnd > pantResultStart);
assert.doesNotMatch(
  pantSource.slice(pantResultStart, pantResultEnd),
  forbiddenOutput,
);

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

const centralizedResponseValidation = source("functions/api/_clinicalValidation.ts");
assert.match(centralizedResponseValidation, /code:\s*"RESPONSES_REQUIRED"/);

for (const apiPath of [
  "functions/api/results.ts",
  "functions/api/scales/results.ts",
  "server/routes.ts",
]) {
  const apiSource = source(apiPath);
  assert.ok(
    /RESPONSES_REQUIRED/.test(apiSource) ||
      /normalizeClinicalResponses\([^)]*(?:responses|answers)/.test(apiSource),
    `${apiPath} deve rejeitar ausência da transcrição, diretamente ou pelo validador central`,
  );
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
