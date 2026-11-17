// OBS-10 · modo Fases. Contrato: mesmos cartões, omissões e registro do Guia da assistente, apresentados em
// fases com um toque por cartão; progressão por documentação, nunca por desempenho; JSON reabre na revisão completa.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { AGE_BANDS, OBS10_VERSION, OUTCOMES, PHASES } from "../../client/src/features/obs10/protocol";
import { PRACTICAL_TASKS } from "../../client/src/features/obs10/practical";
import { PREPARATION_DIRECT_LINE, PREPARATION_FASES_LINE, makeReport, observationIssues, type SessionRecord } from "../../client/src/features/obs10/session";
import { reviewText } from "../../client/src/features/obs10/review";
import { applicatorResult, applicatorResultText } from "../../client/src/features/obs10/fases/result";
import { makeDossier } from "../../client/src/features/obs10/dossier";
import { parseRecordJSON } from "../../client/src/features/obs10/importRecord";
import {
  APPLICATOR_RECORDING, FASES_END, FASES_HELP, FASES_LABEL, FASES_SKIP, NOT_APPLIED_RESPONSE, buildFasesPlan, cardId, entryCardOf, fasesSummary,
  flattenPlan, markObservation, materialsFor, mentionsCamera, noteOf, phaseProgress, withoutCamera,
} from "../../client/src/features/obs10/fases/model";

const page = readFileSync("client/src/pages/pre-consulta-obs10.tsx", "utf8");
const ui = readFileSync("client/src/features/obs10/fases/FasesMode.tsx", "utf8");
const model = readFileSync("client/src/features/obs10/fases/model.ts", "utf8");
const band = (id: string) => AGE_BANDS.find((item) => item.id === id)!;

test("as seis fases trazem exatamente os cartões da ficha, em ordem e sem duplicar", () => {
  for (const item of AGE_BANDS) {
    const plan = buildFasesPlan(item, item.min, true);
    assert.equal(plan.length, PHASES.length, `${item.id}: seis fases`);
    const cards = flattenPlan(plan);
    assert.deepEqual(cards.map((card) => card.task.id), PRACTICAL_TASKS[item.id].map((task) => task.id), `${item.id}: mesma ordem do Guia`);
    cards.forEach((card, index) => {
      assert.equal(card.position, index, `${item.id}: posição contínua`);
      assert.equal(card.phase, card.task.phase, `${item.id}: cartão na fase do protocolo`);
    });
    plan.forEach((phase) => assert.ok(phase.cards.length > 0, `${item.id}: fase ${phase.index + 1} tem cartão`));
  }
});

test("omissões seguem a regra única: prono só com autorização e tarefas com idade mínima", () => {
  const infant = band("m00");
  const withoutProne = flattenPlan(buildFasesPlan(infant, 1, false)).filter((card) => card.task.prone);
  assert.ok(withoutProne.length > 0 && withoutProne.every((card) => card.omission?.includes("Sem autorização para prono")));
  assert.ok(flattenPlan(buildFasesPlan(infant, 1, true)).filter((card) => card.task.prone).every((card) => card.omission === null));
  const toddler = band("m24");
  const young = flattenPlan(buildFasesPlan(toddler, 24, false)).filter((card) => card.task.minMonths !== undefined);
  assert.ok(young.length > 0 && young.every((card) => card.omission?.startsWith("Não aplicar antes de")));
  assert.ok(flattenPlan(buildFasesPlan(toddler, 34, false)).filter((card) => card.task.minMonths !== undefined).every((card) => card.omission === null));
});

