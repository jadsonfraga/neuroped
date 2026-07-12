/**
 * GUARD: fluxogramas por sinal (signalFlowcharts) — os ids que o card "OPB
 * Estruturado" pode SELECIONAR precisam SEMPRE resolver no conjunto que o
 * resolvedor do filtro alcança (catálogo filtrável canônico + escalas mundiais
 * + allScales). Sem isto, um selo curado que aponta para um id só-psicoeducação
 * ou inexistente ficava irresolúvel e sumia o card inteiro para queixas/idades
 * inteiras — silenciosamente (bug caçado em 2026-07).
 *
 * `getClinicalTiers` dá PRECEDÊNCIA ao fluxograma; validar só o clinicalRanking
 * (validate-clinical-ranking) não cobria este caminho. Aqui simulamos a mesma
 * seleção e resolução do runtime.
 */
import { allScales } from "../../client/src/data/scaleFilter.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { noCostWorldScales } from "../../client/src/data/noCostWorldScales.ts";
import { signalFlowcharts } from "../../client/src/data/signalFlowcharts.ts";
import { getClinicalTiers } from "../../client/src/data/clinicalRanking.ts";

// Conjunto EXATO que o resolvedor OPB alcança (filtro.tsx):
//   catalogById ?? coreFilterableById ?? allScalesById
// coreFilterableById = mergeFilterableCatalog(allScales) já contém allScales;
// catalogById acrescenta escalas mundiais preenchíveis → incluímos o mundo todo
// como super-conjunto seguro (não deixa passar id ausente do runtime).
const reachable = new Set<string>([
  ...mergeFilterableCatalog(allScales).map((s) => s.id),
  ...noCostWorldScales.map((s) => s.id),
]);

const errors: string[] = [];
let branchesChecked = 0;
let rawIdsChecked = 0;

for (const [signal, flow] of Object.entries(signalFlowcharts)) {
  // 1) Varredura crua: TODO id em qualquer tier de qualquer ramo (+ monitoring)
  //    deve existir no runtime — pega typos e ids removidos do catálogo.
  const tierSets = [...flow.branches.map((b) => b.tiers), ...(flow.monitoring ? [flow.monitoring] : [])];
  for (const tiers of tierSets) {
    for (const seal of ["ouro", "prata", "bronze"] as const) {
      for (const id of tiers[seal]) {
        rawIdsChecked++;
        if (!reachable.has(id)) {
          errors.push(`[${signal} ${seal}=${id}] id não existe no catálogo do runtime (typo ou removido)`);
        }
      }
    }
  }

  // 2) Simulação do card OPB: para cada ramo (idade = ponto médio) o trio
  //    OURO/PRATA/BRONZE selecionado por getClinicalTiers deve resolver — do
  //    contrário o card some para aquela queixa+idade.
  const ages = [null, ...flow.branches.map((b) => Math.floor((b.minMonths + b.maxMonths) / 2))];
  for (const age of ages) {
    const rule = getClinicalTiers(signal, age);
    if (!rule || !rule.prata || !rule.bronze) continue; // card só exige trio completo
    branchesChecked++;
    const label = `[${signal} @${age ?? "sem idade"}m]`;
    for (const seal of ["ouro", "prata", "bronze"] as const) {
      const id = rule[seal];
      if (id && !reachable.has(id)) {
        errors.push(`${label} selo ${seal}=${id} NÃO resolve → card OPB sumiria`);
      }
    }
  }
}

if (errors.length) {
  console.error(`[validate-signal-flowcharts] ✗ ${errors.length} problema(s):`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(
  `[validate-signal-flowcharts] ✓ ${Object.keys(signalFlowcharts).length} fluxogramas, ` +
    `${rawIdsChecked} ids de tier, ${branchesChecked} resoluções OPB — todos resolvem no runtime.`,
);
