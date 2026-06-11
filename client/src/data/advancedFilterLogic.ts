// Sistema Avançado de Filtragem — Lógica Clínica Refinada
// Incrementa a capacidade de escolha adequada com heurísticas clínicas

import { type ScaleEntry } from "./scaleFilter";

export interface FilterContext {
  queixas: string[];
  ageMonths: number | null; // null = faixa etária não selecionada (sem restrição de idade)
  respondente?: string;
  verbal?: boolean;
  alphabetic?: boolean;
  assessmentType?: "diagnostic" | "monitoring";
  selectedSignals?: string[];
  clinicalContext?: string;
}

export interface RefinedScaleMatch {
  scale: ScaleEntry;
  relevanceScore: number; // 0-100
  clinicalReason: string;
  warningFlags: string[];
  tier: "gold" | "silver" | "bronze" | "conditional";
  confidenceLevel: number; // 0-100
}

// ============ SCORING REFINADO ============

export function calculateRefinedScore(
  scale: ScaleEntry,
  context: FilterContext
): RefinedScaleMatch {
  let score = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];
  let tier: "gold" | "silver" | "bronze" | "conditional" = "conditional";

  // 1. AGE APPROPRIATENESS (35 points max)
  const ageScore = calculateAgeScore(scale, context);
  score += ageScore.points;
  if (ageScore.reason) reasons.push(ageScore.reason);

  // 2. COMPLAINT MATCH (30 points max)
  const queixaScore = calculateQueixaScore(scale, context);
  score += queixaScore.points;
  if (queixaScore.reason) reasons.push(queixaScore.reason);

  // 3. CLINICAL APPROPRIATENESS (20 points max)
  const clinicalScore = calculateClinicalAppropriatenesss(scale, context);
  score += clinicalScore.points;
  if (clinicalScore.reason) reasons.push(clinicalScore.reason);
  if (clinicalScore.warning) warnings.push(clinicalScore.warning);

  // 4. RESPONDENT FIT (10 points max)
  const respondentScore = calculateRespondentFit(scale, context);
  score += respondentScore.points;
  if (respondentScore.reason) reasons.push(respondentScore.reason);

  // 5. METADATA MATCHING (5 points max)
  const metadataScore = calculateMetadataMatch(scale, context);
  score += metadataScore.points;

  // Tier assignment based on score
  if (score >= 85) {
    tier = "gold";
  } else if (score >= 70) {
    tier = "silver";
  } else if (score >= 50) {
    tier = "bronze";
  }

  return {
    scale,
    relevanceScore: Math.min(100, score),
    clinicalReason: reasons.join(" • "),
    warningFlags: warnings,
    tier,
    confidenceLevel: calculateConfidenceLevel(scale, context, score),
  };
}

// ============ COMPONENTES DE SCORE ============

function calculateAgeScore(
  scale: ScaleEntry,
  context: FilterContext
): { points: number; reason: string } {
  const { ageMonths } = context;

  // Sem idade selecionada: pontuação neutra (não penaliza nem privilegia)
  if (ageMonths === null) {
    return { points: 25, reason: "Idade não especificada" };
  }

  // Fora do range: 0 pontos
  if (ageMonths < scale.ageMin || ageMonths > scale.ageMax) {
    return { points: 0, reason: "Fora do range de idade" };
  }

  // Ideal: bem no meio do range
  const rangeSize = scale.ageMax - scale.ageMin;
  const midpoint = scale.ageMin + rangeSize / 2;
  const distanceFromMid = Math.abs(ageMonths - midpoint);
  const percentFromMid = (distanceFromMid / (rangeSize / 2)) * 100;

  let points = 35; // Base
  if (percentFromMid < 20) {
    points = 35; // Perfect
  } else if (percentFromMid < 50) {
    points = 30; // Good
  } else {
    points = 20; // Acceptable
  }

  const reason =
    points === 35
      ? "Idade ideal para escala"
      : points === 30
        ? "Idade adequada"
        : "Idade na margem do range";

  return { points, reason };
}

function calculateQueixaScore(
  scale: ScaleEntry,
  context: FilterContext
): { points: number; reason: string } {
  const { queixas } = context;

  if (queixas.length === 0) {
    return { points: 15, reason: "Sem filtro de queixa selecionado" };
  }

  const matchCount = scale.queixas.filter((q) => queixas.includes(q)).length;
  const perfectMatch = matchCount === queixas.length;
  const anyMatch = matchCount > 0;

  if (perfectMatch) {
    return { points: 30, reason: `Cobre TODAS as ${queixas.length} queixas` };
  } else if (matchCount === queixas.length - 1) {
    return { points: 28, reason: `Cobre ${matchCount} de ${queixas.length} queixas` };
  } else if (anyMatch) {
    return { points: 20 + matchCount * 3, reason: `Cobre ${matchCount} queixas` };
  } else {
    return { points: 0, reason: "Não cobre queixa selecionada" };
  }
}

function calculateClinicalAppropriatenesss(
  scale: ScaleEntry,
  context: FilterContext
): { points: number; reason: string; warning?: string } {
  let points = 15;
  const reasons: string[] = [];
  let warning = "";

  // Prioridade: triagem < diagnóstica < monitorização
  if (context.assessmentType === "diagnostic" && scale.prioridade === "diagnostica") {
    points += 5;
    reasons.push("Escala diagnóstica");
  } else if (context.assessmentType === "monitoring" && scale.prioridade === "monitorizacao") {
    points += 5;
    reasons.push("Escala de monitorização");
  } else if (scale.prioridade === "triagem") {
    points += 2;
    reasons.push("Triagem rápida");
  }

  // Check contra-indicações clínicas
  const scaleId = scale.id.toLowerCase();

  if (scaleId.includes("suicide") || scaleId.includes("suicidio") || scaleId.includes("ecar-si")) {
    if (context.ageMonths !== null && context.ageMonths < 96) {
      warning = "⚠️ Escala de suicídio requer 8+ anos";
      points -= 10;
    }
  }

  if (scaleId.includes("psychosis") || scaleId.includes("psicose") || scaleId.includes("sips") || scaleId.includes("panss")) {
    if (context.ageMonths !== null && context.ageMonths < 144) {
      warning = "⚠️ Escala de psicose requer 12+ anos";
      points -= 10;
    }
  }

  return { points: Math.max(0, points), reason: reasons.join(", "), warning };
}

