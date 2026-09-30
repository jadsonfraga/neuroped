// Super NeuroPad Game: faixas anuais 2–17 com barreira < 2 anos, seis mundos
// integrados (Sonda 10, OBS-10, Reconhecimento Visual, Avaliação Cognitiva),
// motor de resultado com recusa e gesto, mundos não aplicados, relatório/PDF
// com bloco estruturado e a disciplina clínica da página (sem persistência,
// sem rede, sem câmera). O banco por faixa é testado em super-neuropad-integrated-bank.test.ts.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AGE_BANDS,
  CHARACTERS,
  ITEM_BANK,
  MAX_AGE_YEARS,
  MIN_AGE_YEARS,
  PHASE_ORDER,
  PHASES,
  STRUCTURED_HEADER,
  SUPER_NEUROPAD_ROUTE,
  UNDER_TWO_MESSAGE,
  ageGate,
  bandForYears,
  buildGameBrief,
  buildGameReport,
  buildPatientRecordItems,
  buildStructuredLines,
  cutText,
  judgeShortcut,
  levelCuts,
  sessionWallSeconds,
  describeArt,
  interpret,
  itemsFor,
  overallLevel,
  phaseLevel,
  recordBuild,
  recordJudged,
  recordTouch,
  shuffle,
  summarize,
  undoLastAnswer,
  type AnswerRecord,
  type GameSession,
  type Item,
  type PhaseId,
  type TouchItem,
} from "../../client/src/features/super-neuropad/model";
import { buildGameDocSpec } from "../../client/src/features/super-neuropad/pdf";
import { pdfSafe } from "../../client/src/lib/documentPdf";
import { decideRouteAccess, isRouteSensitive } from "../../client/src/security/routeGuardPolicy";

const ISSUER = { doctorName: "Profissional Sintético", specialty: "Neuropediatria", credentials: "CRM 00000", clinicName: "Clínica Sintética", motto: "" };
const strip = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const pageSource = () => strip(readFileSync("client/src/pages/super-neuropad-game.tsx", "utf8"));

test("faixas etárias: um ano cada, de 2 a 17, sem lacuna; menores de 2 anos bloqueados com mensagem clara", () => {
  assert.equal(AGE_BANDS.length, MAX_AGE_YEARS - MIN_AGE_YEARS + 1);
  for (let years = MIN_AGE_YEARS; years <= MAX_AGE_YEARS; years++) {
    const band = bandForYears(years);
    assert.ok(band, `${years} anos tem faixa`);
    assert.equal(band.id, String(years));
    assert.equal(band.min, years);
    assert.equal(band.max, years);
    assert.equal(band.label, `${years} anos`);
    assert.equal(band.perPhase, years <= 5 ? 4 : 5);
    const gate = ageGate(years);
    assert.equal(gate.ok, true);
  }
  assert.equal(bandForYears(1), undefined);
  assert.equal(bandForYears(18), undefined);
  assert.equal(bandForYears(4.5), undefined, "meses não entram: só anos inteiros");
  for (const years of [0, 1, 1.9]) {
    const gate = ageGate(years);
    assert.equal(gate.ok, false, `${years} anos não faz o jogo`);
    if (!gate.ok) {
      assert.equal(gate.reason, "menor_de_2");
      assert.equal(gate.message, UNDER_TWO_MESSAGE);
      assert.match(gate.message, /menos de 2 anos/);
      assert.match(gate.message, /OBS-10/);
      assert.match(gate.message, /Sonda 10/);
      assert.deepEqual(gate.routes.map((route) => route.href), ["/avaliacao-pre-consulta-faixa-etaria", "/testes-diretos"]);
    }
  }
  const over = ageGate(18);
  assert.equal(over.ok, false);
  if (!over.ok) assert.equal(over.reason, "acima_do_teto");
  assert.equal(ageGate(Number.NaN).ok, false);
});

