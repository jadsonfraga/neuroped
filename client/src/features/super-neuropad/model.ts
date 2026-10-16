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
 *   • registro descritivo por idade em anos (menores de 2 anos não fazem o jogo:
 *     vão para OBS-10 ou Sonda 10);
 *   • todo item tem critério de acerto explícito; "Não respondeu" e "Recusou" são
 *     registrados à parte de "Errou";
 *   • o app NÃO classifica nem compara com referência. Só relata como a avaliação foi feita e como a
 *     criança respondeu (contagens brutas, tempos, observações);
 *   • a criança nunca vê certo/errado; a interpretação é do profissional;
 *   • nada é persistido no navegador nem enviado por rede durante o jogo; o
 *     resultado sai em PDF gerado localmente e só vai ao prontuário pelo botão
 *     explícito "Salvar no prontuário".
 */

import { DESCRIPTIVE_NOTICE } from "../../lib/descriptiveNotice";
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
  TODDLER_DOMAIN_LABELS,
  TODDLER_DOMAIN_ORDER,
  type ToddlerDomain,
} from "./items";

export { TODDLER_DOMAIN_LABELS, TODDLER_DOMAIN_ORDER };
export type { ToddlerDomain };
export { buildMatches, isJudged, itemExpected, KIND_LABELS, ORIGIN_LABELS, ORIGIN_ORDER, ORIGIN_ROUTES, MAX_AGE_YEARS, MIN_AGE_YEARS, PHASE_ORDER, YEARS, itemsPerPhase };
export type { BuildItem, DoItem, Item, JudgedItem, Option, OriginId, PhaseId, ShapeId, SpeakItem, TouchItem };

export const SUPER_NEUROPAD_VERSION = "2026-10-15.1";
export const SUPER_NEUROPAD_TITLE = "Super NeuroPad Game";
export const SUPER_NEUROPAD_ROUTE = "/super-neuropad-game";
export const SUPER_NEUROPAD_NATURE =
  `Registro descritivo da aplicação lúdica de pré-consulta e das respostas da criança. ${DESCRIPTIVE_NOTICE}`;
export const SUPER_NEUROPAD_SOURCES = [
  "Sonda 10 · Avaliação Direta (interação, linguagem, atenção, memória operacional, inibição, flexibilidade e planejamento)",
  "Observa 10 (OBS-10) · Pré-Consulta por Faixa Etária (acolher, núcleo motor, mãos/desenho/escrita, linguagem, regra SOL/LUA e evocação)",
  "Teste de Reconhecimento Visual (reconhecer, parear e nomear figuras, cores e conceitos por idade)",
  "Avaliação Cognitiva Infantil · Testes Cognitivos por Faixa Etária (visual, fala/leitura, letras/escrita e números)",
] as const;
/** Teto da sessão inteira, em segundos (20 minutos). */
export const SESSION_LIMIT_SECONDS = 20 * 60;
/** Faixas com bateria dedicada (2 e 3 anos): mundos por domínio, tetos menores. */
export function isToddlerYears(years: number): boolean {
  return years === 2 || years === 3;
}
/** Teto por idade: 12 min aos 2 anos, 15 min aos 3 anos, 20 min nas demais. */
export function sessionLimitSeconds(years: number): number {
  if (years === 2) return 12 * 60;
  if (years === 3) return 15 * 60;
  return SESSION_LIMIT_SECONDS;
}

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
}

