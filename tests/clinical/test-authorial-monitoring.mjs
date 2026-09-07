import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allScales, filterScales } from "../../client/src/data/scaleFilter.ts";
import { filterScalesIntelligently } from "../../client/src/data/advancedFilterLogic.ts";
import { makeInteractiveConfig } from "../../client/src/data/interactiveScaleItems.ts";
import { authorialMonitoringRecords, authorialMonitoringCatalog, authorialMonitoringItems, validateMonitoringRecords } from "../../client/src/data/authorialMonitoring.ts";
import { escalasImportadasDrive2026 } from "../../client/src/data/escalasImportadasDrive2026.ts";
import { assertUniqueAuthorialPackage } from "../../scripts/guards/assert-authorial-package-unique.mjs";

const expected = {
  "afi12-sdg": { min: 60, max: 215, complaint: "tdah", respondents: ["pais", "professor"], domainSizes: [6, 6], timeframe: 7, itemCount: 12, labelCount: 4, maxAnswer: 3, maxTotal: 36, hasNo: false },
  "sdrd12-sdg": { min: 36, max: 215, complaint: "sono", respondents: ["pais"], domainSizes: [4, 4, 4], timeframe: 7, itemCount: 12, labelCount: 4, maxAnswer: 3, maxTotal: 36, hasNo: false },
  "sarf12-sdg": { min: 24, max: 179, complaint: "alimentacao", respondents: ["pais"], domainSizes: [4, 4, 4], timeframe: 7, itemCount: 12, labelCount: 4, maxAnswer: 3, maxTotal: 36, hasNo: false },
  "irritabilidade-desregulacao-vs1": { min: 36, max: 215, complaint: "comportamento", respondents: ["pais"], domainSizes: [4, 4, 4, 4, 4], timeframe: 14, itemCount: 20, labelCount: 5, maxAnswer: 3, maxTotal: 60, hasNo: true, signals: ["irritabilidade", "desregulacao"] },
  "nexo-s-24-sdg": { min: 36, max: 215, complaint: "sensorial", respondents: ["pais"], domainSizes: [6, 6, 6, 6], timeframe: 14, itemCount: 24, labelCount: 6, maxAnswer: 4, maxTotal: 96, hasNo: true, signals: ["sensorial", "sobrecarga"] },
  "mapa-ri-18-sdg": { min: 36, max: 215, complaint: "comportamento", respondents: ["pais", "professor"], domainSizes: [5, 4, 5, 4], timeframe: 14, itemCount: 18, labelCount: 5, maxAnswer: 4, maxTotal: 72, hasNo: false, signals: ["irritabilidade", "desregulacao"] },
  "vigia-sd-20-sdg": { min: 24, max: 215, complaint: "sono", respondents: ["pais"], domainSizes: [5, 5, 5, 5], timeframe: 7, itemCount: 20, labelCount: 4, maxAnswer: 3, maxTotal: 60, hasNo: false, signals: ["sono", "sonolencia"] },
  "balanco-med-24-sdg": { min: 0, max: 215, complaint: "comportamento", respondents: ["pais", "clinico"], domainSizes: [5, 5, 5, 5, 4], timeframe: 7, itemCount: 24, labelCount: 4, maxAnswer: 3, maxTotal: 72, hasNo: false, signals: ["medicacao", "tolerabilidade"] },
  "mcri-24-sdg": { min: 36, max: 215, complaint: "comportamento", respondents: ["pais"], domainSizes: [4, 4, 4, 4, 4, 4], timeframe: 14, itemCount: 24, labelCount: 6, maxAnswer: 4, maxTotal: 96, hasNo: true, signals: ["irritabilidade", "desregulacao", "frustracao"], legacyRaw: false },
};
let checks = 0;

assertUniqueAuthorialPackage(escalasImportadasDrive2026); checks++;

