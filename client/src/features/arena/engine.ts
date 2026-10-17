/**
 * Arena do NeuroPad: cinco brincadeiras curtas e uma leitura da rodada.
 * A leitura descreve o que aconteceu. Não classifica, não gera percentil
 * e não substitui a consulta.
 */
import { DESCRIPTIVE_NOTICE } from "@/lib/descriptiveNotice";
import {
  boltSequence,
  figurePrompt,
  letterPrompt,
  memoryPieces,
  phrasePrompt,
  skyWord,
  trailSteps,
  type BoltKind,
  type FigureChoice,
  type MemoryPiece,
  type SoundStep,
} from "@/features/arena/content";

export type AgeBandId = "5-6" | "7-8" | "9-11";
export type GameId = "constelacao" | "ditado" | "trilha" | "bau" | "relampago";
export type MissionMode = "missao" | GameId;
export type ArenaTab = "missao" | "leitura";
export type ReadingName = "folga" | "em construção" | "com ajuda";
export type MemoryMark = "acerto" | "troca" | "esqueceu";
export type DictationMode = "figura" | "letras" | "frase";
export type GuessEffect = "repetida" | "acesa" | "apagou" | "completa" | "ceu-apagado" | "ignorada";

export const ARENA_ROUTE = "/neuropad-arena";
export const ARENA_STORAGE_KEY = "neuroped.arena.ficha.v1";
export const ARENA_VERSION = 1;
export const BOLT_WINDOW_MS = 4000;
export const GAME_ORDER: readonly GameId[] = ["constelacao", "ditado", "trilha", "bau", "relampago"];

export const GAME_LABEL: Record<GameId, string> = {
  constelacao: "Constelação",
  ditado: "Ditado do Raio",
  trilha: "Trilha dos sons",
  bau: "Baú da memória",
  relampago: "Relâmpago",
};

export const BANDS: readonly { id: AgeBandId; label: string }[] = [
  { id: "5-6", label: "5–6 anos" },
  { id: "7-8", label: "7–8 anos" },
  { id: "9-11", label: "9–11 anos" },
];

const BAND_SET = new Set<string>(BANDS.map((band) => band.id));
const GAME_SET = new Set<string>(GAME_ORDER);

export interface Settled {
  acerto: boolean;
  detalhe: string;
  memoria?: MemoryMark;
}

export interface ConstellationPlay {
  game: "constelacao";
  itemId: string;
  word: string;
  syllables: string[];
  revealed: boolean[];
  stars: number;
  tried: string[];
  ajuda: number;
  elapsedMs: number;
  settled: Settled | null;
}

export interface DictationPlay {
  game: "ditado";
  itemId: string;
  mode: DictationMode;
  spoken: string;
  promptVisible: boolean;
  options: FigureChoice[];
  answer: string;
  letters: string[];
  target: string;
  assembled: string[];
  written: string;
  listens: number;
  ajuda: number;
  elapsedMs: number;
  settled: Settled | null;
}

export interface TrailPlay {
  game: "trilha";
  itemId: string;
  steps: SoundStep[];
  step: number;
  hits: number;
  hint: boolean;
  ajuda: number;
  elapsedMs: number;
  settled: Settled | null;
}

export interface MemoryPlay {
  game: "bau";
  itemId: string;
  sequence: MemoryPiece[];
  phase: "mostra" | "devolve";
  given: string[];
  ajuda: number;
  elapsedMs: number;
  settled: Settled | null;
}

export interface BoltPlay {
  game: "relampago";
  itemId: string;
  sequence: BoltKind[];
  index: number;
  remainingMs: number;
  hits: number;
  misses: number;
  hint: boolean;
  ajuda: number;
  elapsedMs: number;
  settled: Settled | null;
}

export type Play = ConstellationPlay | DictationPlay | TrailPlay | MemoryPlay | BoltPlay;

export interface Trial {
  game: GameId;
  itemId: string;
  acerto: boolean;
  ajuda: number;
  segundos: number;
  detalhe: string;
  memoria?: MemoryMark;
}

export interface Ficha {
  version: typeof ARENA_VERSION;
  band: AgeBandId;
  mode: MissionMode;
  tab: ArenaTab;
  paused: boolean;
  cursor: number;
  queue: GameId[];
  play: Play | null;
  trials: Trial[];
  startedAt: string;
}

