// Baterias dedicadas de 2 e 3 anos do Super NeuroPad Game: roteamento por idade, contagem e
// duração, cobertura dos seis domínios, relato do cuidador rotulado, contagem por domínio no
// relatório, sem sinais de alerta nem qualquer classificação.
import assert from "node:assert/strict";
import test from "node:test";
import { buildGameDocSpec } from "../../client/src/features/super-neuropad/pdf";
import {
  PHASE_ORDER,
  TODDLER_DOMAIN_ORDER,
  bandForYears,
  buildGameBrief,
  buildGameReport,
  buildPatientRecordItems,
  buildStructuredLines,
  estimateBandSeconds,
  gameItemsFor,
  isJudged,
  itemsFor,
  phaseById,
  recordBuild,
  recordJudged,
  recordTouch,
  sessionLimitSeconds,
  summarize,
  type AnswerRecord,
  type AnswerStatus,
  type GameSession,
  type Item,
  type PhaseId,
} from "../../client/src/features/super-neuropad/model";

const ISSUER = { doctorName: "Profissional Sintético", specialty: "Neuropediatria", credentials: "CRM 00000", clinicName: "Clínica Sintética", motto: "" };
const all = (years: number): Item[] => PHASE_ORDER.flatMap((phaseId) => itemsFor(String(years), phaseId));
const gameAll = (years: number): Item[] => PHASE_ORDER.flatMap((phaseId) => gameItemsFor(String(years), phaseId));

function record(item: Item, phaseId: PhaseId, status: AnswerStatus): AnswerRecord {
  if (item.kind === "toque") {
    const chosen = status === "acerto" ? item.options.find((o) => o.label === item.answer)! : status === "erro" ? item.options.find((o) => o.label !== item.answer)! : null;
    return recordTouch(item, phaseId, chosen, 3, false, status === "recusa");
  }
  if (isJudged(item)) return recordJudged(item, phaseId, status, 5);
  return recordBuild(item, phaseId, status === "acerto" ? [...item.target] : null, 5, false, status === "recusa");
}
function play(years: number, plan: (item: Item) => AnswerStatus = () => "acerto"): GameSession {
  const answers = PHASE_ORDER.flatMap((phaseId) => gameItemsFor(String(years), phaseId).map((item) => record(item, phaseId, plan(item))));
  return { version: "test", ageYears: years, bandId: String(years), characterId: "robo", startedAt: "2026-10-13T12:00:00.000Z", finishedAt: "2026-10-13T12:12:00.000Z", answers, pauseCount: 0 };
}

test("roteamento: 2 e 3 anos recebem a bateria dedicada; 4 anos ou mais continuam como antes", () => {
  for (const years of [2, 3]) {
    assert.ok(bandForYears(years));
    assert.ok(all(years).every((item) => item.domain && /Bateria (24–35|36–47) meses|bateria 2–3 anos/.test(item.ref)), `${years} anos: só itens da bateria`);
    assert.equal(phaseById("corpo", years).name, "Casinha do Faz de Conta");
  }
  for (const years of [4, 5, 8, 17]) {
    assert.ok(all(years).every((item) => !item.domain && !item.informant), `${years} anos sem mudança`);
    assert.equal(phaseById("corpo", years).name, "Torre do Corpo");
    assert.equal(summarize(play(years)).domains.length, 0);
  }
});

test("contagem e duração: núcleo dedicado preservado e partida de 50 itens dentro do teto infantil", () => {
  assert.equal(all(2).length, 18);
  assert.equal(all(3).length, 24);
  for (const years of [2, 3]) {
    assert.equal(gameAll(years).length, 50);
    const estimate = estimateBandSeconds(years);
    assert.ok(estimate.totalSeconds <= sessionLimitSeconds(years), `${years} anos: ${estimate.totalSeconds}s`);
    for (const phaseId of PHASE_ORDER) assert.ok(estimate.byPhase[phaseId] > 0, `${years}/${phaseId}: ${estimate.byPhase[phaseId]}s`);
  }
  assert.equal(sessionLimitSeconds(2), 1800);
  assert.equal(sessionLimitSeconds(3), 2100);
  assert.equal(sessionLimitSeconds(4), 2700);
});

