import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AGE_BANDS } from "../../client/src/features/obs10/protocol";
import { tabletPlan, TABLET_VERSION, TABLET_LIMITS } from "../../client/src/features/obs10/tablet/protocol";
import { tabletReducer as reduce, initialTabletState, parseTabletRecord, drawingStrokes, tabletText, type TabletState, type TabletRecord } from "../../client/src/features/obs10/tablet/engine";

function ready(): TabletState { let s = initialTabletState(); for (let i = 0; i < 3; i++) s = reduce(s, { type: "next-setup" }); return s; }
function started(months = 42): TabletState { return reduce(ready(), { type: "start", context: { code: "FICTICIO", months, schooling: "", communication: "", conditions: "" }, camera: "external", sessionId: "sessao-sintetica" }); }
assert.equal(tabletPlan(-1), null); assert.equal(tabletPlan(216), null); assert.equal(tabletPlan(2.5), null);
for (const band of AGE_BANDS) {
  const p = tabletPlan(band.min)!; assert.equal(p.bandId, band.id);
  assert.equal(new Set(p.tasks.map((t) => t.id)).size, p.tasks.length);
  assert.ok(p.tasks.every((t) => t.command && t.prepare && t.observe && t.caution));
  assert.ok(p.tasks.length >= 6 && p.tasks.length <= 8);
  if (band.min < 24) { assert.equal(p.childScreen, false); assert.ok(p.tasks.every((t) => t.kind === "quiet")); }
  for (const t of p.tasks) {
    if (t.memory) { assert.equal(t.kind, "quiet"); assert.equal(t.text, undefined); assert.equal(t.scene, undefined); }
    if (t.model) assert.equal(t.kind, "drawing");
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
  assert.equal(reduce(all, { type: "save", outcome: "E", note: "" }).phase, "response");
  all = reduce(all, { type: "save", outcome: "E", note: "Descrição fictícia da tentativa; não é dado de paciente." });
}
assert.equal(all.phase, "review"); assert.equal(all.record!.observations.length, 8); assert.deepEqual(parseTabletRecord(JSON.stringify(all.record)), all.record);
assert.match(tabletText(all.record!), /sem equivalência/);
assert.ok(!tabletText(all.record!).includes("Marcha normal"));
let skipped = started(); skipped = reduce(skipped, { type: "skip", reason: "Não houve oportunidade nesta simulação." });
assert.equal(skipped.record!.observations[0].attempted, false); assert.equal(skipped.record!.observations[0].outcome, "NA");
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
console.log("OBS-10 Tablet: 13 age bands, state transitions, timer, no-equivalence, raw events, bounded imports and no hidden upload passed.");
