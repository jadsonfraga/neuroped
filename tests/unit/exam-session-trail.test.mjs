import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = path => readFileSync(new URL("../../client/src/" + path, import.meta.url), "utf8");

test("as duas fichas têm os mesmos atalhos opcionais e alvos de teclado", () => {
  for (const [path, prefix, activities] of [
    ["pages/exame-por-idade.tsx", "exam", "exam-simple"],
    ["pages/exame-via-assistente.tsx", "assistant-exam", "assistant-exam-activities"],
  ]) {
    const page = source(path);
    assert.match(page, /<ExamSessionTrail/, path + ": falta a trilha");
    for (const [label, id] of [["Preparar", prefix + "-prepare"], ["Atividades", activities], ["Revisar", prefix + "-review"]]) {
      assert.ok(page.includes('label: "' + label + '", target: "' + id + '"'));
      assert.match(page, new RegExp('id="' + id + '"[^>]*tabIndex=\\{-1\\}'));
    }
  }
});

test("a trilha social só reflete a etapa e não aparece no estímulo", () => {
  const page = source("components/observacao-social/ObservacaoSocial.tsx");
  const view = page.slice(page.indexOf("return <article"));
  assert.match(view, /<ExamSessionTrail\b[^>]*current=\{stage\}/);
  const dialogue = view.slice(view.indexOf("<dialog"), view.indexOf("</dialog>") + 9);
  assert.doesNotMatch(dialogue, /ExamSessionTrail/);
  assert.match(dialogue, /<ParticipantPace/);
});