test("um toque grava a categoria canônica; ajuda e pulo exigem o motivo escolhido; nota é só o que foi digitado", () => {
  const task = PRACTICAL_TASKS.y06[1];
  const first = markObservation(task, { outcome: "E" }, 42, undefined, false);
  assert.equal(first.id, cardId(task));
  assert.equal(first.id, `guided-${task.id}`, "mesmo id do Guia para reabrir na revisão completa");
  assert.equal(first.task, task.title);
  assert.equal(first.response, "", "categoria sozinha não escreve descrição");
  assert.equal(first.assistance, "");
  assert.equal(first.applicationSecond, 42);
  assert.ok(observationIssues(first).some((issue) => issue.startsWith("Descreva o fato")), "sem nota segue pendente");

  const helped = markObservation(task, { outcome: "V", assistance: FASES_HELP[0].assistance, note: "  tocou a mesa  " }, 90, first, false);
  assert.equal(helped.outcome, "V");
  assert.equal(helped.response, "tocou a mesa");
  assert.equal(helped.assistance, FASES_HELP[0].assistance);
  assert.equal(helped.applicationSecond, 42, "trocar a marcação preserva o horário original");

  const skipped = markObservation(task, { outcome: "NA", assistance: FASES_SKIP[0] }, 120, helped, false);
  assert.equal(skipped.response, NOT_APPLIED_RESPONSE);
  assert.equal(skipped.assistance, FASES_SKIP[0]);
  assert.deepEqual(observationIssues(skipped), [], "pular com motivo fica completo");
  assert.equal(noteOf(skipped), "");
  const skippedWithNote = markObservation(task, { outcome: "NA", assistance: FASES_SKIP[1], note: "chorou" }, 120, undefined, false);
  assert.equal(noteOf(skippedWithNote), "chorou");
  assert.equal(noteOf(helped), "tocou a mesa");

  const back = markObservation(task, { outcome: "R" }, 130, skipped, false);
  assert.equal(back.response, "", "frase automática de não aplicação some ao trocar a categoria");
  assert.equal(back.assistance, "");

  const modelTask = Object.values(PRACTICAL_TASKS).flat().find((item) => item.model)!;
  assert.equal(markObservation(modelTask, { outcome: "E" }, 1, undefined, false).modelInInstruction, true, "modelo previsto não vira produção espontânea");
  assert.equal(markObservation(task, { outcome: "E" }, 1, undefined, true).editedAfterEnd, true);
});

test("rótulos simples cobrem todas as categorias canônicas e nenhum soa como nota", () => {
  assert.deepEqual(Object.keys(FASES_LABEL).sort(), OUTCOMES.map((item) => item.id).sort());
  for (const help of FASES_HELP) assert.ok(["V", "M", "A"].includes(help.outcome) && help.assistance.length > 10);
  const visible = [...Object.values(FASES_LABEL), ...FASES_HELP.map((item) => item.label), ...FASES_SKIP].join(" ");
  assert.doesNotMatch(visible, /acert|err[oa]u?\b|ponto|nota\s+\d|estrela|XP|n[ií]vel|pr[eê]mio|normal/i);
});

test("progresso conta cartões marcados, qualquer categoria; nunca desempenho", () => {
  const plan = buildFasesPlan(band("y04"), 50, false);
  const cards = flattenPlan(plan);
  const asE = cards.map((card) => markObservation(card.task, { outcome: "E" }, 10, undefined, false));
  const asND = cards.map((card) => markObservation(card.task, { outcome: "ND" }, 10, undefined, false));
  const a = fasesSummary(plan, asE), b = fasesSummary(plan, asND);
  assert.equal(a.marked, cards.length);
  assert.deepEqual({ ...a, withoutNote: 0 }, { ...b, withoutNote: 0 }, "fez ou não fez agora: mesma progressão");
  assert.equal(a.phasesDone, PHASES.length);
  const partial = asE.slice(1);
  assert.equal(phaseProgress(plan[0], partial).done, false);
  assert.equal(entryCardOf(plan[0], partial), 0, "volta ao primeiro cartão sem marca da fase");
  assert.equal(fasesSummary(plan, []).unmarked, cards.length);
  assert.ok(!materialsFor(plan[2]).includes("Celular + suporte"), "o celular não aparece como objeto a pegar");
});

