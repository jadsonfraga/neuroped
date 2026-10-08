/**
 * Motor puro do Jogo das Letras e Números (5–18 anos): progressão adaptativa,
 * classificação de erros do ditado, XP, limite de sessão e resumo por domínio.
 * Sem React e sem DOM, para ser testado isoladamente.
 *
 * Triagem interna. NÃO diagnostica e NÃO tem validação normativa brasileira.
 */
import { BANDS, bandForAge, fluencyWords, type ArithOp, type BandBank, type BandId, type Level } from "./bank";

export const GAME_VERSION = "JLN-1";
export const GAME_STORAGE_KEY = "neuroped-dyslexia-game-v1";
export const SESSION_CAP_SECONDS = 15 * 60;
export const START_LEVEL: Level = 2;
export const STEP_AFTER = 2;
export const ITEMS_PER_WORLD = { ditado: 8, decodificacao: 8, aritmetica: 8 } as const;
export const FLUENCY_SECONDS = 60;

export type WorldId = "ditado" | "decodificacao" | "fluencia" | "compreensao" | "aritmetica";
export type AdaptiveWorld = keyof typeof ITEMS_PER_WORLD;
export type Outcome = "correto" | "erro" | "nao_respondeu";
export type DitadoError = "ortografico" | "fonologico";

export const WORLDS: { id: WorldId; nome: string; emoji: string; dominio: "ditado" | "leitura" | "aritmetica"; fala: string }[] = [
  { id: "ditado", nome: "Caverna do Ditado", emoji: "✏️", dominio: "ditado", fala: "Ouça a palavra e escreva do seu jeito." },
  { id: "decodificacao", nome: "Vila das Palavras", emoji: "📖", dominio: "leitura", fala: "Leia em voz alta. Algumas palavras são inventadas!" },
  { id: "fluencia", nome: "Corrida da Leitura", emoji: "🏃", dominio: "leitura", fala: "Leia em voz alta por 1 minuto, no seu ritmo." },
  { id: "compreensao", nome: "Torre das Histórias", emoji: "🏰", dominio: "leitura", fala: "Uma história curta e três perguntas." },
  { id: "aritmetica", nome: "Ponte dos Números", emoji: "🔢", dominio: "aritmetica", fala: "Toque na resposta certa." },
];

export interface AdaptiveState { level: Level; streakOk: number; streakErr: number; path: Level[] }

export interface ItemResponse {
  world: WorldId;
  itemId: string;
  level: Level;
  prompt: string;
  expected: string;
  given: string;
  outcome: Outcome;
  errorType?: DitadoError;
  op?: ArithOp;
  kind?: string;
  ms: number;
}

export interface FluencyResult { probeId: string; totalWords: number; lidas: number; erros: number; segundos: number; wcpm: number | null }

export interface WorldProgress { status: "pendente" | "concluido" | "pulado"; adaptive: AdaptiveState; responses: ItemResponse[] }

export interface GameState {
  version: 1;
  nome: string;
  idade: number | null;
  examinador: string;
  avatar: string;
  startedAt: string;
  activeMs: number;
  worlds: Record<WorldId, WorldProgress>;
  fluency: FluencyResult | null;
  xp: number;
  streak: number;
  bestStreak: number;
  endedReason: "" | "completo" | "tempo" | "encerrado";
}

export function initialAdaptive(): AdaptiveState {
  return { level: START_LEVEL, streakOk: 0, streakErr: 0, path: [] };
}

export function newGame(input: { nome?: string; idade: number | null; examinador?: string; avatar?: string }, now = new Date()): GameState {
  const worlds = Object.fromEntries(WORLDS.map((w) => [w.id, { status: "pendente", adaptive: initialAdaptive(), responses: [] }])) as unknown as Record<WorldId, WorldProgress>;
  return {
    version: 1,
    nome: input.nome ?? "",
    idade: input.idade,
    examinador: input.examinador ?? "",
    avatar: input.avatar ?? "🦊",
    startedAt: now.toISOString(),
    activeMs: 0,
    worlds,
    fluency: null,
    xp: 0,
    streak: 0,
    bestStreak: 0,
    endedReason: "",
  };
}

