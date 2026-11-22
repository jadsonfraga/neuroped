/**
 * Âncora de condição no Filtro: instrumento de epilepsia só entra pela queixa
 * secundária (sono, ansiedade, aprendizagem, atraso, depressão) quando epilepsia
 * também está marcada. Cenários sintéticos, sem dado de paciente.
 */
import assert from "node:assert/strict";
import { allScales } from "../../client/src/data/scaleFilter.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { filterScalesWithClinicalRescue, outsideConditionAnchor } from "../../client/src/data/advancedFilterLogic.ts";
import { selectCuratedTiers, selectPodium } from "../../client/src/data/filterPodium.ts";

const catalog = mergeFilterableCatalog(allScales);
const candidates = (queixas: string[], ageMonths: number) =>
  filterScalesWithClinicalRescue(catalog, { queixas, ageMonths, ageBand: null, respondente: null, selectedSignals: [] } as never)
    .map((m) => m.scale.id);
const podium = (queixas: string[], ageMonths: number) => {
  const matches = filterScalesWithClinicalRescue(catalog, { queixas, ageMonths, ageBand: null, respondente: null, selectedSignals: [] } as never);
  const curated = selectCuratedTiers(queixas, ageMonths, new Map(matches.map((m) => [m.scale.id, m])), null, null);
  const p = selectPodium(matches, curated, { selectedQueixas: queixas, ageMonths, selectedSignals: [], ageBand: null });
  return [p.ouro, p.prata, p.bronze].filter(Boolean).map((m) => m!.scale.id);
};
const isEpilepsyBattery = (id: string) => id.startsWith("ipn-epi-seg-");

// Queixa secundária sozinha: nenhum instrumento de epilepsia.
for (const [queixa, age] of [["sono", 15], ["ansiedade", 9], ["aprendizagem", 96], ["atraso", 30]] as const) {
  const ids = candidates([queixa], age);
  assert.ok(!ids.some(isEpilepsyBattery), `${queixa} aos ${age} m não traz bateria de epilepsia: ${ids.filter(isEpilepsyBattery).join(", ")}`);
}
assert.ok(!candidates(["depressao"], 168).includes("nddie"), "NDDI-E (depressão na epilepsia) não entra sem epilepsia");

// Sono aos 15 meses: instrumento de sono e do bebê no lugar da anamnese de epilepsia.
const sleep = podium(["sono"], 15);
assert.ok(sleep.includes("bisq"), `sono aos 15 meses mantém a BISQ: ${sleep.join(", ")}`);
assert.ok(!sleep.some(isEpilepsyBattery), `sono aos 15 meses sem bateria de epilepsia: ${sleep.join(", ")}`);

// Com epilepsia marcada, a bateria volta e cobre as duas queixas.
const both = candidates(["sono", "epilepsia"], 15);
assert.ok(both.includes("ipn-epi-seg-anamnese-20"), "sono + epilepsia mantém a anamnese IPN-EPI/SEG");
assert.ok(candidates(["epilepsia"], 120).some(isEpilepsyBattery), "epilepsia mantém a bateria");

// Domínios que acompanham a condição continuam abertos.
assert.ok(candidates(["pc"], 6).includes("hine"), "HINE continua disponível para PC");
assert.ok(candidates(["neonatal"], 2).includes("hine"), "HINE continua disponível para neonatal");
assert.ok(candidates(["efeitos"], 120).includes("na-efeitos-antiepilepticos-pais"), "efeitos dos antiepilépticos continua para efeitos");

// Contrato da função pura.
const epi = catalog.find((s) => s.id === "ipn-epi-seg-anamnese-20")!;
assert.equal(outsideConditionAnchor(epi, ["sono"]), true);
assert.equal(outsideConditionAnchor(epi, ["sono", "epilepsia"]), false);
assert.equal(outsideConditionAnchor(epi, []), false, "sem queixa marcada, a âncora não bloqueia");

console.log("[filter-condition-anchor] OK: epilepsia ancorada; sono, ansiedade, aprendizagem, atraso e depressão sozinhos não trazem instrumento de epilepsia");
