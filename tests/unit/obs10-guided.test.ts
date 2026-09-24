import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AGE_BANDS, MAX_SECONDS, OBS10_VERSION } from "../../client/src/features/obs10/protocol";
import { PRACTICAL_TASKS, validatePracticalCoverage } from "../../client/src/features/obs10/practical";
import { framePlan, preparationsForBand, resourceIssues, taskHandoff } from "../../client/src/features/obs10/framePlan";
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
    const paper = plan.materials.find((item) => item.id === "paper");
    if (paper && !plan.model) assert.doesNotMatch(paper.quantity + paper.detail, /modelo/i, "paper supply must not introduce a model to a non-copying task");
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
const material = (band: string, title: string, id: string) => { const entry = framePlan(find(band, title), band).materials.find((item) => item.id === id); assert.ok(entry); return entry; };
assert.match(material("y05", "Cópia de quadrado", "paper").quantity, /modelo/);
assert.match(material("y06", "Amostra de leitura e escrita", "paper").quantity, /texto/);
assert.match(material("y09", "Amostra de leitura e escrita", "paper").quantity, /texto/);
for (const [band, title] of [["y04", "Desenho de pessoa"], ["y05", "Letras conhecidas"], ["y12", "Amostra de leitura e escrita"]]) assert.match(material(band, title, "paper").quantity, /^1 folha em branco/);
assert.equal(material("m12", "Ofereça uma escolha", "blocks").quantity, "1 bloco grande");
assert.equal(material("m12", "Observe o deslocamento habitual", "blocks").quantity, "1 bloco grande");
assert.equal(material("m06", "Apresente o brinquedo devagar", "target").quantity, "1 brinquedo grande");
assert.equal(material("m06", "Dois brinquedos, duas mãos", "target").quantity, "2 brinquedos grandes");
assert.equal(preparationsForBand("m00").length, 0);
assert.equal(preparationsForBand("not-a-band").length, 0);
// A disabled print action must return before even accessing window or a DOM node.
assert.equal(printChildResource(null as unknown as HTMLElement, false), false);
// Transitions describe only what changes hands between consecutive tasks; fixed furniture and camera never churn.
const STATIONARY_LABELS = ["Celular + suporte", "Colchonete firme", "Cadeira estável", "Trajeto livre e duas marcas"];
for (const [bandId, tasks] of Object.entries(PRACTICAL_TASKS)) {
  for (const task of tasks) {
    const before = JSON.stringify(task);
    const hand = taskHandoff(bandId, task.id);
    assert.equal(JSON.stringify(task), before, "handoff planning is pure");
    if (!hand) { assert.equal(task.id, tasks[tasks.length - 1].id, "only the last card has no next task"); continue; }
    for (const label of [...hand.pick, ...hand.stow]) assert.ok(!STATIONARY_LABELS.includes(label), `${task.id}: stationary item churned`);
  }
}
const readingHandoff = taskHandoff("y06", find("y06", "Amostra de leitura e escrita").id);
assert.equal(readingHandoff?.nextTitle, "Observe os movimentos das mãos");
assert.equal(readingHandoff?.sameBlock, true);
assert.deepEqual(readingHandoff?.pick, []);
assert.deepEqual(readingHandoff?.stow, ["Folhas em branco", "Lápis"]);
const crossBlock = taskHandoff("y05", find("y05", "Conte objetos").id);
assert.equal(crossBlock?.sameBlock, false);
assert.equal(crossBlock?.nextTitle, "Alvo e sorriso");
assert.deepEqual(crossBlock?.pick, ["Lápis"]);
assert.deepEqual(crossBlock?.stow, ["Blocos grandes"]);
assert.equal(taskHandoff("not-a-band", "x"), null);
assert.equal(taskHandoff("y06", "not-a-task"), null);
// The full-screen stimulus surface can never reach commands, tasks or session state.
const stage = readFileSync("client/src/features/obs10/StimulusStage.tsx", "utf8");
assert.ok(!/\.\/practical|\.\/protocol|\.\/session/.test(stage), "stimulus surface must not import commands or records");
assert.ok(stage.includes('role="dialog"') && stage.includes("aria-modal"));
assert.ok(stage.includes("Encerrar exibição"));
const cardSource = readFileSync("client/src/features/obs10/GuidedTaskCard.tsx", "utf8");
assert.ok(cardSource.includes("screenAllowed={running}"), "screen display only while the collection runs; finished blocks new attempts");
assert.ok(cardSource.includes("obs10-next-up"));
const resources = readFileSync("client/src/features/obs10/FrameResources.tsx", "utf8");
assert.ok(resources.includes("screen={screenAllowed}") && resources.includes("screen={!locked}"));
const files = ["GuidedTaskCard.tsx", "FrameResources.tsx", "framePlan.ts", "guidedStyle.ts", "StimulusStage.tsx"];
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
