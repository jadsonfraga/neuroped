import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { INTEGRATED_BANK, PHASE_ORDER, YEARS } from "../../client/src/features/super-neuropad/bank";
import {
  DESAFIOS_DISPONIVEIS_POR_IDADE, disponiveisDaIdade, estimativaOpcionaisSegundos, opcionaisDaIdade, pendentesDeCopia, proximoPendente,
  registradosNaOrdem, registrarOpcional, apagarOpcional, textoOpcionais, type RegistrosOpcionais,
} from "../../client/src/features/super-neuropad/extensao";
import {
  bandItemCount, estimateBandSeconds, isJudged, itemProvenance, recordBuild, recordJudged, recordTouch, sessionLimitSeconds,
  type AnswerRecord, type Item, type PhaseId,
} from "../../client/src/features/super-neuropad/model";

const plain = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
const criterion = (item: Item) => (item.kind === "montar" ? item.word : item.kind === "toque" ? item.answer : item.expected);
const sameTask = (item: Item) => `${item.kind}:${plain(item.kind === "montar" ? "" : item.prompt)}:${plain(criterion(item))}`;

function record(item: Item, phaseId: PhaseId, seconds = 4): AnswerRecord {
  if (item.kind === "toque") return recordTouch(item, phaseId, item.options.find((option) => option.label === item.answer) ?? null, seconds);
  if (isJudged(item)) return recordJudged(item, phaseId, "acerto", seconds);
  return recordBuild(item, phaseId, [...item.target], seconds);
}

test("extensão: 50 desafios disponíveis em cada idade de 2 a 17 anos, bateria principal + opcionais", () => {
  assert.equal(DESAFIOS_DISPONIVEIS_POR_IDADE, 50);
  for (const years of YEARS) {
    const disponivel = disponiveisDaIdade(years);
    assert.equal(disponivel.principal, bandItemCount(String(years)), `${years} anos: principal vem da bateria`);
    assert.equal(disponivel.total, 50, `${years} anos: 50 disponíveis`);
    const ids = opcionaisDaIdade(years).map((entry) => entry.item.id);
    assert.equal(new Set(ids).size, ids.length, `${years} anos: ids únicos`);
    assert.ok(ids.every((id) => id.startsWith(`${years}.opcional.`)), `${years} anos: ids da extensão`);
  }
});

test("extensão: a bateria principal não muda (contagem, tempo e limite por idade)", () => {
  const principal = YEARS.map((years) => bandItemCount(String(years)));
  assert.deepEqual(principal, [18, 24, 24, 24, 30, 30, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36]);
  for (const years of YEARS) {
    const limite = years === 2 ? 12 * 60 : years === 3 ? 15 * 60 : 20 * 60;
    assert.equal(sessionLimitSeconds(years), limite, `${years} anos: limite da sessão principal inalterado`);
    assert.ok(estimateBandSeconds(years).totalSeconds <= limite, `${years} anos: estimativa principal dentro do limite`);
    const mainIds = PHASE_ORDER.flatMap((phaseId) => INTEGRATED_BANK[years][phaseId].map((item) => item.id));
    assert.ok(mainIds.every((id) => !id.includes("opcional")), `${years} anos: nenhum opcional entrou na bateria`);
  }
});

test("extensão: opcionais vêm dos bancos de origem da idade, sem itens criados e sem repetir a bateria", () => {
  for (const years of YEARS) {
    const main = PHASE_ORDER.flatMap((phaseId) => INTEGRATED_BANK[years][phaseId]);
    const mainTasks = new Set(main.map(sameTask));
    const seen = new Set<string>();
    for (const { item, phaseId } of opcionaisDaIdade(years)) {
      assert.equal(itemProvenance(item), "banco_de_origem", `${item.id}: sem item autoral`);
      assert.match(item.ref, new RegExp(`^(Cognitivos ${years} anos · |Sonda 10 · banco objetivo |OBS-10 · banco objetivo )`), `${item.id}: referência do banco de origem da idade`);
      assert.ok(["cognitivo", "sonda10", "obs10"].includes(item.origin), `${item.id}: origem`);
      assert.ok(PHASE_ORDER.includes(phaseId), `${item.id}: mundo de agrupamento`);
      assert.ok(!mainTasks.has(sameTask(item)), `${item.id}: não repete tarefa da bateria (${item.prompt})`);
      assert.ok(!main.some((entry) => entry.ref === item.ref || entry.ref.startsWith(`${item.ref} · `)), `${item.id}: referência já usada na bateria`);
      assert.ok(!seen.has(sameTask(item)), `${item.id}: não repete outro opcional`);
      seen.add(sameTask(item));
      if (item.kind === "toque") assert.ok(item.options.some((option) => option.label === item.answer), `${item.id}: resposta entre as opções`);
    }
  }
});

test("extensão: estimativa de tempo dos opcionais é informada e não soma ao limite principal", () => {
  for (const years of YEARS) {
    const segundos = estimativaOpcionaisSegundos(years);
    assert.ok(segundos > 0, `${years} anos: estimativa positiva`);
    assert.equal(estimateBandSeconds(years).items, bandItemCount(String(years)), `${years} anos: estimativa principal só com a bateria`);
  }
});

