/**
 * Super NeuroPad Game — avaliação única de pré-consulta, uma faixa por ano (2 a 17 anos).
 *
 * Integra, em uma só sessão de até 20 minutos, os elementos das quatro abas
 * que continuam existindo: Sonda 10 (Avaliação Direta), Observa 10 (OBS-10,
 * Pré-Consulta por faixa etária), Teste de Reconhecimento Visual e Avaliação
 * Cognitiva Infantil (Testes Cognitivos por Faixa Etária). O banco integrado
 * (`bank.ts`) reutiliza os bancos de lá; cada item diz de onde veio.
 * Aplicado pela aplicadora junto com a criança, sem câmera e sem instrumento
 * externo: resposta direta da criança (toque/montagem na tela) ou registro
 * imediato da aplicadora (fala/ação) contra um critério explícito.
 *
 * Contrato clínico (não negociável):
 *   • triagem autoral de déficits GROSSEIROS por idade em anos (menores de 2 anos
 *     não fazem o jogo: vão para OBS-10 ou Sonda 10);
 *   • todo item tem certo e errado explícitos; "Não respondeu" e "Recusou" são
 *     registrados à parte de "Errou";
 *   • contagens e faixas operacionais são autorais: não são norma, percentil,
 *     idade equivalente, escore psicométrico nem diagnóstico;
 *   • a criança nunca vê certo/errado; a leitura final é do médico;
 *   • nada é persistido no navegador nem enviado por rede durante o jogo; o
 *     resultado sai em PDF gerado localmente e só vai ao prontuário pelo botão
 *     explícito "Salvar no prontuário".
 */

import { formatClinicalDate, formatClinicalDateTime } from "../../lib/clinicalDate";
import { EMOJI_NAMES, INTEGRATED_BANK, itemsPerPhase, MAX_AGE_YEARS, MIN_AGE_YEARS, PHASE_ORDER, YEARS, type PhaseId } from "./bank";
import {
  buildMatches,
  isJudged,
  itemExpected,
  KIND_LABELS,
  ORIGIN_LABELS,
  ORIGIN_ORDER,
  ORIGIN_ROUTES,
  type BuildItem,
  type DoItem,
  type Item,
  type JudgedItem,
  type Option,
  type OriginId,
  type ShapeId,
  type SpeakItem,
  type TouchItem,
} from "./items";

export { buildMatches, isJudged, itemExpected, KIND_LABELS, ORIGIN_LABELS, ORIGIN_ORDER, ORIGIN_ROUTES, MAX_AGE_YEARS, MIN_AGE_YEARS, PHASE_ORDER, YEARS, itemsPerPhase };
export type { BuildItem, DoItem, Item, JudgedItem, Option, OriginId, PhaseId, ShapeId, SpeakItem, TouchItem };

export const SUPER_NEUROPAD_VERSION = "2026-09-30.1";
export const SUPER_NEUROPAD_TITLE = "Super NeuroPad Game";
export const SUPER_NEUROPAD_ROUTE = "/super-neuropad-game";
export const SUPER_NEUROPAD_NATURE =
  "Avaliação lúdica autoral de pré-consulta para déficits grosseiros, aplicada pela aplicadora junto com a criança. Não é instrumento psicométrico, não gera escore normativo, percentil, idade equivalente nem diagnóstico. A leitura e a conclusão pertencem ao médico.";
export const SUPER_NEUROPAD_SOURCES = [
  "Sonda 10 · Avaliação Direta (interação, linguagem, atenção, memória operacional, inibição, flexibilidade e planejamento)",
  "Observa 10 (OBS-10) · Pré-Consulta por Faixa Etária (acolher, núcleo motor, mãos/desenho/escrita, linguagem, regra SOL/LUA e evocação)",
  "Teste de Reconhecimento Visual (reconhecer, parear e nomear figuras, cores e conceitos por idade)",
  "Avaliação Cognitiva Infantil · Testes Cognitivos por Faixa Etária (visual, fala/leitura, letras/escrita e números)",
] as const;
/** Marcos de desenvolvimento citados pelo roteiro OBS-10, usados como referência descritiva da calibração. */
export const SUPER_NEUROPAD_MILESTONE_SOURCES = [
  "CDC — Learn the Signs. Act Early (marcos de 2 a 5 anos)",
  "AAP — Bright Futures / vigilância do desenvolvimento",
] as const;

/** Teto da sessão inteira, em segundos (20 minutos). */
export const SESSION_LIMIT_SECONDS = 20 * 60;

// ─────────────────────────────── faixas etárias (um ano cada) ───────────────────────────────
export type BandId = string;

export interface AgeBand {
  id: BandId;
  label: string;
  min: number;
  max: number;
  icon: string;
  /** Desafios por mundo nesta faixa. */
  perPhase: number;
  /** O que o ambiente da sala precisa ter (nada é levado: tudo mais está no aplicativo). */
  ambient: string[];
}

function iconFor(years: number): string {
  if (years <= 3) return "🌱";
  if (years <= 5) return "🌿";
  if (years <= 7) return "🚀";
  if (years <= 9) return "🧭";
  if (years <= 12) return "🧠";
  return "✨";
}

function ambientFor(years: number): string[] {
  const base = ["Chão livre de uns 3 metros até uma porta ou parede", "Criança sentada ao lado da aplicadora, com o tablet na mesa"];
  if (years >= 4) base.push("Mesa para bater a mão (regra SOL/LUA)");
  if (years >= 8) base.push("Uma junta reta do piso para andar sobre a linha");
  return base;
}

export const AGE_BANDS: readonly AgeBand[] = YEARS.map((years) => ({
  id: String(years), label: `${years} anos`, min: years, max: years, icon: iconFor(years), perPhase: itemsPerPhase(years), ambient: ambientFor(years),
}));

export function bandForYears(years: number): AgeBand | undefined {
  if (!Number.isInteger(years)) return undefined;
  return AGE_BANDS.find((band) => years >= band.min && years <= band.max);
}

export const UNDER_TWO_MESSAGE =
  "Crianças com menos de 2 anos não fazem o Super NeuroPad Game. Use a Observa 10 (OBS-10, de 0 a 23 meses) ou a Sonda 10 (a partir de 12 meses), que têm roteiros próprios para bebês.";
export const OVER_MAX_MESSAGE = `O jogo vai até ${MAX_AGE_YEARS} anos. Acima disso, use as abas de origem com o roteiro de adolescentes e adultos jovens.`;

export type AgeGate = { ok: true; band: AgeBand } | { ok: false; reason: "menor_de_2" | "acima_do_teto" | "invalida"; message: string; routes: { label: string; href: string }[] };

/** Barreira de idade: menores de 2 anos não são testados, com mensagem clara e as abas certas. */
export function ageGate(years: number): AgeGate {
  if (!Number.isFinite(years)) return { ok: false, reason: "invalida", message: "Informe a idade da criança em anos completos.", routes: [] };
  if (years < MIN_AGE_YEARS) {
    return { ok: false, reason: "menor_de_2", message: UNDER_TWO_MESSAGE, routes: [{ label: "Observa 10 (OBS-10)", href: ORIGIN_ROUTES.obs10 }, { label: "Sonda 10", href: ORIGIN_ROUTES.sonda10 }] };
  }
  if (years > MAX_AGE_YEARS) return { ok: false, reason: "acima_do_teto", message: OVER_MAX_MESSAGE, routes: [] };
  const band = bandForYears(years);
  return band ? { ok: true, band } : { ok: false, reason: "invalida", message: "Informe a idade da criança em anos completos.", routes: [] };
}