export function emptyFicha(band: AgeBandId = "5-6"): Ficha {
  return {
    version: ARENA_VERSION,
    band,
    mode: "missao",
    tab: "missao",
    paused: false,
    cursor: 0,
    queue: [],
    play: null,
    trials: [],
    startedAt: "",
  };
}

export function matchKey(letter: string, band: AgeBandId): string {
  const upper = letter.trim().toLocaleUpperCase("pt-BR");
  if (band === "9-11") return upper;
  return upper.normalize("NFD").replace(/\p{M}/gu, "");
}

function lettersOf(word: string): string[] {
  return [...word];
}

function isLetter(char: string): boolean {
  return /\p{L}/u.test(char);
}

export function startConstellation(word: string, itemId = "ceu", stars = 5): ConstellationPlay {
  return {
    game: "constelacao",
    itemId,
    word,
    syllables: [],
    revealed: lettersOf(word).map((char) => !isLetter(char)),
    stars,
    tried: [],
    ajuda: 0,
    elapsedMs: 0,
    settled: null,
  };
}

export function guessLetter(
  play: ConstellationPlay,
  letter: string,
  band: AgeBandId,
): { play: ConstellationPlay; effect: GuessEffect } {
  if (play.settled) return { play, effect: "ignorada" };
  const raw = letter.trim();
  if (lettersOf(raw).length !== 1 || !isLetter(raw)) return { play, effect: "ignorada" };
  const key = matchKey(raw, band);
  if (play.tried.includes(key)) return { play, effect: "repetida" };
  const chars = lettersOf(play.word);
  const hit = chars.some((char, index) => isLetter(char) && !play.revealed[index] && matchKey(char, band) === key);
  const tried = [...play.tried, key];
  if (!hit) {
    const stars = Math.max(0, play.stars - 1);
    const next = { ...play, tried, stars };
    if (stars === 0) {
      return { play: settleConstellation(next, false), effect: "ceu-apagado" };
    }
    return { play: next, effect: "apagou" };
  }
  const revealed = play.revealed.map((on, index) => on || (isLetter(chars[index]) && matchKey(chars[index], band) === key));
  const next = { ...play, tried, revealed };
  if (revealed.every(Boolean)) {
    return { play: settleConstellation(next, true), effect: "completa" };
  }
  return { play: next, effect: "acesa" };
}

export function lanternConstellation(play: ConstellationPlay, band: AgeBandId): ConstellationPlay {
  if (play.settled) return play;
  const chars = lettersOf(play.word);
  const index = chars.findIndex((char, position) => isLetter(char) && !play.revealed[position]);
  if (index < 0) return play;
  const key = matchKey(chars[index], band);
  const revealed = play.revealed.map((on, position) => on || (isLetter(chars[position]) && matchKey(chars[position], band) === key));
  const tried = play.tried.includes(key) ? play.tried : [...play.tried, key];
  const next = { ...play, revealed, tried, ajuda: play.ajuda + 1 };
  return revealed.every(Boolean) ? settleConstellation(next, true) : next;
}

function settleConstellation(play: ConstellationPlay, acerto: boolean): ConstellationPlay {
  const syllables = play.syllables.length > 0 ? play.syllables : syllableParts(play.word);
  const lost = Math.max(0, 5 - play.stars);
  const starNote = !acerto || lost === 0 ? "" : lost === 1 ? " Uma estrela se apagou no caminho." : ` ${lost} estrelas se apagaram no caminho.`;
  return {
    ...play,
    syllables,
    settled: {
      acerto,
      detalhe: acerto
        ? `Constelação: a palavra ficou acesa e apareceu em sílabas.${starNote}`
        : "Constelação: as estrelas da rodada se apagaram e a palavra apareceu em sílabas.",
    },
  };
}

export function syllableLine(syllables: readonly string[]): string {
  return syllables.join(" · ");
}

function syllableParts(word: string): string[] {
  return [word];
}

export function dictationMode(band: AgeBandId): DictationMode {
  if (band === "5-6") return "figura";
  if (band === "7-8") return "letras";
  return "frase";
}

