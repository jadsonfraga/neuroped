// Jogo das Letras e Números (aba dyslexia risk, 5–18 anos): banco por faixa,
// escada adaptativa, classificação do ditado, pontuação, teto de 15 min e
// relatório. Triagem interna; nenhum teste aqui afirma norma brasileira.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { BANDS, MAX_GAME_AGE, MIN_GAME_AGE, bandForAge, fluencyWords, type BandBank, type Level } from "../../client/src/features/dyslexia-risk/game/bank";
import {
  ITEMS_PER_WORLD, SESSION_CAP_SECONDS, WORLDS, classifyDitado, estimateSessionSeconds, newGame, nextItemFor, pickItem,
  recordFluency, recordResponse, skipWorld, worldTarget, finalLevelOf, starsFor, stepAdaptive, summarizeGame, tick, wcpmOf, initialAdaptive,
  type GameState, type ItemResponse,
} from "../../client/src/features/dyslexia-risk/game/engine";
import { GAME_DISCLAIMER, buildGameDocSpec, buildGameRecord, gameResponseItems } from "../../client/src/features/dyslexia-risk/game/report";

const LEVELS: Level[] = [1, 2, 3];
const ONSETS = /^(?:ch|lh|nh|qu|gu|pr|br|tr|dr|cr|gr|fr|vr|pl|bl|cl|gl|fl|ps|[bcdfgjklmnpqrstvxz])?/;

test("faixas cobrem 5 a 18 anos sem buraco nem sobreposição", () => {
  assert.equal(MIN_GAME_AGE, 5);
  assert.equal(MAX_GAME_AGE, 18);
  for (let age = 5; age <= 18; age++) assert.ok(bandForAge(age), `${age} anos sem faixa`);
  for (const bad of [4, 19, 7.5, Number.NaN, null]) assert.equal(bandForAge(bad as number), null);
  assert.deepEqual(BANDS.map((b) => b.band), ["5-6", "7-8", "9-10", "11-12", "13-14", "15-18"]);
  for (let i = 1; i < BANDS.length; i++) assert.equal(BANDS[i].minAge, BANDS[i - 1].maxAge + 1);
});

test("cada faixa tem itens suficientes por nível e domínio para a sessão adaptativa", () => {
  for (const b of BANDS) {
    for (const [domain, pool] of [["ditado", b.ditado], ["decodificacao", b.decodificacao], ["aritmetica", b.aritmetica]] as const) {
      assert.ok(pool.length >= ITEMS_PER_WORLD[domain], `${b.band} ${domain}: ${pool.length} itens < ${ITEMS_PER_WORLD[domain]}`);
      for (const lv of LEVELS) assert.ok(pool.filter((i) => i.level === lv).length >= 4, `${b.band} ${domain} nível ${lv} < 4 itens`);
    }
    assert.ok(b.compreensao.questions.length >= 3, `${b.band} compreensão`);
    assert.ok(b.compreensao.questions.some((q) => q.kind === "inferencial"), `${b.band} sem pergunta inferencial`);
    assert.ok(fluencyWords(b.fluencia).length >= 40, `${b.band} sonda de fluência curta`);
  }
  assert.equal(BANDS[0].compreensao.listening, true, "5–6 anos: compreensão ouvida, não lida");
  assert.equal(BANDS[0].fluencia.kind, "silabas");
});

test("sem duplicatas: ids únicos no banco inteiro e alvos únicos dentro de cada faixa e domínio", () => {
  const ids = BANDS.flatMap((b) => [...b.ditado, ...b.decodificacao, ...b.aritmetica, ...b.compreensao.questions].map((i) => i.id));
  assert.equal(new Set(ids).size, ids.length, "id repetido");
  for (const b of BANDS) {
    const words = b.ditado.map((i) => i.target);
    assert.equal(new Set(words).size, words.length, `${b.band} ditado repetido`);
    const reads = b.decodificacao.map((i) => i.text);
    assert.equal(new Set(reads).size, reads.length, `${b.band} leitura repetida`);
    const prompts = b.aritmetica.map((i) => `${i.prompt}|${i.visual ?? ""}`);
    assert.equal(new Set(prompts).size, prompts.length, `${b.band} aritmética repetida`);
  }
});