// ─────────────────────────────── personagens (RPG) ───────────────────────────────
export interface Character {
  id: string;
  emoji: string;
  name: string;
  role: string;
  power: string;
}

export const CHARACTERS: readonly Character[] = [
  { id: "raposa", emoji: "🦊", name: "Raposa", role: "Ninja", power: "Olhos rápidos" },
  { id: "dragao", emoji: "🐉", name: "Dragão", role: "Mago", power: "Fogo das palavras" },
  { id: "unicornio", emoji: "🦄", name: "Unicórnio", role: "Cavaleiro", power: "Chifre dos números" },
  { id: "robo", emoji: "🤖", name: "Robô", role: "Guerreiro", power: "Memória de aço" },
  { id: "fada", emoji: "🧚", name: "Fada", role: "Arqueira", power: "Asas ligeiras" },
  { id: "panda", emoji: "🐼", name: "Panda", role: "Curandeiro", power: "Calma de mestre" },
] as const;

// ─────────────────────────────── mundos (domínios) ───────────────────────────────
export interface Phase {
  id: PhaseId;
  order: number;
  name: string;
  emoji: string;
  domain: string;
  tagline: string;
  badge: string;
  operator: string;
  source: string;
  /** Abas de origem cujos elementos entram neste mundo. */
  origins: readonly OriginId[];
  /** O que conferir na consulta quando o mundo fica fora do esperado (roteiro autoral, não diagnóstico). */
  consult: string;
  /** Abas de origem que aprofundam o mundo, com rota interna. */
  routes: readonly { label: string; href: string }[];
}

export const PHASES: readonly Phase[] = [
  {
    id: "vila", order: 1, name: "Vila da Conversa", emoji: "🏡", domain: "Interação e comunicação",
    tagline: "Conversar, brincar de faz de conta e entender o que os outros sentem.", badge: "Amigo da Vila",
    operator: "Comece por aqui: é o acolhimento. Converse com calma, na altura da criança. Pode repetir o comando uma vez; nas faixas de 2 e 3 anos vale responder apontando ou com gesto quando o item disser.",
    source: "Sonda 10 (entrada social, atenção conjunta, simbolismo, pragmática, cognição social) · OBS-10 (acolher e interagir)",
    origins: ["sonda10", "obs10"],
    consult: "Conferir interação espontânea com a família, resposta ao nome, atenção compartilhada, brincadeira simbólica, reciprocidade na conversa e compreensão de emoções; separar timidez com estranhos de dificuldade persistente.",
    routes: [{ label: "Sonda 10", href: ORIGIN_ROUTES.sonda10 }, { label: "OBS-10", href: ORIGIN_ROUTES.obs10 }],
  },
  {
    id: "olhos", order: 2, name: "Floresta dos Olhos", emoji: "🌳", domain: "Reconhecimento visual e raciocínio visual",
    tagline: "Encontre a figura certa entre as folhas.", badge: "Explorador da Floresta",
    operator: "Leia a pergunta em voz alta e deixe a criança tocar na tela. Se ela apontar sem tocar, toque na figura que ela apontou. Não dê pistas.",
    source: "Teste de Reconhecimento Visual (figuras, cores, conceitos) · Avaliação Cognitiva Infantil (visual)",
    origins: ["visual", "cognitivo"],
    consult: "Conferir visão (óculos, consulta oftalmológica recente), nomeação e pareamento de figuras com mais itens, atenção visual durante a tarefa e se a criança entendeu o formato de tocar na tela.",
    routes: [{ label: "Reconhecimento Visual", href: ORIGIN_ROUTES.visual }, { label: "Testes Cognitivos", href: ORIGIN_ROUTES.cognitivo }],
  },
  {
    id: "palavras", order: 3, name: "Ilha das Palavras", emoji: "🏝️", domain: "Linguagem, leitura e escrita",
    tagline: "Sons, nomes e frases escondidos na areia.", badge: "Navegante das Palavras",
    operator: "Fale devagar, uma vez; pode repetir uma única vez. Nas tarefas de fala, marque acerto só quando a resposta bater com o critério.",
    source: "Sonda 10 (linguagem) · OBS-10 (linguagem e raciocínio) · Avaliação Cognitiva Infantil (fala/leitura e letras/escrita)",
    origins: ["sonda10", "obs10", "cognitivo"],
    consult: "Conferir história de linguagem e audição, compreensão de ordens em conversa livre, vocabulário e, na idade escolar, leitura e escrita conforme a série; separar timidez de dificuldade real.",
    routes: [{ label: "Sonda 10", href: ORIGIN_ROUTES.sonda10 }, { label: "Testes Cognitivos", href: ORIGIN_ROUTES.cognitivo }],
  },
  {
    id: "numeros", order: 4, name: "Montanha dos Números", emoji: "⛰️", domain: "Quantidade e aritmética",
    tagline: "Cada conta é um degrau até o topo.", badge: "Alpinista dos Números",
    operator: "Leia a pergunta; a criança responde tocando. Sem contar junto, sem dica com os dedos.",
    source: "Avaliação Cognitiva Infantil (números) · Sonda 10 e OBS-10 (banco objetivo)",
    origins: ["cognitivo", "sonda10", "obs10"],
    consult: "Conferir contagem, comparação de quantidades e cálculo conforme a série, escolaridade e apoio pedagógico; checar se a dificuldade é só numérica ou acompanha leitura e atenção.",
    routes: [{ label: "Testes Cognitivos", href: ORIGIN_ROUTES.cognitivo }, { label: "Sonda 10", href: ORIGIN_ROUTES.sonda10 }],
  },
  {
    id: "memoria", order: 5, name: "Caverna da Memória", emoji: "🔦", domain: "Memória, atenção e funções executivas",
    tagline: "Guarde o que viu e ouviu para atravessar a caverna.", badge: "Guardião da Caverna",
    operator: "Diga a sequência uma vez, em ritmo de um item por segundo. Nas regras (SOL/LUA, DIA/NOITE), faça uma prática antes. Acerto só quando o critério for cumprido inteiro.",
    source: "Sonda 10 (memória operacional, inibição, flexibilidade, planejamento) · OBS-10 (repetição, regra SOL/LUA e evocação das 3 palavras)",
    origins: ["sonda10", "obs10"],
    consult: "Conferir atenção sustentada e memória operacional com mais itens, sono, rotina e distratibilidade na consulta; repetir a regra com demonstração para separar não entender de não sustentar.",
    routes: [{ label: "Sonda 10", href: ORIGIN_ROUTES.sonda10 }, { label: "OBS-10", href: ORIGIN_ROUTES.obs10 }],
  },
  {
    id: "corpo", order: 6, name: "Torre do Corpo", emoji: "🏰", domain: "Coordenação motora, desenho e escrita",
    tagline: "Equilíbrio, mãos e traços para subir a torre.", badge: "Mestre da Torre",
    operator: "Demonstre uma vez quando o comando disser. Fique ao lado nas tarefas de equilíbrio. Desenho e escrita são feitos com o dedo na tela. Marque acerto só quando o critério for cumprido inteiro.",
    source: "OBS-10 (núcleo motor; mãos, desenho e escrita) · Sonda 10 (imitação) · Avaliação Cognitiva Infantil (escrita)",
    origins: ["obs10", "sonda10", "cognitivo"],
    consult: "Exame motor dirigido na consulta: tônus, equilíbrio, marcha, coordenação fina, preensão, grafismo e lateralidade; conferir se havia espaço livre e se a demonstração foi feita.",
    routes: [{ label: "OBS-10", href: ORIGIN_ROUTES.obs10 }, { label: "Sonda 10", href: ORIGIN_ROUTES.sonda10 }],
  },
] as const;