export const PHASES: readonly Phase[] = [
  {
    id: "vila", order: 1, name: "Vila da Conversa", emoji: "🏡", domain: "Interação e comunicação",
    tagline: "Conversar, brincar de faz de conta e entender o que os outros sentem.", badge: "Amigo da Vila",
    operator: "Comece por aqui: é o acolhimento. Converse com calma, na altura da criança. Pode repetir o comando uma vez; nas faixas de 2 e 3 anos vale responder apontando ou com gesto quando o item disser.",
    source: "Sonda 10 (entrada social, atenção conjunta, simbolismo, pragmática, cognição social) · OBS-10 (acolher e interagir)",
    origins: ["sonda10", "obs10"],
  },
  {
    id: "olhos", order: 2, name: "Floresta dos Olhos", emoji: "🌳", domain: "Reconhecimento visual e raciocínio visual",
    tagline: "Encontre a figura certa entre as folhas.", badge: "Explorador da Floresta",
    operator: "Leia a pergunta em voz alta e deixe a criança tocar na tela. Se ela apontar sem tocar, toque na figura que ela apontou. Não dê pistas.",
    source: "Teste de Reconhecimento Visual (figuras, cores, conceitos) · Avaliação Cognitiva Infantil (visual)",
    origins: ["visual", "cognitivo"],
  },
  {
    id: "palavras", order: 3, name: "Ilha das Palavras", emoji: "🏝️", domain: "Linguagem, leitura e escrita",
    tagline: "Sons, nomes e frases escondidos na areia.", badge: "Navegante das Palavras",
    operator: "Fale devagar, uma vez; pode repetir uma única vez. Nas tarefas de fala, marque acerto só quando a resposta bater com o critério.",
    source: "Sonda 10 (linguagem) · OBS-10 (linguagem e raciocínio) · Avaliação Cognitiva Infantil (fala/leitura e letras/escrita)",
    origins: ["sonda10", "obs10", "cognitivo"],
  },
  {
    id: "numeros", order: 4, name: "Montanha dos Números", emoji: "⛰️", domain: "Quantidade e aritmética",
    tagline: "Cada conta é um degrau até o topo.", badge: "Alpinista dos Números",
    operator: "Leia a pergunta; a criança responde tocando. Sem contar junto, sem dica com os dedos.",
    source: "Avaliação Cognitiva Infantil (números) · Sonda 10 e OBS-10 (banco objetivo)",
    origins: ["cognitivo", "sonda10", "obs10"],
  },
  {
    id: "memoria", order: 5, name: "Caverna da Memória", emoji: "🔦", domain: "Memória, atenção e funções executivas",
    tagline: "Guarde o que viu e ouviu para atravessar a caverna.", badge: "Guardião da Caverna",
    operator: "Diga a sequência uma vez, em ritmo de um item por segundo. Nas regras (SOL/LUA, DIA/NOITE), faça uma prática antes. Acerto só quando o critério for cumprido inteiro.",
    source: "Sonda 10 (memória operacional, inibição, flexibilidade, planejamento) · OBS-10 (repetição, regra SOL/LUA e evocação das 3 palavras)",
    origins: ["sonda10", "obs10"],
  },
  {
    id: "corpo", order: 6, name: "Torre do Corpo", emoji: "🏰", domain: "Coordenação motora, desenho e escrita",
    tagline: "Equilíbrio, mãos e traços para subir a torre.", badge: "Mestre da Torre",
    operator: "Demonstre uma vez quando o comando disser. Fique ao lado nas tarefas de equilíbrio. Desenho e escrita são feitos com o dedo na tela. Marque acerto só quando o critério for cumprido inteiro.",
    source: "OBS-10 (núcleo motor; mãos, desenho e escrita) · Sonda 10 (imitação) · Avaliação Cognitiva Infantil (escrita)",
    origins: ["obs10", "sonda10", "cognitivo"],
  },
] as const;

/**
 * Baterias dedicadas de 2 e 3 anos: os mesmos seis mundos do jogo, cada um com UM domínio do
 * neurodesenvolvimento (formato inspirado em avaliação gamificada; conteúdo autoral).
 */
type ToddlerPhaseText = Pick<Phase, "name" | "emoji" | "domain" | "tagline" | "badge" | "operator"> & { toddlerDomain: ToddlerDomain };
const TODDLER_SOURCE = "Bateria autoral 2–3 anos (base descritiva: marcos CDC 2022, Denver II, conceitos M-CHAT-R/F) · Sonda 10 · OBS-10";
const TODDLER_PHASE_TEXT: Record<PhaseId, ToddlerPhaseText> = {
  vila: { name: "Vila dos Amigos", emoji: "🏡", toddlerDomain: "interacao_social", domain: TODDLER_DOMAIN_LABELS.interacao_social, tagline: "Sorrir, imitar e brincar junto.", badge: "Amigo da Vila",
    operator: "Comece pelo acolhimento, com o cuidador por perto (a criança pode ficar no colo). Itens “Relato do cuidador” são perguntados a ele e marcados como Cumpre / Não cumpre conforme a resposta." },
  olhos: { name: "Floresta do Olhar", emoji: "🌳", toddlerDomain: "atencao_conjunta", domain: TODDLER_DOMAIN_LABELS.atencao_conjunta, tagline: "Olhar junto para a mesma coisa.", badge: "Explorador do Olhar",
    operator: "Chame o nome sem tocar; aponte para a figura grande da tela. Não insista mais de 2 vezes." },
  palavras: { name: "Ilha do Escutar", emoji: "🏝️", toddlerDomain: "linguagem_receptiva", domain: TODDLER_DOMAIN_LABELS.linguagem_receptiva, tagline: "Entender o que a gente fala.", badge: "Ouvido de Ouro",
    operator: "Fale uma vez, sem apontar nem fazer o gesto; pode repetir uma única vez." },
  numeros: { name: "Montanha das Palavrinhas", emoji: "⛰️", toddlerDomain: "linguagem_expressiva", domain: TODDLER_DOMAIN_LABELS.linguagem_expressiva, tagline: "Falar o nome das coisas.", badge: "Falador da Montanha",
    operator: "Mostre a figura grande e espere até 5 segundos. Vale palavra aproximada ou som do objeto quando o critério disser." },
  memoria: { name: "Caverna da Espera", emoji: "🔦", toddlerDomain: "atencao", domain: TODDLER_DOMAIN_LABELS.atencao, tagline: "Olhar, esperar o sinal e ficar paradinho.", badge: "Mestre da Espera",
    operator: "Marque só o que o critério pede. A observação da atividade vale pelo jogo inteiro." },
  corpo: { name: "Casinha do Faz de Conta", emoji: "🏠", toddlerDomain: "brincar_simbolico", domain: TODDLER_DOMAIN_LABELS.brincar_simbolico, tagline: "Brincar de mentirinha.", badge: "Rei do Faz de Conta",
    operator: "Brinque junto, com as figuras da tela e as mãos. Se quiser, use um brinquedo comum da sala (opcional)." },
};

