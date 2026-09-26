// Super NeuroPad Game: banco objetivo (certo/errado explícito), cobertura
// 6 faixas × 5 fases × 4 itens, motor de resultado, relatório/PDF e a
// disciplina clínica da página (sem persistência, sem rede, sem câmera).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AGE_BANDS,
  CHARACTERS,
  ITEM_BANK,
  ITEMS_PER_PHASE,
  MAX_AGE_YEARS,
  MIN_AGE_YEARS,
  PHASE_ORDER,
  PHASES,
  SUPER_NEUROPAD_ROUTE,
  bandForYears,
  buildGameBrief,
  buildGameReport,
  describeArt,
  interpret,
  pdfLossless,
  itemsFor,
  overallLevel,
  phaseLevel,
  recordJudged,
  recordTouch,
  shuffle,
  summarize,
  undoLastAnswer,
  type AnswerRecord,
  type GameSession,
  type TouchItem,
} from "../../client/src/features/super-neuropad/model";
import { buildGameDocSpec } from "../../client/src/features/super-neuropad/pdf";
import { pdfSafe } from "../../client/src/lib/documentPdf";
import { decideRouteAccess, isRouteSensitive } from "../../client/src/security/routeGuardPolicy";

test("faixas etárias cobrem 2 a 17 anos, em anos inteiros, sem lacuna nem sobreposição", () => {
  for (let years = MIN_AGE_YEARS; years <= MAX_AGE_YEARS; years++) {
    const matches = AGE_BANDS.filter((band) => years >= band.min && years <= band.max);
    assert.equal(matches.length, 1, `${years} anos deve cair em exatamente uma faixa`);
    assert.equal(bandForYears(years)?.id, matches[0].id);
  }
  assert.equal(bandForYears(1), undefined);
  assert.equal(bandForYears(18), undefined);
  assert.equal(bandForYears(4.5), undefined, "meses não entram: só anos inteiros");
  for (const band of AGE_BANDS) assert.doesNotMatch(band.label, /mes/i, "rótulo sem meses");
});

test("banco: cada faixa tem 5 fases com 4 itens objetivos e ids únicos", () => {
  const ids = new Set<string>();
  for (const band of AGE_BANDS) {
    for (const phaseId of PHASE_ORDER) {
      const items = itemsFor(band.id, phaseId);
      assert.equal(items.length, ITEMS_PER_PHASE, `${band.id}/${phaseId}`);
      for (const item of items) {
        assert.equal(ids.has(item.id), false, `id duplicado ${item.id}`);
        ids.add(item.id);
        assert.ok(item.id.startsWith(`${band.id}.${phaseId}.`), `id ${item.id} fora da faixa/fase`);
        assert.ok(item.prompt.trim().length > 0);
        if (item.kind === "toque") {
          assert.ok(item.options.length >= 2 && item.options.length <= 4, `${item.id}: 2 a 4 opções`);
          const hits = item.options.filter((option) => option.label === item.answer);
          assert.equal(hits.length, 1, `${item.id}: exatamente uma opção certa`);
          for (const option of item.options) {
            assert.ok(option.art.trim().length > 0 && option.label.trim().length > 0, `${item.id}: opção com arte e rótulo`);
          }
          if (item.preview) {
            const shown = item.preview.split(/\s+/);
            const answerArt = item.options.find((option) => option.label === item.answer)!.art;
            const asksMissing = /NÃO apareceu/.test(item.prompt);
            assert.equal(shown.includes(answerArt), !asksMissing, `${item.id}: resposta coerente com o estímulo mostrado`);
          }
        } else {
          assert.ok(item.expected.trim().length > 0, `${item.id}: critério explícito de acerto`);
        }
      }
    }
  }
  assert.equal(ids.size, AGE_BANDS.length * PHASE_ORDER.length * ITEMS_PER_PHASE);
  assert.equal(Object.keys(ITEM_BANK).length, AGE_BANDS.length);
});

test("a posição da alternativa correta varia dentro de cada faixa (sem gabarito previsível)", () => {
  for (const band of AGE_BANDS) {
    const positions = new Set<number>();
    for (const phaseId of PHASE_ORDER) {
      for (const item of itemsFor(band.id, phaseId)) {
        if (item.kind === "toque") positions.add(item.options.findIndex((option) => option.label === item.answer));
      }
    }
    assert.ok(positions.size >= 3, `${band.id}: correta em ${positions.size} posições distintas`);
  }
});

