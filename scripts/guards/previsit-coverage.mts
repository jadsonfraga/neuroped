/**
 * GUARD guard:previsit-coverage — cobertura do seletor v2 ("sempre 3") e snapshot do v1.
 *  - ratchet: o nº de combinações (idade×queixa×respondente×contexto) com menos de 3 escalas só pode DIMINUIR;
 *  - snapshot v1: o caminho padrão (v1) não pode mudar sem revisão (`--write` regrava; toda mudança aparece no diff da PR).
 * Uso: node --import tsx scripts/guards/previsit-coverage.mts [--write]
 */
import fs from "node:fs";
import { allScales } from "../../client/src/data/scaleFilter.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { noCostWorldScales } from "../../client/src/data/noCostWorldScales.ts";
import { recommendPrevisitV2 } from "../../client/src/lib/previsitSelectorV2.ts";
import { safePrevisitRecommendations } from "../../client/src/lib/preConsultaSafeRanking.ts";

export const GRID_QUEIXAS = ["linguagem", "tea", "tdah", "comportamento", "sono", "ansiedade", "depressao", "trauma", "tiques", "epilepsia", "aprendizagem", "alimentacao", "efeitos", "social", "atraso", "toc", "dor", "pc"];
const RESP = ["pais", "adolescente", "professor"] as const;
const CTX = ["primeira-consulta", "retorno", "avaliacao-escolar", "ajuste-medicacao", "acompanhamento"] as const;
const AGES = [6, 12, 18, 24, 30, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180, 192, 204, 216];

const catalog = mergeFilterableCatalog([...allScales, ...noCostWorldScales]);
const write = process.argv.includes("--write");
const covPath = "tests/fixtures/previsit-v2-coverage-baseline.json";
const snapPath = "tests/fixtures/previsit-v1-snapshot.json";

let total = 0; const incomplete: Record<string, number> = {}; const v1snap: Record<string, string[]> = {};
for (const queixa of GRID_QUEIXAS) for (const respondente of RESP) for (const contexto of CTX) for (const idadeMeses of AGES) {
  if (respondente === "adolescente" && idadeMeses < 96) continue;
  total++;
  const v2 = recommendPrevisitV2(catalog, { idadeMeses, queixa, respondente, contexto });
  if (v2.length < 3) { const k = `${queixa}|${respondente}|${contexto}`; incomplete[k] = (incomplete[k] ?? 0) + 1; }
  if (["tea", "tdah", "sono", "comportamento", "ansiedade", "depressao", "tiques", "epilepsia", "linguagem", "aprendizagem", "trauma", "alimentacao", "efeitos", "social"].includes(queixa)) {
    v1snap[`${queixa}|${respondente}|${contexto}|${idadeMeses}`] = safePrevisitRecommendations(catalog, { idadeMeses, queixa, respondente, contexto }).map((r) => `${r.label}:${r.scale?.id ?? "-"}`);
  }
}
const incompleteCount = Object.values(incomplete).reduce((a, b) => a + b, 0);
if (write) {
  fs.writeFileSync(covPath, JSON.stringify({ total, incompleteCount, incompleteByCombo: incomplete }, null, 1) + "\n");
  fs.writeFileSync(snapPath, JSON.stringify(v1snap, null, 0).replace(/\],"/g, "],\n\"") + "\n");
  console.log(`baseline gravado: ${total} combinações, ${incompleteCount} com <3 escalas.`);
} else {
  const base = JSON.parse(fs.readFileSync(covPath, "utf8"));
  const snap = JSON.parse(fs.readFileSync(snapPath, "utf8"));
  const errors: string[] = [];
  if (total !== base.total) errors.push(`grade mudou (${total} ≠ ${base.total}); regrave com --write e revise.`);
  if (incompleteCount > base.incompleteCount) errors.push(`cobertura regrediu: ${incompleteCount} combinações com <3 escalas (baseline ${base.incompleteCount}).`);
  for (const k of Object.keys(v1snap)) if (JSON.stringify(v1snap[k]) !== JSON.stringify(snap[k])) errors.push(`snapshot v1 divergiu em ${k}: ${JSON.stringify(snap[k])} → ${JSON.stringify(v1snap[k])}`);
  if (errors.length) { console.error("guard:previsit-coverage FALHOU:\n" + errors.slice(0, 30).map((e) => " - " + e).join("\n")); process.exit(1); }
  console.log(`guard:previsit-coverage OK — ${total} combinações; ${incompleteCount} com <3 escalas (baseline ${base.incompleteCount}); snapshot v1 estável (${Object.keys(v1snap).length} casos).`);
  if (incompleteCount < base.incompleteCount) console.log("  (melhorou: regrave o baseline com --write para travar o ganho)");
}
