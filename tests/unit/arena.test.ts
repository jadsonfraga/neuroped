import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { XICARA_STEP } from "../../client/src/features/arena/content";
import { featuredNavigation, navSections, navigablePages } from "../../client/src/data/navigation";
import {
  ARENA_ROUTE,
  ARENA_STORAGE_KEY,
  actBolt,
  beginRound,
  completeCurrent,
  dictationMode,
  emptyFicha,
  familyPhrase,
  familyPresentation,
  gradeBolt,
  gradeLetters,
  gradeMemory,
  gradePhrase,
  guessLetter,
  hearDictation,
  isIndependent,
  lanternConstellation,
  loadFicha,
  openPlay,
  openTab,
  parseFicha,
  pauseOnHide,
  readingDocument,
  readingName,
  registerListen,
  resolveBoltTimeout,
  roundMap,
  secondsPhrase,
  skyOf,
  startConstellation,
  tickBolt,
  type Trial,
} from "../../client/src/features/arena/engine";

test("letra repetida não apaga outra estrela", () => {
  const start = startConstellation("PÁSSARO");
  const first = guessLetter(start, "Z", "5-6");
  assert.equal(first.effect, "apagou");
  assert.equal(first.play.stars, 4);
  const again = guessLetter(first.play, "z", "5-6");
  assert.equal(again.effect, "repetida");
  assert.equal(again.play.stars, 4);
  assert.deepEqual(again.play.revealed, first.play.revealed);
});

test("acento só é exigido dos 9 aos 11 anos", () => {
  const young = guessLetter(startConstellation("PÁSSARO"), "A", "5-6");
  assert.equal(young.play.revealed[1], true);
  assert.equal(young.play.revealed[4], true);
  assert.equal(young.play.stars, 5);
  const repeatedAccent = guessLetter(young.play, "Á", "7-8");
  assert.equal(repeatedAccent.effect, "repetida");
  assert.equal(repeatedAccent.play.stars, 5);

  const older = guessLetter(startConstellation("PÁSSARO"), "A", "9-11");
  assert.equal(older.play.revealed[1], false);
  assert.equal(older.play.revealed[4], true);
  assert.equal(older.play.stars, 5);
  const accent = guessLetter(older.play, "Á", "9-11");
  assert.equal(accent.play.revealed[1], true);
  assert.equal(accent.effect, "acesa");
});

test("a palavra fechada aparece em sílabas", () => {
  let play = { ...startConstellation("LUA", "lua"), syllables: ["LU", "A"] };
  for (const letter of ["L", "U", "A"]) {
    play = guessLetter(play, letter, "5-6").play;
  }
  assert.ok(play.settled?.acerto);
  assert.equal(play.syllables.join(" · "), "LU · A");
  assert.doesNotMatch(play.settled?.detalhe ?? "", /estrela se apagou/);
  let withMiss = guessLetter(startConstellation("SOL"), "Z", "5-6").play;
  for (const letter of ["S", "O", "L"]) withMiss = guessLetter(withMiss, letter, "5-6").play;
  assert.match(withMiss.settled?.detalhe ?? "", /Uma estrela se apagou no caminho/);
});

test("lanterna acende letra, conta ajuda e não apaga estrela", () => {
  const play = lanternConstellation(startConstellation("SOL"), "5-6");
  assert.equal(play.ajuda, 1);
  assert.equal(play.stars, 5);
  assert.equal(play.revealed[0], true);
  assert.equal(isIndependent({ acerto: true, ajuda: play.ajuda }), false);
});