test("fases são cinco, ordenadas, cada uma com proveniência nas abas de origem", () => {
  assert.equal(PHASES.length, 5);
  assert.deepEqual(PHASES.map((phase) => phase.order), [1, 2, 3, 4, 5]);
  assert.deepEqual(PHASES.map((phase) => phase.id), [...PHASE_ORDER]);
  for (const phase of PHASES) {
    assert.match(phase.source, /Sonda 10|OBS-10|Reconhecimento Visual|Testes Cognitivos/);
    assert.ok(phase.operator.length > 20);
  }
  assert.equal(CHARACTERS.length, 6);
  assert.equal(new Set(CHARACTERS.map((character) => character.id)).size, 6);
});

test("embaralhamento é determinístico por semente e preserva o conjunto", () => {
  const values = ["a", "b", "c", "d"];
  assert.deepEqual(shuffle(values, 7), shuffle(values, 7));
  assert.deepEqual([...shuffle(values, 7)].sort(), values);
  assert.deepEqual(values, ["a", "b", "c", "d"], "entrada não é mutada");
});

test("registro de toque confere sozinho; registro julgado usa o critério; tempos arredondam", () => {
  const item = itemsFor("4-5", "olhos")[0] as TouchItem;
  const right = item.options.find((option) => option.label === item.answer)!;
  const wrong = item.options.find((option) => option.label !== item.answer)!;
  assert.equal(recordTouch(item, "olhos", right, 2.345).status, "acerto");
  assert.equal(recordTouch(item, "olhos", wrong, 1).status, "erro");
  const skipped = recordTouch(item, "olhos", null, -3);
  assert.equal(skipped.status, "sem_resposta");
  assert.equal(skipped.seconds, 0);
  assert.equal(recordTouch(item, "olhos", right, 2.345).seconds, 2.3);
  const judged = itemsFor("4-5", "corpo")[0];
  assert.notEqual(judged.kind, "toque");
  if (judged.kind !== "toque") {
    const record = recordJudged(judged, "corpo", "acerto", 4.06);
    assert.equal(record.expected, judged.expected);
    assert.equal(record.given, "Cumpriu o critério");
    assert.equal(record.seconds, 4.1);
    assert.equal(recordJudged(judged, "corpo", "sem_resposta", 1).given, "—");
  }
  const reading = itemsFor("8-9", "palavras")[3];
  assert.equal(reading.kind, "fala");
  if (reading.kind === "fala") {
    assert.equal(recordJudged(reading, "palavras", "acerto", 2).prompt, "Peça: “Leia em voz alta.” (estímulo: O gato subiu no telhado.)");
  }
  const digits = itemsFor("8-9", "memoria")[0];
  if (digits.kind === "fala") assert.match(recordJudged(digits, "memoria", "erro", 2).prompt, /\(estímulo: 3 · 8 · 1 · 6 · 4\)$/);
  const icon = itemsFor("8-9", "corpo")[0];
  if (icon.kind === "fazer") assert.equal(recordJudged(icon, "corpo", "acerto", 2).prompt, icon.prompt, "ícone ilustrativo não entra no registro");
});

test("faixas operacionais: 3–4 esperado, 2 observar, 0–1 alerta; total 16+/12–15/≤11", () => {
  assert.equal(phaseLevel(4, 4), "esperado");
  assert.equal(phaseLevel(3, 4), "esperado");
  assert.equal(phaseLevel(2, 4), "observar");
  assert.equal(phaseLevel(1, 4), "alerta");
  assert.equal(phaseLevel(0, 4), "alerta");
  assert.equal(overallLevel(16, 20), "esperado");
  assert.equal(overallLevel(15, 20), "observar");
  assert.equal(overallLevel(12, 20), "observar");
  assert.equal(overallLevel(11, 20), "alerta");
  assert.equal(overallLevel(0, 0), "alerta");
});