export function registerListen(listens: number, ajuda: number): { listens: number; ajuda: number; countedHelp: boolean } {
  if (listens <= 0) return { listens: 1, ajuda, countedHelp: false };
  return { listens: listens + 1, ajuda: ajuda + 1, countedHelp: true };
}

export function gradeFigure(picked: string, answer: string): boolean {
  return picked === answer;
}

export function gradeLetters(assembled: readonly string[], target: string, band: AgeBandId): boolean {
  return gradePhrase(assembled.join(""), target, band);
}

export function gradePhrase(written: string, target: string, band: AgeBandId): boolean {
  return foldText(written, band) === foldText(target, band);
}

function foldText(text: string, band: AgeBandId): string {
  const upper = text.trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR");
  if (band === "9-11") return upper;
  return upper.normalize("NFD").replace(/\p{M}/gu, "");
}

export function gradeSound(picked: string, answer: string): boolean {
  return picked === answer;
}

export function gradeMemory(target: readonly string[], given: readonly string[]): MemoryMark {
  if (target.length === given.length && target.every((id, index) => id === given[index])) return "acerto";
  const bag = (items: readonly string[]) => {
    const counts = new Map<string, number>();
    for (const id of items) counts.set(id, (counts.get(id) ?? 0) + 1);
    return counts;
  };
  const left = bag(target);
  const right = bag(given);
  const sameBag = left.size === right.size && [...left].every(([id, count]) => right.get(id) === count);
  return sameBag ? "troca" : "esqueceu";
}

export function gradeBolt(kind: BoltKind, action: "pegar" | "deixar"): boolean {
  return (kind === "estrela" && action === "pegar") || (kind === "meteoro" && action === "deixar");
}

export function resolveBoltTimeout(kind: BoltKind): boolean {
  return kind === "meteoro";
}

export function tickBolt(remainingMs: number, deltaMs: number, paused: boolean): number {
  if (paused) return remainingMs;
  return Math.max(0, remainingMs - Math.max(0, deltaMs));
}

export function isIndependent(trial: { acerto: boolean; ajuda: number }): boolean {
  return trial.acerto && trial.ajuda === 0;
}

export function readingName(trials: readonly { acerto: boolean; ajuda: number }[]): ReadingName {
  if (trials.length === 0) return "em construção";
  const independent = trials.filter((trial) => isIndependent(trial)).length;
  const helpedHits = trials.filter((trial) => trial.acerto && trial.ajuda > 0).length;
  const misses = trials.filter((trial) => !trial.acerto).length;
  if (helpedHits > 0 && (independent === 0 || helpedHits > independent)) return "com ajuda";
  if (misses === 0 && helpedHits === 0 && independent === trials.length) return "folga";
  return "em construção";
}

const FAMILY_PHRASE: Record<ReadingName, string> = {
  folga: "Nesta rodada os passos saíram sem a lanterna e sem ouvir de novo.",
  "em construção": "Nesta rodada uma parte dos passos já se sustenta e outra ainda se monta.",
  "com ajuda": "Nesta rodada a lanterna ou o ouvir de novo entrou em boa parte dos passos.",
};

const CHILD_PHRASE: Record<ReadingName, string> = {
  folga: "Você acendeu este céu com as próprias mãos.",
  "em construção": "Seu céu cresceu um pedaço nesta rodada.",
  "com ajuda": "A lanterna caminhou com você nesta rodada.",
};

export function familyPhrase(name: ReadingName): string {
  return FAMILY_PHRASE[name];
}

export function childPhrase(name: ReadingName): string {
  return CHILD_PHRASE[name];
}

export function familyPresentation(name: ReadingName): { rotulo: ReadingName; frase: string } {
  return { rotulo: name, frase: familyPhrase(name) };
}

export function secondsPhrase(seconds: number): string {
  const count = Math.max(0, Math.trunc(seconds));
  return count === 1 ? "1 segundo" : `${count} segundos`;
}

export function helpPhrase(count: number): string {
  const value = Math.max(0, Math.trunc(count));
  return value === 1 ? "1 ajuda" : `${value} ajudas`;
}

export function homeIdeas(): [string, string] {
  return [
    "Em casa, partam uma palavra curta em sílabas, como quem acende um céu.",
    "Em casa, guardem três objetos numa ordem e peçam a mesma ordem de volta.",
  ];
}

