import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildCircuitReport, circuitForAssistant, type CircuitStatus } from "../../client/src/features/super-neuropad/clinicalCircuit";
import {
  camposPendentes, CAMPO_LABELS, DESCRICAO_ACHADO_MINIMA, detalheObrigatorio, linhaObrigatorio, resumoObrigatorio,
  type EstadoMissao,
} from "../../client/src/features/super-neuropad/obrigatorio";

const completa = (status: CircuitStatus = "observado"): EstadoMissao => ({ status, source: "examinador", marcadores: ["marcador"], descricao: "Descrição objetiva do achado em frase completa." });

test("missão: resultado e quem informou são sempre obrigatórios", () => {
  assert.deepEqual(camposPendentes({}), ["resultado", "fonte"]);
  assert.deepEqual(camposPendentes({ status: "nao_realizado" }), ["fonte"]);
  assert.deepEqual(camposPendentes({ source: "cuidador" }), ["resultado"]);
});

test("missão realizada exige marcador ou descrição; achado exige descrição do achado", () => {
  assert.deepEqual(camposPendentes({ status: "observado", source: "examinador" }), ["marcador_ou_descricao"]);
  assert.deepEqual(camposPendentes({ status: "observado", source: "examinador", marcadores: ["x"] }), []);
  assert.deepEqual(camposPendentes({ status: "observado", source: "examinador", descricao: "  texto  " }), []);
  assert.deepEqual(camposPendentes({ status: "observado", source: "examinador", descricao: "   " }), ["marcador_ou_descricao"]);
  // Achado: marcador sozinho não basta; a descrição precisa ter o mínimo de caracteres.
  assert.deepEqual(camposPendentes({ status: "achado", source: "examinador", marcadores: ["x"] }), ["descricao_do_achado"]);
  assert.deepEqual(camposPendentes({ status: "achado", source: "examinador", descricao: "curto" }), ["descricao_do_achado"]);
  assert.deepEqual(camposPendentes({ status: "achado", source: "examinador", descricao: "x".repeat(DESCRICAO_ACHADO_MINIMA) }), []);
});

test("tarefa não realizada ou sem colaboração conclui com resultado e quem informou, sem exigir marcador", () => {
  for (const status of ["nao_realizado", "nao_colaborou"] as const) {
    assert.deepEqual(camposPendentes({ status, source: "examinador", marcadores: ["resíduo"] }), [], status);
  }
});

test("resumo: todas as estações da faixa são obrigatórias, de 2 a 17 anos, e a síntese também", () => {
  for (let age = 2; age <= 17; age++) {
    const tarefas = circuitForAssistant(age);
    const vazio = resumoObrigatorio(age, {}, "");
    assert.equal(vazio.total, tarefas.length, `idade ${age}`);
    assert.equal(vazio.concluidas, 0, `idade ${age}: nada começa concluído`);
    assert.equal(vazio.pendencias.length, tarefas.length);
    assert.equal(vazio.completo, false);
    const estados = Object.fromEntries(tarefas.map((tarefa) => [tarefa.id, completa()]));
    const semSintese = resumoObrigatorio(age, estados, "   ");
    assert.equal(semSintese.concluidas, tarefas.length, `idade ${age}: todas concluídas`);
    assert.equal(semSintese.completo, false, `idade ${age}: sem síntese não é completo`);
    assert.equal(resumoObrigatorio(age, estados, "Síntese do examinador.").completo, true, `idade ${age}`);
  }
});

test("resumo: uma pendência isolada derruba o circuito para incompleto e é nomeada", () => {
  const tarefas = circuitForAssistant(9);
  const estados = Object.fromEntries(tarefas.map((tarefa) => [tarefa.id, completa()]));
  const alvo = tarefas[3];
  estados[alvo.id] = { ...completa("achado"), descricao: "curto" };
  const resumo = resumoObrigatorio(9, estados, "Síntese.");
  assert.equal(resumo.completo, false);
  assert.equal(resumo.concluidas, tarefas.length - 1);
  assert.deepEqual(resumo.pendencias.map((pendencia) => [pendencia.id, pendencia.faltam]), [[alvo.id, ["descricao_do_achado"]]]);
});

test("texto: declara COMPLETO ou INCOMPLETO, lista as pendências e afirma que não trava nem libera documento", () => {
  const tarefas = circuitForAssistant(7);
  const incompleto = resumoObrigatorio(7, { [tarefas[0].id]: completa() }, "");
  const linha = linhaObrigatorio(incompleto);
  assert.match(linha, new RegExp(`^CIRCUITO CLÍNICO OBRIGATÓRIO: INCOMPLETO — 1 de ${tarefas.length} missões concluídas; síntese do examinador pendente\\.$`));
  const detalhe = detalheObrigatorio(incompleto).join("\n");
  assert.ok(detalhe.includes(`${tarefas[1].title}: falta ${CAMPO_LABELS.resultado}`), "cada pendência é nomeada com o campo que falta");
  assert.match(detalhe, /Síntese final do examinador: falta registrar\./);
  assert.match(detalhe, /Obrigatório não trava a interface nem libera documento/);
  const completo = resumoObrigatorio(7, Object.fromEntries(tarefas.map((tarefa) => [tarefa.id, completa()])), "Síntese.");
  assert.match(linhaObrigatorio(completo), /COMPLETO — \d+ de \d+ missões concluídas; síntese do examinador registrada\./);
  assert.doesNotMatch(detalheObrigatorio(completo).join("\n"), /falta/);
});

test("relatório: o cabeçalho recebe a linha de status obrigatório sem alterar chamadas antigas", () => {
  const resumo = resumoObrigatorio(7, {}, "");
  const relatorio = buildCircuitReport(7, {}, "", new Date("2026-10-21T12:00:00.000Z"), [linhaObrigatorio(resumo)]);
  assert.match(relatorio, /CIRCUITO CLÍNICO OBRIGATÓRIO: INCOMPLETO — 0 de \d+ missões concluídas/);
  assert.doesNotMatch(buildCircuitReport(7, {}, "", new Date("2026-10-21T12:00:00.000Z")), /CIRCUITO CLÍNICO OBRIGATÓRIO/);
});

test("obrigatório sem bloqueio: nenhum controle desabilitado e nada apresentado como opcional na interface", () => {
  const componente = readFileSync("client/src/features/super-neuropad/ClinicalCircuit.tsx", "utf8");
  const pagina = readFileSync("client/src/pages/super-neuropad-game.tsx", "utf8");
  assert.doesNotMatch(componente, /\bdisabled\b|\baria-disabled\b/);
  assert.doesNotMatch(componente, /\(opcional\)|Circuito opcional|Missões clínicas extras/);
  assert.match(componente, /Missões da pré-consulta/);
  assert.match(componente, /nenhuma etapa trava a próxima/);
  assert.match(componente, /MissaoStatus/);
  assert.match(componente, /ObrigatoriosPanel/);
  assert.doesNotMatch(pagina, /missões extras|opcional, fora da partida/);
  assert.match(pagina, /Circuito clínico obrigatório/);
  assert.match(pagina, /onProgresso=\{setCircuito\}/);
  assert.match(pagina, /screen === "phase-done"/, "o circuito aparece entre os mundos");
});

test("módulo obrigatório é puro: sem armazenamento, rede ou captura", () => {
  const fonte = readFileSync("client/src/features/super-neuropad/obrigatorio.ts", "utf8");
  assert.doesNotMatch(fonte, /(localStorage|sessionStorage|MediaRecorder|getUserMedia|fetch\(|XMLHttpRequest)/);
});
