import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AGE_BANDS, MAX_SECONDS, OBS10_VERSION } from "../../client/src/features/obs10/protocol";
import { PRACTICAL_TASKS, validatePracticalCoverage } from "../../client/src/features/obs10/practical";
import { framePlan, preparationsForBand, resourceIssues } from "../../client/src/features/obs10/framePlan";
import { printChildResource } from "../../client/src/features/obs10/FrameResources";

assert.equal(MAX_SECONDS, 600);
assert.equal(OBS10_VERSION, "1.6.1", "this UI revision does not relabel the clinical record schema");
assert.deepEqual(validatePracticalCoverage(), []);
assert.deepEqual(resourceIssues(), []);
const all = Object.values(PRACTICAL_TASKS).flat();
assert.equal(all.length, 145);
for (const band of AGE_BANDS) {
  for (const task of PRACTICAL_TASKS[band.id]) {
    const before = JSON.stringify(task);
    const plan = framePlan(task, band.id);
    assert.deepEqual(plan.materials.map((item) => item.id), task.materials);
    assert.ok(plan.adultOnly && plan.camera);
    assert.ok(plan.materials.every((item) => item.quantity && item.detail && item.substitute));
    assert.equal(JSON.stringify(task), before, "resource planning is pure, never edits task instructions");
    if (task.scene === "words" || task.scene === "rule") {
      assert.equal(plan.child, null, task.id);
      assert.match(plan.adultOnly, /Não mostre/);
    }
    if (plan.model) assert.equal(task.model, true);
  }
}
const find = (band: string, title: string) => { const task = PRACTICAL_TASKS[band].find((item) => item.title === title); assert.ok(task, title); return task; };
for (const [band, expected] of [["y06", "O gato dorme na cadeira"], ["y09", "O gato dorme na cadeira. Quando acorda, vai brincar com a bola."]]) {
  const resource = framePlan(find(band, "Amostra de leitura e escrita"), band).child;
  assert.equal(resource?.kind, "reading");
  if (resource?.kind === "reading") assert.equal(resource.text, expected);
}
assert.equal(framePlan(find("y12", "Amostra de leitura e escrita"), "y12").child, null, "adolescent writing has no supplied reading answer");
assert.equal(framePlan(find("m12", "Folheie o livro"), "m12").child, null, "loose scenes cannot replace page turning");
const pointing = framePlan(find("m24", "Peça partes do corpo e figura"), "m24").child;
assert.equal(pointing?.kind, "scene");
if (pointing?.kind === "scene") assert.deepEqual(pointing.scenes, ["picture-cat"], "cat instruction must have a cat, not an arbitrary scene");
assert.equal(framePlan(find("y04", "Cópia de cruz"), "y04").model, "cruz");
assert.equal(framePlan(find("y05", "Cópia de quadrado"), "y05").model, "quadrado");
assert.equal(framePlan(find("y04", "Desenho de pessoa"), "y04").model, null, "free drawing must not supply a model");
assert.equal(framePlan(find("y05", "Letras conhecidas"), "y05").model, null, "no letter model for spontaneous writing");
assert.match(framePlan(find("y04", "Separe objetos parecidos"), "y04").materials[0].quantity, /^4 /);
assert.match(framePlan(find("y05", "Conte objetos"), "y05").materials[0].quantity, /^5 /);
assert.match(framePlan(find("m12", "Empilhar dois blocos"), "m12").materials[0].quantity, /^2 /);
assert.equal(preparationsForBand("m00").length, 0);
assert.equal(preparationsForBand("not-a-band").length, 0);
// A disabled print action must return before even accessing window or a DOM node.
assert.equal(printChildResource(null as unknown as HTMLElement, false), false);
const files = ["GuidedTaskCard.tsx", "FrameResources.tsx", "framePlan.ts", "guidedStyle.ts"];
const source = files.map((file) => readFileSync(`client/src/features/obs10/${file}`, "utf8")).join("\n");
assert.ok(!/dangerouslySetInnerHTML|\.innerHTML\s*=/.test(source));
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|SpeechRecognition|webkitSpeechRecognition)\s*\(|\b(?:localStorage|sessionStorage|indexedDB)\./.test(source));
assert.ok(!/setInterval|MediaRecorder|getUserMedia/.test(source), "the guide cannot create its own clock/recorder");
assert.ok(source.includes("min-height:56px"));
assert.ok(source.includes("prefers-reduced-motion"));
assert.ok(source.includes("onRecord(item, option.id, \"\")"), "category cannot manufacture literal response");
assert.ok(source.includes("taskOmission(item, months, proneAllowed)"));
const guide = readFileSync("client/src/features/obs10/PracticalGuide.tsx", "utf8");
assert.ok(guide.includes("GuidedTaskCard as PracticalTaskGuide"), "actual existing route must use the new guide");
assert.ok(guide.includes("<PreparationResources"));
console.log("OBS-10 guided resources: all 145 tasks, 13 age sheets, exact reading text, oral-only protection, physical materials and print guard passed.");
