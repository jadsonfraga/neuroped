import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { CIRCUIT_TASKS } from "../../client/src/features/super-neuropad/clinicalCircuit";
import { ESTACOES_SEM_MISSAO, MISSOES } from "../../client/src/features/super-neuropad/missoes";

const ESTADO_PROIBIDO = /sinais de alerta|dentro do esperado|esperado para a|\bnormal\b|normalidade|escore|diagnóstic|ponto de corte|percentil/i;

test("cobertura: toda missão da auxiliar tem brincadeira; exame físico e entrevista reservada ficam sem missão", () => {
  const ids = CIRCUIT_TASKS.map((task) => task.id);
  for (const task of CIRCUIT_TASKS) {
    if (task.executor === "auxiliar") assert.ok(MISSOES[task.id], `missão ausente para ${task.id}`);
    else assert.equal(MISSOES[task.id], undefined, `${task.id} é do médico e não vira missão da auxiliar`);
  }
  for (const id of Object.keys(MISSOES)) assert.ok(ids.includes(id), `missão órfã ${id}`);
  assert.deepEqual([...ESTACOES_SEM_MISSAO].sort(), CIRCUIT_TASKS.filter((task) => task.executor === "medico").map((task) => task.id).sort());
  assert.equal(MISSOES.risk, undefined, "a entrevista de risco não é gamificada");
});

test("passos e marcadores: 3 a 4 passos em linguagem de jogo e 3 a 6 marcadores únicos por missão", () => {
  for (const [id, missao] of Object.entries(MISSOES)) {
    assert.ok(missao.passos.length >= 3 && missao.passos.length <= 4, `${id}: passos`);
    assert.ok(missao.pistas.length >= 3 && missao.pistas.length <= 6, `${id}: marcadores`);
    assert.equal(new Set(missao.pistas).size, missao.pistas.length, `${id}: marcadores repetidos`);
    for (const passo of missao.passos) assert.ok(passo.length > 25, `${id}: passo curto demais`);
    for (const pista of missao.pistas) assert.ok(pista.length >= 4 && pista.length <= 48, `${id}: marcador ${pista}`);
  }
});

test("linguagem: nenhuma missão afirma normalidade, escore ou diagnóstico", () => {
  for (const [id, missao] of Object.entries(MISSOES)) {
    for (const texto of [...missao.passos, ...missao.pistas]) {
      assert.doesNotMatch(texto, ESTADO_PROIBIDO, `${id}: ${texto}`);
    }
  }
});

test("sem bloqueios: a interface não tem nenhum controle desabilitado e mantém a navegação e o registro livres", () => {
  const component = readFileSync("client/src/features/super-neuropad/ClinicalCircuit.tsx", "utf8");
  assert.doesNotMatch(component, /\bdisabled\b/, "nenhum controle pode ficar desabilitado");
  assert.doesNotMatch(component, /\baria-disabled\b/);
  assert.match(component, /nenhuma etapa trava a próxima/);
  assert.match(component, /Escolha o resultado para incluir esta missão/);
  assert.doesNotMatch(component, /Pendências para revisão[^"`]*bloque/i);
});

test("gamificação: passos e marcadores são tocáveis, resultado em quatro escolhas e fonte sugerida sem obrigar", () => {
  const component = readFileSync("client/src/features/super-neuropad/ClinicalCircuit.tsx", "utf8");
  assert.match(component, /Passo a passo da brincadeira/);
  assert.match(component, /Passo a passo do examinador/);
  assert.match(component, /Toque no que você percebeu/);
  assert.match(component, /⭐ Conseguiu/);
  assert.match(component, /🤔 Teve dificuldade/);
  assert.match(component, /🙅 Não quis agora/);
  assert.match(component, /🚫 Não deu para fazer/);
  assert.doesNotMatch(component, /\?\? "examinador"/, "a fonte não é preenchida automaticamente");
  assert.match(component, /Orientação clínica completa/);
  assert.match(component, /Anotação livre \(obrigatória em/);
  assert.doesNotMatch(component, /\(opcional\)|Circuito opcional|Missões clínicas extras/, "nada do circuito é apresentado como opcional");
});

test("risco continua fora da gamificação: entrevista profissional sem passos de brincadeira", () => {
  const risk = CIRCUIT_TASKS.find((task) => task.id === "risk");
  assert.ok(risk);
  assert.equal(risk.method, "entrevista");
  assert.match(risk.safety ?? "", /NÃO é um jogo/);
});

test("prática: convite em voz alta, material e tempo em toda missão; sem termo técnico para a auxiliar", () => {
  const TECNICO = /dismetria|disdiadococinesia|Romberg|tandem|pronação|oftalmoscóp|anisocoria|nistagmo|estereognosia|hipotonia|espasticidade|fotorreação|ataxia|coreia|distonia/i;
  for (const [id, missao] of Object.entries(MISSOES)) {
    assert.ok(missao.fala.length >= 20 && missao.fala.length <= 140, `${id}: convite`);
    assert.ok(missao.material.length >= 3, `${id}: material`);
    assert.ok(missao.minutos >= 2 && missao.minutos <= 5, `${id}: minutos`);
    for (const texto of [missao.fala, missao.material, ...missao.passos, ...missao.pistas]) assert.doesNotMatch(texto, TECNICO, `${id}: ${texto}`);
  }
});

test("sem repetição: nenhuma missão da auxiliar repete passo ou marcador de outra no mesmo ciclo etário", () => {
  const norm = (texto: string) => texto.toLowerCase().replace(/[^a-zà-ÿ ]/g, "").trim();
  const quase = (a: string, b: string) => {
    const wa = new Set(norm(a).split(/\s+/)), wb = new Set(norm(b).split(/\s+/));
    const comuns = [...wa].filter((w) => wb.has(w)).length;
    return comuns / Math.min(wa.size, wb.size) >= 0.8;
  };
  for (let age = 2; age <= 17; age++) {
    const passos: [string, string][] = [];
    for (const task of CIRCUIT_TASKS.filter((entry) => entry.executor === "auxiliar" && age >= entry.min && age <= entry.max)) {
      for (const passo of MISSOES[task.id].passos) passos.push([task.id, passo]);
    }
    for (let i = 0; i < passos.length; i++) {
      for (let j = i + 1; j < passos.length; j++) {
        if (passos[i][0] !== passos[j][0]) assert.ok(!quase(passos[i][1], passos[j][1]), `idade ${age}: ${passos[i][0]} repete ${passos[j][0]}: "${passos[i][1]}"`);
      }
    }
  }
});

test("quantidade prática: de 13 a 16 missões da auxiliar por idade, bem abaixo do circuito completo", () => {
  for (let age = 2; age <= 17; age++) {
    const auxiliar = CIRCUIT_TASKS.filter((task) => task.executor === "auxiliar" && age >= task.min && age <= task.max);
    assert.ok(auxiliar.length >= 13 && auxiliar.length <= 16, `idade ${age}: ${auxiliar.length}`);
    const minutos = auxiliar.reduce((soma, task) => soma + MISSOES[task.id].minutos, 0);
    assert.ok(minutos <= 50, `idade ${age}: ${minutos} min`);
  }
});
