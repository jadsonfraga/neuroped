import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { CIRCUIT_TASKS } from "../../client/src/features/super-neuropad/clinicalCircuit";
import { ESTACOES_SEM_MISSAO, MISSOES } from "../../client/src/features/super-neuropad/missoes";

const ESTADO_PROIBIDO = /sinais de alerta|dentro do esperado|esperado para a|\bnormal\b|normalidade|escore|diagnóstic|ponto de corte|percentil/i;

test("cobertura: toda estação do circuito tem missão, exceto a entrevista reservada de risco", () => {
  const ids = CIRCUIT_TASKS.map((task) => task.id);
  for (const id of ids) {
    if (id === "risk") continue;
    assert.ok(MISSOES[id], `missão ausente para ${id}`);
  }
  for (const id of Object.keys(MISSOES)) assert.ok(ids.includes(id), `missão órfã ${id}`);
  assert.deepEqual([...ESTACOES_SEM_MISSAO], ["risk"]);
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
  assert.match(component, /prior\[task\.id\] \?\? "examinador"/);
  assert.match(component, /Orientação clínica completa/);
  assert.match(component, /Anotação livre \(opcional\)/);
});

test("risco continua fora da gamificação: entrevista profissional sem passos de brincadeira", () => {
  const risk = CIRCUIT_TASKS.find((task) => task.id === "risk");
  assert.ok(risk);
  assert.equal(risk.method, "entrevista");
  assert.match(risk.safety ?? "", /NÃO é um jogo/);
});
