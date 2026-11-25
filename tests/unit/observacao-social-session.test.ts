import assert from "node:assert/strict";
import test from "node:test";
import { fresh, session } from "../../client/src/components/observacao-social/session.ts";

test("escolha explícita da idade e navegação não inferem observação clínica", () => {
  assert.equal(fresh.band, null);
  assert.equal(session(fresh, { type: "open", scene: 0 }), fresh);
  const start = session(fresh, { type: "age", band: 5 });
  const prepare = session(start, { type: "open", scene: 1 });
  assert.equal(prepare.stage, "prepare");
  const record = session(prepare, { type: "stage", stage: "record" });
  assert.deepEqual(record.records, {});
});
test("revisitar, editar, apagar e encerrar preservam o vínculo com cada atividade", () => {
  let state = session(fresh, { type: "age", band: 0 });
  state = session(state, { type: "edit", field: "reaction", value: "Exemplo A" });
  state = session(state, { type: "open", scene: 2 });
  state = session(state, { type: "edit", field: "context", value: "Exemplo B" });
  state = session(state, { type: "stage", stage: "review" });
  assert.equal(state.records["0/0"].reaction, "Exemplo A");
  assert.equal(state.records["0/2"].context, "Exemplo B");
  state = session(state, { type: "edit", field: "context", value: " " });
  assert.deepEqual(Object.keys(state.records), ["0/0"]);
  assert.deepEqual(session(state, { type: "reset" }), fresh);
});
