// @ts-check
/**
 * check-baseline.mjs — Catraca de regressão (Bloco A2).
 *
 * Lê scripts/guards/baseline.json e falha (exit 1) se qualquer métrica
 * mensurável regredir. Roda dentro de `npm run verify`, DEPOIS de:
 *   tsc --noEmit            → garante typescriptErrors = 0
 *   validate-catalog.mjs    → integridade estrutural do catálogo
 *   test-clinical.mjs       → ≥ clinicalCasesMin casos clínicos verdes
 *
 * Aqui guardamos o que essas etapas não cobrem diretamente: o catálogo não
 * pode encolher, perder fontes já declaradas nem aumentar silenciosamente as
 * pendências de validação psicométrica.
 *
 * IMPORTANTE: ausência de fonte (proveniência) e validação psicométrica
 * pendente são eixos independentes e possuem tetos separados.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

const baseline = JSON.parse(readFileSync(resolve(__dirname, "baseline.json"), "utf8"));
const { allScales, allScalesComFichas } = await import(
  pathToFileURL(resolve(repoRoot, "client/src/data/scaleFilter.ts")).href
);

const hasFonte = (scale) =>
  typeof scale.fonte === "string" && scale.fonte.trim().length > 0;

const current = {
  catalogRunnableInstruments: allScales.length,
  catalogRunnableWithFonte: allScales.filter(hasFonte).length,
  catalogRunnableReviewedWithFonte: allScales.filter(
    (s) => hasFonte(s) && s.pendente_validacao_clinica !== true,
  ).length,
  catalogRunnablePendingProvenance: allScales.filter((s) => !hasFonte(s)).length,
  catalogRunnablePendingPsychometricValidation: allScales.filter(
    (s) => s.pendente_validacao_clinica === true,
  ).length,
  catalogDocumentedInstruments: allScalesComFichas.length,
  catalogDocumentedWithFonte: allScalesComFichas.filter(hasFonte).length,
  catalogDocumentedPendingProvenance: allScalesComFichas.filter(
    (s) => !hasFonte(s),
  ).length,
};

/** @type {string[]} */
const regressions = [];
function noLessThan(key) {
  if (typeof baseline[key] !== "number") return;
  if (current[key] < baseline[key]) {
    regressions.push(`${key}: atual ${current[key]} < baseline ${baseline[key]}`);
  }
}

function noMoreThan(currentKey, baselineKey) {
  if (typeof baseline[baselineKey] !== "number") return;
  if (current[currentKey] > baseline[baselineKey]) {
    regressions.push(`${currentKey}: atual ${current[currentKey]} > teto ${baseline[baselineKey]}`);
  }
}

noLessThan("catalogRunnableInstruments");
noLessThan("catalogRunnableWithFonte");
noLessThan("catalogRunnableReviewedWithFonte");
noLessThan("catalogDocumentedInstruments");
noLessThan("catalogDocumentedWithFonte");
noMoreThan("catalogRunnablePendingProvenance", "catalogRunnablePendingProvenanceMax");
noMoreThan(
  "catalogRunnablePendingPsychometricValidation",
  "catalogRunnablePendingPsychometricValidationMax",
);
noMoreThan("catalogDocumentedPendingProvenance", "catalogDocumentedPendingProvenanceMax");

console.log(
  `[baseline] executáveis=${current.catalogRunnableInstruments} (min ${baseline.catalogRunnableInstruments})` +
  ` | executáveis+fonte=${current.catalogRunnableWithFonte} (min ${baseline.catalogRunnableWithFonte})` +
  ` | executáveis revisados+fonte=${current.catalogRunnableReviewedWithFonte} (min ${baseline.catalogRunnableReviewedWithFonte})` +
  ` | sem fonte executável=${current.catalogRunnablePendingProvenance} (máx ${baseline.catalogRunnablePendingProvenanceMax})` +
  ` | validação psicométrica pendente=${current.catalogRunnablePendingPsychometricValidation} (máx ${baseline.catalogRunnablePendingPsychometricValidationMax})` +
  ` | fichas=${current.catalogDocumentedInstruments} (min ${baseline.catalogDocumentedInstruments})` +
  ` | fichas+fonte=${current.catalogDocumentedWithFonte} (min ${baseline.catalogDocumentedWithFonte})` +
  ` | sem fonte documental=${current.catalogDocumentedPendingProvenance} (máx ${baseline.catalogDocumentedPendingProvenanceMax})`,
);

if (regressions.length > 0) {
  console.error(`[baseline] ✗ REGRESSÃO detectada:`);
  for (const r of regressions) console.error(`  ✗ ${r}`);
  console.error(`Se a redução for intencional, atualize scripts/guards/baseline.json.`);
  process.exit(1);
}
console.log("[baseline] ✓ sem regressão.");
