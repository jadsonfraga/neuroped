import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { examExamples, socialAlternatives } from "../../client/src/data/clinicalAssistantGuide";
import { examBands } from "../../client/src/data/exame-por-idade";

test("todos os cartões guiados e faixas médicas têm exemplo fictício, sem escrever no registro", async () => {
  let data;
  try { data = await import("../../client/src/data/examTeachingAids.ts"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ERR_MODULE_NOT_FOUND") throw error; }
  assert.ok(data, "falta o catálogo de figuras e exemplos");
  const guided = Object.values(examExamples).flat();
  assert.equal(guided.length, 34);
  for (const { title } of guided) assert.ok(data.guidedTeaching[title]?.example, title);
  assert.deepEqual(Object.keys(data.medicalTeaching), examBands.map(x => x.age));
  assert.deepEqual(Object.keys(data.socialTeaching), Object.keys(socialAlternatives));
  assert.equal(new Set(Object.values(data.guidedTeaching).map(x => x.example)).size, 34);
});

const source = (path: string) => readFileSync(new URL("../../client/src/" + path, import.meta.url), "utf8");
test("a ajuda é opcional, usa SVG local e fica fora de toda tela da criança", () => {
  for (const path of ["components/ClinicalAssistantCards.tsx", "components/observacao-social/ObservacaoSocial.tsx", "pages/exame-por-idade.tsx"]) {
    const file = source(path); assert.match(file, /<ExamTeachingAid\b/, path);
    for (const part of file.matchAll(/<dialog\b[\s\S]*?<\/dialog>/g)) assert.doesNotMatch(part[0], /ExamTeachingAid/);
  }
  const view = source("components/ExamTeachingAid.tsx");
  assert.match(view, /<svg\b[\s\S]*viewBox=/);
  assert.match(view, /<details[\s\S]*<summary/);
  assert.match(view, /Exemplo fictício/);
  assert.doesNotMatch(view, /onNote|dispatch|<textarea|fetch\(/);
});
