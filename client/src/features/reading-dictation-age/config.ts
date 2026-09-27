/**
 * Configuração pura (sem React) da aba Por Faixa Etária — ditado e leitura,
 * 5 a 19 anos. Restringe o banco autoral dos Testes Cognitivos por Faixa
 * Etária (features/cognitive-age/bank.ts) aos domínios de leitura e
 * escrita/ditado, sem duplicar conteúdo clínico.
 */
import { type CognitiveDomain } from "@/features/cognitive-age/bank";

export const MIN_AGE = 5;
export const MAX_AGE = 19;

/** Ordem dos blocos: leitura primeiro, depois escrita/ditado. */
export const BLOCK_DOMAINS: readonly CognitiveDomain[] = ["leitura", "escrita"];

export function isValidAge(age: number): boolean {
  return Number.isInteger(age) && age >= MIN_AGE && age <= MAX_AGE;
}
