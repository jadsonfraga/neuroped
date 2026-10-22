/**
 * Busca visual autoral — parâmetros de usabilidade, não curvas normativas.
 * A dificuldade progride por quantidade, semelhança dos distratores e tamanho.
 * O cronômetro compensa o aumento de carga; não é um tempo de corte clínico.
 * Cenário determinístico por semente, sem rede ou imagens proprietárias.
 */
export type VisualSearchTier = 0 | 1 | 2 | 3 | 4;
export type ExplorerVariant = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Posição das opções no item: 0 é o explorador-alvo; 1 é qualquer outro. */
export const OPCAO_ALVO = 0;
export const OPCAO_OUTRA = 1;
export type OpcaoBusca = typeof OPCAO_ALVO | typeof OPCAO_OUTRA;

/** Rótulo de dificuldade exibido na missão, pelo nível de semelhança (tier). */
export const TIER_LABELS: readonly string[] = [
  "alto contraste e alvos grandes",
  "formas simples com algumas cores iguais",
  "mais personagens com cores semelhantes",
  "símbolos parecidos e maior densidade",
  "quase iguais, exigindo identificar forma e posição",
];

export interface VisualSearchProfile {
  years: number;
  cells: number;
  columns: number;
  seconds: number;
  tier: VisualSearchTier;
  similar: boolean;
  minTileHeight: number;
  nearDistractors: number;
}

// 2-3: contraste forte, 6-8 alvos grandes e poucos distratores.
// 4-5: mais objetos, mas sem quase iguais.
// 6-9: busca com maior densidade e mesma cor de chapéu em parte da cena.
// 10-13: formas parecidas (estrela vazada / quatro pontas).
// 14-17: maior carga e estrelas fora do centro; mais tempo para compensar.
const PROFILES: readonly Omit<VisualSearchProfile, "years" | "similar" | "nearDistractors">[] = [
  { cells: 6,  columns: 2, seconds: 70, tier: 0, minTileHeight: 84 },
  { cells: 8,  columns: 2, seconds: 70, tier: 0, minTileHeight: 80 },
  { cells: 9,  columns: 3, seconds: 65, tier: 1, minTileHeight: 74 },
  { cells: 12, columns: 3, seconds: 65, tier: 1, minTileHeight: 72 },
  { cells: 12, columns: 3, seconds: 60, tier: 2, minTileHeight: 68 },
  { cells: 16, columns: 4, seconds: 60, tier: 2, minTileHeight: 64 },
  { cells: 20, columns: 4, seconds: 60, tier: 2, minTileHeight: 62 },
  { cells: 24, columns: 4, seconds: 60, tier: 2, minTileHeight: 60 },
  { cells: 24, columns: 4, seconds: 60, tier: 3, minTileHeight: 58 },
  { cells: 30, columns: 5, seconds: 65, tier: 3, minTileHeight: 56 },
  { cells: 30, columns: 5, seconds: 65, tier: 3, minTileHeight: 56 },
  { cells: 36, columns: 6, seconds: 70, tier: 3, minTileHeight: 54 },
  { cells: 36, columns: 6, seconds: 70, tier: 4, minTileHeight: 54 },
  { cells: 42, columns: 6, seconds: 75, tier: 4, minTileHeight: 54 },
  { cells: 42, columns: 6, seconds: 75, tier: 4, minTileHeight: 54 },
  { cells: 48, columns: 6, seconds: 80, tier: 4, minTileHeight: 54 },
] as const;

export function visualSearchProfile(years: number): VisualSearchProfile {
  if (!Number.isInteger(years) || years < 2 || years > 17) {
    throw new RangeError("Busca visual disponível de 2 a 17 anos");
  }
  const base = PROFILES[years - 2];
  const nearDistractors = base.tier === 3
    ? Math.max(3, Math.floor((base.cells - 1) / 3))
    : base.tier === 4
      ? Math.max(5, Math.floor((base.cells - 1) / 2))
      : 0;
  return { years, ...base, similar: base.tier >= 2, nearDistractors };
}

function makePrng(seed: number) {
  // O estado nunca é zero: garante sequência válida inclusive para seed=0.
  let state = ((Number.isFinite(seed) ? Math.trunc(seed) : 0) ^ 0x9e3779b9) >>> 0;
  if (state === 0) state = 0x6d2b79f5;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

/** Exatamente um alvo (0), sem padrão periódico óbvio nos distratores. */
export function buildVisualSearchBoard(profile: VisualSearchProfile, seed: number): ExplorerVariant[] {
  const rand = makePrng(seed);
  const basic: readonly ExplorerVariant[] = [1, 2, 3];
  const near: readonly ExplorerVariant[] = profile.tier === 4 ? [4, 5, 6] : [4, 5];
  const board: ExplorerVariant[] = [0];
  for (let i = 0; i < profile.cells - 1; i++) {
    const pool = i < profile.nearDistractors ? near : basic;
    board.push(pool[Math.floor(rand() * pool.length)]);
  }
  // Fisher-Yates evita alvos sistematicamente na mesma posição ou listras.
  for (let i = board.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [board[i], board[j]] = [board[j], board[i]];
  }
  return board;
}

/**
 * Uma seleção no limite ou depois dele conta como sem resposta, mesmo que
 * setInterval esteja atrasado (ex.: aba lenta ou dispositivo com pouca RAM).
 * Retorna índice de opção ou null, nunca uma classificação clínica.
 */
export function visualSearchChoice(
  variant: ExplorerVariant,
  elapsedSeconds: number,
  limitSeconds: number,
): OpcaoBusca | null {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0
    || !Number.isFinite(limitSeconds) || limitSeconds <= 0
    || elapsedSeconds >= limitSeconds) return null;
  return variant === 0 ? OPCAO_ALVO : OPCAO_OUTRA;
}