test("respostas válidas: gabarito presente, opções únicas, frases do ditado contêm a palavra", () => {
  for (const b of BANDS) {
    for (const item of b.aritmetica) {
      assert.ok(item.options.includes(item.answer), `${item.id}: gabarito fora das opções`);
      assert.equal(new Set(item.options).size, item.options.length, `${item.id}: opção repetida`);
      assert.ok(item.options.length >= 2 && item.options.length <= 4, `${item.id}: 2–4 opções`);
    }
    for (const q of b.compreensao.questions) {
      assert.ok(q.options.includes(q.answer), `${q.id}: gabarito fora das opções`);
      assert.equal(new Set(q.options).size, q.options.length, `${q.id}: opção repetida`);
    }
    for (const item of b.ditado) {
      assert.match(item.sentence.toLocaleLowerCase("pt-BR"), new RegExp(item.target.toLocaleLowerCase("pt-BR")), `${item.id}: frase sem a palavra`);
      assert.match(item.target, /^[a-záéíóúâêôãõç]+$/, `${item.id}: grafia fora do português`);
    }
  }
});

test("aritmética: o gabarito confere com a conta nas operações diretas", () => {
  const norm = (s: string) => s.replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/,/g, ".");
  let checked = 0;
  for (const b of BANDS) {
    for (const item of b.aritmetica) {
      const m = /^Quanto é ([0-9,\s+−×÷()-]+)\?$/.exec(item.prompt);
      if (!m) continue;
      const expr = norm(m[1]);
      if (!/^[0-9.\s+\-*/()]+$/.test(expr)) continue;
      const value = Function(`"use strict"; return (${expr});`)() as number;
      assert.equal(Number(norm(item.answer)), Math.round(value * 1000) / 1000, `${item.id}: ${item.prompt} ≠ ${item.answer}`);
      checked++;
    }
  }
  assert.ok(checked >= 20, `poucas contas conferidas (${checked})`);
});

test("pseudopalavras seguem a fonotática do português e não são palavras do banco", () => {
  const real = new Set(BANDS.flatMap((b) => [...b.ditado.filter((i) => !i.pseudo).map((i) => i.target), ...b.decodificacao.filter((i) => i.kind !== "pseudo").map((i) => i.text)]));
  const pseudos = BANDS.flatMap((b) => [...b.ditado.filter((i) => i.pseudo).map((i) => i.target), ...b.decodificacao.filter((i) => i.kind === "pseudo").map((i) => i.text)]);
  assert.ok(pseudos.length >= 30, "pseudopalavras insuficientes");
  for (const p of pseudos) {
    assert.equal(real.has(p), false, `${p} é palavra real do banco`);
    assert.match(p, /^[a-záéíóúâêôãõç]+$/, `${p}: caracteres`);
    assert.match(p, /[aeiouáéíóúâêôãõ]$|[rslmz]$/, `${p}: final impossível em português`);
    const ascii = p.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const onset = ONSETS.exec(ascii)?.[0] ?? "";
    assert.match(ascii.slice(onset.length), /^[aeiou]/, `${p}: ataque inicial inválido`);
    for (const run of ascii.match(/[^aeiou]+/g) ?? []) {
      const ok = run.length <= 3 || /^(?:ns|bs|rs)(?:pr|br|tr|dr|cr|gr|fr|pl|bl|cl|gl|fl)$/.test(run);
      assert.ok(ok, `${p}: encontro consonantal impossível "${run}"`);
    }
  }
});

