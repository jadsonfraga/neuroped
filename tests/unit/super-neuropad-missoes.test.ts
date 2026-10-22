import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { CIRCUIT_TASKS, missoesPreConsulta } from "../../client/src/features/super-neuropad/clinicalCircuit";
import { ESTACOES_SEM_MISSAO, MISSOES } from "../../client/src/features/super-neuropad/missoes";

/** Texto de cada missão: convite, material, passos e marcadores, mais o roteiro de cada idade da secretaria. */
const textosDe = (missao: (typeof MISSOES)[string]): string[] => [
  missao.fala, missao.material, ...missao.passos, ...missao.pistas, ...Object.values(missao.roteiroPorIdade ?? {}).flat(),
];
/** Passos que a pessoa vê numa idade: o roteiro daquela idade quando existe, senão os passos gerais. */
const passosDaIdade = (id: string, age: number): readonly string[] => MISSOES[id].roteiroPorIdade?.[age] ?? MISSOES[id].passos;

const ESTADO_PROIBIDO = /sinais de alerta|dentro do esperado|esperado para a|\bnormal\b|normalidade|escore|diagnóstic|ponto de corte|percentil/i;

test("cobertura: toda missão da auxiliar e da secretaria tem brincadeira ou roteiro; exame do médico fica sem missão", () => {
  const ids = CIRCUIT_TASKS.map((task) => task.id);
  for (const task of CIRCUIT_TASKS) {
    if (task.executor !== "medico") assert.ok(MISSOES[task.id], `missão ausente para ${task.id}`);
    else assert.equal(MISSOES[task.id], undefined, `${task.id} é do médico e não vira missão da pré-consulta`);
  }
  for (const id of Object.keys(MISSOES)) assert.ok(ids.includes(id), `missão órfã ${id}`);
  assert.deepEqual([...ESTACOES_SEM_MISSAO].sort(), CIRCUIT_TASKS.filter((task) => task.executor === "medico").map((task) => task.id).sort());
  assert.equal(MISSOES.risk, undefined, "a entrevista de risco não é gamificada");
  for (const id of ["face", "hearing", "stereognosis", "finger6", "gait6"]) assert.equal(CIRCUIT_TASKS.find((task) => task.id === id)?.executor, "medico", `${id} saiu da auxiliar`);
});

test("secretaria: relato indireto com roteiro próprio para cada idade da faixa da estação", () => {
  for (const task of CIRCUIT_TASKS.filter((entry) => entry.executor === "secretaria")) {
    const roteiro = MISSOES[task.id].roteiroPorIdade;
    assert.ok(roteiro, `${task.id}: sem roteiro por idade`);
    for (let age = task.min; age <= task.max; age++) {
      assert.ok(roteiro[age] && roteiro[age].length === 3, `${task.id}: roteiro ausente ou incompleto aos ${age} anos`);
    }
    assert.equal(Object.keys(roteiro).length, task.max - task.min + 1, `${task.id}: roteiro fora da faixa`);
  }
});

test("passos e marcadores: 3 a 4 passos em linguagem de jogo e 3 a 6 marcadores únicos por missão", () => {
  for (const [id, missao] of Object.entries(MISSOES)) {
    assert.ok(missao.passos.length >= 3 && missao.passos.length <= 4, `${id}: passos`);
    assert.ok(missao.pistas.length >= 3 && missao.pistas.length <= 6, `${id}: marcadores`);
    assert.equal(new Set(missao.pistas).size, missao.pistas.length, `${id}: marcadores repetidos`);
    for (const passo of textosDe(missao).filter((texto) => texto.length > 0)) assert.ok(passo.length > 25 || passo === missao.material || missao.pistas.includes(passo) || passo === missao.fala, `${id}: passo curto demais "${passo}"`);
    for (const pista of missao.pistas) assert.ok(pista.length >= 4 && pista.length <= 48, `${id}: marcador ${pista}`);
  }
});

test("linguagem: nenhuma missão afirma normalidade, escore ou diagnóstico", () => {
  for (const [id, missao] of Object.entries(MISSOES)) {
    for (const texto of textosDe(missao)) {
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

test("prática: convite em voz alta, material e tempo em toda missão; sem termo técnico para a auxiliar nem para a secretaria", () => {
  const TECNICO = /dismetria|disdiadococinesia|Romberg|tandem|pronação|oftalmoscóp|anisocoria|nistagmo|estereognosia|hipotonia|espasticidade|fotorreação|ataxia|coreia|distonia|reflexo|tônus|meníng|papiledema/i;
  for (const [id, missao] of Object.entries(MISSOES)) {
    assert.ok(missao.fala.length >= 20 && missao.fala.length <= 140, `${id}: convite`);
    assert.ok(missao.material.length >= 3, `${id}: material`);
    assert.ok(missao.minutos >= 2 && missao.minutos <= 5, `${id}: minutos`);
    for (const texto of textosDe(missao)) assert.doesNotMatch(texto, TECNICO, `${id}: ${texto}`);
  }
});

test("sem repetição: nenhuma missão da pré-consulta repete passo ou marcador de outra no mesmo ciclo etário", () => {
  const norm = (texto: string) => texto.toLowerCase().replace(/[^a-zà-ÿ ]/g, "").trim();
  const quase = (a: string, b: string) => {
    const wa = new Set(norm(a).split(/\s+/)), wb = new Set(norm(b).split(/\s+/));
    const comuns = [...wa].filter((w) => wb.has(w)).length;
    return comuns / Math.min(wa.size, wb.size) >= 0.8;
  };
  for (let age = 2; age <= 17; age++) {
    const passos: [string, string][] = [];
    for (const task of missoesPreConsulta(age)) {
      for (const passo of passosDaIdade(task.id, age)) passos.push([task.id, passo]);
    }
    for (let i = 0; i < passos.length; i++) {
      for (let j = i + 1; j < passos.length; j++) {
        if (passos[i][0] !== passos[j][0]) assert.ok(!quase(passos[i][1], passos[j][1]), `idade ${age}: ${passos[i][0]} repete ${passos[j][0]}: "${passos[i][1]}"`);
      }
    }
  }
});

test("quantidade prática: de 12 a 16 missões da pré-consulta por idade, com no máximo 50 minutos", () => {
  for (let age = 2; age <= 17; age++) {
    const pre = missoesPreConsulta(age);
    // Piso de 12: as estações que a auxiliar e a secretaria não conseguem avaliar saíram do circuito.
    assert.ok(pre.length >= 12 && pre.length <= 16, `idade ${age}: ${pre.length}`);
    const minutos = pre.reduce((soma, task) => soma + MISSOES[task.id].minutos, 0);
    assert.ok(minutos <= 50, `idade ${age}: ${minutos} min`);
  }
});
