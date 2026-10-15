// @ts-check
/** Onda 1 — SWYC (marcos x12, BPSC, PPSC) e AIMS: registro, licença, itens oficiais, pontuação e honestidade. */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);
const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { noCostWorldScales } = await imp("client/src/data/noCostWorldScales.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const { interactiveScaleItems, makeInteractiveConfig } = await imp("client/src/data/interactiveScaleItems.ts");
const { getImplementationStatus } = await imp("client/src/data/advancedFilterLogic.ts");
const { getExplicitLicenseRecord } = await imp("client/src/data/scaleLicenseRegistry.ts");
const { INTERACTIVE_SCALE_IDS } = await imp("client/src/data/interactiveScaleIds.generated.ts");
let failures = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { failures++; console.error(`  ❌ ${m}`); } };

const forms = [2, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60];
const ids = [...forms.map((f) => `swyc-marcos-${f}m`), "swyc-bpsc", "swyc-ppsc"];
const offered = new Map(mergeFilterableCatalog([...allScales, ...noCostWorldScales]).map((s) => [s.id, s]));
const FAIXAS = { 2: [1, 3], 4: [4, 5], 6: [6, 8], 9: [9, 11], 12: [12, 14], 15: [15, 17], 18: [18, 22], 24: [23, 28], 30: [29, 34], 36: [35, 46], 48: [47, 58], 60: [59, 65] };
const CORTE_12M = { 12: 12, 13: 13, 14: 14 };

for (const id of ids) {
  const s = allScales.find((x) => x.id === id);
  const def = interactiveScaleItems[id];
  ok(Boolean(s) && Boolean(def), `${id}: catálogo + aplicação`);
  ok(INTERACTIVE_SCALE_IDS.has(id), `${id}: manifesto`);
  ok(s && getImplementationStatus(s) === "complete", `${id}: implementação completa`);
  ok(offered.has(id), `${id}: oferecida no filtro`);
  const lic = getExplicitLicenseRecord(id);
  ok(lic && lic.basis === "verified_official_source" && lic.softwareAllowed === true && lic.sourceUrl && lic.verifiedOn && lic.attribution && lic.wave === 1, `${id}: licença verificada, com fonte/data/atribuição`);
  ok(s?.licencaUso === "livre" && !s?.suicideRiskInstrument && !s?.psychosisRiskInstrument, `${id}: licença livre e sem risco suicida/psicose`);
  ok(Boolean(s?.fonte) && Boolean(s?.validacaoBrasil) && Boolean(s?.scoringCutoff), `${id}: proveniência declarada`);
  ok(/sem valida/i.test(s?.validacaoBrasil ?? ""), `${id}: ausência de validação psicométrica declarada`);
}
for (const f of forms) {
  const s = allScales.find((x) => x.id === `swyc-marcos-${f}m`);
  const [a, b] = FAIXAS[f];
  ok(s.ageMin === a && s.ageMax === b, `swyc-marcos-${f}m: janela etária ${a}–${b} m`);
  const def = interactiveScaleItems[s.id];
  ok(def.domains[0].items.length === 10, `${s.id}: 10 itens`);
  const cfg = makeInteractiveConfig(s, def);
  const all2 = Object.fromEntries(def.domains[0].items.map((_, i) => [`0-${i}`, 2]));
  const r = cfg.onCalculate(all2);
  ok(r.total === 20, `${s.id}: total máximo 20`);
  ok(!/atraso|alterad/i.test(r.classification), `${s.id}: sem classificação automática`);
  if (f === 2 || f === 60) ok(/NÃO há ponto de corte/.test(s.scoringCutoff), `${s.id}: sem corte (conforme Manual)`);
  else ok(/Ponto de corte oficial/.test(s.scoringCutoff), `${s.id}: corte oficial documentado`);
}
ok(/12 m: 12; 13 m: 13; 14 m: 14/.test(allScales.find((x) => x.id === "swyc-marcos-12m").scoringCutoff), "cortes 12/13/14 m conforme planilha oficial");
// Janelas contíguas 1–65 m, sem sobreposição
const sorted = forms.map((f) => allScales.find((x) => x.id === `swyc-marcos-${f}m`)).sort((x, y) => x.ageMin - y.ageMin);
ok(sorted.every((s, i) => i === 0 || s.ageMin === sorted[i - 1].ageMax + 1), "janelas SWYC contíguas sem sobreposição");

// BPSC: ≥3 em QUALQUER subescala
{
  const s = allScales.find((x) => x.id === "swyc-bpsc"); const def = interactiveScaleItems[s.id]; const cfg = makeInteractiveConfig(s, def);
  ok(def.domains.length === 3 && def.domains.every((d) => d.items.length === 4), "BPSC: 3 subescalas de 4 itens");
  const mk = (arr) => Object.fromEntries(arr.flatMap((v, d) => [0, 1, 2, 3].map((i) => [`${d}-${i}`, v[i] ?? 0])).map((x) => x));
  const lowAll = cfg.onCalculate(mk([[1, 1, 0, 0], [1, 1, 0, 0], [1, 1, 0, 0]]));
  ok(/Abaixo/.test(lowAll.classification), "BPSC: 2 em cada subescala (<3) → abaixo do corte");
  const one = cfg.onCalculate(mk([[2, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]));
  ok(/Em risco/.test(one.classification) && one.domainResults[0].score === 3, "BPSC: 3 em uma subescala → em risco");
}
// PPSC: total ≥9
{
  const s = allScales.find((x) => x.id === "swyc-ppsc"); const def = interactiveScaleItems[s.id]; const cfg = makeInteractiveConfig(s, def);
  ok(def.domains[0].items.length === 18, "PPSC: 18 itens");
  const mk = (n) => Object.fromEntries(Array.from({ length: 18 }, (_, i) => [`0-${i}`, i < n ? 1 : 0]));
  ok(/Abaixo/.test(cfg.onCalculate(mk(8)).classification), "PPSC: 8 → abaixo do corte");
  ok(/Em risco/.test(cfg.onCalculate(mk(9)).classification), "PPSC: 9 → em risco");
}
console.log(`test-open-scales-wave1: ${checks - failures}/${checks} verificações`);
if (failures) process.exit(1);