test("escada adaptativa: começa no esperado, sobe após 2 acertos e desce após 2 erros, limitada a 1–3", () => {
  let s = initialAdaptive();
  assert.equal(s.level, 2);
  s = stepAdaptive(s, true); assert.equal(s.level, 2);
  s = stepAdaptive(s, true); assert.equal(s.level, 3);
  s = stepAdaptive(s, true); s = stepAdaptive(s, true); assert.equal(s.level, 3, "teto 3");
  s = stepAdaptive(s, false); assert.equal(s.level, 3, "um erro não desce");
  s = stepAdaptive(s, true); s = stepAdaptive(s, false); assert.equal(s.level, 3, "erros alternados não descem");
  s = stepAdaptive(s, false); assert.equal(s.level, 2);
  s = stepAdaptive(s, false); s = stepAdaptive(s, false); assert.equal(s.level, 1);
  s = stepAdaptive(s, false); s = stepAdaptive(s, false); assert.equal(s.level, 1, "piso 1");
});

test("pickItem: mesmo nível primeiro, depois o mais próximo, sem repetir", () => {
  const pool = [{ id: "a", level: 1 as Level }, { id: "b", level: 2 as Level }, { id: "c", level: 3 as Level }];
  assert.equal(pickItem(pool, 2, new Set())?.id, "b");
  assert.equal(pickItem(pool, 2, new Set(["b"]))?.id, "a", "empate vai para o mais fácil");
  assert.equal(pickItem(pool, 3, new Set(["c"]))?.id, "b");
  assert.equal(pickItem(pool, 1, new Set(["a", "b", "c"])), null);
});

test("ditado: correto, ortográfico (mesmo som/regra) e fonológico (som diferente)", () => {
  assert.deepEqual(classifyDitado("casa", "casa", false), { outcome: "correto" });
  assert.deepEqual(classifyDitado("casa", "  CASA ", false), { outcome: "correto" });
  for (const [t, w] of [["casa", "caza"], ["chuva", "xuva"], ["campo", "canpo"], ["carro", "caro"], ["pássaro", "passaro"], ["exceção", "esseção"], ["hipótese", "ipótese"], ["majestade", "magestade"], ["tomate", "tomati"], ["guerreiro", "gereiro"]]) {
    assert.equal(classifyDitado(t, w, false).errorType, "ortografico", `${t}/${w}`);
  }
  for (const [t, w] of [["vela", "fela"], ["prato", "pato"], ["bola", "bolo"], ["dedo", "deto"], ["blusa", "bulsa"]]) {
    assert.equal(classifyDitado(t, w, false).errorType, "fonologico", `${t}/${w}`);
  }
  assert.equal(classifyDitado("fabo", "fabu", true).outcome, "correto", "pseudopalavra aceita grafia plausível");
  assert.equal(classifyDitado("fabo", "fapo", true).errorType, "fonologico");
  assert.equal(classifyDitado("fabo", "", true).outcome, "nao_respondeu");
});

test("fluência: palavras corretas por minuto (60 s ou proporcional quando termina antes)", () => {
  assert.equal(wcpmOf(80, 4, 60), 76);
  assert.equal(wcpmOf(90, 0, 45), 120);
  assert.equal(wcpmOf(10, 20, 60), 0);
  assert.equal(wcpmOf(10, 0, 0), null);
});

test("teto de sessão: estimativa ≤ 15 min em todas as faixas e o relógio encerra no limite", () => {
  assert.equal(SESSION_CAP_SECONDS, 900);
  for (const b of BANDS) {
    const est = estimateSessionSeconds(b.band);
    assert.ok(est <= SESSION_CAP_SECONDS, `${b.band}: estimativa ${est}s > 900s`);
  }
  let g = newGame({ idade: 9 });
  g = tick(g, 899_000);
  assert.equal(g.endedReason, "");
  g = tick(g, 5_000);
  assert.equal(g.endedReason, "tempo");
  assert.equal(g.activeMs, 900_000);
  assert.equal(tick(g, 10_000).activeMs, 900_000, "nada corre depois do teto");
  assert.match(summarizeGame(g).sinais.join(" "), /15 minutos/);
});

