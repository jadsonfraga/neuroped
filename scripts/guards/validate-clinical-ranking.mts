/**
 * GUARD: ranking clínico curado (OURO/PRATA/BRONZE) só referencia escalas que
 * ABREM, marcadas com a queixa e com faixa etária sobreposta à regra.
 *
 * Falha o build se alguma regra apontar para um instrumento que não abre
 * (ficha-only) ou inconsistente — protege o invariante "só recomendamos o que
 * o usuário consegue de fato aplicar".
 */
import { allScales } from "../../client/src/data/scaleFilter.ts";
import { interactiveScaleItems } from "../../client/src/data/interactiveScaleItems.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { clinicalRanking } from "../../client/src/data/clinicalRanking.ts";
import { opbParentCopy } from "../../client/src/data/opbParentCopy.ts";

const ITEMS = new Set(Object.keys(interactiveScaleItems));
const dedicated = (r?: string) =>
  !!r && !r.startsWith("/generic-scale/") && r !== "/escalas-neuropsiquiatria" && r !== "/filtro";
const opensAsUsableTool = (s: any) => dedicated(s.appRoute) || ITEMS.has(s.id);

const catalog = mergeFilterableCatalog(allScales).filter(opensAsUsableTool);
const byId = new Map(catalog.map((s) => [s.id, s]));

const errors: string[] = [];
let refs = 0;

for (const rule of clinicalRanking) {
  if (rule.ageMin >= rule.ageMax) errors.push(`[${rule.queixa} ${rule.ageMin}-${rule.ageMax}] faixa inválida`);
  for (const seal of ["ouro", "prata", "bronze"] as const) {
    const id = rule[seal];
    if (!id) continue;
    refs++;
    const tag = `[${rule.queixa} ${rule.ageMin}-${rule.ageMax}m ${seal}=${id}]`;
    const scale = byId.get(id);
    if (!scale) { errors.push(`${tag} NÃO abre (ausente do catálogo usável)`); continue; }
    if (!scale.queixas?.includes(rule.queixa)) errors.push(`${tag} não está marcada com a queixa "${rule.queixa}"`);
    const overlaps = scale.ageMax >= rule.ageMin && scale.ageMin <= rule.ageMax;
    if (!overlaps) errors.push(`${tag} faixa do instrumento (${scale.ageMin}-${scale.ageMax}m) não sobrepõe a regra`);
  }
}

// Todo id com texto curado (opbParentCopy) precisa existir no catálogo usável.
for (const id of Object.keys(opbParentCopy)) {
  if (!byId.has(id)) errors.push(`[opbParentCopy ${id}] id não abre / inexistente no catálogo usável`);
}

if (errors.length) {
  console.error(`[validate-clinical-ranking] ✗ ${errors.length} problema(s):`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(`[validate-clinical-ranking] ✓ ${clinicalRanking.length} regras, ${refs} referências — todas abrem, marcadas e na faixa.`);
