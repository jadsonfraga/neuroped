/**
 * Testes para Pais — Exemplos Contextualizados do Dia-a-Dia
 * Questões que pais entendem naturalmente, com exemplos para marcar corretamente
 */

export interface ParentTestExample {
  id: string;
  scaleId: string;
  domain: "tdah" | "tea" | "comportamento" | "ansiedade" | "linguagem" | "motor" | "sono" | "alimentacao" | "aprendizagem" | "social" | "funcionalidade";
  question: string;
  exemplosYes: string[];
  exemplosNo: string[];
  exemplosAs: string[];
  dica: string;
  idade: [number, number];
  sinais_alerta?: string[];
}

export const testesPaisCompletos: ParentTestExample[] = [];

export function getTestesPaisByDomain(domain: string): ParentTestExample[] {
  return testesPaisCompletos.filter(t => t.domain === domain);
}

export function getTestesPaisByScale(scaleId: string): ParentTestExample[] {
  return testesPaisCompletos.filter(t => t.scaleId === scaleId);
}