export function phaseById(id: PhaseId): Phase {
  const phase = PHASES.find((entry) => entry.id === id);
  if (!phase) throw new Error(`Mundo desconhecido: ${id}`);
  return phase;
}

// ─────────────────────────────── banco ───────────────────────────────
export const ITEM_BANK: Record<BandId, Record<PhaseId, Item[]>> = Object.fromEntries(
  Object.entries(INTEGRATED_BANK).map(([years, phases]) => [String(years), phases]),
);

export function itemsFor(bandId: BandId, phaseId: PhaseId): Item[] {
  return ITEM_BANK[bandId]?.[phaseId] ?? [];
}

export function bandItemCount(bandId: BandId): number {
  return PHASE_ORDER.reduce((sum, phaseId) => sum + itemsFor(bandId, phaseId).length, 0);
}

// ─────────────────────────────── tempo estimado por faixa ───────────────────────────────
/** Segundos por tipo de item numa aplicação típica (ler/ouvir o comando, responder, registrar). */
export const KIND_SECONDS: Record<Item["kind"], number> = { toque: 12, fala: 20, fazer: 25, montar: 30 };
export const SETUP_SECONDS = 60;
export const INTRO_SECONDS = 15;
export const PREVIEW_SECONDS = 5;
export const REPEAT_ALLOWANCE = 0.1;

/** Crianças pequenas precisam de mais tempo por item (atenção curta, fala emergente, transições). */
export function youngFactor(years: number): number {
  if (years <= 3) return 1.5;
  if (years <= 5) return 1.25;
  return 1;
}

/** Pausa rápida planejada (lanche, água, banheiro) para as faixas de até 5 anos. */
export function plannedBreakSeconds(years: number): number {
  return years <= 5 ? 90 : 0;
}

/** Leitura: +1 s a cada 25 caracteres de enunciado/estímulo/opções nos itens de toque (máximo +25 s). */
export const READING_CHARS_PER_SECOND = 25;

export function itemSeconds(item: Item): number {
  const base = item.seconds ?? KIND_SECONDS[item.kind];
  if (item.kind !== "toque") return base;
  const chars = item.prompt.length + (item.stimulus?.length ?? 0) + (item.context?.length ?? 0) + item.options.reduce((sum, option) => sum + (option.vr ? 0 : option.label.length), 0);
  const reading = Math.min(25, Math.floor(chars / READING_CHARS_PER_SECOND));
  return base + reading + (item.preview ? PREVIEW_SECONDS : 0);
}

export interface BandEstimate {
  years: number;
  items: number;
  perPhase: number;
  itemSeconds: number;
  overheadSeconds: number;
  totalSeconds: number;
  minutes: number;
  byPhase: Record<PhaseId, number>;
}

/**
 * Tempo estimado da sessão inteira: preparação + apresentação de cada mundo +
 * itens (com fator para crianças pequenas) + folga de 10% para repetições +
 * pausa planejada até 5 anos. Travado em ≤ 20 minutos por teste unitário.
 */
export function estimateBandSeconds(years: number): BandEstimate {
  const bandId = String(years);
  const factor = youngFactor(years);
  const byPhase = {} as Record<PhaseId, number>;
  let itemTotal = 0;
  for (const phaseId of PHASE_ORDER) {
    const seconds = itemsFor(bandId, phaseId).reduce((sum, item) => sum + itemSeconds(item) * factor, 0);
    byPhase[phaseId] = Math.round(seconds);
    itemTotal += seconds;
  }
  const withRepeats = itemTotal * (1 + REPEAT_ALLOWANCE);
  const overhead = SETUP_SECONDS + INTRO_SECONDS * PHASE_ORDER.length + plannedBreakSeconds(years);
  const total = Math.round(withRepeats + overhead);
  return {
    years, items: bandItemCount(bandId), perPhase: itemsPerPhase(years), itemSeconds: Math.round(withRepeats), overheadSeconds: overhead,
    totalSeconds: total, minutes: Math.round((total / 60) * 10) / 10, byPhase,
  };
}

// ─────────────────────────────── glossário de figuras (PDF) ───────────────────────────────
// O construtor de PDF desenha em Latin-1 e descarta emoji. Para o registro
// não perder o estímulo ("O que vem depois? 🔴 🔵 …"), cada figura vira o seu
// nome textual entre colchetes.
const ART_EXTRA: Record<string, string> = {
  "🏃": "correr", "☀️": "SOL", "🌙": "LUA", "√": "raiz de", "·": "·",
};

function stripVariation(text: string): string {
  return text.replace(/\uFE0F/g, "");
}

function hasNonLatin(text: string): boolean {
  return /[^\t\n\r\x20-\x7E\xA0-\xFF–—‘’“”…≥≤→⇒←×]/u.test(text);
}

export const ART_GLOSSARY: ReadonlyArray<readonly [string, string]> = (() => {
  const map = new Map<string, string>();
  for (const band of Object.values(ITEM_BANK)) {
    for (const items of Object.values(band)) {
      for (const item of items) {
        if (item.kind !== "toque") continue;
        for (const option of item.options) {
          const art = stripVariation(option.art);
          if (art && hasNonLatin(art) && !map.has(art)) map.set(art, option.label.toLowerCase());
        }
      }
    }
  }
  for (const [art, label] of Object.entries(EMOJI_NAMES)) if (!map.has(stripVariation(art))) map.set(stripVariation(art), label);
  for (const [art, label] of Object.entries(ART_EXTRA)) map.set(stripVariation(art), label);
  map.delete("·");
  return [...map.entries()].sort((a, b) => b[0].length - a[0].length);
})();

/** Substitui figuras por nomes textuais entre colchetes, preservando o resto. */
export function describeArt(text: string): string {
  let out = stripVariation(text ?? "").replace(/−/g, "-");
  for (const [art, label] of ART_GLOSSARY) {
    if (out.includes(art)) out = out.split(art).join(`[${label}]`);
  }
  return out.replace(/\]\[/g, "] [");
}

/** Verdadeiro quando o texto sobrevive inteiro à normalização Latin-1 do PDF. */
export function pdfLossless(text: string): boolean {
  return !hasNonLatin(describeArt(text));
}

