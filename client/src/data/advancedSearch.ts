/**
 * Busca Avançada Inteligente
 * Permite usuários buscar por:
 * - "rápida para ansiedade" → GAD-7, SCARED
 * - "padrão-ouro desenvolvimento" → Bayley, Griffiths
 * - "<10 minutos" → escalas rápidas
 * - "escrita criança 6 anos" → TDE, CONFIAS
 */

import { allScales, ScaleEntry } from "./scaleFilter";

export interface SearchIntent {
  type: "speed" | "quality" | "age" | "domain" | "respondent" | "pattern";
  value: string;
  keywords: string[];
}

export const searchPatterns: SearchIntent[] = [
  // Velocidade
  { type: "speed", value: "<5min", keywords: ["rápida", "5 min", "<5", "gad7", "phq"] },
  { type: "speed", value: "<15min", keywords: ["rápido", "15 min", "<15", "triagem"] },
  { type: "speed", value: "completa", keywords: ["completa", "detalhada", "minuciosa"] },

  // Qualidade
  { type: "quality", value: "padrão-ouro", keywords: ["padrão-ouro", "melhor", "diagnóstico"] },
  { type: "quality", value: "rastreio", keywords: ["rastreio", "rastreio", "screening"] },

  // Idade
  { type: "age", value: "lactente", keywords: ["lactente", "bebê", "0-24", "meses"] },
  { type: "age", value: "pré-escolar", keywords: ["pré-escolar", "2-6", "anos pré"] },
  { type: "age", value: "escolar", keywords: ["escolar", "6-12", "criança"] },
  { type: "age", value: "adolescente", keywords: ["adolescente", "12-18", "ado"] },

  // Domínios comuns
  { type: "domain", value: "ansiedade", keywords: ["ansiedade", "anxiety", "medo"] },
  { type: "domain", value: "desenvolvimento", keywords: ["desenvolvimento", "dev", "marco"] },
  { type: "domain", value: "tdah", keywords: ["tdah", "adhd", "atenção"] },
  { type: "domain", value: "tea", keywords: ["tea", "autismo", "autista"] },
  { type: "domain", value: "inteligência", keywords: ["qi", "inteligência", "iq"] },
  { type: "domain", value: "leitura", keywords: ["leitura", "escrita", "disléxia"] },
  { type: "domain", value: "comportamento", keywords: ["comportamento", "condutas"] },

  // Respondente
  { type: "respondent", value: "pais", keywords: ["pais", "parental", "parent"] },
  { type: "respondent", value: "professor", keywords: ["professor", "escolar", "teacher"] },
  { type: "respondent", value: "clinico", keywords: ["clínico", "médico", "clínica"] },

  // Padrões clínicos
  { type: "pattern", value: "tdah-executiva", keywords: ["tdah executiva", "tdah função"] },
  { type: "pattern", value: "tea-completo", keywords: ["tea completo", "tea diagnóstico"] },
];

/**
 * Processa buscas avançadas
 * Exemplo: "rápida para ansiedade" → GAD-7, SCARED
 */
export function searchAdvanced(query: string): ScaleEntry[] {
  if (!query || query.length < 3) return [];

  const normalized = query.toLowerCase();
  const results: ScaleEntry[] = [];
  const scored: Array<[ScaleEntry, number]> = [];

  for (const scale of allScales) {
    let score = 0;

    // Match contra nome
    if (scale.name.toLowerCase().includes(normalized)) score += 100;

    // Match contra descrição
    const desc = (scale.description || "").toLowerCase();
    if (desc.includes(normalized)) score += 50;

    // Match contra domínios
    const queixasText = scale.queixas?.join(" ").toLowerCase() || "";
    if (queixasText.includes(normalized)) score += 30;

    // Busca inteligente
    if (normalized.includes("<") && normalized.includes("min")) {
      // Ex: "<5min" → busca por escalas com tempo <5 min
      const timeMatch = normalized.match(/<(\d+)/);
      if (timeMatch) {
        const maxMinutes = parseInt(timeMatch[1]);
        const scaleTime = parseInt(scale.tempo?.match(/\d+/)?.[0] || "999");
        if (scaleTime <= maxMinutes) score += 80;
      }
    }

    // Busca por padrão clínico
    for (const pattern of searchPatterns) {
      for (const keyword of pattern.keywords) {
        if (normalized.includes(keyword)) {
          // Priorizar escalas que correspondem ao padrão
          if (scale.queixas?.includes(pattern.value as any)) score += 40;
        }
      }
    }

    if (score > 0) {
      scored.push([scale, score]);
    }
  }

  // Ordenar por score e retornar
  return scored
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([scale]) => scale);
}

/**
 * Sugestões de busca automáticas
 */
export const searchSuggestions = [
  "rápida para ansiedade",
  "padrão-ouro desenvolvimento",
  "<10 minutos",
  "escala inteligência",
  "triagem TDAH",
  "diagnóstico TEA",
  "comportamento crianças",
  "teste escolar",
  "avaliação lactente",
];