function calculateRespondentFit(
  scale: ScaleEntry,
  context: FilterContext
): { points: number; reason: string } {
  if (!context.respondente) {
    return { points: 5, reason: "Sem filtro de respondente" };
  }

  if (scale.respondente.includes(context.respondente as ScaleEntry["respondente"][number])) {
    return { points: 10, reason: `Respondente: ${context.respondente}` };
  } else {
    return { points: 0, reason: `Respondente não disponível: ${context.respondente}` };
  }
}

function calculateMetadataMatch(scale: ScaleEntry, context: FilterContext): { points: number } {
  let points = 0;

  if (context.verbal !== undefined && scale.verbal === context.verbal) {
    points += 2;
  }

  if (context.alphabetic !== undefined && scale.alphabetic === context.alphabetic) {
    points += 2;
  }

  if (
    context.assessmentType &&
    (scale.assessment_type === context.assessmentType || scale.assessment_type === "both")
  ) {
    points += 1;
  }

  return { points: Math.min(5, points) };
}

function calculateConfidenceLevel(scale: ScaleEntry, context: FilterContext, score: number): number {
  // Confidence increases with score and complete context
  let confidence = score;

  const contextCompleteness =
    (context.queixas.length > 0 ? 1 : 0) +
    (context.respondente ? 1 : 0) +
    (context.assessmentType ? 1 : 0) +
    (context.selectedSignals && context.selectedSignals.length > 0 ? 1 : 0);

  confidence += contextCompleteness * 5;

  return Math.min(100, Math.round(confidence));
}

// ============ INTELLIGENT FILTERING ============

export function filterScalesIntelligently(
  scales: ScaleEntry[],
  context: FilterContext
): RefinedScaleMatch[] {
  // 1. Basic filtering (must match)
  const candidates = scales.filter((scale) => {
    // Must have age overlap (idade não selecionada => sem restrição)
    if (context.ageMonths !== null && (context.ageMonths < scale.ageMin || context.ageMonths > scale.ageMax)) {
      return false;
    }

    // Must have at least one matching queixa if specified
    if (context.queixas.length > 0) {
      if (!scale.queixas.some((q) => context.queixas.includes(q))) {
        return false;
      }
    }

    // Must have respondent if specified
    if (context.respondente && !scale.respondente.includes(context.respondente as ScaleEntry["respondente"][number])) {
      return false;
    }

    return true;
  });

  // 2. Score each candidate
  const scored = candidates.map((scale) => calculateRefinedScore(scale, context));

  // 3. Sort by relevance, then by tier
  const tierOrder = { gold: 0, silver: 1, bronze: 2, conditional: 3 };
  scored.sort((a, b) => {
    // First by relevance score (descending)
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    // Then by tier
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  // 4. Return top matches
  return scored.slice(0, 20);
}

// ============ CLINICAL PATTERN DETECTION ============

export function detectClinicalPattern(context: FilterContext): string {
  const { queixas, selectedSignals = [] } = context;

  // TDAH pattern
  if (queixas.includes("tdah")) {
    if (selectedSignals.some((s) => s.includes("hiperatividade"))) {
      return "TDAH com hiperatividade predominante";
    }
    if (selectedSignals.some((s) => s.includes("desatenção"))) {
      return "TDAH com desatenção predominante";
    }
    return "TDAH misto";
  }

  // TEA pattern
  if (queixas.includes("tea")) {
    const hasLanguage = selectedSignals.some((s) => s.includes("linguagem"));
    const hasSocial = selectedSignals.some((s) => s.includes("social"));
    if (hasLanguage && hasSocial) {
      return "TEA com déficit social-comunicativo";
    }
    if (hasLanguage) {
      return "TEA com atraso de linguagem";
    }
    return "Suspeita TEA";
  }

  // Development pattern
  if (queixas.includes("atraso")) {
    const hasMotor = selectedSignals.some((s) => s.includes("motor"));
    const hasLanguage = selectedSignals.some((s) => s.includes("linguagem"));
    if (hasMotor && hasLanguage) {
      return "Atraso desenvolvimento global";
    }
    if (hasMotor) {
      return "Atraso motor";
    }
    if (hasLanguage) {
      return "Atraso de linguagem";
    }
    return "Suspeita atraso desenvolvimento";
  }

  return "Avaliação geral";
}

// ============ RECOMENDAÇÕES CONTEXTUAIS ============

export function generateContextualRecommendation(matches: RefinedScaleMatch[]): string {
  if (matches.length === 0) {
    return "Nenhuma escala adequada encontrada para este perfil. Refine os filtros.";
  }

  const gold = matches.filter((m) => m.tier === "gold");
  const silver = matches.filter((m) => m.tier === "silver");

  if (gold.length > 0) {
    return `Recomendado: ${gold[0].scale.name} — ${gold[0].clinicalReason}`;
  } else if (silver.length > 0) {
    return `Segunda opção: ${silver[0].scale.name} — ${silver[0].clinicalReason}`;
  }

  return `Disponível: ${matches[0].scale.name}`;
}
