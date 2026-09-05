import "./test-authorial-sdg-core.mjs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { authorialSdgRegistry, buildSdgPublicManifest } from "../../client/src/data/authorialSdgRegistry.ts";
import { allScales } from "../../client/src/data/scaleFilter.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { filterScalesIntelligently } from "../../client/src/data/advancedFilterLogic.ts";
import { interactiveScaleItems, makeInteractiveConfig } from "../../client/src/data/interactiveScaleItems.ts";
import { INTERACTIVE_SCALE_IDS, INTERACTIVE_SCALE_ITEM_COUNTS } from "../../client/src/data/interactiveScaleIds.generated.ts";

const catalog = mergeFilterableCatalog(allScales);
const run = (context) => filterScalesIntelligently(catalog, { queixas: [], selectedSignals: [], ...context });
let filterChecks = 0;
for (const instrument of authorialSdgRegistry) {
  const id = instrument.id;
  const entry = allScales.find((scale) => scale.id === id);
  const definition = interactiveScaleItems[id];
  assert.ok(entry && definition, `${id}: presente no caminho real do aplicativo`);
  assert.equal(allScales.filter((s) => s.id === id).length, 1);
  assert.equal(catalog.filter((s) => s.id === id).length, 1);
  const count = instrument.domains.reduce((sum, domain) => sum + domain.items.length, 0);
  assert.ok(INTERACTIVE_SCALE_IDS.has(id), `${id}: manifesto de rotas atualizado`);
  assert.equal(INTERACTIVE_SCALE_ITEM_COUNTS[id], count);
  const config = makeInteractiveConfig(entry, definition);
  const answers = (option) => Object.fromEntries(definition.domains.flatMap((domain, di) => domain.items.map((_, ii) => [`${di}-${ii}`, option])));
  for (const option of [0, 1, 2, 3]) {
    const result = config.onCalculate(answers(option));
    assert.equal(result.total, option * count, `${id}: cálculo REAL do aplicativo`);
    assert.match(result.classification, /sem ponto de corte validado/);
    assert.deepEqual(result.domainResults.map((d) => d.score), definition.domains.map((d) => d.items.length * option));
    for (const alert of instrument.alerts) assert.ok(result.description.includes(alert));
  }
  // Cada idade e respondente permitido: sem promoção artificial no ranking.
  for (let age = entry.ageMin; age <= entry.ageMax; age++) {
    for (const respondent of entry.respondente) {
      const results = run({ ageMonths: age, queixas: [entry.queixas[0]], respondente: respondent, assessmentUse: "monitorizacao" });
      assert.ok(results.some((match) => match.scale.id === id), `${id}: ausente aos ${age} meses / ${respondent}`);
      filterChecks++;
    }
  }
  for (const age of [entry.ageMin - 1, entry.ageMax + 1]) {
    assert.ok(!run({ ageMonths: age, queixas: [entry.queixas[0]], respondente: "pais", assessmentUse: "monitorizacao" }).some((match) => match.scale.id === id), `${id}: não extrapolar faixa sugerida`);
    filterChecks++;
  }
  for (const respondent of ["autoaplicavel", "teste_direto_crianca", "clinico", ...(!entry.respondente.includes("professor") ? ["professor"] : [])]) {
    assert.ok(!run({ ageMonths: entry.ageMin, queixas: [entry.queixas[0]], respondente: respondent, assessmentUse: "monitorizacao" }).some((match) => match.scale.id === id), `${id}: respondente inadequado`);
    filterChecks++;
  }
  assert.ok(!run({ ageMonths: entry.ageMin, queixas: [entry.queixas[0]], assessmentUse: "diagnostico" }).some((match) => match.scale.id === id), `${id}: não é instrumento diagnóstico`);
  for (const complaint of ["suicidio", "psicose", "epilepsia"]) {
    assert.ok(!run({ ageMonths: entry.ageMax, queixas: [complaint], assessmentUse: "monitorizacao" }).some((match) => match.scale.id === id), `${id}: não oferece falsa cobertura para ${complaint}`);
    filterChecks++;
  }
}
const publicManifest = JSON.parse(readFileSync(new URL("../../client/public/authorial-sdg-manifest.json", import.meta.url), "utf8"));
assert.deepEqual(publicManifest, buildSdgPublicManifest());
console.log(`[SDG integration] ${filterChecks} cenários de filtro, cálculo real, rotas e manifesto público aprovados.`);
