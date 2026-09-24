import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AGE_BANDS, OBS10_VERSION, PHASES } from "../../client/src/features/obs10/protocol";
import { KITS, MATERIALS, PRACTICAL_TASKS, getTaskBudget, taskOmission, validatePracticalCoverage } from "../../client/src/features/obs10/practical";
import { completeKit, missingForTask } from "../../client/src/features/obs10/PracticalGuide";
import { sessionElapsed, leavesObsRoute } from "../../client/src/features/obs10/safety";
import { makeReport, exportFilename, emptyObservation, type SessionRecord } from "../../client/src/features/obs10/session";

assert.equal(OBS10_VERSION, "1.6.1");
assert.deepEqual(validatePracticalCoverage(), []);
assert.equal(Object.keys(KITS).length, 13);
assert.equal(Object.keys(MATERIALS).length, 17);
const keys = new Set<string>();
let taskCount = 0;
for (const band of AGE_BANDS) {
  const kit = KITS[band.id];
  assert.equal(new Set(kit.map((item) => item.id)).size, kit.length, "no duplicated kit entries");
  assert.equal(completeKit(band.id, {}), false);
  assert.equal(completeKit(band.id, Object.fromEntries(kit.map((item) => [item.id, "ready"]))), true);
  assert.equal(completeKit(band.id, Object.fromEntries(kit.map((item) => [item.id, "missing"]))), true, "missing can be documented; device availability is separately required by the UI");
  for (const task of PRACTICAL_TASKS[band.id]) {
    assert.equal(keys.has(task.id), false, "unique task key prevents record collisions"); keys.add(task.id);
    assert.ok(task.steps.length >= 2 && task.steps.length <= 3);
    assert.ok(task.say.length > 10 && task.record.length > 15 && task.seconds > 0);
    assert.ok(task.phase >= 0 && task.phase < 6);
    taskCount++;
    for (const id of task.materials) {
      assert.ok(kit.some((item) => item.id === id), `${task.id}: kit must supply ${id}`);
      assert.ok(missingForTask(task, { [id]: "missing" })?.includes(MATERIALS[id].label));
    }
    if (task.prone) {
      assert.match(taskOmission(task, band.min, false)!, /Sem autorização/);
      assert.equal(taskOmission(task, band.min, true), null);
    }
  }
  PHASES.forEach((phase, index) => {
    assert.ok(getTaskBudget(band.id, index) > 0);
    assert.ok(getTaskBudget(band.id, index) <= phase.end - phase.start, `${band.id}: no overbooked block`);
  });
}
assert.ok(taskCount >= 130, "age-specific instructions must not collapse back into generic paragraphs");
for (const task of PRACTICAL_TASKS.m24.filter((task) => task.minMonths)) {
  assert.match(taskOmission(task, 29, false)!, /antes de 30/);
  assert.equal(taskOmission(task, 30, false), null);
}
assert.equal(sessionElapsed(100000, 5000, 101000, 16000), 11, "monotonic clock survives a slow/backward wall clock");
assert.equal(sessionElapsed(100000, 5000, 99000, 4000, 17), 17, "elapsed time cannot go backwards");
assert.equal(sessionElapsed(0, 0, 700000, 20000), 600, "sleep or tab suspension cannot exceed cap");
assert.equal(sessionElapsed(0, 0, 30000, 10000), 30);
assert.equal(leavesObsRoute("#/testes-diretos", "https://neuroped.pages.dev/#/avaliacao-pre-consulta-faixa-etaria"), true);
assert.equal(leavesObsRoute("#/avaliacao-pre-consulta-faixa-etaria?x=1", "https://neuroped.pages.dev/"), false);
assert.equal(leavesObsRoute("#/login", "https://neuroped.pages.dev/"), false, "unsaved-data guard never blocks authentication redirect");
const old: SessionRecord = { version: "1.0.0", context: { code: "SINTETICO", chronologicalMonths: 60, correctedMonths: null, bandId: "y05", schooling: "", language: "", adaptations: "", conditions: "", familyReport: "", proneAllowed: false }, observations: [], durationSeconds: 30, endReason: "Teste", encodingSecond: null, recallSecond: null, recording: "Teste sem captação" };
assert.ok(makeReport(old).startsWith("NEUROPED OBS-10 · v1.0.0"), "old records retain their version");
const copy = { ...emptyObservation("copy", 4, 30), task: "Cópia", outcome: "E" as const, modelInInstruction: true, recordedAfterEnd: true };
const current = makeReport({ ...old, version: OBS10_VERSION, observations: [copy] });
assert.match(current, /modelo na proposta inicial/);
assert.match(current, /Anotação realizada após o encerramento/);
assert.match(current, /Registro incompleto/);
assert.ok(!current.includes("Força preservada"));
assert.notEqual(exportFilename("SINTETICO", "txt", "sessao-a"), exportFilename("SINTETICO", "txt", "sessao-b"));
assert.equal(exportFilename("../x", "txt", "<s>/one"), "OBS10-x-sone.txt");
const page = readFileSync("client/src/pages/pre-consulta-obs10.tsx", "utf8");
const media = readFileSync("client/src/features/obs10/useLocalRecorder.ts", "utf8");
const visual = readFileSync("client/src/features/obs10/PracticalVisuals.tsx", "utf8");
const guide = readFileSync("client/src/features/obs10/PracticalGuide.tsx", "utf8");
assert.ok(page.indexOf("<PracticalMaterials") < page.indexOf('className="obs10-setup'));
assert.ok(page.includes('device === "ready"'), "film device is essential even when other omissions are allowed");
assert.ok(page.includes("printPlainTextDocument"), "report printing isolated from transformed app shell");
assert.ok(media.includes("generation.current !== ticket"), "late requests are guarded");
assert.ok(media.includes('addEventListener("ended"'), "track failure cannot remain silent");
assert.ok(media.includes('updateStatus("finalizing")'), "new session waits for final data");
assert.ok(visual.includes('aria-labelledby={id}') && visual.includes("useId"));
assert.ok(!/https?:\/\//.test(visual), "instructional illustrations are local");
assert.ok(!/dangerouslySetInnerHTML|\.innerHTML\s*=/.test(page + guide));
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(|\b(?:localStorage|sessionStorage|indexedDB)\./.test(page + media + guide));
console.log(`OBS-10 v1.1: ${taskCount} task cards, 17 materials, 13 kits, budgets, omissions, clock, export and safety contracts passed.`);

// A two-foot jump must never reuse the one-foot balance illustration.
for (const task of Object.values(PRACTICAL_TASKS).flat().filter((item) => item.title === "Pequeno salto com dois pés")) {
  assert.equal(task.scene, "jump");
}
assert.ok(visual.includes('case "jump":'));
assert.ok(!visual.includes('case "arms": content = <>{floor}<Person'), "arms-forward illustration uses a side view rather than lateral wings");
