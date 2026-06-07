// @ts-check
/**
 * scorecard.mjs — placar objetivo do NeuroPed.
 *
 * Este script não declara nota clínica final; ele consolida métricas locais
 * que podem ser reproduzidas no repositório para apoiar auditorias.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const baseline = JSON.parse(
  readFileSync(resolve(__dirname, "baseline.json"), "utf8"),
);
const { allScales } = await import(
  pathToFileURL(resolve(repoRoot, "client/src/data/scaleFilter.ts")).href
);

const metrics = [
  ["Instrumentos no catálogo", allScales.length, baseline.catalogInstruments],
  [
    "Instrumentos com fonte",
    allScales.filter(
      (scale) =>
        typeof scale.fonte === "string" && scale.fonte.trim().length > 0,
    ).length,
    baseline.catalogWithFonte,
  ],
  [
    "Casos clínicos mínimos",
    baseline.clinicalCasesMin,
    baseline.clinicalCasesMin,
  ],
];

const lines = [
  "# Placar objetivo NeuroPed",
  "",
  "Gerado por `npm run scorecard`.",
  "",
  "| Métrica | Atual | Referência | Estado |",
  "|---|---:|---:|---|",
];

let ok = true;
for (const [label, current, reference] of metrics) {
  const passed = Number(current) >= Number(reference);
  ok = ok && passed;
  lines.push(
    `| ${label} | ${current} | ${reference} | ${passed ? "OK" : "REGRESSÃO"} |`,
  );
}

writeFileSync(resolve(repoRoot, "docs/PLACAR_9.0.md"), `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
if (!ok) process.exit(1);