export const ROUND_LIMITS = [
  "Esta leitura descreve só esta rodada.",
  "Não fecha diagnóstico, não gera percentil e não substitui a consulta.",
  "Não é escala pronta nem instrumento com norma.",
] as const;

export interface SkyStar {
  id: GameId;
  acesa: boolean;
}

export function skyOf(queue: readonly GameId[], trials: readonly Trial[]): SkyStar[] {
  const games = queue.length > 0 ? queue : GAME_ORDER.filter((game) => trials.some((trial) => trial.game === game));
  return games.map((id) => ({
    id,
    acesa: trials.some((trial) => trial.game === id && isIndependent(trial)),
  }));
}

export interface MapRow {
  game: GameId;
  nome: ReadingName;
  linha: string;
  detalhe: string;
}

export function roundMap(queue: readonly GameId[], trials: readonly Trial[]): MapRow[] {
  const games = queue.length > 0 ? queue : GAME_ORDER.filter((game) => trials.some((trial) => trial.game === game));
  return games.map((game) => {
    const mine = trials.filter((trial) => trial.game === game);
    const segundos = mine.reduce((sum, trial) => sum + trial.segundos, 0);
    const ajudas = mine.reduce((sum, trial) => sum + trial.ajuda, 0);
    return {
      game,
      nome: readingName(mine),
      linha: mine.length === 0 ? "Ainda não entrou nesta rodada." : `${secondsPhrase(segundos)} · ${helpPhrase(ajudas)}`,
      detalhe: mine.map((trial) => trial.detalhe).join(" "),
    };
  });
}

export function clinicalNotes(ficha: Pick<Ficha, "trials" | "play" | "paused">): string[] {
  const notes: string[] = [...ROUND_LIMITS];
  const ajudas = ficha.trials.reduce((sum, trial) => sum + trial.ajuda, 0);
  if (ajudas > 0) notes.push("A ajuda desta rodada fica registrada à parte e não conta como passo sozinho.");
  for (const trial of ficha.trials) notes.push(trial.detalhe);
  if (ficha.play) notes.push("A missão ainda está aberta neste aparelho.");
  if (ficha.paused) notes.push("A missão está pausada e a jogada foi conservada.");
  notes.push("Tudo isto fica só neste aparelho.");
  return notes;
}

export function readingDocument(ficha: Ficha): string {
  const name = readingName(ficha.trials);
  const family = familyPresentation(name);
  const stars = skyOf(ficha.queue, ficha.trials);
  const acesas = stars.filter((star) => star.acesa).length;
  const lines = [
    "Arena · NeuroPad",
    `Faixa ${labelOf(ficha.band)}`,
    `Estrelas da rodada: ${acesas} de ${stars.length}`,
    childPhrase(name),
    `Rótulo da rodada: ${family.rotulo}`,
    family.frase,
    "Mapa da rodada",
    ...roundMap(ficha.queue, ficha.trials).map((row) => `${GAME_LABEL[row.game]} · ${row.nome} · ${row.linha}`),
    "Em casa",
    ...homeIdeas(),
    "Notas para o consultório",
    ...clinicalNotes(ficha),
    DESCRIPTIVE_NOTICE,
  ];
  return lines.join("\n");
}

function labelOf(band: AgeBandId): string {
  return BANDS.find((item) => item.id === band)?.label ?? band;
}

