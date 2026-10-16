/**
 * GUARD guard:previsit-coverage — pré-consulta "sempre três" (grade idade×queixa×respondente×contexto).
 *  - v2 (padrão) deve devolver 3 posições com instrumento em TODA combinação com ao menos 3 instrumentos seguros possíveis;
 *  - paridade: onde o v1 já tinha uma posição, o v2 mantém exatamente a mesma escolha (só preenche o que faltava);
 *  - ratchet: combinações incompletas no v2 só podem diminuir.
 * Uso: node --import tsx scripts/guards/previsit-coverage.mts [--write] [--report]
 */
import fs from "node:fs";
import { allScales } from "../../client/src/data/scaleFilter.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { noCostWorldScales } from "../../client/src/data/noCostWorldScales.ts";
import { safePrevisitRecommendations, PREVISIT_POSITIONS } from "../../client/src/lib/preConsultaSafeRanking.ts";

export const GRID_QUEIXAS = ["linguagem", "tea", "tdah", "comportamento", "sono", "ansiedade", "depressao", "trauma", "tiques", "epilepsia", "aprendizagem", "alimentacao", "efeitos", "social", "atraso", "toc", "dor", "pc"];
const RESP = ["pais", "adolescente", "professor"] as const;
const CTX = ["primeira-consulta", "retorno", "avaliacao-escolar", "ajuste-medicacao", "acompanhamento"] as const;
const AGES = [6, 12, 18, 24, 30, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180, 192, 204, 216];
const catalog = mergeFilterableCatalog([...allScales, ...noCostWorldScales]);
const covPath = "tests/fixtures/previsit-v2-coverage-baseline.json";
const positions = (rows: ReturnType<typeof safePrevisitRecommendations>) => rows.filter((r) => (PREVISIT_POSITIONS as readonly string[]).includes(r.label));

let total = 0; const incompleteV1: string[] = []; const incompleteV2: string[] = []; const parity: string[] = [];
for (const queixa of GRID_QUEIXAS) for (const respondente of RESP) for (const contexto of CTX) for (const idadeMeses of AGES) {
  if (respondente === "adolescente" && idadeMeses < 96) continue;
  total++;
  const input = { idadeMeses, queixa, respondente, contexto };
  const v1 = positions(safePrevisitRecommendations(catalog, input)); const v2 = positions(safePrevisitRecommendations(catalog, input, { fill: true }));
  const key = `${queixa}|${respondente}|${contexto}|${idadeMeses}`;
  const n1 = v1.filter((r) => r.scale).length, n2 = v2.filter((r) => r.scale).length;
  if (n1 < 3) incompleteV1.push(key);
  if (n2 < 3) incompleteV2.push(key);
  for (let i = 0; i < n1; i++) if (v1[i].scale?.id !== v2[i]?.scale?.id) { parity.push(`${key} pos${i + 1}: ${v1[i].scale?.id} → ${v2[i]?.scale?.id}`); break; }
  if (n2 > 3 || new Set(v2.filter((r) => r.scale).map((r) => r.scale!.id)).size !== n2) parity.push(`${key}: repetição/excesso`);
}
if (process.argv.includes("--report")) { console.log(incompleteV2.join("\n")); }
if (process.argv.includes("--write")) {
  fs.writeFileSync(covPath, JSON.stringify({ total, v1Incomplete: incompleteV1.length, v2Incomplete: incompleteV2.length, v2IncompleteKeys: incompleteV2 }, null, 1) + "\n");
  console.log(`baseline gravado: ${total} combinações; v1 incompletas ${incompleteV1.length}; v2 incompletas ${incompleteV2.length}.`);
} else {
  const base = JSON.parse(fs.readFileSync(covPath, "utf8")); const errors: string[] = [];
  if (total !== base.total) errors.push(`grade mudou (${total} ≠ ${base.total}); regrave com --write e revise.`);
  if (incompleteV2.length > base.v2Incomplete) errors.push(`cobertura regrediu: ${incompleteV2.length} combinações incompletas (baseline ${base.v2Incomplete}).`);
  errors.push(...parity.slice(0, 20));
  if (errors.length) { console.error("guard:previsit-coverage FALHOU:\n" + errors.map((e) => " - " + e).join("\n")); process.exit(1); }
  console.log(`guard:previsit-coverage OK — ${total} combinações; v1 incompletas ${incompleteV1.length}; v2 incompletas ${incompleteV2.length} (baseline ${base.v2Incomplete}); paridade v1⊂v2 preservada.`);
}