test("ditado muda com a faixa e ouvir de novo continua valendo como acerto com ajuda", () => {
  assert.equal(dictationMode("5-6"), "figura");
  assert.equal(dictationMode("7-8"), "letras");
  assert.equal(dictationMode("9-11"), "frase");
  const first = registerListen(0, 0);
  assert.equal(first.countedHelp, false);
  const again = registerListen(first.listens, first.ajuda);
  assert.equal(again.countedHelp, true);
  assert.equal(again.ajuda, 1);
  const ditado = openPlay("ditado", "7-8");
  assert.equal(ditado.game, "ditado");
  if (ditado.game !== "ditado") return;
  const heard = hearDictation(hearDictation(ditado));
  assert.equal(heard.ajuda, 1);
  assert.equal(gradeLetters(["G", "A", "T", "O"], "GATO", "7-8"), true);
  assert.equal(gradePhrase("O PASSARO VOA", "O PÁSSARO VOA", "7-8"), true);
  assert.equal(gradePhrase("O PASSARO VOA", "O PÁSSARO VOA", "9-11"), false);
  assert.equal(gradePhrase("O PÁSSARO VOA", "O PÁSSARO VOA", "9-11"), true);
});

test("trilha: XÍCARA caminha com CHAVE, não com TÁXI", () => {
  assert.equal(XICARA_STEP.answer, "chave");
  assert.equal(XICARA_STEP.options.find((option) => option.label === "CHAVE")?.id, "chave");
  assert.notEqual(XICARA_STEP.answer, "taxi");
  const trail = openPlay("trilha", "9-11");
  assert.equal(trail.game, "trilha");
  if (trail.game !== "trilha") return;
  assert.equal(trail.steps[1]?.prompt, "XÍCARA");
  assert.equal(trail.steps.map((step) => step.kind).join(","), "rima,inicial,palmas");
});

test("baú: trocar a ordem conta diferente de esquecer", () => {
  const target = ["sol", "lua", "estrela"];
  assert.equal(gradeMemory(target, ["sol", "lua", "estrela"]), "acerto");
  assert.equal(gradeMemory(target, ["sol", "estrela", "lua"]), "troca");
  assert.equal(gradeMemory(target, ["sol", "lua"]), "esqueceu");
  assert.equal(gradeMemory(target, ["sol", "lua", "raio"]), "esqueceu");
});

test("relâmpago pega a estrela e deixa o meteoro passar", () => {
  assert.equal(gradeBolt("estrela", "pegar"), true);
  assert.equal(gradeBolt("estrela", "deixar"), false);
  assert.equal(gradeBolt("meteoro", "deixar"), true);
  assert.equal(gradeBolt("meteoro", "pegar"), false);
  assert.equal(resolveBoltTimeout("estrela"), false);
  assert.equal(resolveBoltTimeout("meteoro"), true);
  const bolt = openPlay("relampago", "5-6");
  assert.equal(bolt.game, "relampago");
  if (bolt.game !== "relampago") return;
  const paused = tickBolt(bolt.remainingMs, 1000, true);
  assert.equal(paused, bolt.remainingMs);
  const caught = actBolt(bolt, "pegar");
  assert.equal(caught.hits, 1);
  assert.equal(caught.index, 1);
});

test("trocar de aba pausa sem perder a jogada", () => {
  const started = beginRound("9-11", "missao", "2026-10-17T12:00:00.000Z");
  const guessed = started.play?.game === "constelacao" ? guessLetter(started.play, "P", "9-11").play : null;
  assert.ok(guessed);
  const mid = { ...started, play: guessed };
  const hidden = pauseOnHide(mid);
  assert.equal(hidden.paused, true);
  assert.equal(hidden.play, guessed);
  const leitura = openTab(hidden, "leitura");
  assert.equal(leitura.tab, "leitura");
  assert.equal(leitura.paused, true);
  assert.equal(leitura.play, guessed);
  const back = openTab(leitura, "missao");
  assert.equal(back.play, guessed);
  assert.equal(back.play && "revealed" in back.play ? back.play.revealed[0] : false, true);
});

test("memória corrompida abre uma ficha nova", () => {
  for (const raw of ["{", "null", "[]", "{\"version\":2}", "{\"version\":1}", "{\"version\":1,\"band\":\"5-6\",\"play\":{\"game\":\"chuva\"}}"]) {
    assert.doesNotThrow(() => parseFicha(raw));
    const fresh = parseFicha(raw);
    assert.equal(fresh.play, null);
    assert.deepEqual(fresh.trials, []);
  }
  assert.equal(loadFicha({ getItem() { throw new Error("bloqueado"); } }).play, null);
  const round = beginRound("7-8", "constelacao", "2026-10-17T12:00:00.000Z");
  assert.deepEqual(parseFicha(JSON.stringify(round)), round);
});