export function phaseById(id: PhaseId, years?: number): Phase {
  const phase = PHASES.find((entry) => entry.id === id);
  if (!phase) throw new Error(`Mundo desconhecido: ${id}`);
  if (years !== undefined && isToddlerYears(years)) {
    const { toddlerDomain: _domain, ...text } = TODDLER_PHASE_TEXT[id];
    return { ...phase, ...text, source: TODDLER_SOURCE, origins: ["sonda10", "obs10", "visual", "cognitivo"] };
  }
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

/** Folga (s) entre o limite de sessão da idade e o tempo estimado. Só informação; não muda itens nem limites. */
export function timeMarginSeconds(years: number): number {
  return sessionLimitSeconds(years) - estimateBandSeconds(years).totalSeconds;
}

export type ItemProvenance = "autoral" | "banco_de_origem";

/** Procedência do item: o campo `ref` marca "autoral" nos itens criados para o jogo; os demais vêm dos bancos de origem. */
export function itemProvenance(item: Pick<Item, "ref">): ItemProvenance {
  return /autoral/i.test(item.ref) ? "autoral" : "banco_de_origem";
}

/** Quantos itens da idade vêm dos bancos de origem e quantos foram criados para o jogo. */
export function provenanceCounts(years: number): { autoral: number; origem: number; total: number } {
  const items = PHASE_ORDER.flatMap((phaseId) => itemsFor(String(years), phaseId));
  const autoral = items.filter((item) => itemProvenance(item) === "autoral").length;
  return { autoral, origem: items.length - autoral, total: items.length };
}

export function provenanceText(years: number): string {
  const c = provenanceCounts(years);
  return `Procedência dos itens: ${c.origem} de ${c.total} dos bancos de origem do NeuroPed; ${c.autoral} criados para o jogo.`;
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

/**
 * Cor da resposta da criança no resultado e no PDF: azul = acertou, vermelho = errou,
 * cinza neutro = não respondeu / recusou (ausência de resposta não é erro ativo; não
 * pinta de vermelho). A cor nunca é o único sinal: o rótulo (Acertou/Errou/…) segue ao lado.
 */
export type AnswerTone = "correct" | "wrong" | "neutral";
export const ANSWER_TONE: Record<AnswerStatus, AnswerTone> = {
  acerto: "correct",
  erro: "wrong",
  sem_resposta: "neutral",
  recusa: "neutral",
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
  /** Itens de toque (v2026-10-16): posição da opção escolhida na tela (0 = primeira) e número de opções mostradas. Ausente em registros antigos. */
  pos?: number;
  shown?: number;
  /** Posição da resposta certa na tela (planejada para ficar balanceada na partida). */
  correctPos?: number;
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
  "Aplicadora repetiu ou reformulou a instrução", "Aplicadora deu exemplo antes do item", "Ambiente com ruído ou interrupções",
  "Acompanhante presente na sala", "Uso de óculos ou aparelho auditivo",
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

/**
 * Ordem das opções na tela. A posição da resposta certa é PLANEJADA: entre os itens de toque com o mesmo número de
 * opções da partida, cada bloco de `n` itens usa as `n` posições uma vez (ordem do bloco sorteada pela semente), então
 * nenhuma posição fica favorecida e uma preferência de posição da criança aparece no perfil de resposta em vez de
 * virar acerto ou erro por acaso. Os distratores são embaralhados de forma determinística. `ordinal` = quantos itens de
 * toque com o mesmo número de opções vieram antes na partida (ver `touchOrdinal`).
 */
export function optionOrder(item: TouchItem, seed: number, ordinal: number): Option[] {
  const n = item.options.length;
  const correctIndex = item.options.findIndex((option) => option.label === item.answer);
  if (n < 2 || correctIndex < 0) return shuffle(item.options, seed);
  const block = Math.floor(ordinal / n);
  const cycle = shuffle(Array.from({ length: n }, (_, index) => index), seed + block * 7919 + n * 31);
  const target = cycle[ordinal % n];
  const others = shuffle(item.options.filter((_, index) => index !== correctIndex), seed + ordinal * 104729 + 13);
  const out: Option[] = [];
  for (let slot = 0, next = 0; slot < n; slot++) out.push(slot === target ? item.options[correctIndex] : others[next++]);
  return out;
}

/** Quantos itens de toque com o mesmo número de opções precedem o item na partida (ordem fixa dos mundos). */
export function touchOrdinal(bandId: BandId, phaseId: PhaseId, itemId: string): number {
  let count = 0;
  const target = itemsFor(bandId, phaseId).find((entry) => entry.id === itemId);
  if (!target || target.kind !== "toque") return 0;
  for (const id of PHASE_ORDER) {
    for (const entry of itemsFor(bandId, id)) {
      if (id === phaseId && entry.id === itemId) return count;
      if (entry.kind === "toque" && entry.options.length === target.options.length) count++;
    }
  }
  return count;
}

/** Registro a partir de um toque da criança: o jogo confere sozinho. `refusal` marca recusa explícita. `shown` = ordem exibida (para registrar a posição). */
export function recordTouch(item: TouchItem, phaseId: PhaseId, chosen: Option | null, seconds: number, repeated = false, refusal = false, shown?: readonly Option[]): AnswerRecord {
  const status: AnswerStatus = chosen === null ? (refusal ? "recusa" : "sem_resposta") : chosen.label === item.answer ? "acerto" : "erro";
  const prompt = item.context && !item.prompt.includes(item.context) ? `${item.prompt} (contexto lido: ${item.context})` : item.prompt;
  const position = shown && chosen ? shown.findIndex((option) => option.label === chosen.label) : -1;
  const correctPos = shown ? shown.findIndex((option) => option.label === item.answer) : -1;
  const where = shown ? { shown: shown.length, ...(position >= 0 ? { pos: position } : {}), ...(correctPos >= 0 ? { correctPos } : {}) } : {};
  return { ...base(item, phaseId, seconds, repeated), prompt, expected: item.answer, given: chosen ? chosen.label : "—", status, ...where };
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

// ─────────────────────────────── resumo descritivo (sem classificação) ───────────────────────────────
// Diretriz do Dr. Jadson (16/10/2026): o app só relata COMO a avaliação foi feita e COMO a criança
// respondeu (contagens brutas, tipos de resposta, tempos, observações). Nenhuma classificação nem
// comparação com referência existe neste módulo.

export interface PhaseSummary {
  phase: Phase;
  hits: number;
  errors: number;
  noResponse: number;
  refused: number;
  total: number;
  /** Falso quando nenhum item do mundo foi registrado (partida interrompida ou mundo pulado). */
  applied: boolean;
  /** Motivo quando a aplicadora pulou o mundo de propósito ("não aplicado"). */
  skipReason: string | null;
  /** Tempo somado dos itens registrados no mundo, em segundos. */
  seconds: number;
  answers: AnswerRecord[];
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

/** Contagem por domínio nas baterias de 2–3 anos (vazio nas demais idades). */
export interface DomainSummary {
  domain: ToddlerDomain;
  label: string;
  hits: number;
  total: number;
  registered: number;
  caregiverItems: number;
}

export interface GameSummary {
  domains: DomainSummary[];
  band: AgeBand;
  character: Character;
  phases: PhaseSummary[];
  origins: OriginSummary[];
  hits: number;
  total: number;
  durationSeconds: number;
  complete: boolean;
}

export function summarize(session: GameSession): GameSummary {
  const band = bandForYears(session.ageYears) ?? AGE_BANDS[0];
  const character = CHARACTERS.find((entry) => entry.id === session.characterId) ?? CHARACTERS[0];
  const skipped = new Map((session.skipped ?? []).map((entry) => [entry.phaseId, entry.reason]));
  const planned = PHASE_ORDER.flatMap((phaseId) => itemsFor(band.id, phaseId).map((item) => ({ item, phaseId })));
  // Partida completa = todos os itens previstos registrados uma única vez e nenhum mundo pulado.
  // É informação de como a aplicação transcorreu; não gera classificação.
  const complete = bandForYears(session.ageYears)?.id === session.bandId
    && skipped.size === 0
    && session.answers.length === planned.length
    && planned.every(({ item, phaseId }) => session.answers.filter((answer) => answer.itemId === item.id && answer.phaseId === phaseId).length === 1);
  const phases: PhaseSummary[] = PHASE_ORDER.map((phaseId) => {
    const phase = phaseById(phaseId, band.min);
    const answers = session.answers.filter((answer) => answer.phaseId === phaseId);
    const total = itemsFor(band.id, phaseId).length;
    const count = (status: AnswerStatus) => answers.filter((answer) => answer.status === status).length;
    const seconds = Math.round(answers.reduce((sum, answer) => sum + answer.seconds, 0));
    return {
      phase, hits: count("acerto"), errors: count("erro"), noResponse: count("sem_resposta"), refused: count("recusa"), total,
      applied: answers.length > 0, skipReason: skipped.get(phaseId) ?? null, seconds, answers,
    };
  });
  const origins: OriginSummary[] = ORIGIN_ORDER.map((origin) => {
    const plannedOrigin = planned.filter(({ item }) => item.origin === origin);
    const answered = session.answers.filter((answer) => answer.origin === origin);
    return {
      origin, label: ORIGIN_LABELS[origin], route: ORIGIN_ROUTES[origin], planned: plannedOrigin.length, applied: answered.length,
      hits: answered.filter((answer) => answer.status === "acerto").length,
      phases: PHASE_ORDER.filter((phaseId) => plannedOrigin.some((entry) => entry.phaseId === phaseId)),
      refs: [...new Set(plannedOrigin.map(({ item }) => item.ref.split(" · ").slice(0, 3).join(" · ")))],
    };
  });
  const hits = phases.reduce((sum, phase) => sum + phase.hits, 0);
  const total = phases.reduce((sum, phase) => sum + phase.total, 0);
  const durationSeconds = session.answers.reduce((sum, answer) => sum + answer.seconds, 0);
  const itemOf = (answer: AnswerRecord) => planned.find(({ item, phaseId }) => item.id === answer.itemId && phaseId === answer.phaseId)?.item;
  const domains: DomainSummary[] = isToddlerYears(band.min) ? TODDLER_DOMAIN_ORDER.map((domain) => {
    const plannedDomain = planned.filter(({ item }) => item.domain === domain);
    const answered = session.answers.filter((answer) => itemOf(answer)?.domain === domain);
    return {
      domain, label: TODDLER_DOMAIN_LABELS[domain], hits: answered.filter((answer) => answer.status === "acerto").length, total: plannedDomain.length, registered: answered.length,
      caregiverItems: plannedDomain.filter(({ item }) => item.informant === "cuidador").length,
    };
  }).filter((entry) => entry.total > 0) : [];
  return { domains, band, character, phases, origins, hits, total, durationSeconds: Math.round(durationSeconds), complete };
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

// ─────────────────────────────── estatísticas descritivas do registro ───────────────────────────────
export interface KindProfile {
  hits: number;
  total: number;
}

/** Contagens e tempos brutos da partida, sem comparação com nenhuma referência. */
export interface SessionStats {
  registered: number;
  hits: number;
  errors: number;
  noResponse: number;
  refused: number;
  repeated: number;
  gestures: number;
  /** Itens conferidos pelo jogo (toque e montagem) e conferidos pela aplicadora (fala e ação). */
  touch: KindProfile;
  judged: KindProfile;
  /** Tempo por item registrado (s): mínimo, mediana e máximo; null sem itens com tempo. */
  seconds: { min: number; median: number; max: number } | null;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function sessionStats(session: GameSession): SessionStats {
  const answers = session.answers;
  const count = (status: AnswerStatus) => answers.filter((answer) => answer.status === status).length;
  const profile = (kinds: Item["kind"][]): KindProfile => {
    const subset = answers.filter((answer) => kinds.includes(answer.kind));
    return { hits: subset.filter((answer) => answer.status === "acerto").length, total: subset.length };
  };
  const timed = answers.filter((answer) => answer.seconds > 0).map((answer) => answer.seconds);
  return {
    registered: answers.length, hits: count("acerto"), errors: count("erro"), noResponse: count("sem_resposta"), refused: count("recusa"),
    repeated: answers.filter((answer) => answer.repeated).length, gestures: answers.filter((answer) => answer.via === "gesto").length,
    touch: profile(["toque", "montar"]), judged: profile(["fala", "fazer"]),
    seconds: timed.length ? { min: round1(Math.min(...timed)), median: round1(median(timed)), max: round1(Math.max(...timed)) } : null,
  };
}

/** Linhas descritivas (contagens e tempos) do registro. Nenhuma frase interpretativa. */
export function statsLines(session: GameSession): string[] {
  const s = sessionStats(session);
  const lines = [
    `Respostas registradas: ${s.registered} (acertos ${s.hits}, erros ${s.errors}, sem resposta ${s.noResponse}, recusas ${s.refused}).`,
    `Por quem confere o item: tela (toque e montagem) ${s.touch.hits}/${s.touch.total} acertos; aplicadora (fala e ação) ${s.judged.hits}/${s.judged.total} acertos.`,
    `Comandos repetidos: ${s.repeated}. Acertos por gesto/apontar: ${s.gestures}.`,
  ];
  if (s.seconds) lines.push(`Tempo por item: mínimo ${s.seconds.min} s, mediana ${s.seconds.median} s, máximo ${s.seconds.max} s.`);
  lines.push(`Pausas: ${session.pauseCount ?? 0} (${Math.round(session.pausedSeconds ?? 0)} s em pausa). Registros desfeitos e refeitos: ${session.undoCount ?? 0}.`);
  return lines;
}

// ─────────────────────────────── perfil de resposta (descritivo, v2026-10-16) ───────────────────────────────
/** Estatística descritiva do tempo por item (segundos). Sem referência normativa: compara a criança consigo mesma. */
export interface LatencyStats {
  n: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  sd: number;
  /** Coeficiente de variação (desvio-padrão amostral ÷ média); null com menos de 5 tempos ou média 0. */
  cv: number | null;
}

export const LATENCY_MIN_N = 5;

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function latencyStats(values: readonly number[]): LatencyStats {
  const clean = values.filter((value) => Number.isFinite(value) && value >= 0).sort((a, b) => a - b);
  const n = clean.length;
  if (n === 0) return { n: 0, median: 0, q1: 0, q3: 0, iqr: 0, sd: 0, cv: null };
  const mean = clean.reduce((sum, value) => sum + value, 0) / n;
  const variance = n > 1 ? clean.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1) : 0;
  const sd = Math.sqrt(variance);
  const q1 = quantile(clean, 0.25);
  const q3 = quantile(clean, 0.75);
  return { n, median: round1(quantile(clean, 0.5)), q1: round1(q1), q3: round1(q3), iqr: round1(q3 - q1), sd: round1(sd), cv: n >= LATENCY_MIN_N && mean > 0 ? Math.round((sd / mean) * 100) / 100 : null };
}

export interface ResponseProfile {
  /** Itens de toque respondidos com a posição registrada (partidas novas). */
  positioned: number;
  /** Escolhas por posição na tela (0 = primeira), só itens de toque respondidos. */
  choicesByPosition: Record<number, number>;
  /** Erros por posição na tela. */
  errorsByPosition: Record<number, number>;
  /** Maior sequência de toques respondidos na mesma posição (itens com 3 ou mais opções). */
  longestSamePosition: { length: number; position: number } | null;
  /** Tempo nos itens conferidos pelo jogo (toque e montar), mais próximo da latência da criança. */
  tapLatency: LatencyStats;
  /** Tempo nos itens conferidos pela aplicadora (inclui a conferência): só ritmo. */
  judgedLatency: LatencyStats;
  byPhase: { phaseId: PhaseId; name: string; tap: LatencyStats }[];
}

export function responseProfile(session: GameSession): ResponseProfile {
  const touches = session.answers.filter((answer) => answer.kind === "toque" && answer.pos !== undefined && answer.status !== "sem_resposta" && answer.status !== "recusa");
  const choicesByPosition: Record<number, number> = {};
  const errorsByPosition: Record<number, number> = {};
  let longest: { length: number; position: number } | null = null;
  let run = 0;
  let last = -1;
  for (const answer of touches) {
    const position = answer.pos as number;
    choicesByPosition[position] = (choicesByPosition[position] ?? 0) + 1;
    if (answer.status === "erro") errorsByPosition[position] = (errorsByPosition[position] ?? 0) + 1;
    if ((answer.shown ?? 0) >= 3 && position === last) run += 1; else run = (answer.shown ?? 0) >= 3 ? 1 : 0;
    last = (answer.shown ?? 0) >= 3 ? position : -1;
    if (run >= 2 && (!longest || run > longest.length)) longest = { length: run, position };
  }
  const gameChecked = (answer: AnswerRecord) => (answer.kind === "toque" || answer.kind === "montar") && answer.status !== "sem_resposta" && answer.status !== "recusa";
  const judged = (answer: AnswerRecord) => (answer.kind === "fala" || answer.kind === "fazer") && answer.status !== "sem_resposta" && answer.status !== "recusa";
  const band = bandForYears(session.ageYears) ?? AGE_BANDS[0];
  return {
    positioned: touches.length,
    choicesByPosition,
    errorsByPosition,
    longestSamePosition: longest,
    tapLatency: latencyStats(session.answers.filter(gameChecked).map((answer) => answer.seconds)),
    judgedLatency: latencyStats(session.answers.filter(judged).map((answer) => answer.seconds)),
    byPhase: PHASE_ORDER.map((phaseId) => ({ phaseId, name: phaseById(phaseId, band.min).name, tap: latencyStats(session.answers.filter((answer) => answer.phaseId === phaseId && gameChecked(answer)).map((answer) => answer.seconds)) })),
  };
}

function latencyText(stats: LatencyStats): string {
  if (stats.n === 0) return "sem itens";
  return `n=${stats.n}, mediana ${stats.median} s, intervalo interquartil ${stats.q1}–${stats.q3} s (amplitude ${stats.iqr} s), desvio-padrão ${stats.sd} s${stats.cv !== null ? `, coeficiente de variação ${stats.cv}` : " (coeficiente de variação só com 5 ou mais itens)"}`;
}

const positionText = (counts: Record<number, number>) => Object.keys(counts).map(Number).sort((a, b) => a - b).map((key) => `posição ${key + 1}: ${counts[key]}`).join(" · ") || "nenhuma";

/** Linhas do perfil de resposta para relatório e PDF. Só contagens e dispersão; nenhuma norma, corte ou interpretação. */
export function responseProfileLines(session: GameSession): string[] {
  const profile = responseProfile(session);
  if (profile.tapLatency.n === 0 && profile.judgedLatency.n === 0) return [];
  const lines = [
    `Tempo por item conferido pelo jogo (toque e montar): ${latencyText(profile.tapLatency)}.`,
    `Tempo por item conferido pela aplicadora (inclui o tempo de julgar; vale só como ritmo): ${latencyText(profile.judgedLatency)}.`,
    ...profile.byPhase.filter((entry) => entry.tap.n >= 2).map((entry) => `  ${entry.name}: ${latencyText(entry.tap)}.`),
  ];
  if (profile.positioned > 0) {
    lines.push(`Posição das escolhas na tela (itens de toque respondidos: ${profile.positioned}): ${positionText(profile.choicesByPosition)}.`);
    lines.push(`Erros por posição na tela: ${positionText(profile.errorsByPosition)}. A posição da resposta certa foi balanceada pelo jogo; erros concentrados numa posição podem refletir preferência de posição, não só conteúdo.`);
    if (profile.longestSamePosition) lines.push(`Maior sequência de toques na mesma posição: ${profile.longestSamePosition.length} seguidos (posição ${profile.longestSamePosition.position + 1}). Observação descritiva; conferir com o comportamento visto pela aplicadora.`);
  }
  lines.push("Perfil descritivo da própria partida: sem comparação com referência externa; o tempo aqui inclui leitura do comando e deslocamento do toque, não é tempo de reação preciso.");
  return lines;
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

/** Resumo curto, em prosa, para colar na evolução ou no prontuário. Só descreve; não classifica. */
export function buildGameBrief(session: GameSession, date = sessionDate(session)): string {
  const summary = summarize(session);
  const stats = sessionStats(session);
  // Dia no fuso clínico. `toISOString()` é UTC: no Brasil, a partir das 21h,
  // o registro de pré-consulta saía datado do dia seguinte.
  const day = formatClinicalDate(date);
  const observations = cleanObservations(session.observations ?? "");
  const missed = session.answers.filter((answer) => answer.status !== "acerto");
  const parts: string[] = [
    `Registro lúdico de pré-consulta (${SUPER_NEUROPAD_TITLE}, ${summary.band.label}) em ${day}: ${summary.complete ? "partida completa" : "partida incompleta"}, ${session.answers.length} de ${summary.total} itens registrados; ${stats.hits} acertos, ${stats.errors} erros, ${stats.noResponse} sem resposta, ${stats.refused} recusas.`,
    `Por mundo: ${summary.phases.map((phase) => `${phase.phase.name} ${phaseStatusText(phase, summary.complete)}`).join(", ")}.${skippedText(summary)}`,
  ];
  if (summary.domains.length) parts.push(`Por domínio: ${summary.domains.map((entry) => `${entry.label} ${entry.hits}/${entry.total}`).join(", ")}.`);
  if (missed.length > 0) parts.push(`Itens não acertados: ${missed.map((answer) => `${answer.prompt}: ${answer.given} (${STATUS_LABELS[answer.status].toLowerCase()}; ${answer.seconds} s)`).join("; ")}.`);
  parts.push(`Comandos repetidos: ${stats.repeated}; acertos por gesto/apontar: ${stats.gestures}; pausas: ${session.pauseCount ?? 0}.`);
  if (observations) parts.push(`Observações da aplicadora: ${sentence(observations)}`);
  parts.push(DESCRIPTIVE_NOTICE);
  return parts.join(" ");
}

// ─────────────────────────────── baterias de 2–3 anos: contagem por domínio ───────────────────────────────
/** Linhas por domínio (só 2–3 anos): contagem bruta de itens cumpridos. */
export function toddlerReportLines(summary: GameSummary): string[] {
  if (summary.domains.length === 0) return [];
  return [
    "CONTAGEM POR DOMÍNIO (BATERIA 2–3 ANOS)",
    ...summary.domains.map((entry) => `- ${entry.label}: ${entry.hits}/${entry.total} cumpre (${entry.registered} registrados)${entry.caregiverItems ? ` · ${entry.caregiverItems} item(ns) por relato do cuidador` : ""}`),
    "",
  ];
}

// ─────────────────────────────── bloco estruturado (leitura por IA) ───────────────────────────────
export const STRUCTURED_HEADER = "DADOS ESTRUTURADOS (formato estável: uma linha por registro, JSON após o rótulo)";

/**
 * Bloco legível por máquina, com rótulos fixos: `SESSAO`, `DOMINIO`, `ORIGEM`, `ITEM`
 * e `OBSERVACOES`. Os valores são JSON de uma linha; figuras viram nomes entre colchetes.
 * Só contagens e fatos do registro; nenhum campo de classificação.
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
    duracao_tarefas_s: summary.durationSeconds,
    duracao_sessao_s: wall, tempo_estimado_s: estimateBandSeconds(summary.band.min).totalSeconds, limite_sessao_s: sessionLimitSeconds(summary.band.min),
    folga_planejada_s: timeMarginSeconds(summary.band.min),
    pausas: session.pauseCount ?? 0, tempo_em_pausa_s: Math.round(session.pausedSeconds ?? 0), desfeitos: session.undoCount ?? 0,
    mundos_nao_aplicados: (session.skipped ?? []).map((entry) => ({ mundo: phaseById(entry.phaseId, summary.band.min).name, motivo: entry.reason })),
  })}`);
  for (const phase of summary.phases) {
    lines.push(`DOMINIO ${json({
      mundo: phase.phase.name, dominio: phase.phase.domain, ordem: phase.phase.order, itens: phase.total, registrados: phase.answers.length,
      acertos: phase.hits, erros: phase.errors, sem_resposta: phase.noResponse, recusas: phase.refused,
      aplicado: phase.applied, nao_aplicado_motivo: phase.skipReason, tempo_s: phase.seconds,
    })}`);
  }
  for (const origin of summary.origins) {
    lines.push(`ORIGEM ${json({ instrumento: origin.label, itens_previstos: origin.planned, registrados: origin.applied, acertos: origin.hits, mundos: origin.phases.map((id) => phaseById(id, summary.band.min).name) })}`);
  }
  for (const answer of session.answers) {
    lines.push(`ITEM ${json({
      id: answer.itemId, mundo: phaseById(answer.phaseId, summary.band.min).name, origem: ORIGIN_LABELS[answer.origin], referencia: answer.ref, tipo: answer.kind,
      pergunta: answer.prompt, criterio_acerto: answer.expected, resposta: answer.given, resultado: answer.status, tempo_s: answer.seconds,
      repeticoes: answer.repeated ? 1 : 0, via: answer.via ?? "padrao",
    })}`);
  }
  for (const entry of summary.domains) {
    lines.push(`DOMINIO_2_3 ${json({ dominio: entry.label, itens: entry.total, registrados: entry.registered, cumpre: entry.hits, itens_relato_cuidador: entry.caregiverItems })}`);
  }
  const profile = responseProfile(session);
  if (profile.tapLatency.n > 0 || profile.judgedLatency.n > 0) {
    lines.push(`PERFIL ${json({
      tempo_jogo: profile.tapLatency, tempo_aplicadora: profile.judgedLatency, posicao_escolhas: profile.choicesByPosition, posicao_erros: profile.errorsByPosition,
      maior_sequencia_mesma_posicao: profile.longestSamePosition, toques_com_posicao: profile.positioned,
    })}`);
  }
  lines.push(`OBSERVACOES ${json({ texto: cleanObservations(session.observations ?? "") || null })}`);
  return lines;
}

// ─────────────────────────────── relatório em texto ───────────────────────────────
export function buildGameReport(session: GameSession, date = sessionDate(session)): string {
  const summary = summarize(session);
  const wall = sessionWallSeconds(session);
  const observations = cleanObservations(session.observations ?? "");
  const lines: string[] = [
    `${SUPER_NEUROPAD_TITLE} · versão ${SUPER_NEUROPAD_VERSION}`,
    `Idade informada: ${session.ageYears} anos · Faixa: ${summary.band.label} · Personagem: ${summary.character.emoji} ${summary.character.name} ${summary.character.role}`,
    `Data e hora (local): ${formatClinicalDateTime(date)} · Tempo somado nas tarefas: ${formatDuration(summary.durationSeconds)}${wall !== null ? ` · Duração da sessão: ${formatDuration(wall)}` : ""} · ${session.pauseCount ?? 0} pausa(s) · ${summary.complete ? "Jogo completo" : "Jogo incompleto"}`,
    `Tempo estimado para a idade: ${formatDuration(estimateBandSeconds(summary.band.min).totalSeconds)} · limite da sessão: ${Math.round(sessionLimitSeconds(summary.band.min) / 60)} min`,
    "",
    "O QUE FOI APLICADO POR INSTRUMENTO DE ORIGEM",
    ...summary.origins.map((origin) => `- ${origin.label}: ${origin.planned} item(ns) nos mundos ${origin.phases.map((id) => phaseById(id, summary.band.min).name).join(", ")} · registrados ${origin.applied}, acertos ${origin.hits}`),
    provenanceText(summary.band.min),
    "",
    "REGISTRO DE RESPOSTAS — CONTAGEM BRUTA",
    `Total: ${summary.hits} acertos em ${summary.total} itens previstos (${session.answers.length} registrados).`,
    ...summary.phases.map((phase) => `Mundo ${phase.phase.order} · ${phase.phase.name} (${phase.phase.domain}): ${phase.skipReason || !phase.applied ? phaseStatusText(phase, false) : `${phase.hits}/${phase.total} acertos, ${phase.errors} erros, ${phase.noResponse} sem resposta, ${phase.refused} recusa(s) · ${formatDuration(phase.seconds)}`}`),
    "",
    ...toddlerReportLines(summary),
    "ASPECTOS DA APLICAÇÃO E DA RESPOSTA (CONTAGENS E TEMPOS)",
    ...statsLines(session).map((line) => `- ${line}`),
    "",
    ...(responseProfileLines(session).length ? ["PERFIL DE RESPOSTA (DESCRITIVO, SEM NORMA)", ...responseProfileLines(session).map((line) => (line.startsWith("  ") ? line : `- ${line}`)), ""] : []),
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
      lines.push(`     Critério de acerto: ${answer.expected} · Registrado: ${answer.given} · ${STATUS_LABELS[answer.status]} · ${answer.seconds}s${answer.repeated ? " · comando repetido 1x" : ""}${answer.via === "gesto" ? " · por gesto/apontar" : ""}`);
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
 * escalas). A primeira linha é o resumo em prosa de `buildGameBrief`; depois vem cada
 * item registrado, na ordem da partida, com origem, critério de acerto, registrado,
 * tempo e repetição. Nenhum escore ou classificação é criado aqui.
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
    ...(summary.domains.length ? [{ question: "Contagem por domínio (2–3 anos)", answer: summary.domains.map((entry) => `${entry.label}: ${entry.hits}/${entry.total} cumpre`).join(" · ") }] : []),
    { question: "O que foi testado por instrumento", answer: summary.origins.map((origin) => `${origin.label}: ${origin.applied}/${origin.planned} itens registrados, ${origin.hits} acertos`).join(" · ") },
    ...summary.phases.filter((phase) => phase.skipReason).map((phase) => ({ question: `Mundo ${phase.phase.order} · ${phase.phase.name}`, answer: `Não aplicado — ${phase.skipReason}` })),
    ...(observations ? [{ question: "Observações da aplicadora", answer: observations }] : []),
  ];
  for (const answer of session.answers) {
    const phase = phaseById(answer.phaseId, summary.band.min);
    rows.push({
      question: `Mundo ${phase.order} · ${phase.name} · ${ORIGIN_LABELS[answer.origin]} · ${answer.prompt}`,
      answer: `${STATUS_LABELS[answer.status]} · registrado: ${answer.given} · critério de acerto: ${answer.expected} · ${answer.seconds} s${answer.repeated ? " · comando repetido 1x" : ""}${answer.via === "gesto" ? " · por gesto/apontar" : ""}`,
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