for (const [id, e] of Object.entries(expected)) {
  const r = authorialMonitoringRecords.find((record) => record.id === id);
  const entry = authorialMonitoringCatalog.find((record) => record.id === id);
  assert.ok(r && entry, id); checks++;
  assert.equal(r.timeframeDays, e.timeframe); checks++;
  assert.deepEqual([entry.ageMin, entry.ageMax], [e.min, e.max]); checks++;
  if (e.legacyRaw !== false) {
    assert.equal(escalasImportadasDrive2026.filter((s) => s.id === id).length, 1, `${id}: fonte bruta única`); checks++;
  }
  assert.equal(allScales.filter((s) => s.id === id).length, 1, `${id}: catálogo visível único`); checks++;
  assert.equal(entry.prioridade, "monitorizacao"); checks++;
  assert.equal(entry.assessmentUse, "monitorizacao"); checks++;
  assert.equal(entry.licencaUso, "autoral"); checks++;
  assert.equal(entry.implementationStatus, "complete"); checks++;
  assert.equal(entry.pendente_validacao_clinica, true); checks++;
  assert.equal(entry.suicideRiskInstrument, false); checks++;
  assert.equal(entry.psychosisRiskInstrument, false); checks++;
  assert.deepEqual(r.domains.map((d) => d.itemIds.length), e.domainSizes); checks++;

  const def = authorialMonitoringItems[id];
  assert.equal(def.domains.flatMap((d) => d.items).length, e.itemCount); checks++;
  assert.equal(def.labels.length, e.labelCount); checks++;
  assert.equal(def.bands.length, 1); checks++;
  assert.match(def.bands[0].classification, /sem classificação diagnóstica/i); checks++;

  for (const age of new Set([e.min, e.max])) {
    assert.ok(filterScales([e.complaint], { min: age, max: age }).some((s) => s.id === id), `${id}: filtro simples idade ${age}`); checks++;
    for (const respondent of e.respondents) {
      const matches = filterScalesIntelligently(allScales, { queixas: [e.complaint], ageMonths: age, respondente: respondent, assessmentUse: "monitorizacao", selectedSignals: [] });
      assert.ok(matches.some((m) => m.scale.id === id), `${id}: idade ${age}, ${respondent}`); checks++;
    }
  }
  const outsideAges = [e.max + 1, ...(e.min > 0 ? [e.min - 1] : [])];
  for (const age of outsideAges) {
    const matches = filterScalesIntelligently(allScales, { queixas: [e.complaint], ageMonths: age, respondente: e.respondents[0], assessmentUse: "monitorizacao", selectedSignals: [] });
    assert.ok(!matches.some((m) => m.scale.id === id), `${id}: bloqueio fora da idade ${age}`); checks++;
  }

  if (e.signals) {
    const age = Math.max(e.min, Math.min(120, e.max));
    const signalMatches = filterScalesIntelligently(allScales, { queixas: [e.complaint], ageMonths: age, respondente: e.respondents[0], assessmentUse: "monitorizacao", selectedSignals: e.signals });
    assert.ok(signalMatches.some((m) => m.scale.id === id), `${id}: filtro por sinais`); checks++;
  }

  const config = makeInteractiveConfig(entry, def);
  const response = (n) => Object.fromEntries(def.domains.flatMap((d, di) => d.items.map((_, ii) => [`${di}-${ii}`, n])));
  const zero = config.onCalculate(response(0));
  const maximum = config.onCalculate(response(e.maxAnswer));
  assert.equal(zero.total, 0); checks++;
  assert.equal(maximum.total, e.maxTotal); checks++;
  assert.equal(zero.classification, maximum.classification); checks++;
  assert.deepEqual(maximum.domainResults.map((d) => d.score), e.domainSizes.map((n) => n * e.maxAnswer)); checks++;

  if (e.hasNo) {
    assert.match(def.labels.at(-1), /^NO\b/); checks++;
    assert.match(def.instruction, /NO .*nunca deve ser convertido em zero/i); checks++;
    assert.match(def.totalLabel, /apuração manual/i); checks++;
    assert.match(entry.scoringCutoff, /NO ou item em branco torna o domínio incompleto/i); checks++;
  } else {
    assert.match(def.totalLabel, new RegExp(`0[–-]${e.maxTotal}`)); checks++;
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

const generic = readFileSync(new URL("../../client/src/components/GenericScale.tsx", import.meta.url), "utf8");
assert.match(generic, /const allAnswered = total > 0 && allItems\.every\(isCompleteForSubmit\)/); checks++;
assert.match(generic, /if \(!allAnswered\)/); checks++;
assert.ok(!generic.includes("config.onCalculate("), "GenericScale autoral não deve transformar a transcrição em classificação clínica automática."); checks++;

console.log(`PASS: ${checks} verificações dos instrumentos autorais, catálogo, filtro, segurança e aplicação interativa.`);
