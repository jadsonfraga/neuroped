import type { ScaleEntry } from "./scaleFilter";
import type { OpenScaleSpec } from "./openScaleKit";

/**
 * Kit dos instrumentos AUTORAIS NeuroPed (ondas 2–3). Texto dos itens ORIGINAL (redigido para o contexto
 * brasileiro: família, escola, UBS/SUS), inspirado apenas no CONSTRUTO clínico — nenhum item copiado de
 * instrumento protegido. Sem validação psicométrica, sem ponto de corte: interpretação descritiva.
 */
export const AUTORAL_NOTICE = "Instrumento autoral NeuroPed, sem validação psicométrica. Apoio à decisão clínica, não diagnóstico. Sem ponto de corte: leia as respostas item a item e a soma/média por bloco como descrição, junto da história clínica.";
const SOURCE_URL = "https://github.com/jadsonfraga/neuroped/blob/main/docs/ESCALAS_AUTORAIS_NEUROPED.md";

export const FREQ4 = ["Nunca", "Às vezes", "Frequentemente", "Quase sempre"];
export const INTENS4 = ["Nada", "Um pouco", "Bastante", "Muito"];
export const IMPACT4 = ["Nunca atrapalha", "Atrapalha às vezes", "Atrapalha bastante", "Atrapalha muito"];
export const SKILL4 = ["Ainda não faz", "Faz com ajuda", "Faz às vezes sozinho", "Faz sozinho"];

export interface AuthorialInput {
  wave: 2 | 3;
  id: string;
  name: string;
  fullName: string;
  construct: string; // construto em que o instrumento se inspira (sem citar instrumento protegido)
  ageMin: number; ageMax: number;
  queixas: string[];
  respondente: ScaleEntry["respondente"];
  applicationMode: NonNullable<ScaleEntry["applicationMode"]>;
  assessmentUse: NonNullable<ScaleEntry["assessmentUse"]>;
  prioridade?: ScaleEntry["prioridade"];
  tempo: string;
  primaryDomain: string;
  overlapGroup: string;
  signalTags: string[];
  description: string;
  instruction: string;
  labels?: string[];
  higherBetter?: boolean;
  blocks: Array<{ name: string; items: string[] }>;
  verbalRequirement?: ScaleEntry["verbalRequirement"];
  literacyRequirement?: ScaleEntry["literacyRequirement"];
  psychosisRisk?: boolean; suicideRisk?: boolean;
  extraInfo?: string;
}

export function authorial(a: AuthorialInput): OpenScaleSpec {
  const labels = a.labels ?? FREQ4;
  const n = a.blocks.reduce((t, b) => t + b.items.length, 0);
  return {
    wave: a.wave, id: a.id, name: `${a.name} (autoral)`, fullName: a.fullName,
    ageMin: a.ageMin, ageMax: a.ageMax, queixas: a.queixas, respondente: a.respondente,
    prioridade: a.prioridade ?? "triagem", tempo: a.tempo,
    description: `${a.description} ${AUTORAL_NOTICE}`,
    fonte: `Instrumento autoral NeuroPed (Dr. Jadson Fraga, 2026). Inspirado no construto de ${a.construct}; itens originais em português do Brasil, sem reprodução de instrumento protegido.`,
    validacaoBrasil: "Nenhuma: instrumento autoral NeuroPed, sem validação psicométrica.",
    scoringCutoff: "Sem ponto de corte (descritivo): soma e média por bloco, lidas com a história clínica. Apoio à decisão clínica, não diagnóstico.",
    assessmentUse: a.assessmentUse, applicationMode: a.applicationMode, primaryDomain: a.primaryDomain,
    overlapGroup: a.overlapGroup, signalTags: a.signalTags,
    verbalRequirement: a.verbalRequirement, literacyRequirement: a.literacyRequirement,
    authorial: true, psychosisRisk: a.psychosisRisk, suicideRisk: a.suicideRisk,
    license: { status: "authorial", sourceUrl: SOURCE_URL, verifiedOn: "2026-10-15", attribution: "Instrumento autoral NeuroPed © Dr. Jadson Fraga. Texto original.", note: "Autoria do próprio projeto; nenhum item copiado de terceiros." },
    def: {
      instruction: a.instruction,
      infoBox: `${AUTORAL_NOTICE} ${n} itens. ${a.extraInfo ?? ""}`.trim(),
      labels, optionPoints: labels.map((_, i) => i), scoreDirection: a.higherBetter ? "higher_better" : "higher_worse",
      totalLabel: `${a.name} — soma`, instrumentVersion: `${a.id}-autoral-v1-2026-10-15`,
      descriptiveDomainSummary: true,
      bands: [{ minPct: 0, classification: "Descritivo", color: "amber", description: "Sem faixa interpretativa: instrumento autoral sem validação. Leia item a item e por bloco." }],
      domains: a.blocks,
    },
  };
}
