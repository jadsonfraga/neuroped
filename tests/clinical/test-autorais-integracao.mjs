// Integração dos instrumentos autorais: todos alcançáveis no filtro (queixa+idade+respondente+finalidade próprios),
// marcadores de sintoma presentes e fluxogramas (quando citam autorais) resolvendo.
import assert from "node:assert/strict";
import { openScaleSpecs } from "../../client/src/data/openScalesIndex.ts";
import { allScales } from "../../client/src/data/scaleFilter.ts";
import { filterScalesWithClinicalRescue } from "../../client/src/data/advancedFilterLogic.ts";
import { signalFlowcharts } from "../../client/src/data/signalFlowcharts.ts";

const au = openScaleSpecs.filter((s) => s.authorial);
assert.equal(au.length, 49);
for (const s of au) {
  const age = Math.round((s.ageMin + s.ageMax) / 2);
  const ctx = { ageMonths: age, ageBand: { min: age, max: age }, queixas: [s.primaryDomain], respondente: s.respondente[0], assessmentUse: s.assessmentUse === "seguimento" ? "monitorizacao" : s.assessmentUse, isLiterate: s.literacyRequirement === "alfabetizado" ? true : null, isVerbal: null, selectedSignals: [] };
  const hit = filterScalesWithClinicalRescue(allScales, ctx).some((m) => m.scale.id === s.id);
  assert.ok(hit, `${s.id}: não aparece no filtro para ${s.primaryDomain}/${age}m/${s.respondente[0]}`);
  assert.ok(s.signalTags.length >= 3, s.id);
}
const ids = new Set(allScales.map((s) => s.id));
for (const [sig, f] of Object.entries(signalFlowcharts)) for (const t of [...f.branches.map((b) => b.tiers), ...(f.monitoring ? [f.monitoring] : [])]) for (const id of [...t.ouro, ...t.prata, ...t.bronze]) if (id.startsWith("na-")) assert.ok(ids.has(id), `${sig}: ${id}`);
console.log(`✓ ${au.length} autorais alcançáveis no filtro; fluxogramas resolvem; a cobertura de 3 posições da pré-consulta é garantida por guard:previsit-coverage`);