export function openPlay(game: GameId, band: AgeBandId): Play {
  if (game === "constelacao") {
    const sky = skyWord(band);
    return { ...startConstellation(sky.word, sky.id), syllables: [...sky.syllables] };
  }
  if (game === "ditado") {
    const mode = dictationMode(band);
    const figure = figurePrompt();
    const letters = letterPrompt();
    const phrase = phrasePrompt();
    return {
      game: "ditado",
      itemId: mode === "figura" ? figure.id : mode === "letras" ? letters.id : phrase.id,
      mode,
      spoken: mode === "figura" ? figure.spoken : mode === "letras" ? letters.spoken : phrase.spoken,
      promptVisible: false,
      options: mode === "figura" ? figure.options.map((option) => ({ ...option })) : [],
      answer: mode === "figura" ? figure.answer : "",
      letters: mode === "letras" ? [...letters.letters] : [],
      target: mode === "letras" ? letters.target : mode === "frase" ? phrase.target : "",
      assembled: [],
      written: "",
      listens: 0,
      ajuda: 0,
      elapsedMs: 0,
      settled: null,
    };
  }
  if (game === "trilha") {
    return {
      game: "trilha",
      itemId: "trilha",
      steps: trailSteps(),
      step: 0,
      hits: 0,
      hint: false,
      ajuda: 0,
      elapsedMs: 0,
      settled: null,
    };
  }
  if (game === "bau") {
    const sequence = memoryPieces(band);
    return {
      game: "bau",
      itemId: `bau-${sequence.length}`,
      sequence,
      phase: "mostra",
      given: [],
      ajuda: 0,
      elapsedMs: 0,
      settled: null,
    };
  }
  return {
    game: "relampago",
    itemId: "relampago",
    sequence: boltSequence(),
    index: 0,
    remainingMs: BOLT_WINDOW_MS,
    hits: 0,
    misses: 0,
    hint: false,
    ajuda: 0,
    elapsedMs: 0,
    settled: null,
  };
}

export function beginRound(band: AgeBandId, mode: MissionMode, startedAt: string): Ficha {
  const queue = mode === "missao" ? [...GAME_ORDER] : [mode];
  return {
    version: ARENA_VERSION,
    band,
    mode,
    tab: "missao",
    paused: false,
    cursor: 0,
    queue,
    play: openPlay(queue[0], band),
    trials: [],
    startedAt,
  };
}

export function pauseOnHide(ficha: Ficha): Ficha {
  if (!ficha.play || ficha.paused) return ficha.play ? { ...ficha } : ficha;
  return { ...ficha, paused: true };
}

export function resumeRound(ficha: Ficha): Ficha {
  return ficha.paused ? { ...ficha, paused: false } : ficha;
}

export function openTab(ficha: Ficha, tab: ArenaTab): Ficha {
  if (ficha.tab === tab) return ficha;
  const next = { ...ficha, tab };
  return tab === "leitura" ? pauseOnHide(next) : next;
}

export function advanceClock(ficha: Ficha, deltaMs: number): Ficha {
  if (!ficha.play || ficha.paused || ficha.tab !== "missao" || ficha.play.settled) return ficha;
  if (ficha.play.game === "relampago") return { ...ficha, play: advanceBolt(ficha.play, deltaMs) };
  return { ...ficha, play: { ...ficha.play, elapsedMs: ficha.play.elapsedMs + deltaMs } };
}

function advanceBolt(play: BoltPlay, deltaMs: number): BoltPlay {
  const remainingMs = tickBolt(play.remainingMs, deltaMs, false);
  const elapsedMs = play.elapsedMs + deltaMs;
  if (remainingMs > 0) return { ...play, remainingMs, elapsedMs };
  return applyBolt(play, resolveBoltTimeout(play.sequence[play.index]), elapsedMs);
}

export function hearDictation(play: DictationPlay): DictationPlay {
  if (play.settled) return play;
  const listen = registerListen(play.listens, play.ajuda);
  return { ...play, listens: listen.listens, ajuda: listen.ajuda };
}

export function revealDictation(play: DictationPlay): DictationPlay {
  if (play.settled || play.promptVisible) return play;
  return { ...play, promptVisible: true, ajuda: play.ajuda + 1 };
}

export function pickFigure(play: DictationPlay, figureId: string): DictationPlay {
  if (play.settled || play.mode !== "figura") return play;
  const acerto = gradeFigure(figureId, play.answer);
  return {
    ...play,
    settled: {
      acerto,
      detalhe: acerto
        ? "Ditado do Raio: a criança apontou a figura ouvida."
        : "Ditado do Raio: a figura apontada foi outra.",
    },
  };
}

export function toggleLetter(play: DictationPlay, letter: string): DictationPlay {
  if (play.settled || play.mode !== "letras") return play;
  return { ...play, assembled: [...play.assembled, letter] };
}

export function undoLetter(play: DictationPlay): DictationPlay {
  if (play.settled || play.assembled.length === 0) return play;
  return { ...play, assembled: play.assembled.slice(0, -1) };
}

