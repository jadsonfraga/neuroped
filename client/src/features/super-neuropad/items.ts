/**
 * Tipos de item do Super NeuroPad Game e construtores compartilhados pelo banco
 * integrado (`bank.ts`) e pelo motor (`model.ts`).
 *
 * Cada item carrega a sua ORIGEM (qual das quatro abas de origem ele traz para
 * o jogo) e, quando veio de um banco existente, a referência exata (`ref`), para
 * o laudo dizer o que foi testado por instrumento sem reinventar conteúdo.
 */

export type ShapeId = "circulo" | "cruz" | "quadrado" | "triangulo" | "losango" | "pentagono";

/** As quatro abas que o jogo integra. */
export type OriginId = "sonda10" | "obs10" | "visual" | "cognitivo";

export const ORIGIN_LABELS: Record<OriginId, string> = {
  sonda10: "Sonda 10",
  obs10: "Observa 10 (OBS-10)",
  visual: "Reconhecimento visual",
  cognitivo: "Avaliação cognitiva infantil",
};

export const ORIGIN_ROUTES: Record<OriginId, string> = {
  sonda10: "/testes-diretos",
  obs10: "/avaliacao-pre-consulta-faixa-etaria",
  visual: "/testes-reconhecimento",
  cognitivo: "/testes-cognitivos",
};

export const ORIGIN_ORDER: readonly OriginId[] = ["sonda10", "obs10", "visual", "cognitivo"];

export interface Option {
  /** O que a criança vê no botão (emoji, número ou palavra). Vazio quando a figura vem do banco visual (`vr`). */
  art: string;
  /** Nome textual da opção, usado no registro e no PDF. */
  label: string;
  size?: "sm" | "lg";
  /** Figura do banco do Reconhecimento Visual (id do manifesto), desenhada pelo próprio componente de lá. */
  vr?: string;
}

interface ItemMeta {
  id: string;
  prompt: string;
  origin: OriginId;
  /** Referência do item no banco de origem (ex.: "Cognitivos 7 anos · leitura 3"). */
  ref: string;
  /** Tempo estimado de aplicação, em segundos (sobrepõe o padrão por tipo). */
  seconds?: number;
}

/** A criança responde tocando na tela; o jogo confere sozinho. */
export interface TouchItem extends ItemMeta {
  kind: "toque";
  options: Option[];
  answer: string;
  /** Estímulo fixo mostrado acima das opções (figuras, sequência, texto curto). */
  stimulus?: string;
  /** Figura do banco visual mostrada como modelo acima das opções (pareamento). */
  stimulusVr?: string;
  /** Contexto lido pela aplicadora antes da pergunta (conceitos contextualizados do banco visual). */
  context?: string;
  /** Estímulo mostrado antes das opções e escondido depois (memória visual). */
  preview?: string;
  big?: boolean;
}

/** A aplicadora faz a pergunta e confere a resposta falada contra o critério. */
export interface SpeakItem extends ItemMeta {
  kind: "fala";
  expected: string;
  stimulus?: string;
  stimulusVr?: string;
  /** Alternativa não verbal aceita (apontar, gesto) — usada nas faixas de 2 e 3 anos. */
  gesture?: string;
}

/** A criança executa uma ação; a aplicadora confere contra o critério. */
export interface DoItem extends ItemMeta {
  kind: "fazer";
  expected: string;
  stimulus?: string;
  shape?: ShapeId;
  /** A criança desenha ou escreve com o dedo na própria tela (nada é guardado). */
  draw?: boolean;
  gesture?: string;
}

/** A criança monta a palavra tocando nas letras na ordem; o jogo confere sozinho. */
export interface BuildItem extends ItemMeta {
  kind: "montar";
  /** Palavra-alvo (somente para a aplicadora ditar e para o registro). */
  word: string;
  target: string[];
  tiles: string[];
  /** true = a palavra fica visível para copiar; false = ditado. */
  show: boolean;
}

export type Item = TouchItem | SpeakItem | DoItem | BuildItem;
export type JudgedItem = SpeakItem | DoItem;

export const KIND_LABELS: Record<Item["kind"], string> = {
  toque: "Toque na tela (conferido pelo jogo)",
  fala: "Resposta falada (conferida pela aplicadora)",
  fazer: "Ação executada (conferida pela aplicadora)",
  montar: "Montar a palavra na tela (conferido pelo jogo)",
};

export function isJudged(item: Item): item is JudgedItem {
  return item.kind === "fala" || item.kind === "fazer";
}

export function itemExpected(item: Item): string {
  if (item.kind === "toque") return item.answer;
  if (item.kind === "montar") return item.word;
  return item.expected;
}

/** Confere a montagem: mesma sequência de letras da palavra-alvo. */
export function buildMatches(item: BuildItem, placed: readonly string[]): boolean {
  return placed.length === item.target.length && placed.every((letter, index) => letter === item.target[index]);
}