test("registro do modo Fases: linha de preparo, relatório, dossiê e reimportação na revisão completa", () => {
  const item = band("y06");
  const plan = buildFasesPlan(item, 80, false);
  const cards = flattenPlan(plan);
  const observations = [
    markObservation(cards[0].task, { outcome: "E", note: "entrou e sentou" }, 5, undefined, false),
    markObservation(cards[1].task, { outcome: "NA", assistance: FASES_SKIP[3] }, 40, undefined, false),
  ];
  const record: SessionRecord = {
    version: OBS10_VERSION, sessionId: "2026-11-17T10-00-00-000Z-abcd1234",
    context: { code: "OBS-FASES", chronologicalMonths: 80, correctedMonths: null, bandId: item.id, schooling: "", language: "", adaptations: "", conditions: "", familyReport: "", proneAllowed: false, preparation: "fases" },
    observations, durationSeconds: 300, endReason: FASES_END.early, encodingSecond: null, recallSecond: null,
    recording: "Filmagem externa declarada pela aplicadora (celular de apoio).",
  };
  const report = makeReport(record);
  assert.ok(report.includes(PREPARATION_FASES_LINE));
  assert.ok(!report.includes(PREPARATION_DIRECT_LINE));
  assert.match(report, /Fato\/resposta literal: entrou e sentou/);
  assert.match(report, /NÃO É LAUDO NEM DIAGNÓSTICO/);
  assert.match(makeDossier(record), /Preparação: modo Fases/);
  assert.match(report, /RESULTADO PELO REGISTRO DA APLICADORA — SEM VÍDEO/);
  assert.doesNotMatch(report, /Registro incompleto: Descreva o fato|qualidade audiovisual|Qualidade referida|Referência audiovisual/, "sem vídeo: nada de pendência de descrição ou de qualidade audiovisual");
  assert.doesNotMatch(reviewText(record), /Descreva o fato|qualidade audiovisual/);
  const reopened = parseRecordJSON(JSON.stringify(record));
  assert.ok(reopened.ok, "JSON do modo Fases reabre no Guia da assistente");
  assert.equal(reopened.ok && reopened.record.context.preparation, "fases");
  assert.equal(reopened.ok && reopened.record.observations[0].task, cards[0].task.title);
  const forged = parseRecordJSON(JSON.stringify({ ...record, context: { ...record.context, preparation: "jogo" } }));
  assert.equal(forged.ok, false, "valor de preparo desconhecido é recusado");
});

test("sem câmera: cartões não pedem filmagem e mantêm a orientação de segurança", () => {
  for (const item of AGE_BANDS) for (const card of flattenPlan(buildFasesPlan(item, item.min, true))) {
    assert.equal(mentionsCamera(card), false, `${item.id}/${card.task.id}: texto sem câmera`);
    assert.ok(card.steps.length > 0 && card.say.trim() && card.observe.trim(), `${item.id}/${card.task.id}: cartão continua completo`);
  }
  assert.equal(withoutCamera("Conteúdo sensível: pare a gravação e chame o médico para conversa reservada."), "Conteúdo sensível: pare e chame o médico para conversa reservada.");
  assert.match(APPLICATOR_RECORDING, /Sem vídeo/);
  assert.doesNotMatch(ui, /FILMING|Celular de apoio filmando|Sem filmagem hoje/, "a filmagem saiu do preparo");
  assert.ok(ui.includes("const ready = Boolean(band && childOk && roomOk);"), "início depende só da idade e das duas confirmações");
  assert.ok(ui.includes("showCamera={false}"));
});

