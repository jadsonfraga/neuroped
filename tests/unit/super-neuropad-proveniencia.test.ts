import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  CIRCUIT_TASKS, circuitForAge, fontesDaTarefa, FONTES_POR_EXECUTOR, missoesPreConsulta, textoPreConsulta, type CircuitRecords,
} from "../../client/src/features/super-neuropad/clinicalCircuit";

test("fontes por executor: auxiliar observa, secretaria relata, só o médico registra exame direto", () => {
  for (const task of CIRCUIT_TASKS) {
    const fontes = fontesDaTarefa(task);
    assert.ok(fontes.length >= 2, `${task.id}: fontes`);
    if (task.executor === "auxiliar") assert.ok(!fontes.includes("examinador") && !fontes.includes("cuidador") && !fontes.includes("escola"), task.id);
    if (task.executor === "secretaria") assert.ok(!fontes.includes("examinador") && !fontes.includes("auxiliar"), task.id);
    if (task.executor === "medico") assert.deepEqual([...fontes], ["examinador", "outra"], task.id);
  }
  assert.deepEqual([...FONTES_POR_EXECUTOR.secretaria], ["cuidador", "escola", "outra"]);
});

test("sono e marcos do desenvolvimento não aceitam observação direta da auxiliar", () => {
  for (const id of ["sleep", "milestones"]) {
    const task = CIRCUIT_TASKS.find((entry) => entry.id === id);
    assert.ok(task, id);
    assert.equal(task.executor, "secretaria", id);
    assert.ok(!fontesDaTarefa(task).includes("auxiliar"), `${id} aceita observação direta da auxiliar`);
  }
});

test("relatório da pré-consulta: sem exame do médico, sem matriz e identificado como não laudo", () => {
  const records: CircuitRecords = {
    rapport: { status: "observado", note: "Contato espontâneo.", source: "auxiliar" },
    sleep: { status: "achado", note: "Relata despertares noturnos.", source: "cuidador" },
    fundus: { status: "observado", note: "Exame do médico sintético.", source: "examinador" },
  };
  const texto = textoPreConsulta(7, records, new Date("2026-10-22T12:00:00.000Z"));
  assert.match(texto, /REGISTRO OBSERVACIONAL DA PRÉ-CONSULTA/);
  assert.match(texto, /NÃO é laudo, NÃO é síntese médica e NÃO contém exame do médico/);
  assert.match(texto, /Contato espontâneo\./);
  assert.match(texto, /Relata despertares noturnos\./);
  assert.doesNotMatch(texto, /Exame do médico sintético/, "exame do médico não entra na pré-consulta");
  assert.doesNotMatch(texto, /PRONTIDÃO|COBERTURA|Sinais de urgência|CIRCUITO CLÍNICO OBRIGATÓRIO/);
  assert.match(texto, /Missões registradas: 2\/\d+/);
});

test("pré-consulta sem registros não inventa conteúdo", () => {
  const texto = textoPreConsulta(9, {});
  assert.match(texto, /Missões registradas: 0\//);
  assert.match(texto, /Nenhum registro de pré-consulta\./);
});

test("componente: escolhas de fonte vêm de fontesDaTarefa e a exportação do médico fica separada da pré-consulta", () => {
  const component = readFileSync("client/src/features/super-neuropad/ClinicalCircuit.tsx", "utf8");
  assert.doesNotMatch(component, /Object\.entries\(CIRCUIT_SOURCES\)/, "nenhuma escolha de fonte pode ignorar o executor");
  assert.match(component, /fontesDaTarefa\(task\)/);
  assert.match(component, /Copiar registro da pré-consulta/);
  assert.match(component, /Baixar TXT da pré-consulta/);
  assert.match(component, /Copiar registro clínico do médico/);
  assert.match(component, /tab === "medico" \|\| tab === "cobertura"/, "exportação clínica só nas abas do médico");
});

test("pré-consulta usa o catálogo de missões da auxiliar e da secretaria", () => {
  for (let age = 2; age <= 17; age++) {
    const esperado = circuitForAge(age).filter((task) => task.executor !== "medico").length;
    assert.equal(missoesPreConsulta(age).length, esperado, `idade ${age}`);
  }
});
