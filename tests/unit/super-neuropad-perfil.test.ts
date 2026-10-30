// Super NeuroPad Game (v2026-10-16): posição balanceada das opções, registro de posição compatível com
// registros antigos e perfil de resposta descritivo (tempo, dispersão, posição) sem norma nem corte.
import assert from "node:assert/strict";
import test from "node:test";
import {
  ITEM_BANK, PHASE_ORDER, YEARS, buildGameReport, buildStructuredLines, gameItemsFor, latencyStats, optionOrder, recordJudged, recordTouch,
  responseProfile, responseProfileLines, touchOrdinal, type AnswerRecord, type GameSession, type TouchItem,
} from "../../client/src/features/super-neuropad/model";

function touchItems(years: number) {
  const out: { item: TouchItem; phaseId: (typeof PHASE_ORDER)[number]; ordinal: number }[] = [];
  for (const phaseId of PHASE_ORDER) for (const item of gameItemsFor(String(years), phaseId)) if (item.kind === "toque") out.push({ item, phaseId, ordinal: touchOrdinal(String(years), phaseId, item.id) });
  return out;
}

test("optionOrder: mesmas opções, determinístico, resposta certa em posição planejada e balanceada em cada bloco", () => {
  for (const years of YEARS) {
    for (const seed of [1, 12345, 999999, 424242]) {
      const byN = new Map<number, number[]>();
      for (const { item, ordinal } of touchItems(years)) {
        const order = optionOrder(item, seed, ordinal);
        assert.equal(order.length, item.options.length);
        assert.deepEqual([...order.map((o) => o.label)].sort(), [...item.options.map((o) => o.label)].sort(), `${item.id}: mesmas opções`);
        assert.deepEqual(optionOrder(item, seed, ordinal).map((o) => o.label), order.map((o) => o.label), "determinístico");
        const list = byN.get(item.options.length) ?? [];
        list.push(order.findIndex((o) => o.label === item.answer));
        byN.set(item.options.length, list);
      }
      for (const [n, positions] of byN) {
        for (let start = 0; start + n <= positions.length; start += n) {
          assert.deepEqual([...positions.slice(start, start + n)].sort(), Array.from({ length: n }, (_, i) => i), `${years} anos, ${n} opções: bloco balanceado`);
        }
      }
    }
  }
});

test("touchOrdinal conta os toques de mesmo número de opções na ordem da partida", () => {
  const list = touchItems(9);
  assert.equal(list[0].ordinal, 0);
  const counts = new Map<number, number>();
  for (const entry of list) {
    const expected = counts.get(entry.item.options.length) ?? 0;
    assert.equal(entry.ordinal, expected, `${entry.item.id}: ordinal entre itens com ${entry.item.options.length} opções`);
    counts.set(entry.item.options.length, expected + 1);
  }
});

test("recordTouch guarda posição escolhida e da certa; sem a ordem exibida mantém o formato antigo", () => {
  const { item, phaseId, ordinal } = touchItems(9)[0];
  const shown = optionOrder(item, 7, ordinal);
  const wrong = shown.find((o) => o.label !== item.answer)!;
  const miss = recordTouch(item, phaseId, wrong, 3.2, false, false, shown);
  assert.equal(miss.status, "erro");
  assert.equal(miss.pos, shown.indexOf(wrong));
  assert.equal(miss.shown, 4);
  assert.equal(miss.correctPos, shown.findIndex((o) => o.label === item.answer));
  const none = recordTouch(item, phaseId, null, 9, false, false, shown);
  assert.equal(none.pos, undefined);
  assert.equal(none.shown, 4);
  const legacy = recordTouch(item, phaseId, wrong, 3.2);
  assert.ok(!("pos" in legacy) && !("shown" in legacy) && !("correctPos" in legacy), "registro antigo idêntico");
});

test("latencyStats: mediana, quartis, desvio e CV só com 5 ou mais tempos", () => {
  assert.deepEqual(latencyStats([]), { n: 0, median: 0, q1: 0, q3: 0, iqr: 0, sd: 0, cv: null });
  const four = latencyStats([2, 4, 6, 8]);
  assert.equal(four.median, 5);
  assert.equal(four.cv, null);
  const five = latencyStats([2, 4, 6, 8, 10]);
  assert.equal(five.median, 6);
  assert.equal(five.q1, 4);
  assert.equal(five.q3, 8);
  assert.equal(five.iqr, 4);
  assert.equal(five.sd, 3.2);
  assert.equal(five.cv, 0.53);
  assert.equal(latencyStats([Number.NaN, -1, 3]).n, 1);
});

function sessionWith(answers: AnswerRecord[]): GameSession {
  return { version: "t", ageYears: 9, bandId: "9", characterId: "raposa", startedAt: "2026-10-16T12:00:00.000Z", finishedAt: "2026-10-16T12:15:00.000Z", answers };
}

test("responseProfile: erros por posição, maior sequência na mesma posição e separação toque × aplicadora", () => {
  const list = touchItems(9);
  const answers: AnswerRecord[] = list.slice(0, 5).map(({ item, phaseId }, index) => {
    const shown = item.options;
    const chosen = shown.find((o) => o.label !== item.answer)!;
    return { ...recordTouch(item, phaseId, chosen, 2 + index, false, false, shown), pos: 2 };
  });
  const judgedItem = Object.values(ITEM_BANK["9"]).flat().find((i) => i.kind === "fala")!;
  answers.push(recordJudged(judgedItem as never, "vila", "acerto", 14));
  const profile = responseProfile(sessionWith(answers));
  assert.equal(profile.positioned, 5);
  assert.deepEqual(profile.errorsByPosition, { 2: 5 });
  assert.deepEqual(profile.longestSamePosition, { length: 5, position: 2 });
  assert.equal(profile.tapLatency.n, 5);
  assert.equal(profile.judgedLatency.n, 1);
  const text = responseProfileLines(sessionWith(answers)).join("\n");
  assert.match(text, /posição 3: 5/);
  assert.doesNotMatch(text, /idade equivalente|diagnóstic[oa] de|ponto de corte de|norma de/i);
  assert.match(text, /sem comparação com referência externa/);
});

test("perfil entra no relatório e nas linhas estruturadas apenas com respostas; registros antigos continuam válidos", () => {
  assert.deepEqual(responseProfileLines(sessionWith([])), []);
  assert.ok(!buildStructuredLines(sessionWith([])).some((line) => line.startsWith("PERFIL ")));
  const { item, phaseId } = touchItems(9)[0];
  const old = recordTouch(item, phaseId, item.options.find((o) => o.label === item.answer)!, 2.5);
  const session = sessionWith([old]);
  assert.ok(buildStructuredLines(session).some((line) => line.startsWith("PERFIL ")));
  assert.match(buildGameReport(session), /PERFIL DE RESPOSTA \(DESCRITIVO, SEM NORMA\)/);
  assert.equal(responseProfile(session).positioned, 0, "registro antigo: sem posição");
});
