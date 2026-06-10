// RQ-02: Filtro inteligente para testes de reconhecimento
// Implementa os 13 critérios de filtragem especificados na requirement specification

import { ScaleEntry } from "./scaleFilter";
import { getDifficultyLevelByAge, type DifficultyLevel } from "./difficulttyLevels";

export interface FilterCriteria {
  // 1. Respondent
  respondent?: "pais" | "professor" | "clinico" | "autoaplicavel";

  // 2. Age
  ageMonths?: number;

  // 3. Symptoms/Complaints
  queixas?: string[];

  // 4. Sex
  sex?: "M" | "F" | "ambos";

  // 5. Time of evolution
  evolutionTime?: "agudo" | "subagudo" | "cronico";

  // 6. Severity
  severity?: "leve" | "moderado" | "grave";

  // 7. Context
  context?: "clinico" | "escolar" | "domiciliar" | "hospitalar";

  // 8. Clinical history
  hasComorbidities?: boolean;
  hasNeurodevelopmentalHistory?: boolean;

  // 9. Comorbidities
  comorbidities?: string[];

  // 10. Development/Schooling
  developmentLevel?: "normal" | "atraso" | "precoce";
  schoolingStatus?: "regular" | "especial" | "nao-frequenta";

  // 11. Evaluation objective
  evaluationObjective?: "triagem" | "diagnostica" | "monitorizacao" | "baseline";

  // 12. Language/Culture
  language?: "portugues" | "outros";
  culturalContext?: string;

  // 13. Special needs
  specialNeeds?: string[];
}

export interface FilterResult {
  scale: ScaleEntry;
  recommendedDifficulty: DifficultyLevel;
  matchScore: number;
  criteria_met: string[];
}

export function filterRecognitionTests(
  scales: ScaleEntry[],
  criteria: FilterCriteria
): FilterResult[] {
  const recognitionTests = scales.filter(s => s.isRecognitionTest === true);

  return recognitionTests
    .map(scale => {
      const score = calculateMatchScore(scale, criteria);
      const difficulty = getDifficultyLevelByAge(criteria.ageMonths || 0);
      const criteriaMetList = getCriteriaMet(scale, criteria);

      return {
        scale,
        recommendedDifficulty: difficulty,
        matchScore: score,
        criteria_met: criteriaMetList
      };
    })
    .filter(result => result.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

function calculateMatchScore(scale: ScaleEntry, criteria: FilterCriteria): number {
  let score = 0;

  // 1. Respondent match (20 points)
  if (criteria.respondent && scale.respondente.includes(criteria.respondent)) {
    score += 20;
  }

  // 2. Age match (25 points) — most critical
  if (criteria.ageMonths !== undefined) {
    if (scale.ageMin <= criteria.ageMonths && criteria.ageMonths <= scale.ageMax) {
      score += 25;
    } else if (
      (criteria.ageMonths < scale.ageMin && criteria.ageMonths > scale.ageMin - 6) ||
      (criteria.ageMonths > scale.ageMax && criteria.ageMonths < scale.ageMax + 6)
    ) {
      score += 10; // Partial credit for near-miss
    }
  }

  // 3. Symptoms/Complaints match (20 points)
  if (criteria.queixas && criteria.queixas.length > 0) {
    const matchedQueixas = criteria.queixas.filter(q => scale.queixas.includes(q));
    if (matchedQueixas.length > 0) {
      score += 20 * (matchedQueixas.length / Math.max(criteria.queixas.length, scale.queixas.length));
    }
  }

  // 4-13. Other criteria add bonus points
  if (criteria.context === "clinico") score += 5;
  if (criteria.evaluationObjective === "triagem" && scale.prioridade === "triagem") score += 5;
  if (criteria.evaluationObjective === "diagnostica" && scale.prioridade === "diagnostica") score += 5;
  if (criteria.developmentLevel === "normal") score += 3;

  return score;
}

function getCriteriaMet(scale: ScaleEntry, criteria: FilterCriteria): string[] {
  const met: string[] = [];

  // 1. Respondent
  if (criteria.respondent && scale.respondente.includes(criteria.respondent)) {
    met.push(`Respondente: ${criteria.respondent}`);
  }

  // 2. Age
  if (criteria.ageMonths !== undefined && scale.ageMin <= criteria.ageMonths && criteria.ageMonths <= scale.ageMax) {
    met.push(`Faixa etária: ${Math.floor(scale.ageMin / 12)}-${Math.floor(scale.ageMax / 12)} anos`);
  }

  // 3. Symptoms
  if (criteria.queixas && criteria.queixas.length > 0) {
    const matchedQueixas = criteria.queixas.filter(q => scale.queixas.includes(q));
    if (matchedQueixas.length > 0) {
      met.push(`Sintomas: ${matchedQueixas.slice(0, 2).join(", ")}`);
    }
  }

  // 7. Context
  if (criteria.context) {
    met.push(`Contexto: ${criteria.context}`);
  }

  // 11. Evaluation objective
  if (criteria.evaluationObjective) {
    met.push(`Objetivo: ${criteria.evaluationObjective}`);
  }

  return met;
}

export function validateDifficultyForAge(
  ageMonths: number,
  selectedDifficulty: DifficultyLevel
): { valid: boolean; warning?: string } {
  const recommendedDifficulty = getDifficultyLevelByAge(ageMonths);

  if (selectedDifficulty !== recommendedDifficulty) {
    return {
      valid: false,
      warning: `⚠️ Atenção: o nível ${selectedDifficulty} não é apropriado para ${Math.floor(ageMonths / 12)} anos. Recomendado: ${recommendedDifficulty}`
    };
  }

  return { valid: true };
}