function playAll(age: number, answer: (world: string, item: any) => Pick<ItemResponse, "given" | "outcome" | "errorType">): GameState {
  const bank = bandForAge(age) as BandBank;
  let g = newGame({ nome: "Teste", idade: age, examinador: "Aplicador" });
  for (const w of WORLDS) {
    if (w.id === "fluencia") {
      g = recordFluency(g, { probeId: bank.fluencia.id, totalWords: fluencyWords(bank.fluencia).length, lidas: 40, erros: 2, segundos: 60 });
      continue;
    }
    let guard = 0;
    for (let item = nextItemFor(g, w.id, bank); item && guard < 50; item = nextItemFor(g, w.id, bank), guard++) {
      const a = answer(w.id, item);
      g = recordResponse(g, { world: w.id, itemId: item.id, level: (item as any).level ?? 2, prompt: "p", expected: "e", ms: 1500, kind: (item as any).kind ?? ((item as any).pseudo ? "pseudo" : "palavra"), op: (item as any).op, ...a }, bank);
    }
  }
  return g;
}

test("nível demonstrado: o mais alto com ≥ 2 acertos (não o próximo da escada)", () => {
  const r = (level: Level, outcome: ItemResponse["outcome"]): ItemResponse => ({ world: "ditado", itemId: `${level}${outcome}${Math.random()}`, level, prompt: "", expected: "", given: "", outcome, ms: 0 });
  const mixed = { status: "concluido" as const, adaptive: { ...initialAdaptive(), level: 3 as Level }, responses: [r(2, "erro"), r(2, "erro"), r(1, "erro"), r(1, "erro"), r(1, "correto"), r(1, "correto"), r(2, "correto"), r(2, "correto")] };
  assert.equal(finalLevelOf(mixed), 2, "escada em 3 após o último acerto não vira nível 3 demonstrado");
  assert.equal(finalLevelOf({ ...mixed, responses: [] }), 1);
});

test("sessão completa: todos acertos sobem para o nível 3; todos erros descem ao 1 e geram sinais", () => {
  for (const age of [5, 8, 12, 15, 18]) {
    const best = playAll(age, (world, item) => ({ given: world === "aritmetica" || world === "compreensao" ? item.answer : "x", outcome: "correto" }));
    assert.equal(best.endedReason, "completo", `${age}: sessão não terminou`);
    const s = summarizeGame(best);
    assert.equal(s.ditado.total, ITEMS_PER_WORLD.ditado);
    assert.equal(s.leitura.decodificacao.total, ITEMS_PER_WORLD.decodificacao);
    assert.equal(s.aritmetica.total, ITEMS_PER_WORLD.aritmetica);
    assert.equal(s.ditado.finalLevel, 3);
    assert.equal(s.aritmetica.pct, 100);
    assert.equal(s.leitura.fluencia?.wcpm, 38);
    assert.deepEqual(s.sinais, []);
    assert.equal(best.xp > 0 && best.bestStreak >= 20, true);
    for (const w of WORLDS) assert.equal(starsFor(best.worlds[w.id], worldTarget(w.id, bandForAge(age) as BandBank)), 3);

    const worst = playAll(age, () => ({ given: "zz", outcome: "erro", errorType: "fonologico" }));
    const sw = summarizeGame(worst);
    assert.equal(sw.ditado.finalLevel, 1);
    assert.equal(sw.aritmetica.finalLevel, 1);
    assert.equal(sw.ditado.fonologicos, ITEMS_PER_WORLD.ditado);
    assert.ok(sw.sinais.length >= 4, `${age}: sinais esperados`);
    const used = worst.worlds.ditado.responses.map((r) => r.itemId);
    assert.equal(new Set(used).size, used.length, "item repetido na sessão");
  }
});