function play(bandId: GameSession["bandId"], plan: (index: number) => AnswerRecord["status"]): GameSession {
  const band = AGE_BANDS.find((entry) => entry.id === bandId)!;
  const answers: AnswerRecord[] = [];
  let index = 0;
  for (const phaseId of PHASE_ORDER) {
    for (const item of itemsFor(bandId, phaseId)) {
      const status = plan(index++);
      if (item.kind === "toque") {
        const chosen = status === "sem_resposta" ? null : item.options.find((option) => (option.label === item.answer) === (status === "acerto"))!;
        answers.push(recordTouch(item, phaseId, chosen, 3));
      } else {
        answers.push(recordJudged(item, phaseId, status, 5));
      }
    }
  }
  return { version: "test", ageYears: band.min, bandId, characterId: "robo", startedAt: "2026-09-25T12:00:00.000Z", finishedAt: "2026-09-25T12:10:00.000Z", answers };
}

test("resumo conta acertos por fase e no total, marca completude e soma tempos", () => {
  const perfect = summarize(play("8-9", () => "acerto"));
  assert.equal(perfect.hits, 20);
  assert.equal(perfect.total, 20);
  assert.equal(perfect.level, "esperado");
  assert.equal(perfect.complete, true);
  assert.ok(perfect.durationSeconds > 0);
  assert.deepEqual(perfect.phases.map((phase) => phase.hits), [4, 4, 4, 4, 4]);

  const mixed = summarize(play("6-7", (index) => (index % 4 === 0 ? "erro" : index % 4 === 1 ? "sem_resposta" : "acerto")));
  assert.equal(mixed.hits, 10);
  assert.equal(mixed.level, "alerta");
  assert.deepEqual(mixed.phases.map((phase) => [phase.hits, phase.errors, phase.noResponse]), [[2, 1, 1], [2, 1, 1], [2, 1, 1], [2, 1, 1], [2, 1, 1]]);
  assert.ok(mixed.phases.every((phase) => phase.level === "observar"));

  const partial = play("2-3", () => "acerto");
  partial.answers = partial.answers.slice(0, 7);
  const summary = summarize(partial);
  assert.equal(summary.complete, false);
  assert.equal(summary.hits, 7);
  assert.equal(summary.phases[4].answers.length, 0);
});

test("relatório e PDF trazem cada pergunta, resposta esperada, registrada, certo/errado e tempo, sem escore normativo", () => {
  const session = play("10-12", (index) => (index === 3 ? "erro" : index === 9 ? "sem_resposta" : "acerto"));
  const report = buildGameReport(session, new Date("2026-09-25T12:00:00Z"));
  assert.match(report, /18 de 20 acertos/);
  assert.match(report, /NÃO É ESCORE NORMATIVO, PERCENTIL NEM DIAGNÓSTICO/);
  for (const answer of session.answers) {
    assert.ok(report.includes(answer.prompt), `relatório inclui: ${answer.prompt}`);
    assert.ok(report.includes(`Esperado: ${answer.expected}`));
  }
  assert.match(report, /Errou · 3s/);
  assert.match(report, /Não respondeu · 3s/);
  assert.doesNotMatch(report, /percentil: |idade equivalente: |QI/i);

  const spec = buildGameDocSpec(session, { doctorName: "Profissional Sintético", specialty: "Neuropediatria", credentials: "CRM 00000", clinicName: "Clínica Sintética", motto: "" }, "25/09/2026 09:00");
  assert.match(spec.title, /Super NeuroPad Game/);
  assert.equal(spec.sections.length, 3 + 5 + 2);
  assert.deepEqual(spec.sections.slice(0, 3).map((section) => section.heading), ["Identificação da aplicação", "Resultado objetivo", "Leitura para a consulta"]);
  assert.match(spec.sections[2].body, /Itens para checar na consulta \(2\)/);
  assert.match(spec.sections[2].body, /nenhuma norma, percentil, idade equivalente ou diagnóstico/);
  assert.match(spec.sections[1].body, /TOTAL: 18 acertos em 20 itens/);
  const bodies = spec.sections.map((section) => section.body).join("\n");
  for (const answer of session.answers) {
    assert.ok(bodies.includes(describeArt(answer.prompt)));
    assert.ok(bodies.includes(`Resposta esperada: ${describeArt(answer.expected)}`));
    assert.ok(bodies.includes(`Resposta registrada: ${describeArt(answer.given)}`));
  }
  assert.match(bodies, /Resultado: Errou - tempo: 3 s/);
  assert.match(bodies, /Resultado: Não respondeu - tempo: 3 s/);
  assert.match(bodies, /nada foi persistido no navegador nem enviado por rede/);
  assert.match(bodies, /O que vem depois\? \[vermelho\] \[vermelho\] \[azul\]/, "estímulo em emoji vira texto no PDF");
  // Nada é descartado pela normalização Latin-1 do construtor de PDF.
  for (const section of spec.sections) {
    for (const line of [section.heading, ...section.body.split("\n")]) {
      const expected = line.replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, "...").replace(/×/g, "x");
      assert.equal(pdfSafe(line), expected, `linha perde conteúdo no PDF: ${line}`);
    }
  }
});