export function lanternLetters(play: DictationPlay, band: AgeBandId): DictationPlay {
  if (play.settled || play.mode !== "letras") return play;
  const next = lettersOf(foldText(play.target, band))[play.assembled.length];
  if (!next) return play;
  return { ...play, assembled: [...play.assembled, next], ajuda: play.ajuda + 1 };
}

export function submitLetters(play: DictationPlay, band: AgeBandId): DictationPlay {
  if (play.settled || play.mode !== "letras") return play;
  const acerto = gradeLetters(play.assembled, play.target, band);
  return {
    ...play,
    settled: {
      acerto,
      detalhe: acerto
        ? "Ditado do Raio: as letras montaram a palavra ouvida."
        : "Ditado do Raio: a montagem ficou diferente da palavra ouvida.",
    },
  };
}

export function writePhrase(play: DictationPlay, written: string): DictationPlay {
  if (play.settled || play.mode !== "frase") return play;
  return { ...play, written };
}

export function lanternPhrase(play: DictationPlay): DictationPlay {
  if (play.settled || play.mode !== "frase") return play;
  const words = play.target.split(" ");
  const have = play.written.trim() ? play.written.trim().split(/\s+/) : [];
  if (have.length >= words.length) return play;
  const next = [...have, words[have.length]].join(" ");
  return { ...play, written: next, ajuda: play.ajuda + 1 };
}

export function submitPhrase(play: DictationPlay, band: AgeBandId): DictationPlay {
  if (play.settled || play.mode !== "frase") return play;
  const acerto = gradePhrase(play.written, play.target, band);
  return {
    ...play,
    settled: {
      acerto,
      detalhe: acerto
        ? "Ditado do Raio: a frase escrita acompanhou a palavra ouvida."
        : "Ditado do Raio: a frase escrita ficou diferente da palavra ouvida.",
    },
  };
}

export function lanternTrail(play: TrailPlay): TrailPlay {
  if (play.settled || play.hint) return play;
  return { ...play, hint: true, ajuda: play.ajuda + 1 };
}

export function pickSound(play: TrailPlay, optionId: string): TrailPlay {
  if (play.settled) return play;
  const current = play.steps[play.step];
  if (!current) return play;
  const hit = gradeSound(optionId, current.answer);
  const hits = play.hits + (hit ? 1 : 0);
  const step = play.step + 1;
  if (step < play.steps.length) return { ...play, hits, step, hint: false };
  const acerto = hits === play.steps.length;
  return {
    ...play,
    hits,
    step,
    hint: false,
    settled: {
      acerto,
      detalhe: acerto
        ? "Trilha dos sons: rima, som inicial e palmas fecharam juntos."
        : "Trilha dos sons: algum passo de som ficou diferente.",
    },
  };
}

export function showMemoryAgain(play: MemoryPlay): MemoryPlay {
  if (play.settled) return play;
  return { ...play, phase: "mostra", given: [], ajuda: play.ajuda + 1 };
}

export function hideMemory(play: MemoryPlay): MemoryPlay {
  if (play.settled) return play;
  return { ...play, phase: "devolve", given: [] };
}

export function undoMemory(play: MemoryPlay): MemoryPlay {
  if (play.settled || play.given.length === 0) return play;
  return { ...play, given: play.given.slice(0, -1) };
}

export function giveMemory(play: MemoryPlay, pieceId: string): MemoryPlay {
  if (play.settled || play.phase !== "devolve") return play;
  if (play.given.length >= play.sequence.length) return play;
  if (play.given.includes(pieceId)) return play;
  return { ...play, given: [...play.given, pieceId] };
}

export function submitMemory(play: MemoryPlay): MemoryPlay {
  if (play.settled || play.phase !== "devolve") return play;
  const mark = gradeMemory(play.sequence.map((piece) => piece.id), play.given);
  const detalhe = mark === "acerto"
    ? "Baú da memória: a ordem voltou igual."
    : mark === "troca"
      ? "Baú da memória: os mesmos itens voltaram em outra ordem."
      : "Baú da memória: faltou ou sobrou item na ordem.";
  return { ...play, settled: { acerto: mark === "acerto", detalhe, memoria: mark } };
}

export function lanternBolt(play: BoltPlay): BoltPlay {
  if (play.settled || play.hint) return play;
  return { ...play, hint: true, ajuda: play.ajuda + 1 };
}

