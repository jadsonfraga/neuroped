// Fase 4 do diagnóstico de 14/10/2026 (jogo JLN-1): forma B de fluência para reteste,
// pseudopalavras no ditado de 5–6 anos e 4ª pergunta de compreensão em todas as faixas.
import assert from "node:assert/strict";
import test from "node:test";
import { BANDS, fluencyFormOf, fluencyProbe, fluencyWords } from "../../client/src/features/dyslexia-risk/game/bank";
import { SESSION_CAP_SECONDS, estimateSessionSeconds, newGame, recordFluency, recordResponse, summarizeGame, type GameState } from "../../client/src/features/dyslexia-risk/game/engine";
import { fluencyText } from "../../client/src/features/dyslexia-risk/game/report";

test("forma B: mesmo tipo e mesmo tamanho da forma A, texto diferente, ids únicos", () => {
  const ids = new Set<string>();
  for (const bank of BANDS) {
    const a = bank.fluencia;
    const b = bank.fluenciaB;
    assert.equal(b.kind, a.kind, bank.band);
    assert.equal(fluencyWords(b).length, fluencyWords(a).length, `${bank.band}: contagem igual`);
    assert.notEqual(b.text, a.text);
    assert.notEqual(b.title, a.title);
    for (const id of [a.id, b.id]) {
      assert.ok(!ids.has(id), id);
      ids.add(id);
    }
    assert.equal(fluencyProbe(bank, "A"), a);
    assert.equal(fluencyProbe(bank, "B"), b);
    assert.equal(fluencyFormOf(bank, a.id), "A");
    assert.equal(fluencyFormOf(bank, b.id), "B");
    assert.equal(fluencyFormOf(bank, "outro"), null);
  }
  const syl = fluencyWords(BANDS[0].fluenciaB);
  assert.equal(new Set(syl).size, syl.length, "5–6: sílabas sem repetição");
  for (const s of syl) assert.match(s, /^[bcdfgjlmnprstvz][aeiou]$/, `sílaba CV simples: ${s}`);
});

function withFluency(form: "A" | "B"): GameState {
  const bank = BANDS[2];
  const probe = fluencyProbe(bank, form);
  return recordFluency(newGame({ idade: 9 }), { probeId: probe.id, totalWords: fluencyWords(probe).length, lidas: 80, erros: 2, segundos: 60 });
}

test("relatório informa a forma aplicada sem mudar a taxa", () => {
  const a = fluencyText(summarizeGame(withFluency("A")));
  const b = fluencyText(summarizeGame(withFluency("B")));
  assert.match(a, /^forma A · 80 palavras lidas/);
  assert.match(b, /^forma B \(reteste\) · 80 palavras lidas/);
  assert.equal(a.replace(/^forma A · /, ""), b.replace(/^forma B \(reteste\) · /, ""));
});

test("ditado de 5–6 anos passa a ter pseudopalavras; cada faixa tem 4 perguntas com literal e inferencial", () => {
  assert.ok(BANDS[0].ditado.filter((item) => item.pseudo).length >= 2);
  for (const bank of BANDS) {
    const qs = bank.compreensao.questions;
    assert.equal(qs.length, 4, bank.band);
    assert.ok(qs.some((q) => q.kind === "literal") && qs.some((q) => q.kind === "inferencial"), bank.band);
    for (const q of qs) {
      assert.ok(q.options.includes(q.answer), q.id);
      assert.equal(new Set(q.options).size, q.options.length, q.id);
    }
    assert.ok(estimateSessionSeconds(bank.band) <= SESSION_CAP_SECONDS, `${bank.band}: cabe em 15 min`);
  }
});

test("compreensão: o resumo traz só a contagem (total, literal e inferencial), sem sinal automático", () => {
  const bank = BANDS[2];
  const play = (hits: number) => {
    let state = newGame({ idade: 9 });
    bank.compreensao.questions.forEach((q, i) => {
      const ok = i < hits;
      state = recordResponse(state, { world: "compreensao", itemId: q.id, prompt: q.question, expected: q.answer, given: ok ? q.answer : q.options.find((o) => o !== q.answer)!, outcome: ok ? "correto" : "erro", kind: q.kind, ms: 1000 }, bank);
    });
    return summarizeGame(state);
  };
  for (const hits of [0, 1, 2, 3, 4]) {
    const summary = play(hits);
    assert.equal(summary.leitura.compreensao.corretos, hits);
    assert.equal(summary.leitura.compreensao.total, bank.compreensao.questions.length);
    assert.equal("sinais" in summary, false);
    assert.deepEqual(summary.condicoes, []);
  }
});