test("mundos são seis, ordenados, cada um com proveniência nas abas de origem", () => {
  assert.equal(PHASES.length, 6);
  assert.deepEqual(PHASES.map((phase) => phase.order), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(PHASES.map((phase) => phase.id), [...PHASE_ORDER]);
  assert.deepEqual([...PHASE_ORDER], ["vila", "olhos", "palavras", "numeros", "memoria", "corpo"]);
  for (const phase of PHASES) {
    assert.match(phase.source, /Sonda 10|OBS-10|Reconhecimento Visual|Avaliação Cognitiva/);
    assert.ok(phase.operator.length > 20);
    assert.ok(phase.origins.length >= 2);
  }
  assert.equal(CHARACTERS.length, 6);
  assert.equal(Object.keys(ITEM_BANK).length, AGE_BANDS.length);
});

test("embaralhamento é determinístico por semente e preserva o conjunto", () => {
  const values = ["a", "b", "c", "d"];
  assert.deepEqual(shuffle(values, 7), shuffle(values, 7));
  assert.deepEqual([...shuffle(values, 7)].sort(), values);
  assert.deepEqual(values, ["a", "b", "c", "d"], "entrada não é mutada");
});

function firstOf<K extends Item["kind"]>(years: number, kind: K, predicate: (item: Extract<Item, { kind: K }>) => boolean = () => true): { item: Extract<Item, { kind: K }>; phaseId: PhaseId } {
  for (const phaseId of PHASE_ORDER) {
    for (const item of itemsFor(String(years), phaseId)) {
      if (item.kind === kind && predicate(item as Extract<Item, { kind: K }>)) return { item: item as Extract<Item, { kind: K }>, phaseId };
    }
  }
  throw new Error(`sem item ${kind} aos ${years} anos`);
}

test("registros: toque e montagem conferidos pelo jogo; julgado pelo critério; recusa separada de não resposta; gesto só quando previsto", () => {
  const { item, phaseId } = firstOf(5, "toque");
  const right = item.options.find((option) => option.label === item.answer)!;
  const wrong = item.options.find((option) => option.label !== item.answer)!;
  const hit = recordTouch(item, phaseId, right, 2.345);
  assert.equal(hit.status, "acerto");
  assert.equal(hit.seconds, 2.3);
  assert.equal(hit.origin, item.origin);
  assert.equal(hit.ref, item.ref);
  assert.equal(recordTouch(item, phaseId, wrong, 1).status, "erro");
  const silent = recordTouch(item, phaseId, null, -3);
  assert.equal(silent.status, "sem_resposta");
  assert.equal(silent.seconds, 0);
  assert.equal(recordTouch(item, phaseId, null, 3, false, true).status, "recusa");

  const build = firstOf(7, "montar");
  assert.equal(recordBuild(build.item, build.phaseId, [...build.item.target], 9).status, "acerto");
  assert.equal(recordBuild(build.item, build.phaseId, [...build.item.target].reverse(), 9).status, "erro");
  assert.equal(recordBuild(build.item, build.phaseId, null, 9).status, "sem_resposta");
  assert.equal(recordBuild(build.item, build.phaseId, null, 9, false, true).status, "recusa");
  assert.equal(recordBuild(build.item, build.phaseId, ["G", "A"], 9).given, "GA");
  assert.match(recordBuild(build.item, build.phaseId, null, 9).prompt, /^Ditado: monte a palavra GATO$/);

  const judged = firstOf(4, "fazer");
  const record = recordJudged(judged.item, judged.phaseId, "acerto", 4.06);
  assert.equal(record.expected, judged.item.expected);
  assert.equal(record.given, "Cumpriu o critério");
  assert.equal(record.seconds, 4.1);
  assert.equal(recordJudged(judged.item, judged.phaseId, "sem_resposta", 1).given, "—");
  assert.equal(recordJudged(judged.item, judged.phaseId, "recusa", 1).given, "Recusou");
  assert.equal("via" in recordJudged(judged.item, judged.phaseId, "acerto", 1, false, "gesto"), false, "sem alternativa prevista, gesto não vira via");

  const gesture = firstOf(2, "fala", (entry) => Boolean(entry.gesture));
  const viaGesture = recordJudged(gesture.item, gesture.phaseId, "acerto", 3, false, "gesto");
  assert.equal(viaGesture.via, "gesto");
  assert.equal(viaGesture.given, "Cumpriu o critério por gesto/apontar");
  assert.match(viaGesture.expected, /alternativa aceita: /);
  assert.equal("via" in recordJudged(gesture.item, gesture.phaseId, "erro", 3, false, "gesto"), false, "gesto só acompanha acerto");

  const reading = firstOf(7, "fala", (entry) => entry.prompt === "Peça: “Leia a frase em voz alta.”" || entry.prompt.startsWith("Leia a frase em voz alta"));
  assert.match(recordJudged(reading.item, reading.phaseId, "acerto", 2).prompt, /\(estímulo: O gato dorme no sofá\.\)$/);
  const digits = firstOf(9, "fala", (entry) => entry.prompt.includes("Repita: 3 – 8 – 1 – 6 – 4"));
  assert.match(recordJudged(digits.item, digits.phaseId, "erro", 2).prompt, /\(estímulo: 3 · 8 · 1 · 6 · 4\)$/);
  const icon = firstOf(8, "fazer", (entry) => entry.stimulus === "🦩");
  assert.equal(recordJudged(icon.item, icon.phaseId, "acerto", 2).prompt, icon.item.prompt, "ícone ilustrativo não entra no registro");
  const context = firstOf(5, "toque", (entry) => Boolean(entry.context));
  assert.match(recordTouch(context.item, context.phaseId, null, 1).prompt, /ferver/);
});

test("faixas operacionais: as mesmas proporções de sempre, com texto gerado pelo número de itens", () => {
  assert.equal(phaseLevel(4, 4), "esperado");
  assert.equal(phaseLevel(3, 4), "esperado");
  assert.equal(phaseLevel(2, 4), "observar");
  assert.equal(phaseLevel(1, 4), "alerta");
  assert.equal(phaseLevel(4, 5), "esperado");
  assert.equal(phaseLevel(3, 5), "observar");
  assert.equal(phaseLevel(2, 5), "alerta");
  assert.equal(overallLevel(16, 20), "esperado");
  assert.equal(overallLevel(15, 20), "observar");
  assert.equal(overallLevel(11, 20), "alerta");
  assert.equal(overallLevel(20, 24), "esperado");
  assert.equal(overallLevel(19, 24), "observar");
  assert.equal(overallLevel(24, 30), "esperado");
  assert.equal(overallLevel(18, 30), "observar");
  assert.equal(overallLevel(17, 30), "alerta");
  assert.equal(overallLevel(0, 0), "alerta");
  assert.deepEqual(levelCuts(4), { esperado: 3, observar: 2 });
  assert.deepEqual(levelCuts(5), { esperado: 4, observar: 3 });
  assert.deepEqual(levelCuts(20, "total"), { esperado: 16, observar: 12 });
  assert.equal(cutText(4), "3–4 acertos = esperado; 2 = observar; 0–1 = alerta");
  assert.equal(cutText(5), "4–5 acertos = esperado; 3 = observar; 0–2 = alerta");
  assert.equal(cutText(20, "total"), "16–20 acertos = esperado; 12–15 = observar; 0–11 = alerta");
  assert.equal(cutText(30, "total"), "24–30 acertos = esperado; 18–23 = observar; 0–17 = alerta");
  // As proporções continuam iguais às da versão anterior: nenhuma faixa ficou mais permissiva.
  for (let total = 1; total <= 40; total++) {
    for (let hits = 0; hits <= total; hits++) {
      assert.equal(phaseLevel(hits, total), hits / total >= 0.75 ? "esperado" : hits / total >= 0.5 ? "observar" : "alerta");
    }
  }
});

type Plan = (index: number, item: Item) => AnswerRecord["status"];

function answer(item: Item, phaseId: PhaseId, status: AnswerRecord["status"], seconds: number): AnswerRecord {
  if (item.kind === "toque") {
    const chosen = status === "sem_resposta" || status === "recusa" ? null : item.options.find((option) => (option.label === item.answer) === (status === "acerto"))!;
    return recordTouch(item, phaseId, chosen, seconds, false, status === "recusa");
  }
  if (item.kind === "montar") {
    const placed = status === "acerto" ? [...item.target] : status === "erro" ? [...item.target].reverse() : null;
    return recordBuild(item, phaseId, placed, seconds, false, status === "recusa");
  }
  return recordJudged(item, phaseId, status, seconds);
}

function play(years: number, plan: Plan = () => "acerto"): GameSession {
  const answers: AnswerRecord[] = [];
  let index = 0;
  for (const phaseId of PHASE_ORDER) {
    for (const item of itemsFor(String(years), phaseId)) {
      answers.push(answer(item, phaseId, plan(index++, item), item.kind === "toque" || item.kind === "montar" ? 3 : 5));
    }
  }
  return { version: "test", ageYears: years, bandId: String(years), characterId: "robo", startedAt: "2026-09-30T12:00:00.000Z", finishedAt: "2026-09-30T12:15:00.000Z", answers, pauseCount: 0 };
}

test("resumo conta acertos por mundo e no total, com esperado para a idade e completude", () => {
  const perfect = summarize(play(8));
  assert.equal(perfect.hits, 30);
  assert.equal(perfect.total, 30);
  assert.equal(perfect.expectedMin, 24);
  assert.equal(perfect.level, "esperado");
  assert.equal(perfect.complete, true);
  assert.deepEqual(perfect.phases.map((phase) => phase.hits), [5, 5, 5, 5, 5, 5]);
  assert.ok(perfect.phases.every((phase) => phase.expectedMin === 4));

  const young = summarize(play(3));
  assert.equal(young.total, 24);
  assert.equal(young.expectedMin, 20);
  assert.ok(young.phases.every((phase) => phase.total === 4 && phase.expectedMin === 3));

  const mixed = summarize(play(6, (index) => (index % 5 === 0 ? "erro" : index % 5 === 1 ? "sem_resposta" : index % 5 === 2 ? "recusa" : "acerto")));
  assert.equal(mixed.hits, 12);
  assert.equal(mixed.level, "alerta");
  assert.deepEqual(mixed.phases.map((phase) => [phase.hits, phase.errors, phase.noResponse, phase.refused]), Array(6).fill([2, 1, 1, 1]));

  const partial = play(2);
  partial.answers = partial.answers.slice(0, 7);
  const summary = summarize(partial);
  assert.equal(summary.complete, false);
  assert.equal(summary.hits, 7);
  assert.equal(summary.phases[5].answers.length, 0);

  const origins = summarize(play(7)).origins;
  assert.deepEqual(origins.map((origin) => origin.origin), ["sonda10", "obs10", "visual", "cognitivo"]);
  assert.equal(origins.reduce((sum, origin) => sum + origin.planned, 0), 30);
  assert.ok(origins.every((origin) => origin.planned > 0 && origin.applied === origin.planned && origin.hits === origin.planned));
});

test("mundo pulado: aparece como não aplicado com motivo; partida fica incompleta, sem classificação, e o resto é preservado", () => {
  const session = play(3);
  session.answers = session.answers.filter((entry) => entry.phaseId !== "corpo");
  session.skipped = [{ phaseId: "corpo", reason: "Criança cansada ou sem colaboração" }];
  const summary = summarize(session);
  assert.equal(summary.complete, false);
  assert.equal(summary.level, null);
  assert.equal(interpret(session), null);
  const corpo = summary.phases.find((phase) => phase.phase.id === "corpo")!;
  assert.equal(corpo.applied, false);
  assert.equal(corpo.skipReason, "Criança cansada ou sem colaboração");
  assert.equal(summary.hits, 20, "os mundos aplicados continuam contados");
  for (const output of [buildGameBrief(session), buildGameReport(session), JSON.stringify(buildGameDocSpec(session, ISSUER, "30/09/2026 14:00"))]) {
    assert.match(output, /não aplicado — Criança cansada|Não aplicado - motivo: Criança cansada|não aplicado — Criança cansada/i);
    assert.match(output, /Sem classificação ou interpretação/);
  }
  const rows = buildPatientRecordItems(session);
  assert.ok(rows.some((row) => row.question === "Mundo 6 · Torre do Corpo" && row.answer === "Não aplicado — Criança cansada ou sem colaboração"));
  const structured = buildStructuredLines(session).join("\n");
  assert.match(structured, /"nao_aplicado_motivo":"Criança cansada ou sem colaboração"/);
  assert.match(structured, /"nivel":null/);
});

test("relatório e PDF: metadados, o que foi testado por instrumento, domínio × esperado, cada item com esperado/resposta/resultado/tempo/repetição e bloco estruturado", () => {
  const session: GameSession = { ...play(7, (index) => (index === 3 ? "erro" : index === 9 ? "sem_resposta" : index === 12 ? "recusa" : "acerto")), pauseCount: 2, pausedSeconds: 95, undoCount: 1, observations: "Tímida no início, soltou depois." };
  session.answers[5] = { ...session.answers[5], repeated: true };
  const report = buildGameReport(session, new Date("2026-09-30T17:05:00Z"));
  assert.match(report, /27 de 30 acertos \(esperado para a idade: 24 ou mais\)/);
  assert.match(report, /Data e hora \(local\): 30\/09\/2026/);
  assert.match(report, /O QUE FOI TESTADO POR INSTRUMENTO DE ORIGEM/);
  for (const label of ["Sonda 10", "Observa 10 (OBS-10)", "Reconhecimento visual", "Avaliação cognitiva infantil"]) assert.ok(report.includes(`- ${label}: `), label);
  assert.match(report, /NÃO É ESCORE NORMATIVO, PERCENTIL NEM DIAGNÓSTICO/);
  assert.match(report, /OBSERVAÇÕES DA APLICADORA\nTímida no início, soltou depois\./);
  for (const entry of session.answers) {
    assert.ok(report.includes(entry.prompt), `relatório inclui: ${entry.prompt}`);
    assert.ok(report.includes(`Esperado: ${entry.expected}`));
  }
  assert.match(report, /Errou · 3s|Errou · 5s/);
  assert.match(report, /Recusou · /);
  assert.match(report, /comando repetido 1x/);
  assert.ok(report.includes(STRUCTURED_HEADER));
  assert.doesNotMatch(report, /percentil: |idade equivalente: |QI/i);

  const spec = buildGameDocSpec(session, ISSUER, "30/09/2026 14:05");
  assert.match(spec.title, /Super NeuroPad Game/);
  assert.equal(spec.sections.length, 4 + 6 + 4, "identificação, instrumentos, domínios, leitura, 6 mundos, observações, critérios, estruturado, proveniência");
  assert.deepEqual(spec.sections.slice(0, 4).map((section) => section.heading), [
    "Identificação da sessão", "O que foi testado por instrumento de origem", "Desempenho por domínio x esperado para a idade", "Leitura para a consulta",
  ]);
  assert.deepEqual(spec.sections.slice(-4).map((section) => section.heading), ["Observações da aplicadora", "Critérios de leitura", STRUCTURED_HEADER, "Proveniência e natureza"]);
  const identification = spec.sections[0].body;
  assert.match(identification, /Idade informada: 7 anos \(faixa anual de 7 anos; itens calibrados para esta idade\)/);
  assert.match(identification, /Data e hora da aplicação \(horário local, America\/Sao_Paulo\): 30\/09\/2026 14:05/);
  assert.match(identification, /Duração da sessão \(relógio\): 15 min 00 s/);
  assert.match(identification, /tempo estimado para a idade: \d+ min \d\d s \(máximo 20 min\)/);
  assert.match(identification, /Pausas: 2 \(1 min 35 s em pausa\)/);
  assert.match(identification, /Mundos não aplicados: nenhum/);
  assert.match(spec.sections[1].body, /Sonda 10 \(\/testes-diretos\): \d+ item\(ns\) previstos para 7 anos/);
  assert.match(spec.sections[1].body, /Reconhecimento visual \(\/testes-reconhecimento\)/);
  assert.match(spec.sections[2].body, /TOTAL: 27 acertos em 30 itens \(esperado para a idade: 24 ou mais\)/);
  assert.match(spec.sections[2].body, /Mundo 1 - Vila da Conversa \(Interação e comunicação\): \d\/5 acertos \(esperado: 4 ou mais\)/);
  assert.match(spec.sections[3].body, /Itens para checar na consulta \(3\)/);
  const bodies = spec.sections.map((section) => section.body).join("\n");
  for (const entry of session.answers) {
    assert.ok(bodies.includes(describeArt(entry.prompt)));
    assert.ok(bodies.includes(`Resposta esperada: ${describeArt(entry.expected)}`));
    assert.ok(bodies.includes(`Resposta da criança: ${describeArt(entry.given)}`));
  }
  assert.match(bodies, /Origem: Reconhecimento visual - Reconhecimento visual · reconhecer · Ambulância/);
  assert.match(bodies, /Resultado: Recusou - tempo: \d s - repetições do comando: 0/);
  assert.match(bodies, /repetições do comando: 1/);
  assert.match(spec.sections.at(-4)!.body, /Tímida no início/);
  assert.match(spec.sections.at(-3)!.body, /Por mundo \(5 itens\): 4–5 acertos = esperado; 3 = observar; 0–2 = alerta\./);
  assert.match(spec.sections.at(-3)!.body, /CDC/);
  const structured = spec.sections.at(-2)!.body.split("\n");
  assert.equal(structured.filter((line) => line.startsWith("SESSAO ")).length, 1);
  assert.equal(structured.filter((line) => line.startsWith("DOMINIO ")).length, 6);
  assert.equal(structured.filter((line) => line.startsWith("ORIGEM ")).length, 4);
  assert.equal(structured.filter((line) => line.startsWith("ITEM ")).length, 30);
  assert.equal(structured.filter((line) => line.startsWith("OBSERVACOES ")).length, 1);
  for (const line of structured.filter((entry) => /^[A-Z]+ \{/.test(entry))) {
    const parsed = JSON.parse(line.slice(line.indexOf(" ") + 1));
    assert.equal(typeof parsed, "object");
  }
  const sessionLine = JSON.parse(structured.find((line) => line.startsWith("SESSAO "))!.slice(7));
  assert.equal(sessionLine.idade_anos, 7);
  assert.equal(sessionLine.completa, true);
  assert.equal(sessionLine.pausas, 2);
  assert.equal(sessionLine.duracao_sessao_s, 900);
  assert.equal(sessionLine.nivel_total, "esperado");
  const itemLine = JSON.parse(structured.find((line) => line.startsWith("ITEM "))!.slice(5));
  assert.deepEqual(Object.keys(itemLine), ["id", "mundo", "origem", "referencia", "tipo", "pergunta", "esperado", "resposta", "resultado", "tempo_s", "repeticoes", "via"]);
  assert.match(bodies, /nada foi persistido no navegador nem enviado por rede/);
  assert.match(bodies, /Salvar no prontuário/);
  // Nada é descartado pela normalização Latin-1 do construtor de PDF.
  for (const section of spec.sections) {
    for (const line of [section.heading, ...section.body.split("\n")]) {
      const expected = line.replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, "...").replace(/×/g, "x");
      assert.equal(pdfSafe(line), expected, `linha perde conteúdo no PDF: ${line}`);
    }
  }
});

test("desfazer último registro devolve mundo e índice exatos do desafio a refazer", () => {
  assert.equal(undoLastAnswer([]), null);
  const session = play(3);
  const inWorld3 = session.answers.slice(0, 10); // 4 + 4 + 2 itens
  const undone = undoLastAnswer(inWorld3)!;
  assert.equal(undone.answers.length, 9);
  assert.equal(undone.phaseId, "palavras");
  assert.equal(undone.itemIndex, 1);
  const worldEnd = undoLastAnswer(session.answers.slice(0, 8))!;
  assert.equal(worldEnd.phaseId, "olhos");
  assert.equal(worldEnd.itemIndex, 3);
  assert.equal(inWorld3.length, 10, "entrada não é mutada");
});

function readComplete(session: GameSession) {
  const reading = interpret(session);
  assert.ok(reading, "uma partida completa deve manter a leitura");
  return reading;
}

test("leitura para a consulta: prioridades, padrão com recusa agrupada, gesto, ritmo interno, toque × aplicadora e abas para aprofundar", () => {
  const perfect = readComplete(play(8));
  assert.deepEqual(perfect.priorities, []);
  assert.equal(perfect.pattern, "nenhum");
  assert.ok(perfect.notes.some((note) => /dentro do esperado para a idade/.test(note) && /não exclui dificuldades sutis/.test(note)));
  assert.equal(perfect.notes.some((note) => /Aprofundar/.test(note)), false);

  // Mundo 5 (memória) todo recusado, mundo 3 (palavras) com dois erros.
  const mixed = readComplete(play(6, (index) => (index >= 20 && index < 25 ? "recusa" : index === 10 || index === 11 ? "erro" : "acerto")));
  assert.deepEqual(mixed.priorities.map((phase) => [phase.phase.id, phase.level]), [["memoria", "alerta"], ["palavras", "observar"]]);
  assert.equal(mixed.missed.length, 7);
  assert.equal(mixed.errors, 2);
  assert.equal(mixed.noResponse, 5);
  assert.equal(mixed.refused, 5);
  assert.equal(mixed.pattern, "nao_resposta");
  assert.ok(mixed.notes.some((note) => /Predomínio de não resposta ou recusa \(5 de 7 itens perdidos, 5 recusa\(s\)\)/.test(note)));
  assert.ok(mixed.notes.some((note) => /Prioridade para a consulta: Caverna da Memória 0\/5 \(alerta\); Ilha das Palavras 3\/5 \(observar\)/.test(note)));
  assert.ok(mixed.notes.some((note) => note.startsWith("Aprofundar com as abas de origem: Sonda 10 (memória operacional")));

  const gestures = play(2);
  gestures.answers = gestures.answers.map((entry) => {
    const item = itemsFor("2", entry.phaseId).find((candidate) => candidate.id === entry.itemId)!;
    return (item.kind === "fala" || item.kind === "fazer") && item.gesture ? recordJudged(item, entry.phaseId, "acerto", 5, false, "gesto") : entry;
  });
  const gestureReading = readComplete(gestures);
  assert.ok(gestureReading.gestures >= 3);
  assert.ok(gestureReading.notes.some((note) => /acerto\(s\) por gesto\/apontar/.test(note)));

  const slowSession = play(10);
  slowSession.answers[7] = { ...slowSession.answers[7], seconds: 40 };
  const slow = readComplete(slowSession);
  assert.equal(slow.slow.length, 1);
  assert.ok(slow.notes.some((note) => /1 item\(ns\) bem acima do ritmo da própria criança \(40 s\)\. Comparação interna à partida, não normativa\./.test(note)));

  const byKind = play(6);
  byKind.answers = byKind.answers.map((entry) => (entry.kind === "toque" || entry.kind === "montar" ? entry : { ...entry, status: "erro", given: "Não cumpriu o critério" }));
  const kind = readComplete(byKind);
  assert.equal(kind.touch.hits, kind.touch.total);
  assert.equal(kind.judged.hits, 0);
  assert.ok(kind.notes.some((note) => /Melhor nos itens conferidos pelo jogo/.test(note)));

  const app = readFileSync("client/src/App.tsx", "utf8");
  for (const phase of PHASES) {
    assert.ok(phase.consult.length > 60);
    assert.doesNotMatch(phase.consult, /diagn[oó]stico|percentil|escore|QI/i);
    for (const route of phase.routes) assert.ok(app.includes(`path="${route.href}"`), `${route.href} existe no App`);
  }

  const withEvents = { ...play(6), pauseCount: 2, undoCount: 1 };
  assert.ok(readComplete(withEvents).notes.some((note) => note === "Proveniência do registro: 2 pausa(s), 1 registro(s) desfeito(s) e refeito(s) durante a partida."));

  const text = [...perfect.notes, ...mixed.notes, ...slow.notes, ...kind.notes, ...gestureReading.notes].join("\n");
  assert.doesNotMatch(text, /percentil|idade equivalente|QI|diagnóstico de|escore/i, "leitura descritiva, sem norma nem diagnóstico");
  for (const note of text.split("\n")) assert.equal(pdfSafe(note), note.replace(/[–—]/g, "-").replace(/×/g, "x"), `nota perde conteúdo no PDF: ${note}`);
});

test("leitura: toques impulsivos, não resposta por tipo e fadiga", () => {
  const fast = play(6, (index) => (index % 2 === 0 ? "erro" : "acerto"));
  fast.answers = fast.answers.map((entry) => (entry.kind === "toque" ? { ...entry, seconds: 0.4 } : entry));
  const fastReading = readComplete(fast);
  assert.ok(fastReading.fastMisses.length >= 2);
  assert.ok(fastReading.fastMisses.every((entry) => entry.kind === "toque" && entry.status === "erro"));

  const shy = play(8);
  shy.answers = shy.answers.map((entry) => (entry.kind === "fala" ? { ...entry, status: "sem_resposta", given: "—" } : entry));
  const shyReading = readComplete(shy);
  assert.ok(shyReading.noResponseByKind.fala >= 2);
  assert.equal(shyReading.noResponseByKind.toque, 0);
  assert.ok(shyReading.notes.some((note) => /Não resposta concentrada nas tarefas de fala/.test(note)));

  const tired = readComplete(play(10, (index) => (index < 15 ? "acerto" : "erro")));
  assert.deepEqual([tired.halves.first.hits, tired.halves.second.hits], [15, 0]);
  assert.equal(tired.halves.drop, true);
});

test("resumo para o prontuário é prosa curta com idade, contagem, mundos, itens perdidos, observações e ressalva autoral", () => {
  const session = { ...play(6, (index) => (index === 1 ? "erro" : index === 13 ? "sem_resposta" : "acerto")), observations: "Colaborou bem" };
  const brief = buildGameBrief(session, new Date("2026-09-30T12:00:00Z"));
  assert.match(brief, /^Avaliação lúdica de pré-consulta \(Super NeuroPad Game, 6 anos\) aplicada em 30\/09\/2026: 28 de 30 acertos, dentro do esperado para a idade\./);
  assert.match(brief, /Por mundo: Vila da Conversa 4\/5, Floresta dos Olhos 5\/5, Ilha das Palavras 4\/5, Montanha dos Números 5\/5, Caverna da Memória 5\/5, Torre do Corpo 5\/5\./);
  assert.match(brief, /Itens perdidos: .*\(errou\); .*\(não respondeu\)\./);
  assert.match(brief, /Observações da aplicadora: Colaborou bem\. Contagem autoral/);
  assert.match(brief, /Contagem autoral, não normativa; a leitura e a conclusão são do médico\.$/);
  assert.doesNotMatch(brief, /\n/);
  assert.doesNotMatch(brief, /Aprofundar com/);
  assert.ok(brief.length < 2000);
});

test("resumo e relatório datam a partida no fuso clínico, não em UTC nem no momento da cópia", () => {
  const lateSession = { ...play(6), startedAt: "2026-09-27T01:20:00.000Z", finishedAt: "2026-09-27T01:30:00.000Z" };
  assert.match(buildGameBrief(lateSession), /aplicada em 26\/09\/2026:/);
  assert.match(buildGameReport(lateSession), /Data e hora \(local\): 26\/09\/2026/);
  assert.doesNotMatch(buildGameReport(lateSession), /27\/09\/2026/);
  const partial = { ...lateSession, finishedAt: null };
  assert.match(buildGameBrief(partial), / em 26\/09\/2026/);
  assert.doesNotMatch(buildGameReport({ ...partial, startedAt: "" }), /Invalid Date|NaN/);
});

test("partidas interrompidas ou com itens duplicados não pontuam nem interpretam em texto, resumo ou PDF", () => {
  const full = play(6, (index) => (index % 2 ? "erro" : "acerto"));
  for (const count of [0, 1, 4, 7, 29]) {
    const partial = { ...full, answers: full.answers.slice(0, count) };
    const result = summarize(partial);
    assert.equal(result.complete, false);
    assert.equal(result.level, null);
    assert.ok(result.phases.every((phase) => phase.level === null));
    assert.equal(interpret(partial), null);
    const pdf = buildGameDocSpec(partial, ISSUER, "30/09/2026");
    for (const output of [buildGameReport(partial), buildGameBrief(partial), JSON.stringify(pdf)]) {
      assert.match(output, /incompleta/);
      assert.match(output, /Sem classificação ou interpretação/);
      assert.doesNotMatch(output, /sinal de alerta|dentro do esperado para|prioridade para|ritmo regular|roteiro sugerido|"nivel":"/i);
    }
    assert.ok(!pdf.sections.some((section) => /Leitura para a consulta|Critérios de leitura/.test(section.heading)));
    assert.equal(pdf.sections.length, 3 + 6 + 3);
    for (const entry of partial.answers) assert.ok(buildGameReport(partial).includes(entry.prompt));
  }
  const duplicate = { ...full, answers: full.answers.map((entry, index) => (index === 29 ? full.answers[0] : entry)) };
  assert.equal(summarize(duplicate).complete, false);
  assert.equal(interpret(duplicate), null);
});

test("duração de relógio da sessão: início → fim, nula sem fim ou com instantes inválidos", () => {
  const session = play(6);
  assert.equal(sessionWallSeconds(session), 900);
  assert.equal(sessionWallSeconds({ ...session, finishedAt: null }), null);
  assert.equal(sessionWallSeconds({ ...session, finishedAt: "invalido" }), null);
  assert.equal(sessionWallSeconds({ ...session, finishedAt: "2026-09-30T11:00:00.000Z" }), null);
});

test("salvar no prontuário: resumo, partida, instrumentos, observações e cada item com origem, sem classificar partida incompleta", () => {
  const full = { ...play(8, (index) => (index % 5 === 0 ? "erro" : "acerto")), pauseCount: 2, undoCount: 1, observations: "Agitada" };
  const rows = buildPatientRecordItems(full);
  assert.equal(rows.length, full.answers.length + 4);
  assert.deepEqual(rows[0], { question: "Resumo para o prontuário", answer: buildGameBrief(full) });
  assert.match(rows[1].answer, /Idade informada: 8 anos \(faixa anual\) · 30 de 30 itens registrados \(completa\)/);
  assert.match(rows[1].answer, /duração da sessão 15 min/);
  assert.match(rows[1].answer, /2 pausa\(s\) · 1 desfeito\(s\)/);
  assert.equal(rows[2].question, "O que foi testado por instrumento");
  assert.match(rows[2].answer, /Sonda 10: \d+\/\d+ itens registrados/);
  assert.deepEqual(rows[3], { question: "Observações da aplicadora", answer: "Agitada" });
  full.answers.forEach((entry, index) => {
    const row = rows[index + 4];
    assert.ok(row.question.endsWith(entry.prompt));
    assert.ok(row.question.includes(" · Sonda 10 · ") || row.question.includes(" · Observa 10 (OBS-10) · ") || row.question.includes(" · Reconhecimento visual · ") || row.question.includes(" · Avaliação cognitiva infantil · "));
    assert.ok(row.answer.includes(`esperado: ${entry.expected}`) && row.answer.includes(`registrado: ${entry.given}`));
  });
  for (const count of [0, 1, 7, 29]) {
    const partial = { ...full, answers: full.answers.slice(0, count), finishedAt: null, observations: "" };
    const partialRows = buildPatientRecordItems(partial);
    assert.equal(partialRows.length, count + 3);
    assert.match(partialRows[1].answer, /\(incompleta\)/);
    assert.doesNotMatch(partialRows[1].answer, /duração da sessão/);
    const text = partialRows.map((row) => `${row.question} ${row.answer}`).join("\n");
    assert.match(text, /Sem classificação ou interpretação/);
    assert.doesNotMatch(text, /sinal de alerta|dentro do esperado para|prioridade para|roteiro sugerido/i);
  }
});

test("página: rota real, sensível, sem persistência local, sem rede e sem câmera; abas de origem preservadas", () => {
  const app = readFileSync("client/src/App.tsx", "utf8");
  assert.match(app, /import\("@\/pages\/super-neuropad-game"\)/);
  assert.match(app, /<Route path="\/super-neuropad-game" component=\{SuperNeuroPadGamePage\} \/>/);
  for (const route of ["/testes-diretos", "/testes-reconhecimento", "/testes-cognitivos", "/avaliacao-pre-consulta-faixa-etaria"]) {
    assert.ok(app.includes(`path="${route}"`), `${route} continua existindo`);
  }
  assert.equal(isRouteSensitive(SUPER_NEUROPAD_ROUTE), true);
  const accessBase = { path: SUPER_NEUROPAD_ROUTE, accessMode: "remote" as const, isAuthenticated: true, isLoading: false };
  for (const role of ["admin", "professional", "operator"] as const) assert.equal(decideRouteAccess({ ...accessBase, userRole: role }), "allow");
  assert.equal(decideRouteAccess({ ...accessBase, userRole: "reader" }), "forbidden");
  const page = pageSource();
  const feature = ["model.ts", "bank.ts", "items.ts", "music.ts", "pdf.ts"].map((file) => strip(readFileSync(`client/src/features/super-neuropad/${file}`, "utf8"))).join("\n");
  assert.doesNotMatch(page + feature, /\b(?:localStorage|sessionStorage|indexedDB)\s*\./, "sem persistência clínica no navegador");
  assert.doesNotMatch(page + feature, /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(|preloadSymbols/, "sem envio por rede");
  assert.doesNotMatch(page + feature, /getUserMedia|MediaRecorder|<video|toDataURL|toBlob/, "sem câmera e o desenho com o dedo não é exportado");
  assert.match(page, /buildDocumentPdf\(buildGameDocSpec\(/, "PDF pelo construtor clínico compartilhado");
  assert.match(page, /createChiptune\(\)/);
  assert.match(page, /undoLastAnswer\(answers\)/);
  assert.match(page, /interpret\(session\)/);
  assert.match(page, /buildGameBrief\(session\)/);
  assert.match(page, /import \{ Stimulus as VrStimulus \} from "@\/features\/visual-recognition\/Stimulus";/, "figuras do Reconhecimento Visual reaproveitadas");
  assert.match(page, /<VrStimulus id=\{id\} child \/>/, "texto alternativo não entrega a resposta");
  assert.match(page, /import "@\/styles\/super-neuropad-arcade\.css"/);
  const css = readFileSync("client/src/styles/super-neuropad-arcade.css", "utf8");
  assert.match(css, /prefers-reduced-motion: no-preference/);
  assert.match(css, /\.snp \.snp-vr \.rv-illustration/);
  assert.match(feature, /isSoundEnabled\(\)/);
  assert.doesNotMatch(page, /Acertou!|Errou!|Resposta certa|Resposta errada/, "a criança não recebe certo/errado como feedback de jogo");
  assert.doesNotMatch(page, /cerca de 10 minutos|5 mundos|3–4 acertos = esperado|16\+ = esperado/, "textos fixos da versão de 5 mundos removidos");
});

test("página: menores de 2 anos bloqueados, estimativa de tempo, ambiente sem material, pular mundo com motivo e observações", () => {
  const page = pageSource();
  assert.match(page, /Menos de 2 anos/);
  assert.match(page, /data-testid="super-neuropad-under-two"/);
  assert.match(page, /\{UNDER_TWO_MESSAGE\}/);
  assert.match(page, /setUnderTwo\(true\); setAgeYears\(null\);/, "menor de 2 anos nunca tem faixa selecionada");
  assert.match(page, /estimateBandSeconds\(band\.min\)/);
  assert.match(page, /\(máximo 20\)/);
  assert.match(page, /band\.ambient/);
  assert.doesNotMatch(page, /band\.kit/);
  assert.match(page, /function skipPhase\(reason: string\)/);
  assert.match(page, /SKIP_REASONS\.map/);
  assert.match(page, /setSkipped\(\(current\) => current\.filter\(\(entry\) => entry\.phaseId !== phaseId\)\)/, "entrar no mundo anula o pulo anterior");
  assert.match(page, /data-testid="super-neuropad-observations"/);
  assert.match(page, /maxLength=\{OBSERVATIONS_MAX\}/);
  assert.match(page, /OBSERVATION_CHIPS\.map/);
  assert.match(page, /data-testid="super-neuropad-origins"/);
  assert.match(page, /cutText\(summary\.phases\[0\]\.total\)/);
  assert.match(page, /<DrawPad \/>/);
  assert.match(page, /BuildStage/);
});

test("toque duplo em tablet não registra o mesmo desafio duas vezes: todos os caminhos de resposta passam pela guarda por carimbo de evento", () => {
  const page = pageSource();
  assert.match(page, /import \{ acceptManualTap \} from "@\/components\/jogo-facil\/easyReport";/);
  assert.match(page, /if \(!acceptManualTap\(lastAnswerAt\.current, event\.timeStamp\)\) return;\s*\n\s*lastAnswerAt\.current = event\.timeStamp;\s*\n\s*pushAnswer\(record\);/);
  assert.doesNotMatch(page, /=> pushAnswer\(/, "nenhum botão chama pushAnswer direto");
  const submissionSites = [
    /onAnswer=\{\(chosen, event\) => submitAnswer\(recordTouch\(item, phaseId, chosen, elapsedSeconds\(\), repeated\), event\)\}/,
    /onMiss=\{\(status, event\) => submitAnswer\(recordTouch\(item, phaseId, null, elapsedSeconds\(\), repeated, status === "recusa"\), event\)\}/,
    /onDone=\{\(placed, event\) => submitAnswer\(recordBuild\(item, phaseId, placed, elapsedSeconds\(\), repeated\), event\)\}/,
    /onMiss=\{\(status, event\) => submitAnswer\(recordBuild\(item, phaseId, null, elapsedSeconds\(\), repeated, status === "recusa"\), event\)\}/,
    /onJudge=\{\(status, event, gesture\) => submitAnswer\(recordJudged\(item, phaseId, status, elapsedSeconds\(\), repeated, gesture \? "gesto" : undefined\), event\)\}/,
  ];
  for (const pattern of submissionSites) assert.match(page, pattern, `caminho de resposta sem guarda: ${pattern}`);
  assert.match(page, /lastAnswerAt\.current = Number\.NEGATIVE_INFINITY;\s*\n\s*setScreen\("intro"\)/, "startGame zera a guarda");
  assert.match(page, /lastAnswerAt\.current = Number\.NEGATIVE_INFINITY;\s*\n\s*setScreen\("setup"\)/, "restart zera a guarda");
});

test("atalhos da aplicadora: 1/2/3/4 (e 5 = gesto) só para itens julgados; P pausa; toque e montagem seguem da criança", () => {
  assert.equal(judgeShortcut("1"), "acerto");
  assert.equal(judgeShortcut("2"), "erro");
  assert.equal(judgeShortcut("3"), "sem_resposta");
  assert.equal(judgeShortcut("4"), "recusa");
  for (const key of ["0", "5", "p", "Enter", " ", "a"]) assert.equal(judgeShortcut(key), null, key);
  const page = pageSource();
  assert.match(page, /if \(paused \|\| !item \|\| \(item\.kind !== "fala" && item\.kind !== "fazer"\)\) return;/, "teclado nunca responde item de toque ou de montar");
  assert.match(page, /if \(event\.key === GESTURE_SHORTCUT && item\.gesture\)/, "atalho de gesto só quando o item prevê");
  assert.match(page, /submitAnswer\(recordJudged\(item, phaseId, status, elapsedSeconds\(\), repeated\), event\)/);
  assert.match(page, /event\.repeat \|\| event\.altKey \|\| event\.ctrlKey \|\| event\.metaKey/);
  assert.match(page, /INPUT\|TEXTAREA\|SELECT/, "digitar nas observações não aciona atalhos");
  for (const key of ["1", "2", "3", "4", "P"]) assert.match(page, new RegExp(`aria-keyshortcuts="${key}"`));
  assert.match(page, /aria-keyshortcuts=\{GESTURE_SHORTCUT\}/);
});

test("página prática: pausa automática com tempo em pausa, recomeço rápido, nova criança limpa idade e resultado protegido", () => {
  const page = pageSource();
  assert.match(page, /addEventListener\("visibilitychange", onVisibility\)/);
  assert.match(page, /if \(document\.hidden\) pauseNow\(true\)/);
  assert.match(page, /pauseCount\.current \+= 1;\s*\n\s*pausedAt\.current = performance\.now\(\);/, "pausa conta na proveniência e marca o início");
  assert.match(page, /pausedMs\.current \+= performance\.now\(\) - pausedAt\.current/, "tempo em pausa é somado");
  assert.match(page, /pausedSeconds: Math\.round\(pausedMs\.current \/ 1000\)/);
  assert.match(page, /canPause=\{screen === "play"\}/);
  assert.match(page, /function restart\(\) \{[\s\S]*?setAgeYears\(null\);\s*\n\s*setCharacter\(null\);/);
  assert.match(page, /function restart\(\) \{[\s\S]*?setObservations\(""\);/, "nova criança não herda observações");
  assert.match(page, /screen === "results" && !resultKept && !window\.confirm\(/);
  assert.match(page, /function replaySameChild\(\) \{[\s\S]*?startGame\(\);/);
  assert.match(page, /onRestart=\{replaySameChild\}/);
  assert.match(page, /setSeed\(Math\.floor\(Math\.random\(\) \* 1_000_000\)\);/);
  for (const kept of [/writeText\(text\);\s*\n\s*setResultKept\(true\)/, /downloadTextDocument\([^\n]+\);\s*\n\s*setResultKept\(true\)/, /revokeObjectURL\(url\), 1000\);\s*\n\s*setResultKept\(true\)/, /onSaved=\{\(\) => setResultKept\(true\)\}/]) {
    assert.match(page, kept);
  }
  assert.match(page, /import\("@\/components\/SaveToPatient"\)/);
  assert.match(page, /screen === "results" \? buildPatientRecordItems\(session\) : \[\]/);
  const resultsAt = page.indexOf('{screen === "results" && summary && session && (');
  assert.ok(page.slice(resultsAt).includes("<LazySaveToPatient"));
  assert.doesNotMatch(page.slice(0, resultsAt), /<LazySaveToPatient/);
});

test("banco: toque tem uma opção certa e a posição dela varia (sem gabarito previsível)", () => {
  for (const band of AGE_BANDS) {
    const positions = new Set<number>();
    for (const phaseId of PHASE_ORDER) {
      for (const item of itemsFor(band.id, phaseId)) {
        if (item.kind !== "toque") continue;
        const touch = item as TouchItem;
        assert.equal(touch.options.filter((option) => option.label === touch.answer).length, 1, item.id);
        positions.add(touch.options.findIndex((option) => option.label === touch.answer));
      }
    }
    assert.ok(positions.size >= 2, `${band.id}: correta em ${positions.size} posições distintas (o jogo ainda embaralha a cada partida)`);
  }
});
