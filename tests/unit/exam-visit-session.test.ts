import assert from "node:assert/strict";
import test from "node:test";
import { examBands } from "../../client/src/data/exame-por-idade";
import { initialExam, examVisit, summarizeExam, examStatuses } from "../../client/src/lib/examVisitSession";

const ages = examBands.map(band => band.age);
const preschool = ages.indexOf("3 anos");

test("idade tem seleção explícita e só muda em sessão sem registros", () => {
  const active = examVisit(initialExam, { type: "select", band: preschool });
  const reviewed = examVisit(active, { type: "record", step: 0, status: "direct" });
  assert.strictEqual(examVisit(reviewed, { type: "select", band: preschool + 1 }), reviewed);
  assert.deepEqual(examVisit(reviewed, { type: "finish" }), initialExam);
  const next = examVisit(examVisit(reviewed, { type: "finish" }), { type: "select", band: preschool });
  assert.deepEqual(next.records, {});
});

test("todos os perfis produzem síntese vazia até existir registro explícito", () => {
  for (let band = 0; band < ages.length; band++) {
    const active = examVisit(initialExam, { type: "select", band });
    assert.equal(summarizeExam(active).length, 0);
  }
  assert.strictEqual(examVisit(initialExam, { type: "select", band: -1 }), initialExam);
  assert.strictEqual(examVisit(initialExam, { type: "select", band: ages.length }), initialExam);
  assert.strictEqual(examVisit(initialExam, { type: "record", step: 0, status: "direct" }), initialExam);
});

test("classifica origem, apoio e limites sem inferir exame normal nem inventar resultado", () => {
  let state = examVisit(initialExam, { type: "select", band: preschool });
  state = examVisit(state, { type: "record", step: 1, note: "   " });
  assert.deepEqual(state.records, {});
  state = examVisit(state, { type: "record", step: 1, status: "assisted", note: "Exemplo: após demonstração." });
  state = examVisit(state, { type: "record", step: 2, status: "reported", note: "Relato sintético." });
  state = examVisit(state, { type: "record", step: 3, status: "noOpportunity" });
  state = examVisit(state, { type: "record", step: 4, status: "stopped" });
  state = examVisit(state, { type: "record", step: 0, note: "Nota sem classificação." });
  assert.strictEqual(examVisit(state, { type: "record", step: 6, status: "direct" }), state);
  const lines = summarizeExam(state);
  assert.equal(lines.length, 5);
  assert.deepEqual(lines.map(x => x.status), ["Registro sem classificação", examStatuses.assisted, examStatuses.reported, examStatuses.noOpportunity, examStatuses.stopped]);
  assert.doesNotMatch(JSON.stringify(lines), /normal|diagnóstico/i);
  assert.equal(lines[1].note, "Exemplo: após demonstração.");
  assert.equal(examVisit(state, { type: "record", step: 1, status: "", note: "" }).records[1], undefined);
});