// ─────────────────────────────── embaralhamento determinístico ───────────────────────────────
export function shuffle<T>(values: readonly T[], seed: number): T[] {
  const out = [...values];
  let state = seed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─────────────────────────────── registro e resultado ───────────────────────────────
export type AnswerStatus = "acerto" | "erro" | "sem_resposta" | "recusa";

export const STATUS_LABELS: Record<AnswerStatus, string> = {
  acerto: "Acertou",
  erro: "Errou",
  sem_resposta: "Não respondeu",
  recusa: "Recusou",
};

/** Via de resposta aceita num acerto: padrão (fala/ação/toque) ou alternativa não verbal prevista no item. */
export type AnswerVia = "gesto";

export interface AnswerRecord {
  phaseId: PhaseId;
  itemId: string;
  kind: Item["kind"];
  origin: OriginId;
  ref: string;
  prompt: string;
  expected: string;
  given: string;
  status: AnswerStatus;
  seconds: number;
  /** A aplicadora precisou repetir o comando uma vez (permitido uma única repetição). */
  repeated?: boolean;
  /** Acerto pela alternativa não verbal prevista no item (apontar/gesto). */
  via?: AnswerVia;
}

export interface SkippedPhase {
  phaseId: PhaseId;
  reason: string;
}

export interface GameSession {
  version: string;
  ageYears: number;
  bandId: BandId;
  characterId: string;
  startedAt: string;
  finishedAt: string | null;
  answers: AnswerRecord[];
  /** Pausas feitas pela aplicadora durante a partida (proveniência do registro). */
  pauseCount?: number;
  /** Tempo total em pausa, em segundos. */
  pausedSeconds?: number;
  /** Registros desfeitos e refeitos durante a partida (proveniência do registro). */
  undoCount?: number;
  /** Mundos não aplicados de propósito, com o motivo informado pela aplicadora. */
  skipped?: SkippedPhase[];
  /** Observações livres da aplicadora (comportamento, contexto, intercorrências). */
  observations?: string;
}

export const OBSERVATIONS_MAX = 1200;
export const SKIP_REASONS = [
  "Criança cansada ou sem colaboração",
  "Recusou o mundo inteiro",
  "Sem espaço ou condição na sala",
  "Pedido da família",
  "Outro motivo",
] as const;
export const OBSERVATION_CHIPS = [
  "Colaborou bem", "Tímida no início, soltou depois", "Agitada, levantou várias vezes", "Cansou no fim",
  "Precisou de pausa", "Fala difícil de entender", "Respondeu mais com gestos", "Acompanhante ajudou a acalmar",
] as const;

export function cleanObservations(text: string): string {
  return (text ?? "").replace(/\s+/g, " ").trim().slice(0, OBSERVATIONS_MAX);
}

function sentence(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

function round1(value: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 10) / 10 : 0;
}

function base(item: Item, phaseId: PhaseId, seconds: number, repeated: boolean) {
  return { phaseId, itemId: item.id, kind: item.kind, origin: item.origin, ref: item.ref, seconds: round1(seconds), ...(repeated ? { repeated: true } : {}) };
}

/** Registro a partir de um toque da criança: o jogo confere sozinho. `refusal` marca recusa explícita. */
export function recordTouch(item: TouchItem, phaseId: PhaseId, chosen: Option | null, seconds: number, repeated = false, refusal = false): AnswerRecord {
  const status: AnswerStatus = chosen === null ? (refusal ? "recusa" : "sem_resposta") : chosen.label === item.answer ? "acerto" : "erro";
  const prompt = item.context && !item.prompt.includes(item.context) ? `${item.prompt} (contexto lido: ${item.context})` : item.prompt;
  return { ...base(item, phaseId, seconds, repeated), prompt, expected: item.answer, given: chosen ? chosen.label : "—", status };
}

/** Registro a partir da montagem da palavra: o jogo confere sozinho. */
export function recordBuild(item: BuildItem, phaseId: PhaseId, placed: readonly string[] | null, seconds: number, repeated = false, refusal = false): AnswerRecord {
  const status: AnswerStatus = placed === null ? (refusal ? "recusa" : "sem_resposta") : buildMatches(item, placed) ? "acerto" : "erro";
  const prompt = `${item.show ? "Cópia" : "Ditado"}: monte a palavra ${item.word}`;
  return { ...base(item, phaseId, seconds, repeated), prompt, expected: item.word, given: placed === null ? "—" : placed.join("") || "(nada montado)", status };
}

/** Registro a partir da conferência da aplicadora contra o critério explícito. */
export function recordJudged(item: JudgedItem, phaseId: PhaseId, status: AnswerStatus, seconds: number, repeated = false, via?: AnswerVia): AnswerRecord {
  const viaGesture = status === "acerto" && via === "gesto" && Boolean(item.gesture);
  const given = status === "acerto" ? (viaGesture ? "Cumpriu o critério por gesto/apontar" : "Cumpriu o critério") : status === "erro" ? "Não cumpriu o critério" : status === "recusa" ? "Recusou" : "—";
  // Estímulo textual (frase lida, sequência ditada) entra no registro; ícones ilustrativos não.
  const textual = item.stimulus && !/\p{Extended_Pictographic}/u.test(item.stimulus);
  const prompt = textual ? `${item.prompt} (estímulo: ${item.stimulus})` : item.prompt;
  const expected = item.gesture ? `${item.expected} · alternativa aceita: ${item.gesture}` : item.expected;
  return { ...base(item, phaseId, seconds, repeated), prompt, expected, given, status, ...(viaGesture ? { via: "gesto" as const } : {}) };
}

/**
 * Desfaz o último registro (toque errado da aplicadora, criança que mudou de
 * ideia antes do próximo item). Devolve a lista sem o último item e a posição
 * exata (mundo e índice) para o jogo reapresentar o mesmo desafio.
 */
export function undoLastAnswer(answers: readonly AnswerRecord[]): { answers: AnswerRecord[]; phaseId: PhaseId; itemIndex: number } | null {
  if (answers.length === 0) return null;
  const last = answers[answers.length - 1];
  const rest = answers.slice(0, -1);
  return { answers: rest, phaseId: last.phaseId, itemIndex: rest.filter((answer) => answer.phaseId === last.phaseId).length };
}

export type Level = "esperado" | "observar" | "alerta";

export const LEVEL_LABELS: Record<Level, string> = {
  esperado: "Dentro do esperado para a idade",
  observar: "Observar na consulta",
  alerta: "Sinal de alerta — priorizar na consulta",
};

/** Proporções AUTORAIS (não normativas) — as mesmas desde a primeira versão do jogo. */
export const PHASE_RATIOS = { esperado: 0.75, observar: 0.5 } as const;
export const OVERALL_RATIOS = { esperado: 0.8, observar: 0.6 } as const;

function cut(total: number, ratio: number): number {
  return Math.ceil(total * ratio - 1e-9);
}

/** Menor número de acertos para cada faixa, dado o número de itens. */
export function levelCuts(total: number, scope: "fase" | "total" = "fase"): { esperado: number; observar: number } {
  const ratios = scope === "fase" ? PHASE_RATIOS : OVERALL_RATIOS;
  return { esperado: cut(total, ratios.esperado), observar: cut(total, ratios.observar) };
}

/** Texto das faixas para o número de itens (ex.: "4–5 acertos = esperado; 3 = observar; 0–2 = alerta"). */
export function cutText(total: number, scope: "fase" | "total" = "fase"): string {
  const cuts = levelCuts(total, scope);
  const span = (from: number, to: number) => (from === to ? `${from}` : `${from}–${to}`);
  return `${span(cuts.esperado, total)} acertos = esperado; ${span(cuts.observar, cuts.esperado - 1)} = observar; ${span(0, cuts.observar - 1)} = alerta`;
}

export function phaseLevel(hits: number, total: number): Level {
  if (total <= 0) return "alerta";
  const ratio = hits / total;
  if (ratio >= PHASE_RATIOS.esperado) return "esperado";
  if (ratio >= PHASE_RATIOS.observar) return "observar";
  return "alerta";
}

export function overallLevel(hits: number, total: number): Level {
  if (total <= 0) return "alerta";
  const ratio = hits / total;
  if (ratio >= OVERALL_RATIOS.esperado) return "esperado";
  if (ratio >= OVERALL_RATIOS.observar) return "observar";
  return "alerta";
}

export interface PhaseSummary {
  phase: Phase;
  hits: number;
  errors: number;
  noResponse: number;
  refused: number;
  total: number;
  level: Level | null;
  /** Falso quando nenhum item do mundo foi registrado (partida interrompida ou mundo pulado). */
  applied: boolean;
  /** Motivo quando a aplicadora pulou o mundo de propósito ("não aplicado"). */
  skipReason: string | null;
  /** Tempo somado dos itens registrados no mundo, em segundos. */
  seconds: number;
  answers: AnswerRecord[];
  /** Referência descritiva: acertos mínimos para "dentro do esperado" neste mundo. */
  expectedMin: number;
}

export interface OriginSummary {
  origin: OriginId;
  label: string;
  route: string;
  planned: number;
  applied: number;
  hits: number;
  phases: PhaseId[];
  refs: string[];
}

export interface GameSummary {
  band: AgeBand;
  character: Character;
  phases: PhaseSummary[];
  origins: OriginSummary[];
  hits: number;
  total: number;
  level: Level | null;
  durationSeconds: number;
  complete: boolean;
  expectedMin: number;
}

export function summarize(session: GameSession): GameSummary {
  const band = bandForYears(session.ageYears) ?? AGE_BANDS[0];
  const character = CHARACTERS.find((entry) => entry.id === session.characterId) ?? CHARACTERS[0];
  const skipped = new Map((session.skipped ?? []).map((entry) => [entry.phaseId, entry.reason]));
  const expected = PHASE_ORDER.flatMap((phaseId) => itemsFor(band.id, phaseId).map((item) => ({ item, phaseId })));
  // Regra documentada (26/09): só a partida completa (todos os itens registrados uma única vez)
  // recebe classificação. Mundo pulado = partida incompleta, mas o mundo aparece como "não aplicado".
  const complete = bandForYears(session.ageYears)?.id === session.bandId
    && skipped.size === 0
    && session.answers.length === expected.length
    && expected.every(({ item, phaseId }) => session.answers.filter((answer) => answer.itemId === item.id && answer.phaseId === phaseId).length === 1);
  const phases: PhaseSummary[] = PHASE_ORDER.map((phaseId) => {
    const phase = phaseById(phaseId);
    const answers = session.answers.filter((answer) => answer.phaseId === phaseId);
    const total = itemsFor(band.id, phaseId).length;
    const count = (status: AnswerStatus) => answers.filter((answer) => answer.status === status).length;
    const seconds = Math.round(answers.reduce((sum, answer) => sum + answer.seconds, 0));
    const hits = count("acerto");
    return {
      phase, hits, errors: count("erro"), noResponse: count("sem_resposta"), refused: count("recusa"), total,
      level: complete ? phaseLevel(hits, total) : null, applied: answers.length > 0, skipReason: skipped.get(phaseId) ?? null, seconds, answers,
      expectedMin: levelCuts(total).esperado,
    };
  });
  const origins: OriginSummary[] = ORIGIN_ORDER.map((origin) => {
    const planned = expected.filter(({ item }) => item.origin === origin);
    const answered = session.answers.filter((answer) => answer.origin === origin);
    return {
      origin, label: ORIGIN_LABELS[origin], route: ORIGIN_ROUTES[origin], planned: planned.length, applied: answered.length,
      hits: answered.filter((answer) => answer.status === "acerto").length,
      phases: PHASE_ORDER.filter((phaseId) => planned.some((entry) => entry.phaseId === phaseId)),
      refs: [...new Set(planned.map(({ item }) => item.ref.split(" · ").slice(0, 3).join(" · ")))],
    };
  });
  const hits = phases.reduce((sum, phase) => sum + phase.hits, 0);
  const total = phases.reduce((sum, phase) => sum + phase.total, 0);
  const durationSeconds = session.answers.reduce((sum, answer) => sum + answer.seconds, 0);
  return {
    band, character, phases, origins, hits, total, level: complete ? overallLevel(hits, total) : null, durationSeconds: Math.round(durationSeconds), complete,
    expectedMin: levelCuts(total, "total").esperado,
  };
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return minutes > 0 ? `${minutes} min ${rest.toString().padStart(2, "0")} s` : `${rest} s`;
}

/** Texto de um mundo no resumo: acertos, "não aplicado — motivo" ou itens registrados. */
export function phaseStatusText(phase: PhaseSummary, complete: boolean): string {
  if (phase.skipReason) return `não aplicado — ${phase.skipReason}`;
  if (!phase.applied) return "não aplicado";
  if (!complete) return `${phase.answers.length} de ${phase.total} itens registrados, ${phase.hits} acertos`;
  return `${phase.hits}/${phase.total}`;
}

// ─────────────────────────────── leitura para a consulta ───────────────────────────────
/**
 * Leitura AUTORAL e descritiva do registro, pensada para o médico bater o
 * olho antes da consulta: o que priorizar, que padrão de resposta apareceu
 * (erro ativo × não resposta/recusa), lentidão relativa ao ritmo da própria
 * criança, dependência do julgamento da aplicadora e qual aba de origem
 * aprofunda cada mundo. Toda comparação é interna à partida. Nada aqui é
 * norma, percentil, idade equivalente ou diagnóstico.
 */
export type ResponsePattern = "nenhum" | "erro_ativo" | "nao_resposta" | "misto";

export const RESPONSE_PATTERN_LABELS: Record<ResponsePattern, string> = {
  nenhum: "Sem itens perdidos",
  erro_ativo: "Predomínio de erro ativo",
  nao_resposta: "Predomínio de não resposta ou recusa",
  misto: "Erros e não respostas em proporção parecida",
};

export interface KindProfile {
  hits: number;
  total: number;
}

export interface GameReading {
  headline: string;
  complete: boolean;
  /** Mundos aplicados fora do esperado, do mais crítico para o menos. */
  priorities: PhaseSummary[];
  /** Mundos sem nenhum item registrado. */
  notApplied: PhaseSummary[];
  /** Itens perdidos (erro, não resposta ou recusa), na ordem da partida. */
  missed: AnswerRecord[];
  errors: number;
  /** Não respostas + recusas (o padrão de resposta agrupa os dois). */
  noResponse: number;
  refused: number;
  pattern: ResponsePattern;
  medianSeconds: number;
  /** Itens com tempo >= 2x a mediana da própria partida (mínimo 12 s). */
  slow: AnswerRecord[];
  touch: KindProfile;
  judged: KindProfile;
  repeated: number;
  gestures: number;
  /** Toques em menos de 1 s que não acertaram: impulsividade ou toque acidental a considerar. */
  fastMisses: AnswerRecord[];
  /** Não respostas e recusas por tipo de tarefa. */
  noResponseByKind: Record<Item["kind"], number>;
  /** Acertos na primeira e na segunda metade da partida (ordem de aplicação). */
  halves: { first: KindProfile; second: KindProfile; drop: boolean };
  /** Mediana de tempo nos cinco primeiros e nos cinco últimos itens; slowdown quando o fim leva 2x mais. */
  pace: { start: number; end: number; slowdown: boolean };
  /** Roteiro autoral para a consulta, uma entrada por mundo priorizado. */
  plan: { phase: Phase; text: string }[];
  /** Abas de origem que aprofundam os mundos priorizados. */
  deepen: string[];
  /** Rotas internas das abas de origem dos mundos priorizados, sem repetição. */
  routes: { label: string; href: string }[];
  /** Frases descritivas prontas para leitura rápida. */
  notes: string[];
}

export const FAST_TAP_SECONDS = 1;
export const PACE_WINDOW = 5;

export const SLOW_MIN_SECONDS = 12;
export const SLOW_FACTOR = 2;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

const LEVEL_RANK: Record<Level, number> = { alerta: 0, observar: 1, esperado: 2 };

function shortPhase(phase: PhaseSummary): string {
  return `${phase.phase.name} ${phase.hits}/${phase.total}`;
}

export function interpret(session: GameSession): GameReading | null {
  const summary = summarize(session);
  // Uma partida parcial conserva os registros, mas nunca produz classificação ou interpretação.
  if (!summary.complete || summary.level === null) return null;
  const applied = summary.phases.filter((phase) => phase.applied);
  const notApplied = summary.phases.filter((phase) => !phase.applied);
  const priorities = applied
    .filter((phase): phase is PhaseSummary & { level: Level } => phase.level !== null && phase.level !== "esperado")
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || a.hits - b.hits || a.phase.order - b.phase.order);
  const missed = session.answers.filter((answer) => answer.status !== "acerto");
  const errors = missed.filter((answer) => answer.status === "erro").length;
  const refused = missed.filter((answer) => answer.status === "recusa").length;
  const noResponse = missed.filter((answer) => answer.status === "sem_resposta" || answer.status === "recusa").length;
  const pattern: ResponsePattern = missed.length === 0
    ? "nenhum"
    : errors >= noResponse * 2 ? "erro_ativo" : noResponse >= errors * 2 ? "nao_resposta" : "misto";
  const timed = session.answers.filter((answer) => answer.seconds > 0);
  const medianSeconds = Math.round(median(timed.map((answer) => answer.seconds)) * 10) / 10;
  const slowCut = Math.max(SLOW_MIN_SECONDS, medianSeconds * SLOW_FACTOR);
  const slow = medianSeconds > 0 ? timed.filter((answer) => answer.seconds >= slowCut) : [];
  const profile = (kinds: Item["kind"][]): KindProfile => {
    const subset = session.answers.filter((answer) => kinds.includes(answer.kind));
    return { hits: subset.filter((answer) => answer.status === "acerto").length, total: subset.length };
  };
  const touch = profile(["toque", "montar"]);
  const judged = profile(["fala", "fazer"]);
  const repeated = session.answers.filter((answer) => answer.repeated).length;
  const gestures = session.answers.filter((answer) => answer.via === "gesto").length;
  const deepen = [...new Set(priorities.map((phase) => phase.phase.source))];
  const routes: { label: string; href: string }[] = [];
  for (const phase of priorities) for (const route of phase.phase.routes) if (!routes.some((entry) => entry.href === route.href)) routes.push(route);
  const plan = priorities.map((phase) => ({ phase: phase.phase, text: phase.phase.consult }));
  const fastMisses = session.answers.filter((answer) => answer.kind === "toque" && answer.status === "erro" && answer.seconds > 0 && answer.seconds < FAST_TAP_SECONDS);
  const noResponseByKind: Record<Item["kind"], number> = { toque: 0, fala: 0, fazer: 0, montar: 0 };
  for (const answer of session.answers) if (answer.status === "sem_resposta" || answer.status === "recusa") noResponseByKind[answer.kind] += 1;
  const halfAt = Math.ceil(session.answers.length / 2);
  const halfProfile = (subset: AnswerRecord[]): KindProfile => ({ hits: subset.filter((answer) => answer.status === "acerto").length, total: subset.length });
  const first = halfProfile(session.answers.slice(0, halfAt));
  const second = halfProfile(session.answers.slice(halfAt));
  const drop = first.total > 0 && second.total > 0 && first.hits / first.total >= 0.75 && second.hits / second.total <= 0.5;
  const paceStart = timed.length >= PACE_WINDOW * 2 ? Math.round(median(timed.slice(0, PACE_WINDOW).map((answer) => answer.seconds)) * 10) / 10 : 0;
  const paceEnd = timed.length >= PACE_WINDOW * 2 ? Math.round(median(timed.slice(-PACE_WINDOW).map((answer) => answer.seconds)) * 10) / 10 : 0;
  const slowdown = paceStart > 0 && paceEnd >= 4 && paceEnd >= paceStart * 2;

  const notes: string[] = [];
  if (applied.length > 0 && priorities.length === 0) {
    notes.push("Todos os mundos ficaram dentro do esperado para a idade nesta triagem de déficits grosseiros. Isso não exclui dificuldades sutis; a consulta segue o roteiro habitual.");
  }
  if (priorities.length > 0) {
    notes.push(`Prioridade para a consulta: ${priorities.map((phase) => `${shortPhase(phase)} (${phase.level})`).join("; ")}.`);
  }
  if (pattern === "nao_resposta") {
    notes.push(`Predomínio de não resposta ou recusa (${noResponse} de ${missed.length} itens perdidos${refused > 0 ? `, ${refused} recusa(s)` : ""}). Antes de ler como déficit, considerar recusa, timidez, cansaço ou não compreensão do comando; vale reapresentar esses itens na consulta.`);
  } else if (pattern === "erro_ativo") {
    notes.push(`Predomínio de erro ativo (${errors} de ${missed.length} itens perdidos): a criança respondeu, mas fora do critério. Aponta mais para lacuna no domínio do que para recusa.`);
  } else if (pattern === "misto") {
    notes.push(`Erros (${errors}) e não respostas/recusas (${noResponse}) em proporção parecida: separar na consulta o que foi lacuna do que foi recusa ou desatenção.`);
  }
  if (refused > 0 && pattern !== "nao_resposta") {
    notes.push(`${refused} item(ns) recusado(s): registrados à parte do erro; contam como não acertados na contagem.`);
  }
  if (gestures > 0) {
    notes.push(`${gestures} acerto(s) por gesto/apontar (alternativa não verbal prevista no item): compreensão presente; conferir linguagem expressiva na consulta.`);
  }
  if (touch.total > 0 && judged.total > 0) {
    const touchRatio = touch.hits / touch.total;
    const judgedRatio = judged.hits / judged.total;
    if (touchRatio - judgedRatio >= 0.4) {
      notes.push(`Melhor nos itens conferidos pelo jogo (toque/montagem ${touch.hits}/${touch.total}) do que nos conferidos pela aplicadora (fala e ação ${judged.hits}/${judged.total}). Conferir na consulta os itens de fala e de ação e o rigor do critério aplicado.`);
    } else if (judgedRatio - touchRatio >= 0.4) {
      notes.push(`Melhor nos itens de fala e ação (${judged.hits}/${judged.total}) do que nos de toque na tela (${touch.hits}/${touch.total}). Observar atenção visual, impulsividade no toque e compreensão da pergunta lida.`);
    }
  }
  if (slow.length > 0) {
    notes.push(`Ritmo: mediana de ${medianSeconds} s por item; ${slow.length} item(ns) bem acima do ritmo da própria criança (${slow.map((answer) => `${answer.seconds} s`).join(", ")}). Comparação interna à partida, não normativa.`);
  } else if (medianSeconds > 0) {
    notes.push(`Ritmo regular: mediana de ${medianSeconds} s por item, sem item muito acima do ritmo da própria criança.`);
  }
  if (repeated > 0) {
    notes.push(`Comando repetido em ${repeated} item(ns): considerar atenção auditiva e compreensão de instrução.`);
  }
  if (fastMisses.length >= 2) {
    notes.push(`${fastMisses.length} toques errados em menos de 1 s: considerar impulsividade ou toque acidental; reapresentar esses itens antes de ler como lacuna.`);
  }
  if (noResponse >= 2) {
    const dominant = (Object.keys(noResponseByKind) as Item["kind"][]).find((kind) => noResponseByKind[kind] === noResponse);
    if (dominant === "fala") notes.push("Não resposta concentrada nas tarefas de fala: considerar timidez, ansiedade com estranhos ou linguagem expressiva; checar em conversa livre com a família presente.");
    else if (dominant === "fazer") notes.push("Não resposta concentrada nas tarefas de ação: considerar recusa a comandos motores, timidez corporal ou falta de espaço; refazer com demonstração.");
    else if (dominant === "toque" || dominant === "montar") notes.push("Não resposta concentrada nas tarefas de tela: considerar desinteresse pela tela ou não compreensão do formato; testar com objetos concretos na consulta.");
  }
  if (drop) {
    notes.push(`Queda na segunda metade da partida (${first.hits}/${first.total} acertos no início, ${second.hits}/${second.total} no fim): considerar fadiga ou desatenção crescente; a ordem dos mundos é fixa, então os últimos mundos podem estar subestimados.`);
  }
  if (slowdown) {
    notes.push(`Ritmo desacelerou ao longo da partida (mediana ${paceStart} s nos primeiros itens, ${paceEnd} s nos últimos): sinal de cansaço ou de dificuldade crescente nos mundos finais.`);
  }
  const events = [session.pauseCount ? `${session.pauseCount} pausa(s)` : "", session.undoCount ? `${session.undoCount} registro(s) desfeito(s) e refeito(s)` : ""].filter(Boolean);
  if (events.length > 0) notes.push(`Proveniência do registro: ${events.join(", ")} durante a partida.`);
  if (plan.length > 0) {
    for (const entry of plan) notes.push(`Roteiro para ${entry.phase.name}: ${entry.text}`);
  }
  if (deepen.length > 0) {
    notes.push(`Aprofundar com as abas de origem: ${deepen.join(" · ")}.`);
  }

  const headline = `${LEVEL_LABELS[summary.level]} · ${summary.hits} de ${summary.total} acertos`;

  return {
    headline, complete: summary.complete, priorities, notApplied, missed, errors, noResponse, refused, pattern, medianSeconds, slow, touch, judged, repeated, gestures,
    fastMisses, noResponseByKind, halves: { first, second, drop }, pace: { start: paceStart, end: paceEnd, slowdown }, plan, deepen, routes, notes,
  };
}

