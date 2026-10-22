import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { CIRCUIT_TASKS, circuitForAge, circuitForAssistant } from "../../client/src/features/super-neuropad/clinicalCircuit";
import { MISSOES } from "../../client/src/features/super-neuropad/missoes";

const ESTADO_PROIBIDO = /sinais de alerta|dentro do esperado|esperado para a|\bnormal\b|normalidade|escore|diagnóstic|ponto de corte|percentil/i;

test("cobertura: toda estação da assistente tem missão e nenhuma estação do médico vira missão", () => {
  for (const task of CIRCUIT_TASKS) {
    if (task.executor === "assistente") assert.ok(MISSOES[task.id], `missão ausente para ${task.id}`);
    else assert.equal(MISSOES[task.id], undefined, `${task.id}: ato do médico não pode ser missão da assistente`);
  }
  for (const id of Object.keys(MISSOES)) assert.equal(CIRCUIT_TASKS.find((task) => task.id === id)?.executor, "assistente", `missão órfã ${id}`);
});

test("atos do médico nunca entram no fluxo da assistente, em nenhuma idade", () => {
  const DO_MEDICO = ["fundus", "meningeal", "reflex", "vision", "face", "hearing", "shoulders", "posture", "strength2p", "strength6", "sensation",
    "stereognosis", "dismetria2", "finger6", "romberg", "gait6", "growth", "emotion6", "thought6", "insight9", "risk"];
  for (const id of DO_MEDICO) assert.equal(CIRCUIT_TASKS.find((task) => task.id === id)?.executor, "medico", id);
  for (let years = 2; years <= 17; years++) {
    const ids = circuitForAssistant(years).map((task) => task.id);
    assert.ok(ids.length >= 8, `${years} anos: ao menos 8 missões para a assistente`);
    for (const id of DO_MEDICO) assert.ok(!ids.includes(id), `${years} anos: ${id} é do médico`);
    assert.ok(circuitForAge(years).length > ids.length, `${years} anos: sobra exame reservado ao médico`);
  }
});

test("praticidade: toda missão diz o que olhar, o material e o tempo, e dura no máximo 5 minutos", () => {
  for (const [id, missao] of Object.entries(MISSOES)) {
    assert.ok(missao.objetivo.length >= 20, `${id}: objetivo`);
    assert.ok(missao.material.length >= 5, `${id}: material`);
    assert.ok(missao.minutos >= 1 && missao.minutos <= 5, `${id}: minutos`);
  }
});

test("linguagem simples: nenhum termo técnico nem manobra nos passos e marcadores da assistente", () => {
  const TECNICO = /dismetria|praxia|estereognosia|romberg|tandem|oftalmosc|fundo de olho|reflexo|martelo|meníng|nuca|par craniano|tônus|\bpupila|resistência|lateralidade|congruen|prosódia|hipotonia/i;
  for (const [id, missao] of Object.entries(MISSOES)) {
    for (const texto of [missao.objetivo, missao.material, ...missao.passos, ...missao.pistas]) assert.doesNotMatch(texto, TECNICO, `${id}: ${texto}`);
  }
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
  assert.match(component, /Você vai precisar de/);
  assert.match(component, /Reservado ao médico na consulta/);
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

test("risco continua fora da gamificação e do fluxo da assistente: entrevista profissional sem passos de brincadeira", () => {
  const risk = CIRCUIT_TASKS.find((task) => task.id === "risk");
  assert.ok(risk);
  assert.equal(risk.method, "entrevista");
  assert.match(risk.safety ?? "", /NÃO é um jogo/);
});