test("registro: substitui, apaga, segue para o próximo pendente e mantém a ordem do banco", () => {
  const lista = opcionaisDaIdade(9);
  let registros: RegistrosOpcionais = {};
  assert.equal(proximoPendente(9, registros), lista[0].item.id);
  registros = registrarOpcional(registros, record(lista[2].item, lista[2].phaseId));
  registros = registrarOpcional(registros, record(lista[0].item, lista[0].phaseId));
  assert.deepEqual(registradosNaOrdem(9, registros).map((entry) => entry.itemId), [lista[0].item.id, lista[2].item.id]);
  assert.equal(proximoPendente(9, registros, lista[0].item.id), lista[1].item.id);
  assert.equal(proximoPendente(9, registros, lista[1].item.id), lista[3].item.id);
  const outro = registrarOpcional(registros, record(lista[0].item, lista[0].phaseId, 9));
  assert.equal(Object.keys(outro).length, 2, "registrar de novo substitui");
  assert.equal(outro[lista[0].item.id].seconds, 9);
  assert.equal(Object.keys(apagarOpcional(outro, lista[0].item.id)).length, 1);
  const todos = lista.reduce<RegistrosOpcionais>((acc, entry) => registrarOpcional(acc, record(entry.item, entry.phaseId)), {});
  assert.equal(proximoPendente(9, todos), null);
});

test("cópia: só o retrato copiado conta; resposta dada durante a cópia continua pendente", () => {
  const lista = opcionaisDaIdade(5);
  const primeiro = registrarOpcional({}, record(lista[0].item, lista[0].phaseId));
  const retrato = primeiro;
  // Enquanto a área de transferência responde, a aplicadora registra outro item.
  const depois = registrarOpcional(primeiro, record(lista[1].item, lista[1].phaseId));
  assert.equal(pendentesDeCopia(depois, retrato), 1, "o item novo segue pendente");
  // Registrar de novo um item já copiado volta a deixá-lo pendente.
  const refeito = registrarOpcional(depois, record(lista[0].item, lista[0].phaseId, 7));
  assert.equal(pendentesDeCopia(refeito, retrato), 2);
  assert.equal(pendentesDeCopia(refeito, refeito), 0);
});

test("texto dos opcionais: relata aplicação e respostas, sem classificação", () => {
  const lista = opcionaisDaIdade(2);
  const vazio = textoOpcionais(2, {}, "21/10/2026 10:00");
  assert.match(vazio, /50 desafios \(18 na bateria principal \+ 32 opcionais\)/);
  assert.match(vazio, /Nenhum desafio opcional registrado\./);
  const registros = registrarOpcional({}, record(lista[0].item, lista[0].phaseId));
  const texto = textoOpcionais(2, registros, "21/10/2026 10:00");
  assert.match(texto, /Opcionais registrados: 1 de 32\./);
  assert.match(texto, new RegExp(`1\\. \\[.+\\] ${lista[0].item.prompt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(texto, /Registrado: .+ \(Acertou\) · Critério de acerto:/);
  assert.match(texto, /Opcionais não aplicados: 31\./);
  assert.match(texto, /fora da contagem, do tempo e do XP da partida principal/);
  assert.doesNotMatch(texto, /\bnível|\bcortes?\b|percentil|escore|pontuação|alerta|triagem|esperado para|limiar|normativ/i);
});

test("texto e tela: aos 2–3 anos o opcional leva o nome padrão do mundo, não o do domínio da bateria dedicada", () => {
  for (const years of [2, 3]) {
    const numerico = opcionaisDaIdade(years).find((entry) => entry.phaseId === "numeros");
    assert.ok(numerico, `${years} anos: há opcional de números`);
    const texto = textoOpcionais(years, registrarOpcional({}, record(numerico.item, numerico.phaseId)), "21/10/2026 10:00");
    assert.match(texto, /\[Montanha dos Números\]/);
    assert.doesNotMatch(texto, /Palavrinhas/);
  }
  const page = readFileSync("client/src/pages/super-neuropad-game.tsx", "utf8");
  const block = page.slice(page.indexOf("function OpcionaisPanel("), page.indexOf("function Clouds() {"));
  assert.doesNotMatch(block, /phaseById\([^)]*,\s*years\)/, "painel usa o nome padrão do mundo");
});

test("tela: painel opcional sem controle desabilitado e fora da partida", () => {
  const page = readFileSync("client/src/pages/super-neuropad-game.tsx", "utf8");
  const start = page.indexOf("function OpcionaisPanel(");
  const block = page.slice(start, page.indexOf("function Clouds() {"));
  assert.ok(start > 0, "painel presente");
  assert.doesNotMatch(block, /\bdisabled\b/, "nenhum controle do painel fica desabilitado");
  assert.match(block, /não é preciso aplicar todos/);
  assert.match(block, /Pausar opcionais/);
  assert.match(block, /Recolher opcionais/);
  assert.match(block, /Copiar registro dos opcionais/);
  // O painel aparece na preparação e nos resultados; não entra na partida.
  assert.equal(page.match(/<OpcionaisPanel /g)?.length, 2);
  const source = readFileSync("client/src/features/super-neuropad/extensao.ts", "utf8");
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(/, "registro só em memória");
});