/**
 * Data da própria partida (fim, ou início se incompleta), não o relógio do
 * momento em que o texto é copiado. Sem instante válido, usa agora.
 */
function sessionDate(session: GameSession): Date {
  const stamp = new Date(session.finishedAt ?? session.startedAt);
  return Number.isNaN(stamp.getTime()) ? new Date() : stamp;
}

function skippedText(summary: GameSummary): string {
  const skipped = summary.phases.filter((phase) => phase.skipReason);
  return skipped.length ? ` Não aplicado: ${skipped.map((phase) => `${phase.phase.name} (${phase.skipReason})`).join("; ")}.` : "";
}

/** Resumo curto, em prosa, para colar na evolução ou no prontuário. */
export function buildGameBrief(session: GameSession, date = sessionDate(session)): string {
  const summary = summarize(session);
  const reading = interpret(session);
  // Dia no fuso clínico. `toISOString()` é UTC: no Brasil, a partir das 21h,
  // o registro de pré-consulta saía datado do dia seguinte.
  const day = formatClinicalDate(date);
  const observations = cleanObservations(session.observations ?? "");
  const obsText = observations ? ` Observações da aplicadora: ${sentence(observations)}` : "";
  if (!reading || summary.level === null) {
    return `Registro lúdico de pré-consulta (${SUPER_NEUROPAD_TITLE}, ${summary.band.label}) em ${day}: partida incompleta, ${session.answers.length} de ${summary.total} itens registrados. Sem classificação ou interpretação.`
      + ` Por mundo: ${summary.phases.map((phase) => `${phase.phase.name} ${phaseStatusText(phase, false)}`).join(", ")}.${skippedText(summary)} `
      + session.answers.map((answer) => `${answer.prompt}: ${answer.given} (${STATUS_LABELS[answer.status].toLowerCase()}; ${answer.seconds} s).`).join(" ")
      + obsText;
  }
  const parts: string[] = [
    `Avaliação lúdica de pré-consulta (${SUPER_NEUROPAD_TITLE}, ${summary.band.label}) aplicada em ${day}: ${summary.hits} de ${summary.total} acertos, ${LEVEL_LABELS[summary.level].toLowerCase()}.`,
    `Por mundo: ${summary.phases.map((phase) => `${phase.phase.name} ${phase.hits}/${phase.total}`).join(", ")}.`,
  ];
  if (reading.missed.length > 0) {
    parts.push(`Itens perdidos: ${reading.missed.map((answer) => `${answer.prompt} (${STATUS_LABELS[answer.status].toLowerCase()})`).join("; ")}.`);
  }
  parts.push(...reading.notes.filter((note) => !note.startsWith("Aprofundar") && !note.startsWith("Roteiro para") && !note.startsWith("Proveniência")));
  if (observations) parts.push(`Observações da aplicadora: ${sentence(observations)}`);
  parts.push("Contagem autoral, não normativa; a leitura e a conclusão são do médico.");
  return parts.join(" ");
}