/** Escada adaptativa: 2 acertos seguidos sobem um nível; 2 erros seguidos descem. Limites 1–3. */
export function stepAdaptive(state: AdaptiveState, correct: boolean): AdaptiveState {
  const path = [...state.path, state.level];
  if (correct) {
    const streakOk = state.streakOk + 1;
    if (streakOk >= STEP_AFTER && state.level < 3) return { level: (state.level + 1) as Level, streakOk: 0, streakErr: 0, path };
    return { level: state.level, streakOk: streakOk >= STEP_AFTER ? 0 : streakOk, streakErr: 0, path };
  }
  const streakErr = state.streakErr + 1;
  if (streakErr >= STEP_AFTER && state.level > 1) return { level: (state.level - 1) as Level, streakOk: 0, streakErr: 0, path };
  return { level: state.level, streakOk: 0, streakErr: streakErr >= STEP_AFTER ? 0 : streakErr, path };
}

/** Próximo item não usado no nível pedido; se esgotado, o nível mais próximo (empate: o mais fácil). */
export function pickItem<T extends { id: string; level: Level }>(pool: readonly T[], level: Level, used: ReadonlySet<string>): T | null {
  const order: Level[] = level === 1 ? [1, 2, 3] : level === 2 ? [2, 1, 3] : [3, 2, 1];
  for (const lv of order) {
    const found = pool.find((item) => item.level === lv && !used.has(item.id));
    if (found) return found;
  }
  return null;
}

/**
 * Chave fonológica aproximada do português brasileiro. Duas grafias com a
 * mesma chave soam igual ou diferem só por regra contextual / múltipla
 * representação (ex.: "caza"/"casa", "xuva"/"chuva", "canpo"/"campo", "caro"/"carro").
 * Serve para separar erro ortográfico (de regra/convenção) de erro fonológico.
 */
export function phonoKey(raw: string): string {
  let w = raw.toLocaleLowerCase("pt-BR").normalize("NFC").trim().replace(/[^a-záéíóúâêôãõàçü]/g, "");
  w = w.replace(/ão$/g, "@").replace(/am$/g, "@").replace(/ão/g, "@").replace(/õe/g, "&").replace(/ãe/g, "%");
  w = w.replace(/ç/g, "S");
  w = w.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  w = w.replace(/ch/g, "X").replace(/lh/g, "L").replace(/nh/g, "N").replace(/^h/g, "").replace(/h/g, "");
  w = w.replace(/rr/g, "R").replace(/^r/, "R").replace(/([nls])r/g, "$1R");
  w = w.replace(/x?sc(?=[ei])/g, "S").replace(/xc(?=[ei])/g, "S").replace(/ss/g, "S").replace(/c(?=[ei])/g, "S");
  w = w.replace(/^ex(?=[aeiou])/g, "eZ").replace(/([aeiou])s(?=[aeiou])/g, "$1Z").replace(/z$/g, "S").replace(/z/g, "Z").replace(/s/g, "S");
  w = w.replace(/x(?=[^aeiou]|$)/g, "S").replace(/x/g, "X");
  w = w.replace(/qu(?=[ei])/g, "K").replace(/qu/g, "KW").replace(/[ck]/g, "K");
  w = w.replace(/gu(?=[ei])/g, "G").replace(/g(?=[ei])/g, "J").replace(/j/g, "J").replace(/g/g, "G");
  w = w.replace(/l(?=[^aeiou]|$)/g, "u");
  w = w.replace(/[mn](?=[^aeiou@&%]|$)/g, "~");
  w = w.replace(/ou/g, "o");
  w = w.replace(/o$/g, "u").replace(/oS$/g, "uS").replace(/e$/g, "i").replace(/eS$/g, "iS");
  // Múltiplas representações e regras contextuais contam como ortográficas:
  // s/ss/ç/c/sc/z (sibilantes), r/rr e g/gu/j diante de e/i.
  w = w.replace(/Z/g, "S").replace(/R/g, "r").replace(/G(?=[ei])/g, "J");
  return w;
}

function normalizeWritten(value: string): string {
  return value.toLocaleLowerCase("pt-BR").normalize("NFC").trim().replace(/\s+/g, "");
}

