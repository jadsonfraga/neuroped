// Pendências do diagnóstico (jogo de dislexia): compreensão forma B, sinais descritivos de fluência sem norma,
// faixa 15–18 com mais itens por nível, procedência autoral e nota de faixa ampla. Nenhuma norma nova.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { BANDS, BANK_PROVENANCE, bandForAge, fluencyWords, withTextForm, type BandBank } from "../../client/src/features/dyslexia-risk/game/bank";
import { FLUENCY_REFERENCES, fluencyFlags, fluencyReferenceActive } from "../../client/src/features/dyslexia-risk/game/fluencyFlags";
import {
  SESSION_CAP_SECONDS, WORLDS, estimateSessionSeconds, newGame, nextItemFor, recordFluency, recordResponse, summarizeGame, type GameState, type ItemResponse,
} from "../../client/src/features/dyslexia-risk/game/engine";
import { bandSpanNote, buildGameDocSpec, buildGameRecord, fluencyText } from "../../client/src/features/dyslexia-risk/game/report";

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

test("compreensão forma B: um segundo texto autoral por faixa, 4 perguntas, extensão próxima da forma A", () => {
  const ids = new Set<string>();
  for (const b of BANDS) {
    const A = b.compreensao, B = b.compreensaoB;
    assert.notEqual(A.text, B.text, `${b.band}: forma B igual à A`);
    assert.equal(B.questions.length, 4, `${b.band}: 4 perguntas`);
    assert.equal(B.listening, A.listening);
    assert.ok(B.questions.some((q) => q.kind === "inferencial") && B.questions.some((q) => q.kind === "literal"));
    const ratio = words(B.text) / words(A.text);
    assert.ok(ratio >= 0.75 && ratio <= 1.25, `${b.band}: extensão B/A = ${ratio.toFixed(2)}`);
    for (const q of B.questions) {
      assert.ok(q.options.includes(q.answer), `${q.id}: gabarito fora das opções`);
      assert.equal(new Set(q.options).size, q.options.length, `${q.id}: opções repetidas`);
      assert.ok(!ids.has(q.id) && !b.compreensao.questions.some((x) => x.id === q.id), `${q.id}: id repetido`);
      ids.add(q.id);
    }
    // o gabarito não pode ser sempre a mesma posição (vazamento por posição)
  }
  const positions = BANDS.flatMap((b) => b.compreensaoB.questions.map((q) => q.options.indexOf(q.answer)));
  assert.ok(new Set(positions).size >= 3, "gabarito varia de posição");
});

test("forma B: withTextForm troca só a compreensão e o jogo sorteia as perguntas B; A segue idêntica", () => {
  for (const b of BANDS) {
    assert.equal(withTextForm(b, undefined).compreensao, b.compreensao);
    assert.equal(withTextForm(b, "A").compreensao, b.compreensao);
    assert.equal(withTextForm(b, "B").compreensao, b.compreensaoB);
    assert.equal(withTextForm(b, "B").ditado, b.ditado);
    assert.ok(estimateSessionSeconds(b.band, "A") <= SESSION_CAP_SECONDS && estimateSessionSeconds(b.band, "B") <= SESSION_CAP_SECONDS, `${b.band}: estimativa > 15 min`);
  }
  const base = bandForAge(8) as BandBank;
  const g = newGame({ idade: 8, forma: "B" });
  assert.equal(g.forma, "B");
  const q = nextItemFor(g, "compreensao", withTextForm(base, g.forma)) as { id: string };
  assert.match(q.id, /^c78b-/);
  assert.equal(newGame({ idade: 8 }).forma, undefined, "rascunho/jogo sem forma continua A");
});

test("fluência: sinais descritivos sem norma (precisão, nenhuma leitura, tempo curto) e comparação só com referência COM fonte", () => {
  const band = bandForAge(8) as BandBank;
  const flu = (over: Partial<{ lidas: number; erros: number; segundos: number; wcpm: number | null }>) => ({ totalWords: 87, lidas: 40, erros: 2, segundos: 60, wcpm: 38, ...over });
  for (const row of Object.values(FLUENCY_REFERENCES)) { assert.equal(row.wcpmMinimo, null); assert.equal(row.fonte, null); }
  assert.deepEqual(fluencyFlags(band, null), []);
  assert.deepEqual(fluencyFlags(band, flu({})).map((f) => f.id), ["precisao"]);
  assert.match(fluencyFlags(band, flu({}))[0].texto, /precisão de leitura 95%/);
  assert.deepEqual(fluencyFlags(band, flu({ lidas: 0, wcpm: 0 })).map((f) => f.id), ["nenhuma_leitura"]);
  assert.ok(fluencyFlags(band, flu({ segundos: 20, wcpm: 100 })).some((f) => f.id === "extrapolada"));
  // referência sem fonte NÃO liga a comparação
  const row = FLUENCY_REFERENCES["7-8"];
  const backup = { ...row };
  try {
    row.wcpmMinimo = 50;
    assert.equal(fluencyReferenceActive(row), false);
    assert.ok(!fluencyFlags(band, flu({})).some((f) => /referência/.test(f.id)));
    row.fonte = "fonte de teste (não clínica)";
    assert.equal(fluencyReferenceActive(row), true);
    assert.ok(fluencyFlags(band, flu({})).some((f) => f.id === "abaixo_referencia"));
    assert.ok(fluencyFlags(band, flu({ wcpm: 60 })).some((f) => f.id === "dentro_referencia"));
  } finally { Object.assign(row, backup); }
  assert.equal(fluencyReferenceActive(FLUENCY_REFERENCES["7-8"]), false);
});