// ─────────────────────────────── bloco estruturado (leitura por IA) ───────────────────────────────
export const STRUCTURED_HEADER = "DADOS ESTRUTURADOS (formato estável: uma linha por registro, JSON após o rótulo)";

/**
 * Bloco legível por máquina, com rótulos fixos: `SESSAO`, `DOMINIO`, `ORIGEM`, `ITEM`
 * e `OBSERVACOES`. Os valores são JSON de uma linha; figuras viram nomes entre colchetes.
 * Campos de nível ficam `null` quando a partida está incompleta (sem classificação).
 */
export function buildStructuredLines(session: GameSession, date = sessionDate(session)): string[] {
  const summary = summarize(session);
  const wall = sessionWallSeconds(session);
  const json = (value: unknown) => describeArt(JSON.stringify(value));
  const lines: string[] = [];
  lines.push(`SESSAO ${json({
    instrumento: SUPER_NEUROPAD_TITLE, versao: SUPER_NEUROPAD_VERSION, idade_anos: session.ageYears, faixa: summary.band.label,
    data_hora_local: formatClinicalDateTime(date), fuso: "America/Sao_Paulo (UTC-3)", completa: summary.complete,
    itens_previstos: summary.total, itens_registrados: session.answers.length, acertos: summary.hits,
    esperado_minimo_total: summary.expectedMin, nivel_total: summary.level, duracao_tarefas_s: summary.durationSeconds,
    duracao_sessao_s: wall, tempo_estimado_s: estimateBandSeconds(summary.band.min).totalSeconds,
    pausas: session.pauseCount ?? 0, tempo_em_pausa_s: Math.round(session.pausedSeconds ?? 0), desfeitos: session.undoCount ?? 0,
    mundos_nao_aplicados: (session.skipped ?? []).map((entry) => ({ mundo: phaseById(entry.phaseId).name, motivo: entry.reason })),
  })}`);
  for (const phase of summary.phases) {
    lines.push(`DOMINIO ${json({
      mundo: phase.phase.name, dominio: phase.phase.domain, ordem: phase.phase.order, itens: phase.total, registrados: phase.answers.length,
      acertos: phase.hits, erros: phase.errors, sem_resposta: phase.noResponse, recusas: phase.refused,
      esperado_minimo: phase.expectedMin, nivel: phase.level, aplicado: phase.applied, nao_aplicado_motivo: phase.skipReason, tempo_s: phase.seconds,
    })}`);
  }
  for (const origin of summary.origins) {
    lines.push(`ORIGEM ${json({ instrumento: origin.label, itens_previstos: origin.planned, registrados: origin.applied, acertos: origin.hits, mundos: origin.phases.map((id) => phaseById(id).name) })}`);
  }
  for (const answer of session.answers) {
    lines.push(`ITEM ${json({
      id: answer.itemId, mundo: phaseById(answer.phaseId).name, origem: ORIGIN_LABELS[answer.origin], referencia: answer.ref, tipo: answer.kind,
      pergunta: answer.prompt, esperado: answer.expected, resposta: answer.given, resultado: answer.status, tempo_s: answer.seconds,
      repeticoes: answer.repeated ? 1 : 0, via: answer.via ?? "padrao",
    })}`);
  }
  lines.push(`OBSERVACOES ${json({ texto: cleanObservations(session.observations ?? "") || null })}`);
  return lines;
}

