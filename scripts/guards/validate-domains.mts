/**
 * GUARD validate:domains — coerência de domínio das escalas oferecidas no filtro.
 *  - toda queixa de uma escala existe no catálogo de queixas;
 *  - `primaryDomain` (quando declarado) é uma das queixas da própria escala;
 *  - escala nova (wave≥1 no registro de licença) declara `primaryDomain` e `overlapGroup`;
 *  - catraca: nº de escalas "amplas" (≥6 queixas) sem `primaryDomain` só pode diminuir (evita vazamento de domínio no seletor).
 */
import fs from "node:fs";
import { allScales, queixas as QUEIXAS } from "../../client/src/data/scaleFilter.ts";
import { noCostWorldScales } from "../../client/src/data/noCostWorldScales.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { getExplicitLicenseRecord } from "../../client/src/data/scaleLicenseRegistry.ts";

const offered = mergeFilterableCatalog([...allScales, ...noCostWorldScales]);
const known = new Set(QUEIXAS.map((q) => q.id));
// Pendência conhecida (monitores autorais recuperados sem queixa no catálogo; nunca casam com queixa alguma). Não pode crescer.
const KNOWN_NO_QUEIXA = new Set(["sdrd12-sdg", "mcri-24-sdg"]);
const errors: string[] = [];
for (const s of offered) {
  if (!s.queixas.length && !KNOWN_NO_QUEIXA.has(s.id)) errors.push(`${s.id}: sem queixa.`);
  for (const q of s.queixas) if (!known.has(q)) errors.push(`${s.id}: queixa desconhecida "${q}".`);
  if (s.primaryDomain && !s.queixas.includes(s.primaryDomain)) errors.push(`${s.id}: primaryDomain "${s.primaryDomain}" fora das queixas da escala.`);
  if ((getExplicitLicenseRecord(s.id)?.wave ?? 0) >= 1 && (!s.primaryDomain || !s.overlapGroup)) errors.push(`${s.id}: escala nova exige primaryDomain e overlapGroup.`);
}
const broadNoPrimary = offered.filter((s) => s.queixas.length >= 6 && !s.primaryDomain).map((s) => s.id).sort();
const path = "tests/fixtures/domains-broad-baseline.json";
if (process.argv.includes("--write")) { fs.writeFileSync(path, JSON.stringify({ count: broadNoPrimary.length, ids: broadNoPrimary }, null, 1) + "\n"); console.log(`baseline: ${broadNoPrimary.length}`); process.exit(0); }
const base = JSON.parse(fs.readFileSync(path, "utf8"));
if (broadNoPrimary.length > base.count) errors.push(`${broadNoPrimary.length} escalas amplas sem primaryDomain (baseline ${base.count}): ${broadNoPrimary.filter((i) => !base.ids.includes(i)).join(", ")}`);
if (errors.length) { console.error(`validate:domains FALHOU (${errors.length}):\n` + errors.slice(0, 40).map((e) => " - " + e).join("\n")); process.exit(1); }
console.log(`validate:domains OK — ${offered.length} escalas; amplas sem primaryDomain ${broadNoPrimary.length} (baseline ${base.count}).`);
