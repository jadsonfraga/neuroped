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
 * pode encolher (perda de instrumentos ou de proveniência declarada).
 *
 * Lighthouse/axe ficam como null no baseline (sem browser headless no CI);
 * quando passarem a ser medidos, preencher e este script passa a compará-los.
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

const current = {
  catalogRunnableInstruments: allScales.length,
  catalogRunnableReviewedWithFonte: allScales.filter((s) => {
    const hasFonte = typeof s.fonte === "string" && s.fonte.trim().length > 0;
    return hasFonte && s.pendente_validacao_clinica !== true;
  }).length,
  catalogDocumentedInstruments: allScalesComFichas.length,
  catalogDocumentedWithFonte: allScalesComFichas.filter(
    (s) => typeof s.fonte === "string" && s.fonte.trim().length > 0,
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

noLessThan("catalogRunnableInstruments");
noLessThan("catalogRunnableReviewedWithFonte");
noLessThan("catalogDocumentedInstruments");
noLessThan("catalogDocumentedWithFonte");

console.log(
  `[baseline] executáveis=${current.catalogRunnableInstruments} (min ${baseline.catalogRunnableInstruments})` +
  ` | executáveis revisados+fonte=${current.catalogRunnableReviewedWithFonte} (min ${baseline.catalogRunnableReviewedWithFonte})` +
  ` | fichas=${current.catalogDocumentedInstruments} (min ${baseline.catalogDocumentedInstruments})` +
  ` | fichas+fonte=${current.catalogDocumentedWithFonte} (min ${baseline.catalogDocumentedWithFonte})`,
);

if (regressions.length > 0) {
  console.error(`[baseline] ✗ REGRESSÃO detectada:`);
  for (const r of regressions) console.error(`  ✗ ${r}`);
  console.error(`Se a redução for intencional, atualize scripts/guards/baseline.json.`);
  process.exit(1);
}
console.log("[baseline] ✓ sem regressão.");