/** Classifica a escrita: exata = correto; mesma chave sonora = ortográfico; resto = fonológico. Pseudopalavra aceita qualquer grafia plausível. */
export function classifyDitado(target: string, written: string, pseudo: boolean): { outcome: Outcome; errorType?: DitadoError } {
  const given = normalizeWritten(written);
  if (!given) return { outcome: "nao_respondeu" };
  if (given === normalizeWritten(target)) return { outcome: "correto" };
  const sameSound = phonoKey(given) === phonoKey(target);
  if (pseudo && sameSound) return { outcome: "correto" };
  return { outcome: "erro", errorType: sameSound ? "ortografico" : "fonologico" };
}

export function wcpmOf(lidas: number, erros: number, segundos: number): number | null {
  if (!segundos || segundos <= 0) return null;
  const corretas = Math.max(0, lidas - erros);
  if (segundos >= FLUENCY_SECONDS) return corretas;
  return Math.round((corretas * 60) / segundos);
}

export function isAdaptive(world: WorldId): world is AdaptiveWorld {
  return world === "ditado" || world === "decodificacao" || world === "aritmetica";
}

export function worldTarget(world: WorldId, bank: BandBank): number {
  if (isAdaptive(world)) return ITEMS_PER_WORLD[world];
  if (world === "compreensao") return bank.compreensao.questions.length;
  return 1;
}

/** Próximo item do mundo (null quando o mundo terminou). */
export function nextItemFor(state: GameState, world: WorldId, bank: BandBank) {
  const progress = state.worlds[world];
  if (progress.status !== "pendente") return null;
  if (progress.responses.length >= worldTarget(world, bank)) return null;
  const used = new Set(progress.responses.map((r) => r.itemId));
  if (world === "ditado") return pickItem(bank.ditado, progress.adaptive.level, used);
  if (world === "decodificacao") return pickItem(bank.decodificacao, progress.adaptive.level, used);
  if (world === "aritmetica") return pickItem(bank.aritmetica, progress.adaptive.level, used);
  if (world === "compreensao") return bank.compreensao.questions.find((q) => !used.has(q.id)) ?? null;
  return null;
}

export const ENCOURAGEMENT = ["Boa! Continue assim!", "Mandou bem no esforço!", "Isso aí, próxima!", "Você está indo longe!", "Show! Mais uma!", "Que coragem! Segue!"];

export function encouragementFor(count: number): string {
  return ENCOURAGEMENT[count % ENCOURAGEMENT.length];
}

/**
 * Registra uma resposta. XP e sequência premiam o ESFORÇO (responder), não o
 * acerto — a criança não recebe sinal de certo/errado durante a triagem.
 */
export function recordResponse(state: GameState, response: ItemResponse, bank: BandBank): GameState {
  const progress = state.worlds[response.world];
  if (progress.status !== "pendente") return state;
  const responses = [...progress.responses, response];
  const adaptive = isAdaptive(response.world) ? stepAdaptive(progress.adaptive, response.outcome === "correto") : progress.adaptive;
  const answered = response.outcome !== "nao_respondeu";
  const streak = answered ? state.streak + 1 : 0;
  const bonus = answered && streak > 0 && streak % 3 === 0 ? 5 : 0;
  const done = responses.length >= worldTarget(response.world, bank) || (isAdaptive(response.world) && pickItem(poolOf(response.world, bank), adaptive.level, new Set(responses.map((r) => r.itemId))) == null);
  const next: GameState = {
    ...state,
    xp: state.xp + (answered ? 10 : 0) + bonus,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    worlds: { ...state.worlds, [response.world]: { status: done ? "concluido" : "pendente", adaptive, responses } },
  };
  return withCompletion(next);
}

function poolOf(world: AdaptiveWorld, bank: BandBank): readonly { id: string; level: Level }[] {
  return world === "ditado" ? bank.ditado : world === "decodificacao" ? bank.decodificacao : bank.aritmetica;
}

export function recordFluency(state: GameState, result: Omit<FluencyResult, "wcpm">): GameState {
  if (state.worlds.fluencia.status !== "pendente") return state;
  const fluency: FluencyResult = { ...result, wcpm: wcpmOf(result.lidas, result.erros, result.segundos) };
  return withCompletion({
    ...state,
    fluency,
    xp: state.xp + 30,
    streak: state.streak + 1,
    bestStreak: Math.max(state.bestStreak, state.streak + 1),
    worlds: { ...state.worlds, fluencia: { ...state.worlds.fluencia, status: "concluido" } },
  });
}

