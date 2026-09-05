import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allScales, filterScales } from "../../client/src/data/scaleFilter.ts";
import { filterScalesIntelligently } from "../../client/src/data/advancedFilterLogic.ts";
import { makeInteractiveConfig } from "../../client/src/data/interactiveScaleItems.ts";
import { authorialMonitoringRecords, authorialMonitoringCatalog, authorialMonitoringItems, validateMonitoringRecords } from "../../client/src/data/authorialMonitoring.ts";

const expected = {
  "afi12-sdg": { min: 60, max: 215, complaint: "tdah", respondents: ["pais", "professor"], domainSizes: [6, 6] },
  "sdrd12-sdg": { min: 36, max: 215, complaint: "sono", respondents: ["pais"], domainSizes: [4, 4, 4] },
  "sarf12-sdg": { min: 24, max: 179, complaint: "alimentacao", respondents: ["pais"], domainSizes: [4, 4, 4] },
};
let checks = 0;
for (const [id, e] of Object.entries(expected)) {
  const r = authorialMonitoringRecords.find((r) => r.id === id);
  const entry = authorialMonitoringCatalog.find((r) => r.id === id);
  assert.ok(r && entry, id); checks++;
  assert.equal(r.timeframeDays, 7); checks++;
  assert.deepEqual([entry.ageMin, entry.ageMax], [e.min, e.max]); checks++;
  assert.equal(allScales.filter((s) => s.id === id).length, 1); checks++;
  assert.equal(entry.prioridade, "monitorizacao"); checks++;
  assert.equal(entry.assessmentUse, "monitorizacao"); checks++;
  assert.equal(entry.licencaUso, "autoral"); checks++;
  assert.deepEqual(r.domains.map((d) => d.itemIds.length), e.domainSizes); checks++;
  const def = authorialMonitoringItems[id];
  assert.equal(def.domains.flatMap((d) => d.items).length, 12); checks++;
  assert.equal(def.bands.length, 1); checks++;
  for (const age of [e.min, e.max]) {
    assert.ok(filterScales([e.complaint], { min: age, max: age }).some((s) => s.id === id)); checks++;
    for (const respondent of e.respondents) {
      const matches = filterScalesIntelligently(allScales, { queixas: [e.complaint], ageMonths: age, respondente: respondent, assessmentUse: "monitorizacao", selectedSignals: [] });
      assert.ok(matches.some((m) => m.scale.id === id), `${id}: idade ${age}, ${respondent}`); checks++;
    }
  }
  for (const age of [e.min - 1, e.max + 1]) {
    const matches = filterScalesIntelligently(allScales, { queixas: [e.complaint], ageMonths: age, respondente: "pais", assessmentUse: "monitorizacao", selectedSignals: [] });
    assert.ok(!matches.some((m) => m.scale.id === id), `${id}: bloqueio fora da idade ${age}`); checks++;
  }
  const wrongComplaint = e.complaint === "sono" ? "alimentacao" : "sono";
  assert.ok(!filterScales([wrongComplaint], { min: e.min, max: e.max }).some((s) => s.id === id)); checks++;
  const config = makeInteractiveConfig(entry, def);
  const response = (n) => Object.fromEntries(def.domains.flatMap((d, di) => d.items.map((_, ii) => [`${di}-${ii}`, n])));
  const zero = config.onCalculate(response(0));
  const maximum = config.onCalculate(response(3));
  assert.equal(zero.total, 0); checks++;
  assert.equal(maximum.total, 36); checks++;
  assert.equal(zero.classification, maximum.classification); checks++;
  assert.deepEqual(maximum.domainResults.map((d) => d.score), e.domainSizes.map((n) => n * 3)); checks++;
}
for (const mutate of [
  (rows) => rows.push(rows[0]),
  (rows) => { rows[0].ageMaxMonths = 0; },
  (rows) => { rows[0].domains[0].itemIds.push("99"); },
  (rows) => { rows[0].validationStatus = "validated"; },
  (rows) => { rows[0].items.pop(); },
]) {
  const rows = structuredClone(authorialMonitoringRecords);
  mutate(rows);
  assert.throws(() => validateMonitoringRecords(rows)); checks++;
}
// O fluxo real bloqueia conclusão com itens obrigatórios sem resposta.
const generic = readFileSync(new URL("../../client/src/components/GenericScale.tsx", import.meta.url), "utf8");
assert.match(generic, /const allAnswered = total > 0 && allItems\.every\(isCompleteForSubmit\)/); checks++;
assert.match(generic, /if \(!allAnswered\)/); checks++;
console.log(`PASS: ${checks} verificações do Pacote 01, catálogo, filtro real e pontuação descritiva.`);