// ─────────────────────────────── relatório em texto ───────────────────────────────
export function buildGameReport(session: GameSession, date = sessionDate(session)): string {
  const summary = summarize(session);
  const reading = interpret(session);
  const wall = sessionWallSeconds(session);
  const observations = cleanObservations(session.observations ?? "");
  const lines: string[] = [
    `${SUPER_NEUROPAD_TITLE} · versão ${SUPER_NEUROPAD_VERSION}`,
    `Idade informada: ${session.ageYears} anos · Faixa: ${summary.band.label} · Personagem: ${summary.character.emoji} ${summary.character.name} ${summary.character.role}`,
    `Data e hora (local): ${formatClinicalDateTime(date)} · Tempo somado nas tarefas: ${formatDuration(summary.durationSeconds)}${wall !== null ? ` · Duração da sessão: ${formatDuration(wall)}` : ""} · ${session.pauseCount ?? 0} pausa(s) · ${summary.complete ? "Jogo completo" : "Jogo incompleto"}`,
    "",
    "O QUE FOI TESTADO POR INSTRUMENTO DE ORIGEM",
    ...summary.origins.map((origin) => `- ${origin.label}: ${origin.planned} item(ns) nos mundos ${origin.phases.map((id) => phaseById(id).name).join(", ")} · registrados ${origin.applied}, acertos ${origin.hits}`),
    "",
    "RESULTADO OBJETIVO — CONTAGEM DE ACERTOS (NÃO É ESCORE NORMATIVO, PERCENTIL NEM DIAGNÓSTICO)",
    summary.level === null ? `Partida incompleta: ${session.answers.length} de ${summary.total} itens registrados. Sem classificação ou interpretação.` : `Total: ${summary.hits} de ${summary.total} acertos (esperado para a idade: ${summary.expectedMin} ou mais) · ${LEVEL_LABELS[summary.level]}`,
    ...summary.phases.map((phase) => `Mundo ${phase.phase.order} · ${phase.phase.name} (${phase.phase.domain}): ${phase.level === null ? phaseStatusText(phase, false) : `${phase.hits}/${phase.total} acertos (esperado: ${phase.expectedMin} ou mais), ${phase.errors} erros, ${phase.noResponse} sem resposta, ${phase.refused} recusa(s) · ${LEVEL_LABELS[phase.level]} · ${formatDuration(phase.seconds)}`}`),
    "",
    ...(reading ? ["LEITURA PARA A CONSULTA (DESCRITIVA, AUTORAL, NÃO NORMATIVA)", ...reading.notes.map((note) => `- ${note}`), ""] : []),
    "OBSERVAÇÕES DA APLICADORA",
    observations || "Sem observações registradas.",
    "",
    "DETALHAMENTO ITEM A ITEM",
  ];
  for (const phase of summary.phases) {
    lines.push(`Mundo ${phase.phase.order} · ${phase.phase.name}`);
    if (phase.answers.length === 0) lines.push(`  (${phase.skipReason ? `não aplicado — ${phase.skipReason}` : "mundo não aplicado"})`);
    phase.answers.forEach((answer, index) => {
      lines.push(`  ${index + 1}. [${ORIGIN_LABELS[answer.origin]} · ${KIND_LABELS[answer.kind]}] ${answer.prompt}`);
      lines.push(`     Esperado: ${answer.expected} · Registrado: ${answer.given} · ${STATUS_LABELS[answer.status]} · ${answer.seconds}s${answer.repeated ? " · comando repetido 1x" : ""}${answer.via === "gesto" ? " · por gesto/apontar" : ""}`);
    });
  }
  lines.push("", STRUCTURED_HEADER, ...buildStructuredLines(session, date));
  lines.push("", SUPER_NEUROPAD_NATURE);
  return lines.join("\n");
}

