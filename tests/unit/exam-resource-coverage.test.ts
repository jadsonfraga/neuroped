import assert from "node:assert/strict";
import { test } from "node:test";
import { examBands } from "../../client/src/data/exame-por-idade";
import { examExamples } from "../../client/src/data/clinicalAssistantGuide";
import { assistantExamResources, medicalExamResources, examVisuals, materialChecklist } from "../../client/src/data/examResources";

test("each existing activity has preparation and resource coverage, without age-key drift", () => {
  assert.equal(examBands.length, 17);
  assert.deepEqual(Object.keys(assistantExamResources), examBands.map(band => band.age));
  assert.deepEqual(Object.keys(medicalExamResources), examBands.map(band => band.age));
  for (const [i, { age, steps }] of examBands.entries()) {
    const assistant = assistantExamResources[age];
    const medical = medicalExamResources[age];
    assert.equal(assistant.length, examExamples[age].length);
    assert.equal(medical.length, steps.length);
    assistant.forEach((activity, position) => {
      assert.equal(activity.title, examExamples[age][position].title);
      assert.ok(activity.preparation);
      if (i < 8) assert.equal(activity.visual, undefined, "não apresentar tela a menores de 2 anos");
    });
    medical.forEach((activity, position) => {
      assert.equal(activity.title, steps[position].title);
      assert.ok(activity.preparation);
      if (i < 8 || position > 2) assert.equal(activity.visual, undefined);
    });
    for (const activity of [...assistant, ...medical]) {
      assert.ok(activity.materials.length > 0 || activity.visual || activity.preparation.includes("Sem material"));
      if (activity.visual) assert.ok(examVisuals[activity.visual]);
    }
    const kit = materialChecklist([...assistant, ...medical]);
    assert.equal(kit.length, new Set(kit).size, "lista sem duplicatas");
  }
});

test("materiais de manobras presenciais nunca são trocados por cartão", () => {
  assert.ok(medicalExamResources["Nascimento a 27 dias"][3].materials.some(item => /fita/i.test(item)));
  assert.ok(medicalExamResources["6 a 8 anos"][4].materials.some(item => /martelo/i.test(item)));
  assert.ok(medicalExamResources["18 a 19 anos"][5].materials.some(item => /lanterna/i.test(item)));
});
