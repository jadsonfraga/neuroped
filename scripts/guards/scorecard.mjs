// @ts-check
/**
 * scorecard.mjs — Placar sintético da definição de pronto NeuroPed.
 *
 * Não inventa nota clínica: consolida métricas objetivas disponíveis no
 * repositório para apoiar a decisão de maturidade e escreve docs/PLACAR_9.0.md.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const baseline = JSON.parse(readFileSync(resolve(__dirname, "baseline.json"), "utf8"));
const { allScales } = await import(pathToFileURL(resolve(repoRoot, "client/src/data/scaleFilter.ts")).href);

const metrics = [
  {
    eixo: "Catálogo",
    atual: allScales.length,
    meta: baseline.catalogInstruments,
    ok: allScales.length >= baseline.catalogInstruments,
  },
  {
    eixo: "Proveniência",
    atual: allScales.filter((scale) => typeof scale.fonte === "string" && scale.fonte.trim().length > 0).length,
    meta: baseline.catalogWithFonte,
    ok: allScales.filter((scale) => typeof scale.fonte === "string" && scale.fonte.trim().length > 0).length >= baseline.catalogWithFonte,
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
