import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { conceptKey, INTEGRATED_BANK, PHASE_ORDER, YEARS } from "../../client/src/features/super-neuropad/bank";
import {
  avisoDeIdade, DESAFIOS_DISPONIVEIS_POR_IDADE, disponiveisDaIdade, estimativaOpcionaisSegundos, opcionaisDaIdade, pendentesDeCopia, proximoPendente,
  registradosNaOrdem, registrarOpcional, apagarOpcional, textoOpcionais, type RegistrosOpcionais,
} from "../../client/src/features/super-neuropad/extensao";
import {
  bandItemCount, estimateBandSeconds, isJudged, itemProvenance, recordBuild, recordJudged, recordTouch, sessionLimitSeconds,
  type AnswerRecord, type Item, type PhaseId,
} from "../../client/src/features/super-neuropad/model";
import { activeClockSeconds, emptyActiveClock, transitionActiveClock } from "../../client/src/features/super-neuropad/activeClock";

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
      assert.match(item.ref, new RegExp(`^(Cognitivos ${years} anos · |Sonda 10 · banco objetivo |OBS-10 · banco objetivo |Reconhecimento visual · reconhecer · )`), `${item.id}: referência do banco de origem da idade`);
      assert.ok(["cognitivo", "sonda10", "obs10", "visual"].includes(item.origin), `${item.id}: origem`);
      assert.ok(PHASE_ORDER.includes(phaseId), `${item.id}: mundo de agrupamento`);
      assert.ok(!mainTasks.has(sameTask(item)), `${item.id}: não repete tarefa da bateria (${item.prompt})`);
      assert.ok(!main.some((entry) => entry.ref === item.ref || entry.ref.startsWith(`${item.ref} · `)), `${item.id}: referência já usada na bateria`);
      assert.ok(!seen.has(sameTask(item)), `${item.id}: não repete outro opcional`);
      seen.add(sameTask(item));
      if (item.kind === "toque") assert.ok(item.options.some((option) => option.label === item.answer), `${item.id}: resposta entre as opções`);
    }
    assert.ok(opcionaisDaIdade(years).some(({ item }) => item.origin === "visual"), `${years}: inclui tarefa visual elegível para a idade`);
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

test("auditoria 21/10/2026: opcionais não repetem conceito entre si nem com a bateria", () => {
  // Aos 3 anos "Toque na cor VERMELHA" e "Toque no vermelho" pedem a mesma coisa; só um fica.
  const tres = opcionaisDaIdade(3).map((entry) => entry.item.prompt);
  assert.ok(!(tres.includes("Toque na cor VERMELHA.") && tres.includes("Toque no vermelho.")), "3 anos: cor vermelha não aparece duas vezes");
  assert.ok(!(tres.includes("Toque na cor AZUL.") && tres.includes("Toque no azul.")), "3 anos: cor azul não aparece duas vezes");
  // Itens visuais elegíveis completam o banco de 5 anos sem repetir conceito.
  const EXCECOES: Record<number, number> = {};
  for (const years of YEARS) {
    const main = new Set(PHASE_ORDER.flatMap((phaseId) => INTEGRATED_BANK[years][phaseId]).map(conceptKey));
    const seen = new Set<string>();
    let repetidos = 0;
    for (const { item } of opcionaisDaIdade(years)) {
      const key = conceptKey(item);
      if (main.has(key) || seen.has(key)) repetidos++;
      seen.add(key);
    }
    assert.equal(repetidos, EXCECOES[years] ?? 0, `${years} anos: conceitos repetidos nos opcionais`);
    assert.equal(opcionaisDaIdade(years).length + bandItemCount(String(years)), 50, `${years} anos: continuam 50 disponíveis`);
  }
});

test("auditoria 21/10/2026: referência visual informa o número real de alternativas", () => {
  for (const years of YEARS) {
    for (const { item } of opcionaisDaIdade(years)) {
      if (item.kind !== "toque" || item.origin !== "visual") continue;
      assert.match(item.ref, new RegExp(`\\(${item.options.length} opções,`), `${years} anos · ${item.prompt}`);
    }
  }
});

test("auditoria 21/10/2026: pausas excluem o intervalo e retomam o tempo ativo do mesmo item", () => {
  let clock = transitionActiveClock(emptyActiveClock(), 1000, true);
  assert.equal(activeClockSeconds(clock, 21_000), 20);
  clock = transitionActiveClock(clock, 21_000, false);
  assert.equal(activeClockSeconds(clock, 51_000), 20, "30 segundos pausados não entram no tempo");
  clock = transitionActiveClock(clock, 51_000, true);
  assert.equal(activeClockSeconds(clock, 56_000), 25, "5 segundos ativos são somados após retomar");
});

test("auditoria 21/10/2026: letra e numeral aos 2–3 anos levam aviso de idade; o item continua disponível", () => {
  const letra = opcionaisDaIdade(2).find((entry) => /Toque na LETRA/.test(entry.item.prompt));
  assert.ok(letra, "2 anos: o item de letra segue disponível");
  assert.match(avisoDeIdade(2, letra.item) ?? "", /não é marco universal aos 2 anos/);
  const cachorro = opcionaisDaIdade(2).find((entry) => entry.item.prompt === "Toque no cachorro.");
  assert.equal(avisoDeIdade(2, cachorro!.item), null, "item de figura não leva aviso");
  const numeral = opcionaisDaIdade(3).find((entry) => /Quantas maçãs\? Toque no número/.test(entry.item.prompt));
  assert.ok(avisoDeIdade(3, numeral!.item), "3 anos: numeral leva aviso");
  for (const years of YEARS.filter((value) => value > 3)) {
    assert.ok(opcionaisDaIdade(years).every((entry) => avisoDeIdade(years, entry.item) === null), `${years} anos: sem aviso de letramento`);
  }
  const texto = textoOpcionais(2, registrarOpcional({}, record(letra.item, letra.phaseId)), "21/10/2026 10:00");
  assert.match(texto, /Aviso de idade: reconhecer letras ou números não é marco universal aos 2 anos/);
  assert.doesNotMatch(texto, /\bnível|\bcortes?\b|percentil|escore|pontuação|alerta|triagem|esperado para|limiar|normativ|\bobservar\b|dentro do esperado/i);
});

test("auditoria 21/10/2026: o painel dos opcionais pausa ao trocar de aba, como a partida principal", () => {
  const page = readFileSync("client/src/pages/super-neuropad-game.tsx", "utf8");
  const block = page.slice(page.indexOf("function OpcionaisPanel("), page.indexOf("function Clouds() {"));
  assert.match(block, /visibilitychange/);
  assert.match(block, /document\.hidden\) setPausado\(true\)/);
  assert.match(block, /super-neuropad-optional-age-note/);
});
