/**
 * Chave de ativação do seletor v2 da pré-consulta (feature flag + modo sombra).
 *  - "v1"     : comportamento anterior (posições vazias quando não há instrumento);
 *  - "shadow" : devolve v1, calcula v2 e registra divergências SEM dados do paciente;
 *  - "v2"     : PADRÃO — mesmas escolhas do v1 e, quando faltam posições, completa com o instrumento relevante mais próximo (rotulado).
 * Fonte: `VITE_PREVISIT_SELECTOR` (build) ou `localStorage["neuroped:previsit-selector"]` (diagnóstico local).
 */
export type PrevisitSelectorMode = "v1" | "shadow" | "v2";
export const PREVISIT_SELECTOR_STORAGE_KEY = "neuroped:previsit-selector";
export const PREVISIT_SELECTOR_DEFAULT: PrevisitSelectorMode = "v2";

export function parsePrevisitSelectorMode(value: unknown): PrevisitSelectorMode | null {
  return value === "v1" || value === "shadow" || value === "v2" ? value : null;
}

export function getPrevisitSelectorMode(): PrevisitSelectorMode {
  let fromEnv: unknown;
  try { fromEnv = (import.meta as { env?: Record<string, unknown> }).env?.VITE_PREVISIT_SELECTOR; } catch { fromEnv = undefined; }
  let fromStorage: unknown;
  try { fromStorage = typeof localStorage !== "undefined" ? localStorage.getItem(PREVISIT_SELECTOR_STORAGE_KEY) : null; } catch { fromStorage = null; }
  return parsePrevisitSelectorMode(fromStorage) ?? parsePrevisitSelectorMode(fromEnv) ?? PREVISIT_SELECTOR_DEFAULT;
}

/** Registro de divergência v1×v2: só faixa etária ampla, queixa/contexto/respondente e ids de escala — nunca nome, texto livre ou idade exata. */
export interface PrevisitShadowRecord { ageBand: string; queixa: string; contexto: string; respondente: string; v1: string[]; v2: string[] }
const shadowLog: PrevisitShadowRecord[] = [];
export function ageBandOf(months: number): string {
  return months < 24 ? "0-2a" : months < 72 ? "2-6a" : months < 144 ? "6-12a" : "12-18a";
}
export function recordPrevisitShadow(rec: PrevisitShadowRecord): void {
  if (rec.v1.join("|") === rec.v2.join("|")) return;
  shadowLog.push(rec);
  if (shadowLog.length > 200) shadowLog.shift();
}
export function getPrevisitShadowLog(): readonly PrevisitShadowRecord[] { return shadowLog; }