// ─────────────────────────────── uso prático na consulta ───────────────────────────────
/**
 * Duração de relógio da partida (início → fim), em segundos inteiros. Difere do
 * "tempo somado nas tarefas", que exclui pausas, introduções e telas de mundo.
 * Sem instantes válidos ou com fim antes do início, devolve null.
 */
export function sessionWallSeconds(session: GameSession): number | null {
  if (!session.finishedAt) return null;
  const start = Date.parse(session.startedAt);
  const end = Date.parse(session.finishedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return Math.round((end - start) / 1000);
}

/**
 * Linhas pergunta/resposta para "Salvar no prontuário" (mesmo formato das demais
 * escalas). A primeira linha é o resumo em prosa de `buildGameBrief`, que já
 * respeita a regra de partida incompleta (sem classificação); depois vem cada
 * item registrado, na ordem da partida, com origem, esperado, registrado,
 * tempo e repetição. Nenhum escore novo é criado aqui.
 */
export function buildPatientRecordItems(session: GameSession): Array<{ question: string; answer: string }> {
  const summary = summarize(session);
  const wall = sessionWallSeconds(session);
  const observations = cleanObservations(session.observations ?? "");
  const rows = [
    { question: "Resumo para o prontuário", answer: buildGameBrief(session) },
    {
      question: "Partida",
      answer: [
        `Idade informada: ${session.ageYears} anos (faixa anual)`,
        `${session.answers.length} de ${summary.total} itens registrados (${summary.complete ? "completa" : "incompleta"})`,
        `tempo somado nas tarefas ${formatDuration(summary.durationSeconds)}`,
        ...(wall !== null ? [`duração da sessão ${formatDuration(wall)}`] : []),
        `${session.pauseCount ?? 0} pausa(s) · ${session.undoCount ?? 0} desfeito(s)`,
      ].join(" · "),
    },
    { question: "O que foi testado por instrumento", answer: summary.origins.map((origin) => `${origin.label}: ${origin.applied}/${origin.planned} itens registrados, ${origin.hits} acertos`).join(" · ") },
    ...summary.phases.filter((phase) => phase.skipReason).map((phase) => ({ question: `Mundo ${phase.phase.order} · ${phase.phase.name}`, answer: `Não aplicado — ${phase.skipReason}` })),
    ...(observations ? [{ question: "Observações da aplicadora", answer: observations }] : []),
  ];
  for (const answer of session.answers) {
    const phase = phaseById(answer.phaseId);
    rows.push({
      question: `Mundo ${phase.order} · ${phase.name} · ${ORIGIN_LABELS[answer.origin]} · ${answer.prompt}`,
      answer: `${STATUS_LABELS[answer.status]} · registrado: ${answer.given} · esperado: ${answer.expected} · ${answer.seconds} s${answer.repeated ? " · comando repetido 1x" : ""}${answer.via === "gesto" ? " · por gesto/apontar" : ""}`,
    });
  }
  return rows;
}

/**
 * Atalhos de teclado da aplicadora nos itens julgados (fala e ação). Itens de
 * toque continuam exclusivos da criança na tela: o teclado não responde por ela.
 * 5 = acertou por gesto/apontar (só nos itens que preveem essa alternativa).
 */
export const JUDGE_SHORTCUTS: Readonly<Record<string, AnswerStatus>> = Object.freeze({ "1": "acerto", "2": "erro", "3": "sem_resposta", "4": "recusa" });
export const GESTURE_SHORTCUT = "5";
export function judgeShortcut(key: string): AnswerStatus | null {
  return JUDGE_SHORTCUTS[key] ?? null;
}