export function skipWorld(state: GameState, world: WorldId): GameState {
  if (state.worlds[world].status !== "pendente") return state;
  return withCompletion({ ...state, streak: 0, worlds: { ...state.worlds, [world]: { ...state.worlds[world], status: "pulado" } } });
}

function withCompletion(state: GameState): GameState {
  if (state.endedReason) return state;
  const allDone = WORLDS.every((w) => state.worlds[w.id].status !== "pendente");
  return allDone ? { ...state, endedReason: "completo" } : state;
}

/** Avança o relógio ativo (pausa não chama). Atingido o teto de 15 min, a sessão encerra. */
export function tick(state: GameState, ms: number): GameState {
  if (state.endedReason) return state;
  const activeMs = state.activeMs + Math.max(0, ms);
  if (activeMs >= SESSION_CAP_SECONDS * 1000) return { ...state, activeMs: SESSION_CAP_SECONDS * 1000, endedReason: "tempo" };
  return { ...state, activeMs };
}

export function starsFor(progress: WorldProgress, target: number): 0 | 1 | 2 | 3 {
  if (progress.status === "pendente") return 0;
  if (progress.status === "pulado") return 0;
  const answered = progress.responses.filter((r) => r.outcome !== "nao_respondeu").length;
  if (target <= 1 || answered / target >= 0.9) return 3;
  return answered / target >= 0.5 ? 2 : 1;
}

/** Estimativa conservadora (segundos) da sessão completa por faixa; sustenta o teto de 15 min. */
export function estimateSessionSeconds(band: BandId): number {
  const bank = BANDS.find((b) => b.band === band);
  if (!bank) return Infinity;
  const young = band === "5-6";
  const ditado = ITEMS_PER_WORLD.ditado * (young ? 25 : 30);
  const decod = ITEMS_PER_WORLD.decodificacao * (young ? 12 : 15);
  const fluencia = FLUENCY_SECONDS + 30;
  const words = fluencyWords({ id: "", kind: "texto", title: "", text: bank.compreensao.text }).length;
  const wordsPerSecond = bank.compreensao.listening ? 2 : band === "7-8" ? 1.2 : band === "9-10" ? 1.6 : 2.2;
  const compreensao = Math.round(words / wordsPerSecond) + bank.compreensao.questions.length * 25;
  const perArith: Record<BandId, number> = { "5-6": 15, "7-8": 20, "9-10": 22, "11-12": 25, "13-14": 25, "15-18": 25 };
  const aritmetica = ITEMS_PER_WORLD.aritmetica * perArith[band];
  const transicoes = WORLDS.length * 15;
  return ditado + decod + fluencia + compreensao + aritmetica + transicoes;
}

export interface Tally { corretos: number; total: number }
const pct = (t: Tally) => (t.total ? Math.round((t.corretos / t.total) * 100) : null);

export interface GameSummary {
  band: BandBank | null;
  ditado: Tally & { pct: number | null; ortograficos: number; fonologicos: number; naoRespondidos: number; pseudo: Tally; finalLevel: Level; status: WorldProgress["status"] };
  leitura: {
    decodificacao: Tally & { pct: number | null; palavras: Tally; pseudo: Tally; mediaSegundos: number | null; finalLevel: Level; status: WorldProgress["status"] };
    fluencia: FluencyResult | null;
    compreensao: Tally & { pct: number | null; literal: Tally; inferencial: Tally; status: WorldProgress["status"] };
  };
  aritmetica: Tally & { pct: number | null; porOperacao: Partial<Record<ArithOp, Tally>>; finalLevel: Level; status: WorldProgress["status"] };
  sinais: string[];
  minutos: number;
}

/**
 * Nível demonstrado: o mais alto em que a criança somou ≥ 2 acertos; sem isso, 1.
 * Evita superestimar (a escada pode subir no último item) e é estável quando o
 * banco do nível 3 se esgota.
 */
export function finalLevelOf(progress: WorldProgress): Level {
  for (const lv of [3, 2] as Level[]) {
    if (progress.responses.filter((r) => r.level === lv && r.outcome === "correto").length >= 2) return lv;
  }
  return 1;
}

