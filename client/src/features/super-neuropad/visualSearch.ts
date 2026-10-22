/**
 * Busca visual autoral, inspirada em brincadeiras de localizar um personagem.
 * Tempo e densidade são parâmetros lúdicos de aplicação, NÃO normas clínicas.
 * Os elementos são vetoriais locais; não há dependência de sites nem imagens externas.
 */
export interface VisualSearchProfile {
  years: number;
  cells: number;
  columns: number;
  seconds: number;
  similar: boolean;
}

const CELLS = [6, 8, 12, 12, 16, 20, 24, 24, 30, 30, 36, 36, 42, 42, 48, 48] as const;
const COLUMNS = [2, 2, 3, 3, 4, 4, 4, 4, 5, 5, 6, 6, 6, 6, 6, 6] as const;
const SECONDS = [50, 48, 45, 43, 42, 40, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29] as const;

/** Graduação pragmática por idade, ainda não padronizada/validada. */
export function visualSearchProfile(years: number): VisualSearchProfile {
  if (!Number.isInteger(years) || years < 2 || years > 17) {
    throw new RangeError("Busca visual disponível de 2 a 17 anos");
  }
  const index = years - 2;
  return { years, cells: CELLS[index], columns: COLUMNS[index], seconds: SECONDS[index], similar: years >= 8 };
}

export type ExplorerVariant = 0 | 1 | 2 | 3;

/** Exatamente um explorador-alvo; disposição reproduzível por partida. */
export function buildVisualSearchBoard(profile: VisualSearchProfile, seed: number): ExplorerVariant[] {
  const n = profile.cells;
  const normalized = Number.isFinite(seed) ? (Math.trunc(seed) >>> 0) : 0;
  const target = ((Math.imul(normalized ^ 0x9e3779b9, 2654435761) >>> 0) % n);
  return Array.from({ length: n }, (_, index): ExplorerVariant => {
    if (index === target) return 0;
    return (1 + ((normalized + index * 13) % 3)) as ExplorerVariant;
  });
}