test("todo enunciado, critério e rótulo do banco sobrevivem inteiros ao PDF via glossário de figuras", () => {
  for (const band of AGE_BANDS) {
    for (const phaseId of PHASE_ORDER) {
      for (const item of itemsFor(band.id, phaseId)) {
        assert.ok(pdfLossless(item.prompt), `${item.id}: enunciado perde figura no PDF: ${item.prompt}`);
        if (item.kind === "toque") {
          for (const option of item.options) assert.ok(pdfLossless(option.label), `${item.id}: rótulo ${option.label}`);
          assert.ok(pdfLossless(item.answer));
        } else {
          assert.ok(pdfLossless(item.expected), `${item.id}: critério ${item.expected}`);
        }
      }
    }
  }
  assert.equal(describeArt("Toque na figura IGUAL a esta: 🦋"), "Toque na figura IGUAL a esta: [borboleta]");
  assert.equal(describeArt("Qual figura é IGUAL a esta? ♞"), "Qual figura é IGUAL a esta? [cavalo preto]");
});

test("desfazer último registro devolve fase e índice exatos do desafio a refazer", () => {
  assert.equal(undoLastAnswer([]), null);
  const session = play("6-7", () => "acerto");
  const inPhase3 = session.answers.slice(0, 10); // 4 + 4 + 2 itens
  const undone = undoLastAnswer(inPhase3)!;
  assert.equal(undone.answers.length, 9);
  assert.equal(undone.phaseId, "numeros");
  assert.equal(undone.itemIndex, 1, "volta para o segundo desafio da terceira fase");
  const phaseEnd = undoLastAnswer(session.answers.slice(0, 8))!;
  assert.equal(phaseEnd.phaseId, "palavras");
  assert.equal(phaseEnd.itemIndex, 3, "fim de fase volta para o último desafio da fase");
  assert.equal(inPhase3.length, 10, "entrada não é mutada");
});

test("comando repetido entra no registro só quando marcado e aparece em relatório e PDF", () => {
  const item = itemsFor("4-5", "olhos")[0] as TouchItem;
  const right = item.options.find((option) => option.label === item.answer)!;
  assert.equal("repeated" in recordTouch(item, "olhos", right, 1), false);
  assert.equal(recordTouch(item, "olhos", right, 1, true).repeated, true);
  const judged = itemsFor("4-5", "corpo")[0];
  if (judged.kind !== "toque") assert.equal(recordJudged(judged, "corpo", "erro", 2, true).repeated, true);
  const session = play("4-5", () => "acerto");
  session.answers[2] = { ...session.answers[2], repeated: true };
  const reading = interpret(session);
  assert.equal(reading.repeated, 1);
  assert.ok(reading.notes.some((note) => /Comando repetido em 1 item/.test(note)));
  assert.match(buildGameReport(session), /comando repetido 1x/);
  const spec = buildGameDocSpec(session, { doctorName: "P", specialty: "", credentials: "", clinicName: "", motto: "" }, "26/09/2026 09:00");
  assert.match(spec.sections.map((section) => section.body).join("\n"), /comando repetido 1x/);
});