test("resultado pelo registro da aplicadora: descritivo por fase, sem soma nem conclusão", () => {
  const item = band("y04");
  const cards = flattenPlan(buildFasesPlan(item, 50, false));
  const observations = [
    markObservation(cards[0].task, { outcome: "E" }, 5, undefined, false),
    markObservation(cards[1].task, { outcome: "V", assistance: FASES_HELP[0].assistance, note: "respondeu “bola”" }, 20, undefined, false),
    markObservation(cards[2].task, { outcome: "ND" }, 60, undefined, false),
    markObservation(cards[3].task, { outcome: "NA", assistance: FASES_SKIP[3] }, 90, undefined, false),
  ];
  const context = { code: "", chronologicalMonths: 50, correctedMonths: null, bandId: item.id, schooling: "", language: "", adaptations: "", conditions: "", familyReport: "", proneAllowed: false, preparation: "fases" as const };
  const result = applicatorResult({ context, observations });
  assert.equal(result.phases.length, PHASES.length);
  assert.equal(result.phases.reduce((n, p) => n + p.cards.length, 0), cards.length, "todos os cartões da ficha aparecem");
  assert.deepEqual(result.toReview.map((c) => c.title), [cards[1].task.title, cards[2].task.title], "conferir: com ajuda e não fez agora");
  assert.equal(result.skipped[0].reason, FASES_SKIP[3]);
  const text = applicatorResultText({ context, observations });
  assert.match(text, /não é escore, norma, percentil nem diagnóstico/);
  assert.match(text, /com ajuda \(pedido repetido\)\. Nota: “respondeu “bola””/);
  assert.match(text, /sem marca/);
  assert.doesNotMatch(text, /total|pontua|percentual|%|acert|err[oa]u|normal|alterad|atraso|d[eé]ficit/i, "sem soma, porcentagem ou conclusão clínica");
  const guided = makeReport({ version: OBS10_VERSION, context: { ...context, preparation: undefined }, observations, durationSeconds: 100, endReason: "x", encodingSecond: null, recallSecond: null, recording: "r" });
  assert.doesNotMatch(guided, /RESULTADO PELO REGISTRO DA APLICADORA/, "Guia da assistente não muda");
  assert.match(guided, /Registro incompleto: Descreva o fato/, "Guia continua exigindo descrição");
});

test("página: Fases é o padrão, trava as abas na coleta e protege a saída", () => {
  assert.match(page, /useState<"fases" \| "easy" \| "guided" \| "direct">\("fases"\)/);
  assert.ok(page.includes('data-testid="obs10-fases-tab"') && page.includes("aria-selected={fases}"));
  assert.ok(page.includes("<FasesMode signature={signature} onState={setFasesState} />"));
  assert.ok(page.includes("useExitGuard(fasesState.dirty ||"), "dados do modo Fases protegidos ao sair");
  assert.ok(page.includes("fasesState.locked;") && page.includes("disabled={tabsLocked}"), "abas travadas durante a coleta");
  assert.ok(page.indexOf("if (fases) {") < page.indexOf("if (easy) {"), "ramo Fases isolado antes do Modo Fácil");
});

test("interface: cronômetro de 10 minutos, saída da aba encerra, emergência sempre à mão, sem placar", () => {
  assert.ok(ui.includes("sessionElapsed(") && ui.includes("seconds >= MAX_SECONDS") && ui.includes("finish(FASES_END.time)"));
  assert.ok(ui.includes('document.addEventListener("visibilitychange", hidden)') && ui.includes("finish(FASES_END.hidden)"));
  assert.ok(ui.includes("Parar e chamar médico") && ui.includes('href="tel:192"'));
  assert.ok(ui.includes("TAP_GAP_MS"), "toque duplo não marca o cartão seguinte");
  assert.ok(ui.includes('preparation: "fases"'));
  assert.ok(ui.includes("proneAllowed: band.min < 9 && prone"), "prono só nas fichas abaixo de 9 meses");
  for (const source of [ui, model]) assert.doesNotMatch(source, /StarCounter|estrela|\bXP\b|ranking|acertou|errou|pontua[çc][ãa]o da crian/i);
  assert.doesNotMatch(ui, /getUserMedia|MediaRecorder|fetch\(|localStorage/, "sem câmera integrada, envio ou armazenamento");
});
