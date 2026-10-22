import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { PRECONSULTA_IDS, PRECONSULTA_MISSOES, tarefasDaAssistente } from "../../client/src/features/super-neuropad/preconsulta";
import { conceptKey, INTEGRATED_BANK, PHASE_ORDER } from "../../client/src/features/super-neuropad/bank";
import { opcionaisDaIdade, opcionaisSemRedundancia, proximoPendenteNaLista } from "../../client/src/features/super-neuropad/extensao";

const atosMedicos = new Set([
  "vision", "fundus", "face", "hearing", "shoulders", "meningeal", "posture",
  "strength2p", "strength6", "reflex", "sensation", "stereognosis",
  "dismetria2", "finger6", "romberg", "gait6", "growth", "risk",
]);

test("pré-consulta: cobertura anual 2–17 com roteiro enxuto e sem atos médicos", () => {
  assert.equal(new Set(PRECONSULTA_IDS).size, PRECONSULTA_IDS.length);
  for (let age = 2; age <= 17; age++) {
    const tasks = tarefasDaAssistente(age);
    assert.ok(tasks.length >= 7 && tasks.length <= 10, `idade ${age}: ${tasks.length} observações`);
    assert.equal(new Set(tasks.map((task) => task.id)).size, tasks.length);
    assert.ok(tasks.every((task) => !atosMedicos.has(task.id)));
    assert.ok(tasks.some((task) => task.area === "neurologico"));
    assert.ok(tasks.some((task) => task.area === "mental"));
    assert.equal(tarefasDaAssistente(age, "neurologico").length + tarefasDaAssistente(age, "mental").length, tasks.length);
  }
  assert.deepEqual(tarefasDaAssistente(1), []);
  assert.deepEqual(tarefasDaAssistente(18), []);
});

test("pré-consulta: cada missão tem convite, materiais, momento e instruções de uso imediato", () => {
  assert.deepEqual(Object.keys(PRECONSULTA_MISSOES).sort(), [...PRECONSULTA_IDS].sort());
  for (const [id, missao] of Object.entries(PRECONSULTA_MISSOES)) {
    assert.ok(missao.convite.length > 15, id);
    assert.ok(missao.momento.length > 15, id);
    assert.ok(missao.material.length > 5, id);
    assert.equal(missao.passos.length, 3, id);
    assert.ok(missao.pistas.length >= 3, id);
    assert.equal(new Set(missao.pistas).size, missao.pistas.length);
    const instructions = [...missao.passos, ...missao.pistas].join(" ");
    assert.doesNotMatch(instructions, /oftalmoscópio|martelo|reflexo plantar|rigidez de nuca|concluir diagnóstico/i, id);
  }
});

test("pré-consulta: não duplica a bateria e não mascara exames clínicos", () => {
  const code = readFileSync("client/src/features/super-neuropad/ClinicalCircuit.tsx", "utf8");
  assert.match(code, /perfilOperador === "assistente" \? tarefasDaAssistente/);
  assert.match(code, /perfilOperador === "medico"/);
  assert.match(code, /Observe enquanto a criança joga; não refaça testes/);
  assert.match(code, /O exame médico permanece pendente e separado/);
  assert.match(code, /missaoRapida\.convite/);
  assert.match(code, /role="progressbar"/);
  assert.match(code, /RESULTADOS_ASSISTENTE/);
  assert.match(code, /perfilOperador === "medico" && <label/);
  assert.match(code, /perfilOperador === "medico" && task\.video/);
  assert.doesNotMatch(code, /localStorage|sessionStorage|MediaRecorder|getUserMedia/);
});

test("opcionais: a seleção padrão não reapresenta conceitos da bateria nem repete os seus próprios", () => {
  for (let age = 2; age <= 17; age++) {
    const todos = opcionaisDaIdade(age);
    const exibidos = opcionaisSemRedundancia(age);
    assert.ok(exibidos.length > 0 && exibidos.length <= todos.length, `idade ${age}: seleção válida`);
    const vistos = new Set(PHASE_ORDER.flatMap((phaseId) => INTEGRATED_BANK[age][phaseId]).map(conceptKey));
    for (const { item } of exibidos) {
      const chave = conceptKey(item);
      assert.ok(!vistos.has(chave), `idade ${age}: conceito repetido: ${item.prompt}`);
      vistos.add(chave);
    }
    assert.ok(exibidos.every((entry) => todos.some((other) => other.item.id === entry.item.id)));
    assert.equal(proximoPendenteNaLista(exibidos, {}), exibidos[0].item.id);
    assert.equal(proximoPendenteNaLista([], {}), null);
  }
});
