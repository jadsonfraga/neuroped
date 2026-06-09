/**
 * BLOQUEIOS SIMPLIFICADOS — Versão funcional para Phase 9
 */

import type { ClinicalScaleMetadata } from "@/types/ClinicalScaleMetadata";
import type { ScaleEntry } from "@/data/scaleFilter";

export interface FilterContext {
  ageMonths?: number;
  canRead?: boolean;
  readingLevel?: "basico" | "nivel2" | "nivel3" | "fluente";
  canWrite?: boolean;
  isVerbal?: boolean;
  parentAvailable?: boolean;
  schoolAvailable?: boolean;
  professionalAvailable?: boolean;
  professionalType?: string;
}

export interface BlockingDecision {
  isBlocked: boolean;
  blockType?: "hard" | "soft";
  reasons: string[];
  recommendation?: string;
}

export function applyAllBlockingRules(
  scale: ScaleEntry & { clinicalMetadata?: ClinicalScaleMetadata },
  context: FilterContext
): BlockingDecision {
  const reasons: string[] = [];
  let blockType: "hard" | "soft" = "soft";

  // Bloqueio por idade
  if (context.ageMonths !== undefined) {
    if (context.ageMonths < scale.ageMin || context.ageMonths > scale.ageMax) {
      reasons.push(`Fora da faixa etária (${Math.round(scale.ageMin / 12)}-${Math.round(scale.ageMax / 12)} anos)`);
      blockType = "hard";
    }
  }

  // Bloqueio por leitura
  if (context.canRead === false && scale.clinicalMetadata?.requiresReading) {
    reasons.push("Exige leitura, mas criança não alfabetizada");
    blockType = "hard";
  }

  // Bloqueio por respondente
  if (context.parentAvailable === false && scale.respondente.includes("pais")) {
    if (!scale.respondente.some(r => r !== "pais")) {
      reasons.push("Exige pais, mas não disponível");
      blockType = "soft";
    }
  }

  if (context.schoolAvailable === false && scale.respondente.includes("professor")) {
    if (!scale.respondente.some(r => r !== "professor")) {
      reasons.push("Exige professor, mas não disponível");
      blockType = "soft";
    }
  }

  // Bloqueio por risco
  if (scale.clinicalMetadata?.misuseRisk === "muito_alto" && context.professionalAvailable === false) {
    reasons.push("Alto risco: exige profissional especializado");
    blockType = "soft";
  }

  return {
    isBlocked: reasons.length > 0,
    blockType: reasons.length > 0 ? blockType : undefined,
    reasons,
    recommendation: reasons.length > 0 ? `Considere usar: ${reasons.join("; ")}` : undefined,
  };
}