test("os seis domínios estão cobertos, cada mundo tem um domínio principal, e as habilidades-chave por idade existem", () => {
  for (const years of [2, 3]) {
    const items = all(years);
    for (const domain of TODDLER_DOMAIN_ORDER) assert.ok(items.filter((item) => item.domain === domain).length >= 2, `${years}: ${domain}`);
    const text = items.map((item) => `${item.ref} ${item.prompt}`).join("\n");
    for (const key of [/resposta ao nome/, /segue o apontar/, /aponta e mostra/, /partes do corpo/, /espera o sinal/, /atividade \(observação\)/, /atenção sustentada/, /imitação/, /interesse por outras crianças/, /perda de habilidades/]) assert.match(text, key, `${years}: ${key}`);
  }
  assert.match(all(2).map((item) => item.ref).join(), /ordem de 1 etapa/);
  assert.match(all(2).map((item) => item.prompt).join(), /2 palavras/);
  assert.match(all(3).map((item) => item.ref).join(), /ordem de 2 etapas/);
  assert.match(all(3).map((item) => item.ref).join(), /frase de 3 palavras/);
  assert.match(all(3).map((item) => item.ref).join(), /nome e pronome/);
  assert.match(all(3).map((item) => item.ref).join(), /sequência de faz de conta/);
  assert.match(all(3).map((item) => item.ref).join(), /revezar a vez/);
});

test("relato do cuidador é rotulado no enunciado e no critério; critério explícito sem corte por idade", () => {
  for (const years of [2, 3]) {
    const caregiver = all(years).filter((item) => item.informant === "cuidador");
    assert.ok(caregiver.length >= 3);
    for (const item of caregiver) {
      assert.match(item.prompt, /^Relato do cuidador — pergunte:/);
      assert.ok(isJudged(item) && /\(relato do cuidador\)$/.test(item.expected));
    }
    for (const item of all(years)) if (isJudged(item)) assert.doesNotMatch(item.expected, /piso|norma\b|esperado para a idade/i, item.id);
  }
});

test("relatório, resumo, prontuário, bloco estruturado e PDF mostram a contagem por domínio, sem alerta nem classificação", () => {
  const session = play(2, (item) => (/resposta ao nome|apontar/.test(item.ref) ? "erro" : "acerto"));
  const summary = summarize(session);
  assert.equal(summary.domains.length, 6);
  assert.equal(summary.domains.find((entry) => entry.domain === "atencao_conjunta")!.hits, 1);
  assert.ok(summary.domains.every((entry) => !("level" in entry)));
  assert.ok(!("redFlags" in summary));
  const report = buildGameReport(session);
  const brief = buildGameBrief(session);
  const pdf = JSON.stringify(buildGameDocSpec(session, ISSUER, "13/10/2026 09:00"));
  const rows = JSON.stringify(buildPatientRecordItems(session));
  const structured = buildStructuredLines(session).join("\n");
  assert.match(report, /CONTAGEM POR DOMÍNIO \(BATERIA 2–3 ANOS\)/);
  assert.match(report, /Atenção conjunta: 1\/3 cumpre/);
  for (const output of [report, brief, pdf, rows, structured]) assert.doesNotMatch(output, /sinal de alerta|encaminhar avalia|^ALERTA /im);
  assert.match(structured, /^DOMINIO_2_3 /m);
  assert.doesNotMatch(structured, /"nivel"/);
  assert.match(pdf, /Floresta do Olhar/);
  const diagnostic = /\b(autismo|autista|TEA|TDAH|diagnóstico de|tem transtorno|é hiperativ|confirma)/i;
  for (const output of [report, brief, rows]) assert.doesNotMatch(output, diagnostic);
  for (const item of [...all(2), ...all(3)]) {
    const text = `${item.prompt} ${isJudged(item) ? item.expected : ""}`;
    assert.doesNotMatch(text, diagnostic, item.id);
  }
});

test("itens de relato do cuidador seguem rotulados e a bateria não carrega campo de alerta", () => {
  for (const years of [2, 3]) {
    for (const item of all(years)) assert.equal("redFlag" in item, false, item.id);
    assert.ok(all(years).some((item) => item.informant === "cuidador"));
  }
});
