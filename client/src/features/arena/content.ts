import type { AgeBandId } from "@/features/arena/engine";

export interface SkyWord {
  id: string;
  word: string;
  syllables: string[];
}

export interface FigureChoice {
  id: string;
  label: string;
  glyph: string;
}

export interface FigurePrompt {
  id: string;
  spoken: string;
  options: FigureChoice[];
  answer: string;
}

export interface LetterPrompt {
  id: string;
  spoken: string;
  letters: string[];
  target: string;
}

export interface PhrasePrompt {
  id: string;
  spoken: string;
  target: string;
}

export interface SoundChoice {
  id: string;
  label: string;
}

export interface SoundStep {
  id: string;
  kind: "rima" | "inicial" | "palmas";
  prompt: string;
  options: SoundChoice[];
  answer: string;
  clue: string;
}

export interface MemoryPiece {
  id: string;
  label: string;
  glyph: string;
}

export type BoltKind = "estrela" | "meteoro";

const SKY: Record<AgeBandId, SkyWord> = {
  "5-6": { id: "lua", word: "LUA", syllables: ["LU", "A"] },
  "7-8": { id: "estrela", word: "ESTRELA", syllables: ["ES", "TRE", "LA"] },
  "9-11": { id: "passaro", word: "PÁSSARO", syllables: ["PÁS", "SA", "RO"] },
};

const FIGURE: FigurePrompt = {
  id: "peixe",
  spoken: "peixe",
  answer: "peixe",
  options: [
    { id: "peixe", label: "peixe", glyph: "🐟" },
    { id: "bola", label: "bola", glyph: "⚽" },
    { id: "casa", label: "casa", glyph: "🏠" },
    { id: "sol", label: "sol", glyph: "☀️" },
  ],
};

const LETTERS: LetterPrompt = {
  id: "gato",
  spoken: "gato",
  letters: ["T", "A", "O", "G"],
  target: "GATO",
};

const PHRASE: PhrasePrompt = {
  id: "passaro-voa",
  spoken: "O pássaro voa",
  target: "O PÁSSARO VOA",
};

/** Som e letra nem sempre caminham juntos: XÍCARA e CHAVE compartilham o som inicial. */
export const XICARA_STEP: SoundStep = {
  id: "xicara-inicial",
  kind: "inicial",
  prompt: "XÍCARA",
  clue: "o som do começo",
  answer: "chave",
  options: [
    { id: "chave", label: "CHAVE" },
    { id: "taxi", label: "TÁXI" },
    { id: "bola", label: "BOLA" },
  ],
};

const TRAIL: SoundStep[] = [
  {
    id: "pato-rima",
    kind: "rima",
    prompt: "PATO",
    clue: "qual rima",
    answer: "gato",
    options: [
      { id: "gato", label: "GATO" },
      { id: "casa", label: "CASA" },
      { id: "sol", label: "SOL" },
    ],
  },
  XICARA_STEP,
  {
    id: "banana-palmas",
    kind: "palmas",
    prompt: "BANANA",
    clue: "quantas palmas",
    answer: "3",
    options: [
      { id: "2", label: "2" },
      { id: "3", label: "3" },
      { id: "4", label: "4" },
    ],
  },
];

const MEMORY: MemoryPiece[] = [
  { id: "sol", label: "sol", glyph: "☀️" },
  { id: "lua", label: "lua", glyph: "🌙" },
  { id: "estrela", label: "estrela", glyph: "⭐" },
  { id: "raio", label: "raio", glyph: "⚡" },
];

const BOLTS: BoltKind[] = ["estrela", "meteoro", "estrela", "meteoro"];

export function skyWord(band: AgeBandId): SkyWord {
  return SKY[band];
}

export function figurePrompt(): FigurePrompt {
  return FIGURE;
}

export function letterPrompt(): LetterPrompt {
  return LETTERS;
}

export function phrasePrompt(): PhrasePrompt {
  return PHRASE;
}

export function trailSteps(): SoundStep[] {
  return TRAIL.map((step) => ({ ...step, options: step.options.map((option) => ({ ...option })) }));
}

export function memoryPieces(band: AgeBandId): MemoryPiece[] {
  const count = band === "5-6" ? 2 : band === "7-8" ? 3 : 4;
  return MEMORY.slice(0, count).map((piece) => ({ ...piece }));
}

export function boltSequence(): BoltKind[] {
  return [...BOLTS];
}