test("1 segundo fica no singular e a frase da família não cola o rótulo", () => {
  assert.equal(secondsPhrase(1), "1 segundo");
  assert.equal(secondsPhrase(0), "0 segundos");
  assert.equal(secondsPhrase(2), "2 segundos");
  const names = ["folga", "em construção", "com ajuda"] as const;
  for (const name of names) {
    const frase = familyPhrase(name);
    assert.equal(frase.toLocaleLowerCase("pt-BR").includes(name), false);
    assert.notEqual(frase.slice(0, name.length).toLocaleLowerCase("pt-BR"), name);
    const shown = familyPresentation(name);
    assert.equal(shown.rotulo, name);
    assert.equal(shown.frase, frase);
    assert.equal(`${shown.rotulo}${shown.frase}`.includes(`${name}${frase}`), true);
    assert.notEqual(shown.frase, `${name} ${frase}`);
  }
  const trial: Trial = {
    game: "constelacao",
    itemId: "lua",
    acerto: true,
    ajuda: 0,
    segundos: 1,
    detalhe: "Constelação: a palavra ficou acesa e apareceu em sílabas.",
  };
  const line = roundMap(["constelacao"], [trial])[0]?.linha ?? "";
  assert.match(line, /1 segundo/);
  assert.doesNotMatch(line, /1 segundos/);
  const doc = readingDocument({ ...emptyFicha(), queue: ["constelacao"], trials: [trial] });
  assert.match(doc, /1 segundo/);
  assert.doesNotMatch(doc, /folgaNesta|em construçãoNesta|com ajudaNesta/);
  assert.equal(doc.includes(`folga ${familyPhrase("folga")}`), false);
  assert.match(doc, /Não fecha diagnóstico/);
  assert.match(doc, /Registro descritivo/);
});

test("acerto com ajuda não é lido como independência", () => {
  assert.equal(readingName([{ acerto: true, ajuda: 0 }]), "folga");
  assert.equal(readingName([{ acerto: true, ajuda: 1 }]), "com ajuda");
  assert.equal(readingName([{ acerto: false, ajuda: 0 }]), "em construção");
  assert.equal(readingName([]), "em construção");
  const helped = { acerto: true, ajuda: 2 };
  assert.equal(isIndependent(helped), false);
  assert.equal(skyOf(["constelacao"], [{ game: "constelacao", itemId: "x", segundos: 1, detalhe: "", ...helped }])[0]?.acesa, false);
});

test("a missão percorre os cinco jogos e a ficha não sai do aparelho", () => {
  let ficha = beginRound("5-6", "missao", "2026-10-17T12:00:00.000Z");
  assert.deepEqual(ficha.queue, ["constelacao", "ditado", "trilha", "bau", "relampago"]);
  while (ficha.play) {
    ficha = completeCurrent({
      ...ficha,
      play: {
        ...ficha.play,
        settled: { acerto: true, detalhe: "Passo anotado." },
      },
    });
  }
  assert.equal(ficha.trials.length, 5);
  const page = readFileSync("client/src/pages/neuropad-arena.tsx", "utf8");
  const app = readFileSync("client/src/App.tsx", "utf8");
  assert.doesNotMatch(page, /fetch\(|\/api\//);
  assert.match(page, /ARENA_STORAGE_KEY/);
  assert.equal(ARENA_STORAGE_KEY, "neuroped.arena.ficha.v1");
  assert.match(page, /visibilitychange/);
  assert.match(page, /familyPresentation/);
  assert.match(app, /path="\/neuropad-arena"/);
  assert.equal(ARENA_ROUTE, "/neuropad-arena");
  assert.equal(navSections.find((section) => section.title === "PRÉ-CONSULTA GUIADA")?.items[1]?.href, ARENA_ROUTE);
  assert.equal(featuredNavigation.slice(0, 9).some((item) => item.href === ARENA_ROUTE), false);
  assert.equal(navigablePages.filter((item) => item.href === ARENA_ROUTE).length, 1);
});