test("XP premia esforço e não acerto; pular mundo vale como não aplicado", () => {
  const bank = bandForAge(10) as BandBank;
  let g = newGame({ idade: 10 });
  const item = nextItemFor(g, "aritmetica", bank)!;
  const right = recordResponse(g, { world: "aritmetica", itemId: item.id, level: 2, prompt: "", expected: "", given: "", outcome: "correto", ms: 1 }, bank);
  const wrong = recordResponse(g, { world: "aritmetica", itemId: item.id, level: 2, prompt: "", expected: "", given: "", outcome: "erro", ms: 1 }, bank);
  assert.equal(right.xp, wrong.xp, "feedback não revela acerto");
  g = skipWorld(g, "ditado");
  assert.equal(g.worlds.ditado.status, "pulado");
  assert.match(gameResponseItems(g).find((x) => x.question === "Ditado")?.answer ?? "", /pulado/);
});

test("relatório e PDF: disclaimers, cores azul/vermelho por item e contrato do SaveToPatient", () => {
  const g = playAll(15, (world, item) => (world === "ditado" ? { given: "x", outcome: "erro", errorType: "ortografico" } : { given: item.answer ?? "", outcome: "correto" }));
  const issuer = { doctorName: "Dra. Teste", specialty: "", credentials: "", clinicName: "", motto: "" };
  const spec = buildGameDocSpec(g, issuer, "07/10/2026 21:00");
  assert.match(spec.footer ?? "", /LGPD/);
  assert.match(spec.footer ?? "", /NÃO DIAGNÓSTICA/);
  assert.match(GAME_DISCLAIMER, /sem validação normativa brasileira/i);
  const ditado = spec.sections.find((s) => s.heading.startsWith("Caverna do Ditado"));
  assert.ok(ditado?.rich?.every((l) => l.tone === "wrong"), "erros em vermelho");
  const ari = spec.sections.find((s) => s.heading.startsWith("Ponte dos Números"));
  assert.ok(ari?.rich?.every((l) => l.tone === "correct"), "acertos em azul");
  assert.ok(ari?.rich?.every((l) => /^Acertou/.test(l.text)), "cor sempre acompanhada de rótulo");
  const record = buildGameRecord(g, "07/10/2026 21:00");
  assert.match(record, /erros ortográficos 8/);
  assert.match(record, /NÃO DIAGNÓSTICA/);
  const items = gameResponseItems(g);
  assert.ok(items.every((i) => i.question && i.answer));
});

test("página: ICED-8 preservado na mesma chave, jogo em chave própria, dock não cobre o conteúdo", () => {
  const page = readFileSync("client/src/pages/dyslexia-risk.tsx", "utf8");
  assert.match(page, /const KEY = "neuroped-dyslexia-risk-v1"/, "chave do ICED-8 não muda (sessões salvas)");
  assert.match(page, /LazyDyslexiaGame/);
  assert.match(page, /não diagnostica/);
  const engine = readFileSync("client/src/features/dyslexia-risk/game/engine.ts", "utf8");
  assert.match(engine, /GAME_STORAGE_KEY = "neuroped-dyslexia-game-v1"/);
  const css = readFileSync("client/src/styles/dyslexia-risk.css", "utf8");
  assert.match(css, /\.snp\.drx-page \{ padding-bottom: calc\(7rem \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /scroll-margin-bottom/);
  assert.match(css, /prefers-reduced-motion: no-preference/);
  const ui = readFileSync("client/src/features/dyslexia-risk/game/DyslexiaGame.tsx", "utf8");
  assert.match(ui, /snp-answer--correct/);
  assert.match(ui, /snp-answer--wrong/);
  assert.match(ui, /Pausar/);
  assert.match(ui, /NÃO DIAGNÓSTICA/);
});
