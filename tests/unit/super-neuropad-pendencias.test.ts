// Pendências do diagnóstico (Super NeuroPad): perfis de corte por idade (infraestrutura, valores atuais),
// domínios com poucos itens só descritivos, aviso de folga de tempo e procedência dos itens.
import assert from "node:assert/strict";
import test from "node:test";
import {
  AGE_BANDS, MIN_DOMAIN_ITEMS_FOR_LEVEL, CUT_PROFILES, PHASE_ORDER, TIME_MARGIN_NOTE, buildGameReport, cutProfileFor, cutProvenanceText,
  itemProvenance, itemsFor, levelCuts, overallLevel, phaseLevel, provenanceCounts, provenanceText, summarize, timeMarginSeconds, timeMarginTight,
  recordJudged, recordTouch, recordBuild, isJudged, type AnswerRecord, type GameSession, type Item, type PhaseId,
} from "../../client/src/features/super-neuropad/model";

function playAll(years: number): GameSession {
  const answers: AnswerRecord[] = PHASE_ORDER.flatMap((phaseId: PhaseId) => itemsFor(String(years), phaseId).map((item: Item) => {
    if (item.kind === "toque") return recordTouch(item, phaseId, item.options.find((o) => o.label === item.answer)!, 3);
    if (isJudged(item)) return recordJudged(item, phaseId, "acerto", 5);
    return recordBuild(item, phaseId, [...item.target], 5);
  }));
  return { version: "t", ageYears: years, bandId: String(years), characterId: "robo", startedAt: "2026-10-16T12:00:00.000Z", finishedAt: "2026-10-16T12:15:00.000Z", answers };
}

test("perfil de corte: hoje um único perfil interno, idêntico para todas as idades e sem fonte", () => {
  assert.equal(CUT_PROFILES.length, 1);
  for (const band of AGE_BANDS) {
    const profile = cutProfileFor(band.min);
    assert.deepEqual(profile.fase, { esperado: 0.75, observar: 0.5 });
    assert.deepEqual(profile.total, { esperado: 0.8, observar: 0.6 });
    assert.equal(profile.fonte, null);
    assert.equal(profile.status, "referencia_interna_sem_fonte");
    assert.deepEqual(levelCuts(6, "fase", band.min), levelCuts(6, "fase"));
    assert.equal(phaseLevel(4, 6, band.min), phaseLevel(4, 6));
    assert.equal(overallLevel(29, 36, band.min), overallLevel(29, 36));
  }
  assert.match(cutProvenanceText(8), /referência interna do jogo, sem fonte publicada nem validação/);
});

test("2–3 anos: domínio com menos de 3 itens fica descritivo (sem nível); os demais mantêm o nível", () => {
  assert.equal(MIN_DOMAIN_ITEMS_FOR_LEVEL, 3);
  const two = summarize(playAll(2));
  const few = two.domains.filter((d) => d.total < MIN_DOMAIN_ITEMS_FOR_LEVEL);
  assert.ok(few.length >= 1, "aos 2 anos há domínio com poucos itens");
  for (const d of few) assert.equal(d.level, null);
  for (const d of two.domains.filter((x) => x.total >= MIN_DOMAIN_ITEMS_FOR_LEVEL)) assert.equal(d.level, "esperado");
  for (const d of summarize(playAll(3)).domains) assert.equal(d.level, "esperado");
  // o nível do mundo e o total não mudam por causa disso
  assert.equal(two.level, "esperado");
});

test("folga de tempo: aviso só onde a folga é menor que 60 s (2, 3, 16 e 17 anos) e o relatório traz a nota", () => {
  const tight = AGE_BANDS.filter((b) => timeMarginTight(b.min)).map((b) => b.min);
  assert.deepEqual(tight, [2, 3, 16, 17]);
  for (const years of tight) {
    assert.ok(timeMarginSeconds(years) < 60 && timeMarginSeconds(years) > 0, `${years}: folga positiva (${timeMarginSeconds(years)} s)`);
    assert.match(buildGameReport(playAll(years)), /Folga curta até o teto da sessão/);
  }
  assert.doesNotMatch(buildGameReport(playAll(8)), new RegExp(TIME_MARGIN_NOTE.slice(0, 20)));
});

test("procedência: itens autorais do jogo são marcados no relatório e em cada ITEM estruturado", () => {
  assert.deepEqual(provenanceCounts(2), { autoral: 18, origem: 0, total: 18 });
  assert.equal(provenanceCounts(4).autoral, 0);
  assert.equal(provenanceCounts(12).autoral, 6);
  assert.match(provenanceText(12), /6 são autorais do jogo, sem fonte externa verificável/);
  const sample = itemsFor("12", "memoria").find((item) => itemProvenance(item) === "autoral");
  assert.ok(sample, "há item autoral aos 12 anos");
  assert.match(sample.ref, /autoral/);
  assert.match(buildGameReport(playAll(12)), /Procedência dos itens: 30 de 36/);
});
