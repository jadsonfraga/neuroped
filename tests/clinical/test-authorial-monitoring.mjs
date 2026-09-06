import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allScales, filterScales } from "../../client/src/data/scaleFilter.ts";
import { filterScalesIntelligently } from "../../client/src/data/advancedFilterLogic.ts";
import { makeInteractiveConfig } from "../../client/src/data/interactiveScaleItems.ts";
import { authorialMonitoringRecords, authorialMonitoringCatalog, authorialMonitoringItems, validateMonitoringRecords } from "../../client/src/data/authorialMonitoring.ts";
import { escalasImportadasDrive2026 } from "../../client/src/data/escalasImportadasDrive2026.ts";
import { assertUniqueAuthorialPackage } from "../../scripts/guards/assert-authorial-package-unique.mjs";

const expected = {
  "afi12-sdg": { min: 60, max: 215, complaint: "tdah", respondents: ["pais", "professor"], domainSizes: [6, 6], timeframe: 7, itemCount: 12, labelCount: 4, maxTotal: 36, hasNo: false },
  "sdrd12-sdg": { min: 36, max: 215, complaint: "sono", respondents: ["pais"], domainSizes: [4, 4, 4], timeframe: 7, itemCount: 12, labelCount: 4, maxTotal: 36, hasNo: false },
  "sarf12-sdg": { min: 24, max: 179, complaint: "alimentacao", respondents: ["pais"], domainSizes: [4, 4, 4], timeframe: 7, itemCount: 12, labelCount: 4, maxTotal: 36, hasNo: false },
  "irritabilidade-desregulacao-vs1": { min: 36, max: 215, complaint: "comportamento", respondents: ["pais"], domainSizes: [4, 4, 4, 4, 4], timeframe: 14, itemCount: 20, labelCount: 5, maxTotal: 60, hasNo: true },
};
let checks = 0;

// Pacote 01 continua sem fonte duplicada; a VS1 ganha a mesma checagem explícita abaixo.
assertUniqueAuthorialPackage(escalasImportadasDrive2026); checks++;

for (const [id, e] of Object.entries(expected)) {
  const r = authorialMonitoringRecords.find((record) => record.id === id);
  const entry = authorialMonitoringCatalog.find((record) => record.id === id);
  assert.ok(r && entry, id); checks++;
  assert.equal(r.timeframeDays, e.timeframe); checks++;
  assert.deepEqual([entry.ageMin, entry.ageMax], [e.min, e.max]); checks++;
  assert.equal(escalasImportadasDrive2026.filter((s) => s.id === id).length, 1, `${id}: fonte bruta única`); checks++;
  assert.equal(allScales.filter((s) => s.id === id).length, 1, `${id}: catálogo visível único`); checks++;
  assert.equal(entry.prioridade, "monitorizacao"); checks++;
  assert.equal(entry.assessmentUse, "monitorizacao"); checks++;
  assert.equal(entry.licencaUso, "autoral"); checks++;
  assert.equal(entry.implementationStatus, "complete"); checks++;
  assert.equal(entry.pendente_validacao_clinica, true); checks++;
  assert.deepEqual(r.domains.map((d) => d.itemIds.length), e.domainSizes); checks++;

  const def = authorialMonitoringItems[id];
  assert.equal(def.domains.flatMap((d) => d.items).length, e.itemCount); checks++;
  assert.equal(def.labels.length, e.labelCount); checks++;
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
  assert.equal(maximum.total, e.maxTotal); checks++;
  assert.equal(zero.classification, maximum.classification); checks++;
  assert.deepEqual(maximum.domainResults.map((d) => d.score), e.domainSizes.map((n) => n * 3)); checks++;

  if (e.hasNo) {
    assert.match(def.labels[4], /^NO\b/); checks++;
    assert.match(def.instruction, /NO .*nunca deve ser convertido em zero/i); checks++;
    assert.match(def.totalLabel, /apuração manual/i); checks++;
    assert.match(entry.scoringCutoff, /NO ou item em branco torna o domínio incompleto/i); checks++;
    const signalMatches = filterScalesIntelligently(allScales, { queixas: [e.complaint], ageMonths: 120, respondente: "pais", assessmentUse: "monitorizacao", selectedSignals: ["irritabilidade", "desregulacao"] });
    assert.ok(signalMatches.some((m) => m.scale.id === id), `${id}: filtro por sinais`); checks++;
  }
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

for (const mutate of [
  (record) => { record.optionPoints = [0, 1]; },
  (record) => { record.unscoredOptionIndexes = [99]; },
  (record) => { record.responseLabels[4] = record.responseLabels[3]; },
]) {
  const rows = structuredClone(authorialMonitoringRecords);
  const record = rows.find((r) => r.id === "irritabilidade-desregulacao-vs1");
  assert.ok(record); checks++;
  mutate(record);
  assert.throws(() => validateMonitoringRecords(rows)); checks++;
}

// O fluxo real bloqueia conclusão com item obrigatório sem resposta e entrega apenas
// a transcrição por extenso. Isso impede que a opção NO da VS1 seja convertida em
// zero por um cálculo automático invisível; a apuração numérica permanece manual.
const generic = readFileSync(new URL("../../client/src/components/GenericScale.tsx", import.meta.url), "utf8");
assert.match(generic, /const allAnswered = total > 0 && allItems\.every\(isCompleteForSubmit\)/); checks++;
assert.match(generic, /if \(!allAnswered\)/); checks++;
assert.ok(!generic.includes("config.onCalculate("), "GenericScale não deve autoapurar a VS1; resultado é transcrição por extenso."); checks++;

console.log(`PASS: ${checks} verificações dos instrumentos autorais, incluindo VS1, catálogo, filtro e regra NO.`);