function playFlu(age: number, flu: { lidas: number; erros: number; segundos: number }): GameState {
  const bank = bandForAge(age) as BandBank;
  let g = newGame({ nome: "T", idade: age });
  g = recordFluency(g, { probeId: bank.fluencia.id, totalWords: fluencyWords(bank.fluencia).length, ...flu });
  return g;
}

test("fluência: 'nenhuma leitura' vira sinal para investigar; precisão aparece no texto; nada de norma", () => {
  const none = summarizeGame(playFlu(9, { lidas: 0, erros: 0, segundos: 60 }));
  assert.ok(none.sinais.some((x) => /Nenhuma palavra lida registrada/.test(x)));
  const normal = summarizeGame(playFlu(9, { lidas: 60, erros: 3, segundos: 60 }));
  assert.ok(!normal.sinais.some((x) => /Fluência/.test(x)), "sem sinal quando há leitura");
  assert.match(fluencyText(normal), /precisão de leitura 95%/);
  assert.match(fluencyText(normal), /sem referência normativa nesta triagem/);
  assert.doesNotMatch(fluencyText(normal), /abaixo da referência|dentro da referência/);
});

test("15–18 anos: 6 itens por nível em cada mundo adaptativo, sem repetir item na sessão", () => {
  const b = bandForAge(16) as BandBank;
  for (const pool of [b.ditado, b.decodificacao, b.aritmetica]) for (const lv of [1, 2, 3] as const) assert.equal(pool.filter((i) => i.level === lv).length, 6);
  assert.ok(b.decodificacao.filter((i) => i.kind === "pseudo").length === 6, "sem pseudopalavra nova na leitura");
  let g = newGame({ idade: 16 });
  for (const w of WORLDS) {
    if (w.id === "fluencia") { g = recordFluency(g, { probeId: b.fluencia.id, totalWords: 100, lidas: 80, erros: 2, segundos: 60 }); continue; }
    for (let item = nextItemFor(g, w.id, b), n = 0; item && n < 50; item = nextItemFor(g, w.id, b), n++) {
      const a = item as { id: string; level?: 1 | 2 | 3; answer?: string };
      const resp: ItemResponse = { world: w.id, itemId: a.id, level: a.level ?? 2, prompt: "p", expected: "e", given: a.answer ?? "x", outcome: "correto", ms: 1000 };
      g = recordResponse(g, resp, b);
    }
  }
  assert.equal(g.endedReason, "completo");
  for (const w of ["ditado", "decodificacao", "aritmetica"] as const) {
    const used = g.worlds[w].responses.map((r) => r.itemId);
    assert.equal(new Set(used).size, used.length);
  }
});

test("faixa ampla e procedência aparecem no registro e no PDF; 5–6 anos não tem nota de faixa ampla", () => {
  const g = newGame({ nome: "T", idade: 16, forma: "B" });
  const s = summarizeGame(g);
  assert.match(bandSpanNote({ band: s.band, idade: 16 }) ?? "", /Faixa ampla \(15 a 18 anos, 4 anos\): não há subnível validado/);
  assert.equal(bandSpanNote({ band: summarizeGame(newGame({ idade: 5 })).band, idade: 5 }), null);
  const record = buildGameRecord(g, "16/10/2026");
  assert.match(record, /Forma dos textos de compreensão: B/);
  assert.match(record, /Faixa ampla/);
  assert.ok(record.includes(BANK_PROVENANCE));
  const doc = buildGameDocSpec(g, { doctorName: "", specialty: "", credentials: "", clinicName: "", motto: "" } as never, "16/10/2026");
  assert.ok(doc.sections.some((x) => x.body.includes(BANK_PROVENANCE)));
  const ui = readFileSync(new URL("../../client/src/features/dyslexia-risk/game/DyslexiaGame.tsx", import.meta.url), "utf8");
  assert.match(ui, /data-testid="drx-provenance"/);
  assert.match(ui, /Forma dos textos \(aplicador\)/);
  assert.match(BANK_PROVENANCE, /autorais do NeuroPed.*sem fonte normativa nem validação/);
});
