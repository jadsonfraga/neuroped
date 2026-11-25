import assert from "node:assert/strict";
import test from "node:test";
import { assistantObservationLines, emptyAssistantObservation } from "../../client/src/lib/assistantObservation";
import { describeSocialScene, fresh, session } from "../../client/src/components/observacao-social/session";

test("mãos, cartões e apoios sugeridos nunca criam achados; linhas vazias são omitidas", () => {
  assert.deepEqual(assistantObservationLines(emptyAssistantObservation), []);
  assert.deepEqual(assistantObservationLines({ invitation: " Mostrei o gato. ", reaction: " ", support: "Usei a prancha habitual." }),
    ["Proposta realizada: Mostrei o gato.", "Apoio ou contexto: Usei a prancha habitual."]);
  assert.deepEqual(assistantObservationLines({ ...emptyAssistantObservation, reaction: "Entregou o livro ao cuidador." }),
    ["Observação direta: Entregou o livro ao cuidador."]);
});

test("brincadeira sem tela tem registro próprio, não herda título ou foco da atividade padrão", () => {
  let state = session(fresh, { type: "age", band: 0 });
  state = session(state, { type: "edit", field: "reaction", value: "Descrição do cesto." });
  state = session(state, { type: "open", scene: 3 });
  assert.equal(state.scene, 3);
  assert.deepEqual(Object.keys(state.records), ["0/0"]);
  state = session(state, { type: "edit", field: "invitation", value: "Ofereci o bichinho familiar." });
  assert.deepEqual(Object.keys(state.records), ["0/0", "0/3"]);
  assert.equal(state.records["0/0"].reaction, "Descrição do cesto.");
  assert.equal(state.records["0/3"].reaction, "");
  assert.equal(describeSocialScene(0, 3), "12–17 meses · Brincadeira sem tela");
  assert.equal(describeSocialScene(0, 4), null);
  assert.equal(session(state, { type: "open", scene: 4 }), state);
  assert.deepEqual(session(state, { type: "reset" }), fresh);
});