test("leitura para a consulta: prioridades, padrão de resposta, ritmo interno, toque × aplicadora e abas para aprofundar", () => {
  const perfect = interpret(play("8-9", () => "acerto"));
  assert.equal(perfect.complete, true);
  assert.deepEqual(perfect.priorities, []);
  assert.deepEqual(perfect.missed, []);
  assert.equal(perfect.pattern, "nenhum");
  assert.deepEqual(perfect.slow, []);
  assert.ok(perfect.notes.some((note) => /dentro do esperado/.test(note) && /não exclui dificuldades sutis/.test(note)));
  assert.equal(perfect.notes.some((note) => /Aprofundar/.test(note)), false);

  // Fase 4 (memória) toda sem resposta, fase 2 (palavras) com dois erros: prioridade ordena alerta antes de observar.
  const mixed = interpret(play("6-7", (index) => (index >= 12 && index < 16 ? "sem_resposta" : index === 4 || index === 5 ? "erro" : "acerto")));
  assert.deepEqual(mixed.priorities.map((phase) => [phase.phase.id, phase.level]), [["memoria", "alerta"], ["palavras", "observar"]]);
  assert.equal(mixed.missed.length, 6);
  assert.equal(mixed.errors, 2);
  assert.equal(mixed.noResponse, 4);
  assert.equal(mixed.pattern, "nao_resposta");
  assert.ok(mixed.notes.some((note) => /Predomínio de não resposta \(4 de 6/.test(note) && /recusa, timidez, cansaço/.test(note)));
  assert.ok(mixed.notes.some((note) => /Prioridade para a consulta: Caverna da Memória 0\/4 \(alerta\); Ilha das Palavras 2\/4 \(observar\)/.test(note)));
  assert.deepEqual(mixed.deepen, [
    "Sonda 10 (memória operacional e regra) · OBS-10 (regra SOL/LUA)",
    "Sonda 10 (linguagem) · Testes Cognitivos (leitura e escrita)",
  ]);
  assert.ok(mixed.notes.some((note) => /Aprofundar com as abas de origem: Sonda 10 \(memória operacional e regra\)/.test(note)));

  // Ritmo: comparação interna. Mediana 3-5 s; um item de 40 s fica marcado; nada normativo.
  const slowSession = play("10-12", () => "acerto");
  slowSession.answers[7] = { ...slowSession.answers[7], seconds: 40 };
  const slow = interpret(slowSession);
  assert.equal(slow.slow.length, 1);
  assert.equal(slow.slow[0].seconds, 40);
  assert.ok(slow.notes.some((note) => /Ritmo: mediana de \d+(\.\d)? s por item; 1 item\(ns\) bem acima do ritmo da própria criança \(40 s\)\. Comparação interna à partida, não normativa\./.test(note)));

  // Toque × aplicadora: todo item julgado errado, todo toque certo.
  const judgedFail = interpret(play("6-7", () => "acerto"));
  const byKind = play("6-7", () => "acerto");
  byKind.answers = byKind.answers.map((answer) => (answer.kind === "toque" ? answer : { ...answer, status: "erro", given: "Não cumpriu o critério" }));
  const kind = interpret(byKind);
  assert.equal(kind.touch.hits, kind.touch.total);
  assert.equal(kind.judged.hits, 0);
  assert.ok(kind.judged.total > 0);
  assert.ok(kind.pattern === "erro_ativo");
  assert.ok(kind.notes.some((note) => /Melhor nos itens conferidos pelo jogo/.test(note) && /rigor do critério aplicado/.test(note)));
  assert.equal(judgedFail.notes.some((note) => /Melhor nos itens/.test(note)), false);

  // Partida incompleta: fases não aplicadas não viram alerta nem prioridade.
  const partial = play("2-3", () => "acerto");
  partial.answers = partial.answers.slice(0, 9);
  const summary = summarize(partial);
  assert.deepEqual(summary.phases.map((phase) => phase.applied), [true, true, true, false, false]);
  assert.equal(summary.phases[0].seconds, 12);
  const incomplete = interpret(partial);
  assert.equal(incomplete.complete, false);
  assert.deepEqual(incomplete.priorities.map((phase) => phase.phase.id), ["numeros"], "fase parcial com 1/4 é prioridade; fases não aplicadas não são");
  assert.deepEqual(incomplete.notApplied.map((phase) => phase.phase.id), ["memoria", "corpo"]);
  assert.ok(incomplete.notes.some((note) => /Partida incompleta: 9 de 20 itens registrados\. Fase\(s\) não aplicada\(s\): Caverna da Memória, Torre do Corpo\./.test(note)));
  assert.match(incomplete.headline, /^Partida incompleta/);

  const text = [...perfect.notes, ...mixed.notes, ...slow.notes, ...kind.notes, ...incomplete.notes].join("\n");
  assert.doesNotMatch(text, /percentil|idade equivalente|QI|diagnóstico de|escore/i, "leitura descritiva, sem norma nem diagnóstico");
  for (const note of text.split("\n")) assert.equal(pdfSafe(note), note.replace(/[–—]/g, "-").replace(/×/g, "x"), `nota perde conteúdo no PDF: ${note}`);
});

test("resumo para o prontuário é prosa curta com faixa, contagem, fases, itens perdidos e ressalva autoral", () => {
  const session = play("6-7", (index) => (index === 1 ? "erro" : index === 13 ? "sem_resposta" : "acerto"));
  const brief = buildGameBrief(session, new Date("2026-09-26T12:00:00Z"));
  assert.match(brief, /^Triagem lúdica de pré-consulta \(Super NeuroPad Game, faixa 6 a 7 anos\) aplicada pela recepção em 26\/09\/2026: 18 de 20 acertos, dentro do esperado para a faixa\./);
  assert.match(brief, /Por fase: Floresta dos Olhos 3\/4, Ilha das Palavras 4\/4, Montanha dos Números 4\/4, Caverna da Memória 3\/4, Torre do Corpo 4\/4\./);
  assert.match(brief, /Itens perdidos: .*\(errou\); .*\(não respondeu\)\./);
  assert.match(brief, /Contagem autoral, não normativa; a leitura e a conclusão são do médico\.$/);
  assert.doesNotMatch(brief, /\n/, "uma única prosa corrida");
  assert.doesNotMatch(brief, /Aprofundar com/, "sem instrução operacional no texto do prontuário");
  assert.equal(brief.length < 1200, true);
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
  for (const role of ["admin", "professional", "operator"] as const) {
    assert.equal(decideRouteAccess({ ...accessBase, userRole: role }), "allow", `papel ${role} pode aplicar o jogo`);
  }
  assert.equal(decideRouteAccess({ ...accessBase, userRole: "reader" }), "forbidden", "reader não aplica o jogo");
  const strip = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  const page = strip(readFileSync("client/src/pages/super-neuropad-game.tsx", "utf8"));
  const feature = ["model.ts", "music.ts", "pdf.ts"].map((file) => strip(readFileSync(`client/src/features/super-neuropad/${file}`, "utf8"))).join("\n");
  assert.doesNotMatch(page + feature, /\b(?:localStorage|sessionStorage|indexedDB)\s*\./, "sem persistência clínica no navegador");
  assert.doesNotMatch(page + feature, /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/, "sem envio por rede");
  assert.doesNotMatch(page + feature, /getUserMedia|MediaRecorder|<video/, "sem câmera");
  assert.match(page, /buildDocumentPdf\(buildGameDocSpec\(/, "PDF pelo construtor clínico compartilhado");
  assert.match(page, /createChiptune\(\)/, "trilha chiptune sintetizada");
  assert.match(page, /undoLastAnswer\(answers\)/, "desfazer último registro na interface");
  assert.match(page, /interpret\(session\)/, "leitura para a consulta na tela de resultado");
  assert.match(page, /buildGameBrief\(session\)/, "resumo para o prontuário");
  assert.match(page, /import "@\/styles\/super-neuropad-arcade\.css"/, "acabamento arcade isolado em folha própria");
  const css = readFileSync("client/src/styles/super-neuropad-arcade.css", "utf8");
  assert.match(css, /prefers-reduced-motion: no-preference/, "animações só com movimento permitido");
  assert.match(page, /isSoundEnabled\(\)/.test(feature) ? /Música/ : /Música/, "controle de música na interface");
  assert.match(feature, /isSoundEnabled\(\)/, "música respeita a preferência global de som");
  assert.doesNotMatch(page, /Acertou!|Errou!|Resposta certa|Resposta errada/, "a criança não recebe certo/errado como feedback de jogo");
});
