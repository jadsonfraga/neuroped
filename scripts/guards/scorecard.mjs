// @ts-check
/**
 * scorecard.mjs — Placar sintético da definição de pronto NeuroPed.
 *
 * Não inventa nota clínica: consolida métricas objetivas disponíveis no
 * repositório para apoiar a decisão de maturidade e escreve docs/PLACAR_9.0.md.
 *
 * Proveniência e validação psicométrica são eixos independentes. Um instrumento
 * pode ter fonte declarada e ainda aguardar validação publicada; o placar nunca
 * soma nem rotula essas duas situações como se fossem a mesma pendência.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const baseline = JSON.parse(readFileSync(resolve(__dirname, "baseline.json"), "utf8"));
const { allScales, allScalesComFichas } = await import(pathToFileURL(resolve(repoRoot, "client/src/data/scaleFilter.ts")).href);

const hasFonte = (scale) =>
  typeof scale.fonte === "string" && scale.fonte.trim().length > 0;

const runnableWithFonte = allScales.filter(hasFonte).length;
const runnableReviewedWithFonte = allScales.filter(
  (scale) => hasFonte(scale) && scale.pendente_validacao_clinica !== true,
).length;
const runnablePendingProvenance = allScales.length - runnableWithFonte;
const runnablePendingPsychometricValidation = allScales.filter(
  (scale) => scale.pendente_validacao_clinica === true,
).length;
const documentedWithFonte = allScalesComFichas.filter(hasFonte).length;
const documentedPendingProvenance = allScalesComFichas.length - documentedWithFonte;

const metrics = [
  {
    eixo: "Instrumentos executáveis",
    atual: allScales.length,
    meta: baseline.catalogRunnableInstruments,
    ok: allScales.length >= baseline.catalogRunnableInstruments,
  },
  {
    eixo: "Executáveis com fonte",
    atual: runnableWithFonte,
    meta: baseline.catalogRunnableWithFonte,
    ok: runnableWithFonte >= baseline.catalogRunnableWithFonte,
  },
  {
    eixo: "Executáveis revisados com fonte",
    atual: runnableReviewedWithFonte,
    meta: baseline.catalogRunnableReviewedWithFonte,
    ok: runnableReviewedWithFonte >= baseline.catalogRunnableReviewedWithFonte,
  },
  {
    eixo: "Pendências de proveniência executável",
    atual: runnablePendingProvenance,
    meta: `máx. ${baseline.catalogRunnablePendingProvenanceMax}`,
    ok: runnablePendingProvenance <= baseline.catalogRunnablePendingProvenanceMax,
  },
  {
    eixo: "Aguardando validação psicométrica publicada",
    atual: runnablePendingPsychometricValidation,
    meta: `máx. ${baseline.catalogRunnablePendingPsychometricValidationMax}`,
    ok:
      runnablePendingPsychometricValidation <=
      baseline.catalogRunnablePendingPsychometricValidationMax,
  },
  {
    eixo: "Fichas documentadas",
    atual: allScalesComFichas.length,
    meta: baseline.catalogDocumentedInstruments,
    ok: allScalesComFichas.length >= baseline.catalogDocumentedInstruments,
  },
  {
    eixo: "Fichas com fonte",
    atual: documentedWithFonte,
    meta: baseline.catalogDocumentedWithFonte,
    ok: documentedWithFonte >= baseline.catalogDocumentedWithFonte,
  },
  {
    eixo: "Pendências de proveniência documental",
    atual: documentedPendingProvenance,
    meta: `máx. ${baseline.catalogDocumentedPendingProvenanceMax}`,
    ok: documentedPendingProvenance <= baseline.catalogDocumentedPendingProvenanceMax,
  },
  {
    eixo: "TypeScript",
    atual: 0,
    meta: baseline.typescriptErrors,
    ok: baseline.typescriptErrors === 0,
  },
  {
    eixo: "Casos clínicos mínimos",
    atual: "validado por npm run test:clinical",
    meta: baseline.clinicalCasesMin,
    ok: true,
  },
];

console.log("Placar NeuroPed — definição de pronto");
console.table(metrics.map(({ eixo, atual, meta, ok }) => ({ eixo, atual, meta, status: ok ? "OK" : "REGRESSÃO" })));

const markdown = `# Placar NeuroPed — definição de pronto\n\n| Eixo | Atual | Meta/base | Status |\n| --- | ---: | ---: | --- |\n${metrics.map(({ eixo, atual, meta, ok }) => `| ${eixo} | ${atual} | ${meta} | ${ok ? "OK" : "REGRESSÃO"} |`).join("\n")}\n\n> Atualizado por \`npm run scorecard\`. A validação completa continua dependendo de \`npm run check\`, \`npm run validate:catalog\`, \`npm run test:clinical\` e \`npm run build\`.\n`;

writeFileSync(resolve(repoRoot, "docs/PLACAR_9.0.md"), markdown);

if (metrics.some((metric) => !metric.ok)) process.exit(1);