export function actBolt(play: BoltPlay, action: "pegar" | "deixar"): BoltPlay {
  if (play.settled) return play;
  const kind = play.sequence[play.index];
  if (!kind) return play;
  return applyBolt(play, gradeBolt(kind, action), play.elapsedMs);
}

function applyBolt(play: BoltPlay, hit: boolean, elapsedMs: number): BoltPlay {
  const hits = play.hits + (hit ? 1 : 0);
  const misses = play.misses + (hit ? 0 : 1);
  const index = play.index + 1;
  if (index < play.sequence.length) {
    return { ...play, hits, misses, index, remainingMs: BOLT_WINDOW_MS, hint: false, elapsedMs };
  }
  const acerto = misses === 0;
  return {
    ...play,
    hits,
    misses,
    index,
    remainingMs: 0,
    hint: false,
    elapsedMs,
    settled: {
      acerto,
      detalhe: acerto
        ? "Relâmpago: cada estrela foi pega e cada meteoro passou."
        : "Relâmpago: alguma estrela passou ou algum meteoro foi pego.",
    },
  };
}

export function secondsFromMs(ms: number): number {
  return Math.max(0, Math.round(ms / 1000));
}

export function completeCurrent(ficha: Ficha): Ficha {
  if (!ficha.play?.settled) return ficha;
  const trial: Trial = {
    game: ficha.play.game,
    itemId: ficha.play.itemId,
    acerto: ficha.play.settled.acerto,
    ajuda: ficha.play.ajuda,
    segundos: secondsFromMs(ficha.play.elapsedMs),
    detalhe: ficha.play.settled.detalhe,
    ...(ficha.play.settled.memoria ? { memoria: ficha.play.settled.memoria } : {}),
  };
  const trials = [...ficha.trials, trial];
  const cursor = ficha.cursor + 1;
  if (cursor >= ficha.queue.length) {
    return { ...ficha, trials, cursor, play: null, paused: false };
  }
  return {
    ...ficha,
    trials,
    cursor,
    play: openPlay(ficha.queue[cursor], ficha.band),
    paused: false,
  };
}

export function loadFicha(storage: { getItem(key: string): string | null } | null): Ficha {
  try {
    return parseFicha(storage ? storage.getItem(ARENA_STORAGE_KEY) : null);
  } catch {
    return emptyFicha();
  }
}

export function saveFicha(storage: { setItem(key: string, value: string): void }, ficha: Ficha): void {
  storage.setItem(ARENA_STORAGE_KEY, JSON.stringify(ficha));
}

export function clearStoredFicha(storage: { removeItem(key: string): void }): void {
  storage.removeItem(ARENA_STORAGE_KEY);
}

export function fichaJson(ficha: Ficha): string {
  return JSON.stringify(ficha, null, 2);
}

export function parseFicha(raw: string | null): Ficha {
  if (raw == null || raw.trim() === "") return emptyFicha();
  try {
    return sanitizeFicha(JSON.parse(raw)) ?? emptyFicha();
  } catch {
    return emptyFicha();
  }
}

function sanitizeFicha(value: unknown): Ficha | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Ficha>;
  if (source.version !== ARENA_VERSION) return null;
  if (typeof source.band !== "string" || !BAND_SET.has(source.band)) return null;
  if (source.mode !== "missao" && (typeof source.mode !== "string" || !GAME_SET.has(source.mode))) return null;
  if (source.tab !== "missao" && source.tab !== "leitura") return null;
  if (typeof source.paused !== "boolean") return null;
  if (typeof source.cursor !== "number" || source.cursor < 0) return null;
  if (!Array.isArray(source.queue) || source.queue.some((game) => typeof game !== "string" || !GAME_SET.has(game))) return null;
  if (typeof source.startedAt !== "string") return null;
  if (!Array.isArray(source.trials) || source.trials.some((trial) => !trialOk(trial))) return null;
  const play = source.play == null ? null : sanitizePlay(source.play);
  if (source.play != null && !play) return null;
  return {
    version: ARENA_VERSION,
    band: source.band,
    mode: source.mode,
    tab: source.tab,
    paused: source.paused,
    cursor: source.cursor,
    queue: [...source.queue],
    play,
    trials: source.trials.map(cloneTrial),
    startedAt: source.startedAt,
  };
}

