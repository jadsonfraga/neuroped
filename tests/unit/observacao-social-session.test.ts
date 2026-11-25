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

test("idade fica vinculada à sessão após o primeiro registro", () => {
  let state = session(fresh, { type: "age", band: 1 });
  state = session(state, { type: "edit", field: "context", value: "Observação sintética" });
  assert.equal(session(state, { type: "age", band: 5 }), state);
});
test("anotação de vídeo fica separada da observação presencial e da hipótese", () => {
  let state = session(fresh, { type: "age", band: 0 });
  state = session(state, { type: "edit", field: "reaction", value: "Ao vivo" });
  state = session(state, { type: "edit", field: "video", value: "Vídeo 1 · 00:04 — gesto" });
  state = session(state, { type: "edit", field: "interpretation", value: "Possível convite" });
  assert.equal(state.records["0/0"].reaction, "Ao vivo");
  assert.equal(state.records["0/0"].interpretation, "Possível convite");
  assert.match(state.records["0/0"].video, /00:04/);
  const cleared = session(state, {type: "edit", field: "video", value: ""});
  assert.equal(cleared.records["0/0"].video, "");
  assert.equal(cleared.records["0/0"].reaction, "Ao vivo");
});
test("marca de tempo identifica o vídeo e rejeita duração indefinida", async () => {
  const { videoStamp } = await import("../../client/src/components/observacao-social/session.ts");
  assert.equal(videoStamp(2, 64.8), "Vídeo 2 · 01:04");
  assert.equal(videoStamp(1, Infinity), null);
  assert.equal(videoStamp(1, -1), null);
});