function tally(list: ItemResponse[]): Tally {
  return { corretos: list.filter((r) => r.outcome === "correto").length, total: list.length };
}

export function summarizeGame(state: GameState): GameSummary {
  const band = bandForAge(state.idade);
  const dit = state.worlds.ditado;
  const dec = state.worlds.decodificacao;
  const comp = state.worlds.compreensao;
  const ari = state.worlds.aritmetica;
  const ditTally = tally(dit.responses);
  const decTally = tally(dec.responses);
  const compTally = tally(comp.responses);
  const ariTally = tally(ari.responses);
  const porOperacao: Partial<Record<ArithOp, Tally>> = {};
  for (const r of ari.responses) {
    if (!r.op) continue;
    const t = porOperacao[r.op] ?? { corretos: 0, total: 0 };
    porOperacao[r.op] = { corretos: t.corretos + (r.outcome === "correto" ? 1 : 0), total: t.total + 1 };
  }
  const timed = dec.responses.filter((r) => r.outcome !== "nao_respondeu" && r.ms > 0);
  const summary: GameSummary = {
    band,
    ditado: {
      ...ditTally,
      pct: pct(ditTally),
      ortograficos: dit.responses.filter((r) => r.errorType === "ortografico").length,
      fonologicos: dit.responses.filter((r) => r.errorType === "fonologico").length,
      naoRespondidos: dit.responses.filter((r) => r.outcome === "nao_respondeu").length,
      pseudo: tally(dit.responses.filter((r) => r.kind === "pseudo")),
      finalLevel: finalLevelOf(dit),
      status: dit.status,
    },
    leitura: {
      decodificacao: {
        ...decTally,
        pct: pct(decTally),
        palavras: tally(dec.responses.filter((r) => r.kind !== "pseudo")),
        pseudo: tally(dec.responses.filter((r) => r.kind === "pseudo")),
        mediaSegundos: timed.length ? Math.round((timed.reduce((s, r) => s + r.ms, 0) / timed.length / 1000) * 10) / 10 : null,
        finalLevel: finalLevelOf(dec),
        status: dec.status,
      },
      fluencia: state.fluency,
      compreensao: {
        ...compTally,
        pct: pct(compTally),
        literal: tally(comp.responses.filter((r) => r.kind === "literal")),
        inferencial: tally(comp.responses.filter((r) => r.kind === "inferencial")),
        status: comp.status,
      },
    },
    aritmetica: { ...ariTally, pct: pct(ariTally), porOperacao, finalLevel: finalLevelOf(ari), status: ari.status },
    sinais: [],
    minutos: Math.round((state.activeMs / 60000) * 10) / 10,
  };
  const s = summary.sinais;
  if (dit.status === "concluido" && finalLevelOf(dit) === 1) s.push("Ditado: nível demonstrado 1 (abaixo do esperado para a faixa nesta aplicação).");
  if (summary.ditado.fonologicos >= 3) s.push(`${summary.ditado.fonologicos} erros fonológicos no ditado (troca, omissão ou acréscimo de sons).`);
  if (dec.status === "concluido" && finalLevelOf(dec) === 1) s.push("Leitura de palavras: nível demonstrado 1 (abaixo do esperado para a faixa nesta aplicação).");
  const ps = summary.leitura.decodificacao.pseudo;
  if (ps.total >= 2 && ps.corretos / ps.total < 0.5) s.push(`Pseudopalavras lidas: ${ps.corretos}/${ps.total} (decodificação fonológica merece investigação).`);
  if (comp.status === "concluido" && compTally.corretos <= 1) s.push(`Compreensão: ${compTally.corretos}/${compTally.total}.`);
  if (ari.status === "concluido" && finalLevelOf(ari) === 1) s.push("Aritmética: nível demonstrado 1 (abaixo do esperado para a faixa nesta aplicação).");
  if (state.endedReason === "tempo") s.push("Sessão encerrada pelo limite de 15 minutos; mundos não concluídos ficam como não aplicados.");
  return summary;
}

export const LEVEL_LABEL: Record<Level, string> = { 1: "nível demonstrado 1 · abaixo da faixa", 2: "nível demonstrado 2 · esperado para a faixa", 3: "nível demonstrado 3 · acima da faixa" };