function trialOk(value: unknown): value is Trial {
  if (!value || typeof value !== "object") return false;
  const trial = value as Trial;
  if (typeof trial.game !== "string" || !GAME_SET.has(trial.game)) return false;
  if (typeof trial.itemId !== "string" || typeof trial.detalhe !== "string") return false;
  if (typeof trial.acerto !== "boolean") return false;
  if (!whole(trial.ajuda) || !whole(trial.segundos)) return false;
  if (trial.memoria != null && trial.memoria !== "acerto" && trial.memoria !== "troca" && trial.memoria !== "esqueceu") return false;
  return true;
}

function cloneTrial(trial: Trial): Trial {
  return {
    game: trial.game,
    itemId: trial.itemId,
    acerto: trial.acerto,
    ajuda: trial.ajuda,
    segundos: trial.segundos,
    detalhe: trial.detalhe,
    ...(trial.memoria ? { memoria: trial.memoria } : {}),
  };
}

function whole(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function settledOk(value: unknown): value is Settled | null {
  if (value == null) return true;
  if (!value || typeof value !== "object") return false;
  const settled = value as Settled;
  if (typeof settled.acerto !== "boolean" || typeof settled.detalhe !== "string") return false;
  if (settled.memoria != null && settled.memoria !== "acerto" && settled.memoria !== "troca" && settled.memoria !== "esqueceu") return false;
  return true;
}

function sanitizePlay(value: unknown): Play | null {
  if (!value || typeof value !== "object") return null;
  const play = value as Play;
  if (!settledOk(play.settled) || typeof play.itemId !== "string" || !whole(play.ajuda) || !whole(play.elapsedMs)) return null;
  if (play.game === "constelacao") return constellationOk(play) ? { ...play, revealed: [...play.revealed], tried: [...play.tried], syllables: [...play.syllables], settled: play.settled ? { ...play.settled } : null } : null;
  if (play.game === "ditado") return dictationOk(play) ? { ...play, options: play.options.map((option) => ({ ...option })), letters: [...play.letters], assembled: [...play.assembled], settled: play.settled ? { ...play.settled } : null } : null;
  if (play.game === "trilha") return trailOk(play) ? { ...play, steps: play.steps.map((step) => ({ ...step, options: step.options.map((option) => ({ ...option })) })), settled: play.settled ? { ...play.settled } : null } : null;
  if (play.game === "bau") return memoryOk(play) ? { ...play, sequence: play.sequence.map((piece) => ({ ...piece })), given: [...play.given], settled: play.settled ? { ...play.settled } : null } : null;
  if (play.game === "relampago") return boltOk(play) ? { ...play, sequence: [...play.sequence], settled: play.settled ? { ...play.settled } : null } : null;
  return null;
}

function constellationOk(play: ConstellationPlay): boolean {
  return typeof play.word === "string"
    && Array.isArray(play.syllables)
    && Array.isArray(play.revealed)
    && play.revealed.length === lettersOf(play.word).length
    && play.revealed.every((item) => typeof item === "boolean")
    && Array.isArray(play.tried)
    && whole(play.stars);
}

function dictationOk(play: DictationPlay): boolean {
  return (play.mode === "figura" || play.mode === "letras" || play.mode === "frase")
    && typeof play.spoken === "string"
    && typeof play.promptVisible === "boolean"
    && Array.isArray(play.options)
    && typeof play.answer === "string"
    && Array.isArray(play.letters)
    && typeof play.target === "string"
    && Array.isArray(play.assembled)
    && typeof play.written === "string"
    && whole(play.listens);
}

function trailOk(play: TrailPlay): boolean {
  return Array.isArray(play.steps) && play.steps.length > 0 && whole(play.step) && whole(play.hits) && typeof play.hint === "boolean";
}

function memoryOk(play: MemoryPlay): boolean {
  return Array.isArray(play.sequence)
    && play.sequence.length > 0
    && (play.phase === "mostra" || play.phase === "devolve")
    && Array.isArray(play.given);
}

function boltOk(play: BoltPlay): boolean {
  return Array.isArray(play.sequence)
    && play.sequence.length > 0
    && whole(play.index)
    && whole(play.remainingMs)
    && whole(play.hits)
    && whole(play.misses)
    && typeof play.hint === "boolean";
}
