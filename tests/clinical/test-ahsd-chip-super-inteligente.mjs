// @ts-check
/** Chip "Altas habilidades / super inteligente" no filtro → inventário AH/SD pais. */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(root, rel)).href);
const { allScales, queixas } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const { filterScalesIntelligently, scaleCoversSelectedSignalExactly } = await imp("client/src/data/advancedFilterLogic.ts");
const { inferComplaintIds, filterComplaintOptions } = await imp("client/src/lib/filterClinicalInput.ts");
const { popularSymptomById } = await imp("client/src/data/popularSymptoms.ts");
const { getAllSignalsForQueixa } = await imp("client/src/data/signalsAndSymptoms.ts");
const { getValidFilterSignalIds } = await imp("client/src/data/filterSignalState.ts");

const Q = "altas-habilidades", ID = "ahsd-inventario-pais", SIG = "altas-habilidades-super-inteligente";
let f = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { f++; console.error(`  ❌ ${m}`); } };
const chip = queixas.find((q) => q.id === Q);
ok(chip?.label === "Altas habilidades / super inteligente", "chip com rótulo exato");
const scale = allScales.find((s) => s.id === ID);
ok(scale?.queixas.includes(Q), "inventário pais ligado ao chip");
const catalog = mergeFilterableCatalog(allScales);
const onlyChip = filterScalesIntelligently(catalog, { ageMonths: 96, queixas: [Q], respondente: "pais", selectedSignals: [] });
ok(onlyChip[0]?.scale.id === ID, `só o chip (8 anos, pais): inventário em 1º (${onlyChip[0]?.scale.id})`);
const withSig = filterScalesIntelligently(catalog, { ageMonths: 120, queixas: [Q], respondente: "pais", selectedSignals: [SIG] });
ok(withSig.findIndex((m) => m.scale.id === ID) === 0, "chip + sinal: inventário em 1º");
ok(getAllSignalsForQueixa(Q).some((s) => s.id === SIG), "sinal detalhado presente");
ok(Boolean(popularSymptomById[SIG]), "sintoma popular presente");
ok(getValidFilterSignalIds([Q]).has(SIG), "sinal válido na sessão do filtro");
ok(scaleCoversSelectedSignalExactly(scale, { queixas: [Q], selectedSignals: [SIG] }), "cobertura exata do sinal");
for (const term of ["super inteligente", "superdotado", "altas habilidades", "Superdotada", "AH/SD"]) {
  ok(inferComplaintIds(term, queixas).includes(Q), `busca "${term}" infere o chip`);
  ok(filterComplaintOptions(queixas, term, []).some((q) => q.id === Q), `busca "${term}" lista o chip`);
}
console.log(f ? `❌ CHIP AH/SD FALHOU — ${f}/${n}` : `✅ CHIP AH/SD OK — ${n} verificações passaram.`);
process.exit(f ? 1 : 0);
