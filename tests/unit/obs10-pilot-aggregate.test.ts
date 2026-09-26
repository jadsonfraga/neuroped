import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AGE_BANDS } from "../../client/src/features/obs10/protocol";
import { DIFFICULTY_OPTIONS, INTERRUPTION_ENDINGS, METRICS_SCHEMA, REPEAT_OPTIONS, SEGMENT_ENDINGS, UTILITY_OPTIONS, WORK_PHASES, emptyPilot, pilotMetrics, pilotSchema } from "../../client/src/features/obs10/pilot";
import { AGGREGATE_SCHEMA, MAX_METRICS_BYTES, SMALL_GROUP, aggregateMetrics, aggregateText, metricsSchema, parseMetricsJSON } from "../../client/src/features/obs10/pilotAggregate";
import { emptyObservation, type SessionRecord } from "../../client/src/features/obs10/session";

let assertions = 0;
const check = (value: unknown, message: string) => { assert.ok(value, message); assertions++; };
const record = (bandId: string, months: number, extra: Partial<SessionRecord> = {}): SessionRecord => ({
  version: "1.6.1", sessionId: "SINTETICO", context: { code: "NAO-EXPORTAR", chronologicalMonths: months, correctedMonths: null, bandId, schooling: "", language: "", adaptations: "", conditions: "", familyReport: "RELATO-NAO-EXPORTAR", proneAllowed: false },
  observations: [{ ...emptyObservation("manual-1", 2, 100), task: "TAREFA-NAO-EXPORTAR", response: "FATO-NAO-EXPORTAR", outcome: "E", quality: "Nítido" }],
  durationSeconds: 420, endReason: "Teste", encodingSecond: null, recallSecond: null, recording: "Teste", pilot: emptyPilot(), ...extra,
});

// Interruptions count only what the operator did not choose.
const logs = SEGMENT_ENDINGS.map((endedBy, i) => ({ phase: WORK_PHASES[i % WORK_PHASES.length], seconds: 10 + i, endedBy }));
const withLogs = record("y06", 84, { pilot: { ...emptyPilot(), logs } });
check(pilotMetrics(withLogs).manualPausesOrInterruptions === INTERRUPTION_ENDINGS.length, "starting the collection or switching phase is not an interruption");
check(INTERRUPTION_ENDINGS.every((e) => ["aba oculta", "limite"].includes(e)) && INTERRUPTION_ENDINGS.length === 2, "interruptions are hidden tab and limit");
check(pilotSchema.safeParse(withLogs.pilot).success, "all endings remain valid in the record schema");

// The exporter's output and the consolidator's schema stay in lockstep, for every band and option.
for (const band of AGE_BANDS) {
  const m = pilotMetrics(record(band.id, band.min));
  check(m.schema === METRICS_SCHEMA && metricsSchema.safeParse(m).success, `${band.id}: export parses under the strict schema`);
}
for (const utility of UTILITY_OPTIONS) for (const repeatNeed of REPEAT_OPTIONS) for (const difficulty of DIFFICULTY_OPTIONS) {
  const m = pilotMetrics(record("m12", 13, { pilot: { ...emptyPilot(), utility, repeatNeed, difficulty } }));
  check(metricsSchema.safeParse(m).success, "every declared option is accepted");
}
const base = pilotMetrics(record("y06", 84));
check(!JSON.stringify(base).match(/NAO-EXPORTAR|SINTETICO/), "whitelist export carries no clinical text");
for (const bad of [
  { ...base, code: "X" }, { ...base, note: "texto livre" }, { ...base, ageBand: "zz" }, { ...base, collectionSeconds: 601 }, { ...base, schema: "other" },
  { ...base, usefulnessReported: "ótima" }, { ...base, workSecondsRecorded: { ...base.workSecondsRecorded, Extra: 1 } }, { ...base, reportSource: "server" },
]) check(!parseMetricsJSON(JSON.stringify(bad)).ok, "extra field, free text or unknown value refused");
check(!parseMetricsJSON("{").ok && !parseMetricsJSON(" ".repeat(MAX_METRICS_BYTES + 1)).ok, "invalid or oversized input refused");
check(parseMetricsJSON("﻿" + JSON.stringify(base)).ok, "BOM tolerated");
// Regression: patch/minor releases in the supported major are accepted, but a future major is never assumed compatible.
for (const good of ["1.0.0", "1.5.0", "1.6.0", "1.6.1", "1.12.34"]) check(parseMetricsJSON(JSON.stringify({ ...base, protocolVersion: good })).ok, `protocol version ${good} accepted`);
for (const badVersion of ["2.0.0", "1.6", "v1.6.1", "1.6.1-beta", ""]) check(!parseMetricsJSON(JSON.stringify({ ...base, protocolVersion: badVersion })).ok, `unsupported or malformed protocol version ${JSON.stringify(badVersion)} refused`);

