import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AGE_BANDS } from "../../client/src/features/obs10/protocol";
import { tabletPlan, plannedSeconds, TABLET_VERSION, TABLET_LIMITS } from "../../client/src/features/obs10/tablet/protocol";
import { tabletReducer as reduce, initialTabletState, parseTabletRecord, drawingStrokes, tabletText, pendingDescriptions, type TabletState, type TabletRecord } from "../../client/src/features/obs10/tablet/engine";

function ready(): TabletState { let s = initialTabletState(); for (let i = 0; i < 3; i++) s = reduce(s, { type: "next-setup" }); return s; }
function started(months = 42): TabletState { return reduce(ready(), { type: "start", context: { code: "FICTICIO", months, schooling: "", communication: "", conditions: "" }, camera: "external", sessionId: "sessao-sintetica" }); }
assert.equal(tabletPlan(-1), null); assert.equal(tabletPlan(216), null); assert.equal(tabletPlan(2.5), null);
for (const band of AGE_BANDS) {
  const p = tabletPlan(band.min)!; assert.equal(p.bandId, band.id);
  assert.equal(new Set(p.tasks.map((t) => t.id)).size, p.tasks.length);
  assert.ok(p.tasks.every((t) => t.command && t.prepare && t.observe && t.caution));
  assert.ok(p.tasks.length >= 6 && p.tasks.length <= 10);
  if (band.min < 24) { assert.equal(p.childScreen, false); assert.ok(p.tasks.every((t) => t.kind === "quiet")); }
  // Pacing is guidance that has to fit inside the hard limit; it never replaces the controller's 600 s.
  assert.ok(p.tasks.every((t) => Number.isInteger(t.seconds) && t.seconds > 0 && t.seconds <= 120), band.id);
  assert.ok(plannedSeconds(p) <= 600, `${band.id}: suggested pacing must fit the absolute limit`);
  assert.ok(plannedSeconds(p) <= 585, `${band.id}: keep slack for refusal, pauses and note taking`);
  for (const t of p.tasks) {
    if (t.memory) { assert.equal(t.kind, "quiet"); assert.equal(t.text, undefined); assert.equal(t.scene, undefined); }
    if (t.model) assert.equal(t.kind, "drawing");
    // Multi-step proposals stay operator-side: a child surface would leak the script.
    if (t.steps) { assert.equal(t.kind, "quiet"); assert.ok(t.steps.length >= 3); }
  }
  const movement = p.tasks.find((t) => t.id.endsWith(":movement"));
  const rule = p.tasks.find((t) => t.id.endsWith(":rule"));
  assert.equal(Boolean(movement), band.min >= 60, `${band.id}: camera-observed movement only from five years`);
  assert.equal(Boolean(rule), band.min >= 60, `${band.id}: oral rule only from five years`);
  if (movement) {
    assert.equal(movement.kind, "quiet", "movement is observed by the camera, never a screen stimulus");
    assert.match(movement.caution, /Omita/, "unsafe movement must have an explicit omission path");
    assert.ok(movement.steps?.some((line) => /vire e volte/.test(line)) && movement.steps.some((line) => /um pé/.test(line)));
    assert.ok(p.limitations.some((text) => text.includes("observados pela câmera")));
    assert.ok(!p.limitations.some((text) => text.includes("não são propostos neste modo")));
  } else {
    assert.ok(p.limitations.some((text) => text.includes("não são propostos neste modo")), `${band.id}: absent movement must be declared`);
  }
  if (rule) {
    assert.equal(rule.kind, "quiet", "the rule is spoken; no word of it may reach the child screen");
    assert.equal(rule.text, undefined); assert.equal(rule.scene, undefined);
    assert.match(rule.caution, /apenas oral/);
  }
  // Ball, real manipulation and pencil grip are never claimed, with or without the movement proposal.
  assert.ok(p.limitations.some((text) => text.includes("Chute e recepção de bola")));
  assert.ok(p.limitations.some((text) => text.includes("Manipulação de objetos reais")));
  const encoding = p.tasks.findIndex((t) => t.memory === "encoding");
  if (encoding >= 0) {
    const recall = p.tasks.findIndex((t) => t.memory === "recall");
    assert.ok(recall > encoding, "recall follows initial presentation");
    for (const t of p.tasks.slice(encoding + 1, recall)) {
      assert.equal(t.text, undefined, "no reading cue between encoding and recall");
      assert.equal(t.scene, undefined, "no supplied picture cue during the interval");
      assert.ok(!/\b(casa|gato|pão)\b/iu.test([t.command, ...(t.steps ?? [])].join(" ")), "intervening commands and steps do not repeat targets");
    }
  }
  assert.ok(p.limitations.some((text) => text.includes("Preensão")));
}
assert.ok(TABLET_LIMITS.includes("não equivalem"));
assert.equal(started().record!.protocol, TABLET_VERSION);
let s = started();
assert.equal(reduce(s, { type: "next-setup" }), s);
assert.equal(reduce(s, { type: "save", outcome: "E", note: "Não houve atividade" }), s);
s = reduce(s, { type: "tick", second: 12 }); s = reduce(s, { type: "tick", second: 4 }); assert.equal(s.elapsed, 12);
s = reduce(s, { type: "show" }); assert.equal(s.phase, "child"); assert.equal(s.record!.observations[0].outcome, null); assert.equal(s.record!.observations[0].note, "");
assert.equal(reduce(s, { type: "show" }), s, "no repeated opportunity by double click");
assert.equal(reduce(s, { type: "input", event: "select", value: "circle" }), s, "oral/quiet tasks do not accept touch events");
s = reduce(s, { type: "response" });
s = reduce(s, { type: "amend", taskId: "y03:arrival", note: "Chegou e acenou, observado na tentativa fictícia." });
assert.equal(s.record!.observations[0].editedAfterEnd, false);
let interrupted = reduce(s, { type: "end", second: 19, reason: "Interrupção de teste" });
assert.match(interrupted.record!.observations[0].note, /Chegou/);
assert.equal(reduce(interrupted, { type: "show" }), interrupted, "review cannot restart activities");
assert.equal(reduce(interrupted, { type: "input", event: "stroke", value: [{ x: .1, y: .2 }] }), interrupted);
assert.deepEqual(parseTabletRecord(JSON.stringify(interrupted.record)), interrupted.record);
assert.equal(reduce(started(), { type: "import", record: interrupted.record! }).phase, "cue", "import cannot replace an ongoing session");
const imported = reduce(initialTabletState(), { type: "import", record: interrupted.record! });
assert.equal(imported.phase, "review"); assert.equal(imported.record!.reviewed, false); assert.equal(imported.record!.importedForReview, true);
const beforeReview = JSON.stringify(interrupted.record);
interrupted = reduce(interrupted, { type: "reviewed", value: true }); assert.notEqual(JSON.stringify(interrupted.record), beforeReview);
interrupted = reduce(interrupted, { type: "amend", taskId: "y03:arrival", note: "Retificação factual sintética." });
assert.equal(interrupted.record!.reviewed, false); assert.equal(interrupted.record!.observations[0].editedAfterEnd, true);
const timed = reduce(started(), { type: "tick", second: 999 }); assert.equal(timed.phase, "review"); assert.equal(timed.record!.durationSeconds, 600);
assert.equal(reduce(timed, { type: "tick", second: 1200 }), timed);
let all = started();
for (const t of tabletPlan(42)!.tasks) {
  all = reduce(all, { type: "show" });
  if (t.kind === "drawing") {
    all = reduce(all, { type: "input", event: "stroke", value: [{ x: 0, y: 0 }, { x: .5, y: .5 }] });
    assert.equal(drawingStrokes(all.record!.events, t.id).length, 1);
  }
  if (t.kind === "choice") {
    all = reduce(all, { type: "input", event: "select", value: "circle" });
    all = reduce(all, { type: "input", event: "select", value: "circle" });
    assert.equal(all.record!.events.filter((e) => e.taskId === t.id && e.type === "select").length, 2, "retain repeated inputs rather than turn them into scores");
  }
  all = reduce(all, { type: "response" });
  // Deliberate alignment with the in-person rule: the category advances, the description is completed in review.
  // A category is still mandatory, and the pending description is tracked instead of being invented.
  const onlyCategory = reduce(all, { type: "save", outcome: "E", note: "" });
  assert.notEqual(onlyCategory.phase, "response", "marking the category must let the applicator move on");
  assert.equal(onlyCategory.record!.observations.at(-1)!.note, "", "no description is fabricated on the way out");
  assert.ok(pendingDescriptions(onlyCategory.record!).includes(t.id), "the missing description stays counted");
  assert.equal(reduce(all, { type: "save", outcome: "X" as never, note: "" }).phase, "response", "a category is still required");
  all = reduce(all, { type: "save", outcome: "E", note: "Descrição fictícia da tentativa; não é dado de paciente." });
}
assert.equal(all.phase, "review"); assert.equal(all.record!.observations.length, 8); assert.deepEqual(parseTabletRecord(JSON.stringify(all.record)), all.record);
assert.match(tabletText(all.record!), /sem equivalência/);
assert.ok(!tabletText(all.record!).includes("Marcha normal"));
let skipped = started();
assert.equal(reduce(skipped, { type: "skip", reason: "   " }).phase, "cue", "an omission without its reason is never recorded");
assert.match(reduce(skipped, { type: "skip", reason: "" }).error, /por que não aplicou/);
skipped = reduce(skipped, { type: "skip", reason: "Não houve oportunidade nesta simulação." });
assert.equal(skipped.record!.observations[0].attempted, false); assert.equal(skipped.record!.observations[0].outcome, "NA");
// A record whose descriptions are pending must say so in the summary handed to the doctor.
const partial = reduce(reduce(reduce(started(), { type: "show" }), { type: "response" }), { type: "save", outcome: "V", note: "" });
assert.equal(pendingDescriptions(partial.record!).length, 1);
assert.match(tabletText(reduce(partial, { type: "end", second: 30, reason: "Fim sintético" }).record!), /PENDÊNCIA: 1 atividade/);
assert.match(tabletText(all.record!), /Todas as atividades registradas possuem descrição/);
// Saturating the event log must never mint an observation whose opening cannot be traced: the module
// would otherwise export a record its own validator rejects.
const drawingAt = tabletPlan(60)!.tasks.findIndex((t) => t.kind === "drawing");
let saturating = started(60);
for (let i = 0; i < drawingAt; i++) {
  saturating = reduce(saturating, { type: "show" });
  saturating = reduce(saturating, { type: "response" });
  saturating = reduce(saturating, { type: "save", outcome: "E", note: "" });
}
saturating = reduce(saturating, { type: "show" });
assert.equal(saturating.phase, "child");
// One point per stroke keeps the coordinate ceiling far away, so the event ceiling is what saturates.
for (let i = 0; i < 1600 && !saturating.record!.eventLimitReached; i++) saturating = reduce(saturating, { type: "input", event: "stroke", value: [{ x: .5, y: .5 }] });
assert.equal(saturating.record!.eventLimitReached, true, "the drill must actually reach saturation");
saturating = reduce(saturating, { type: "response" });
saturating = reduce(saturating, { type: "save", outcome: "E", note: "" });
assert.equal(saturating.phase, "cue", "the applicator still reaches the next card");
const blocked = reduce(saturating, { type: "show" });
assert.equal(blocked.record!.observations.length, saturating.record!.observations.length, "a dropped opening event cannot leave an untraceable observation behind");
assert.equal(blocked.phase, "cue", "saturation does not hand the child an activity that will not be recorded");
assert.match(blocked.error, /Limite de interações atingido/);
const ended = reduce(blocked, { type: "end", second: 120, reason: "Saturação sintética" });
assert.deepEqual(parseTabletRecord(JSON.stringify(ended.record)), ended.record, "a saturated record still re-imports");
const invalid = (change: (r: TabletRecord) => void) => { const r = structuredClone(all.record!); change(r); assert.throws(() => parseTabletRecord(JSON.stringify(r))); };
invalid((r) => { r.context.months = 6; });
invalid((r) => { r.observations.push(r.observations[0]); });
invalid((r) => { r.observations[0].openedAt = 500; });
invalid((r) => { r.events[1].seq = 99; });
invalid((r) => { r.events.pop(); });
invalid((r) => { r.events[1].taskId = "invalid"; });
assert.throws(() => parseTabletRecord(JSON.stringify({ ...all.record, score: 100 })));
assert.throws(() => parseTabletRecord(JSON.stringify({ version: "1.6.1" })));
assert.throws(() => parseTabletRecord("x".repeat(4 * 1024 * 1024 + 1)));
const sources = ["protocol.ts", "engine.ts", "Stimulus.tsx", "TabletWorkspace.tsx", "TabletLauncher.tsx"].map((name) => readFileSync(`client/src/features/obs10/tablet/${name}`, "utf8")).join("\n");
assert.ok(!/dangerouslySetInnerHTML|\.innerHTML\s*=/.test(sources));
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|SpeechRecognition|webkitSpeechRecognition)\s*\(|\b(?:localStorage|sessionStorage|indexedDB)\./.test(sources));
assert.ok(!/new MediaRecorder|getUserMedia\(/.test(sources), "recorder is shared, not cloned");
assert.ok(sources.includes('localService'), "optional help voice must be local and static");
const stations = readFileSync("client/src/features/obs10/tablet/Stations.tsx", "utf8");
const workspace = readFileSync("client/src/features/obs10/tablet/TabletWorkspace.tsx", "utf8");
const stationStyle = readFileSync("client/src/features/obs10/tablet/style.ts", "utf8");
assert.ok(stations.includes("Progresso de navegação, não desempenho"), "station map explicitly separates navigation from performance");
assert.ok(stations.includes("MAPA DA JORNADA") && stations.includes("CHECKPOINT DE REGISTRO"));
assert.ok(!/\b(?:score|stars?|lives?|leaderboard|xp)\b/iu.test(stations), "stations cannot introduce performance-game mechanics");
assert.ok(!/<button|onClick=|dispatch\(/.test(stations), "station map remains presentation-only");
assert.ok(workspace.includes("<StationJourney") && workspace.includes("<MissionBanner"), "actual tablet route uses stations and checkpoints");
assert.ok(stationStyle.includes("prefers-reduced-motion") && stationStyle.includes("ot-station-enter"), "station transitions must respect reduced motion");
console.log("OBS-10 Tablet: 13 age bands, state transitions, timer, no-equivalence, raw events, bounded imports and no hidden upload passed.");