// Aggregation: duplicates counted once, medians real, small groups flagged, imported files marked.
const a = pilotMetrics(record("y06", 84, { durationSeconds: 600, pilot: { ...emptyPilot(), logs: [{ phase: "Preparação", seconds: 120, endedBy: "início da coleta" }], utility: "acrescentou informação útil" } }));
const b = pilotMetrics(record("y06", 90, { durationSeconds: 300, pilot: { ...emptyPilot(), logs: [{ phase: "Preparação", seconds: 60, endedBy: "aba oculta" }, { phase: "Revisão médica", seconds: 200, endedBy: "manual" }], difficulty: "áudio ou imagem", source: "imported-unverified" } }));
const c = pilotMetrics(record("m12", 14, { durationSeconds: 480 }));
const agg = aggregateMetrics([a, b, c, a, structuredClone(b)]);
check(agg.schema === AGGREGATE_SCHEMA && agg.filesRead === 5 && agg.duplicatesIgnored === 2 && agg.sessions === 3, "identical files counted once");
check(agg.importedUnverified === 1 && agg.smallSample === true, "imported source and small sample flagged");
check(agg.collectionSeconds?.median === 480 && agg.collectionSeconds?.min === 300 && agg.collectionSeconds?.max === 600 && agg.reachedLimit === 1, "real spread of collection time");
check(agg.workSeconds["Preparação"]?.n === 2 && agg.workSeconds["Preparação"]?.median === 90 && agg.workSeconds["Revisão médica"]?.n === 1 && agg.workSeconds["Entrega"] === null, "unmeasured phases are null, never zero");
check(agg.interruptions === 1, "only the hidden-tab segment counts");
check(agg.byAgeBand.length === 2 && agg.byAgeBand.every((row) => row.smallGroup) && agg.byAgeBand.find((row) => row.id === "y06")?.n === 2, "band counts with small-group flag");
check(agg.usefulness["acrescentou informação útil"] === 1 && agg.usefulness["não avaliada"] === 2 && agg.difficulty["áudio ou imagem"] === 1, "declared opinions tallied, never scored");
check(agg.byVersion["1.6.1"] === 3, "versions tallied");
const text = aggregateText(agg);
check(text.includes("3 aplicação(ões) distintas em 5 arquivo(s) válido(s)") && text.includes("2 duplicado(s)") && text.includes("Amostra pequena"), "summary states counts and caution");
check(text.includes("Entrega: não medido em nenhuma aplicação") && text.includes("mediana 1min30s"), "summary distinguishes unmeasured from measured");
check(!/NAO-EXPORTAR|SINTETICO/.test(text + JSON.stringify(agg)), "aggregate carries no clinical text");
check(text.includes("Não mede desempenho da criança"), "limits stated");
const even = aggregateMetrics([a, c]); check(even.collectionSeconds?.median === 540, "even-count median averages the middle pair");
check(aggregateMetrics([]).sessions === 0 && aggregateMetrics([]).collectionSeconds === null && aggregateText(aggregateMetrics([])).includes("0 aplicação"), "empty input is explicit");
check(agg.byAgeBand.some((row) => row.n < SMALL_GROUP), "small group threshold applied");

const panel = readFileSync("client/src/features/obs10/PilotPanel.tsx", "utf8");
const consolidation = readFileSync("client/src/features/obs10/PilotConsolidation.tsx", "utf8");
const aggregateSource = readFileSync("client/src/features/obs10/pilotAggregate.ts", "utf8");
check(!/Date\.now\(\)|new Date\(/.test(panel), "metrics file name carries no timestamp");
check(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(|\b(?:localStorage|sessionStorage|indexedDB)\./.test(panel + consolidation + aggregateSource), "consolidation stays local");
check(!/dangerouslySetInnerHTML|\.innerHTML\s*=/.test(consolidation), "file names rendered as text");
check(consolidation.includes("<h2 className=\"obs13-consolidation-title\"") && !consolidation.includes("<h3"), "heading level follows the page outline when the panel opens after the hero");
check(panel.includes("UTILITY_OPTIONS.map") && panel.includes("REPEAT_OPTIONS.map") && panel.includes("DIFFICULTY_OPTIONS.map"), "panel options come from the schema constants");
console.log(`OBS-10 v1.5: ${assertions} pilot metrics and consolidation assertions passed.`);
