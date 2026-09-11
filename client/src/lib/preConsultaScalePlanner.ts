import { allScales, type AssessmentUse, type ScaleEntry } from "@/data/scaleFilter";
import { mergeFilterableCatalog } from "@/data/filterableCatalog";
import {
  filterScalesWithClinicalRescue,
  getAssessmentUse,
  getImplementationStatus,
  type FilterContext,
  type RefinedScaleMatch,
} from "@/data/advancedFilterLogic";
import { noCostWorldScales } from "@/data/noCostWorldScales";

export type PreVisitPlannerRespondent = "pais" | "adolescente" | "professor" | "secretaria";
export type PreVisitPlannerContext =
  | "primeira-consulta"
  | "retorno"
  | "avaliacao-escolar"
  | "ajuste-medicacao"
  | "acompanhamento";

export interface PreVisitPlannerInput {
  idadeMeses: number;
  queixa: string;
  queixas?: string[];
  respondente: PreVisitPlannerRespondent;
  contexto: PreVisitPlannerContext;
}

export interface PlannedPreVisitScale {
  slot: "principal" | "complementar" | "escola";
  scale?: ScaleEntry;
  reason: string;
  estimatedMinutes?: number;
  relevanceScore?: number;
  inClinic: boolean;
}

export const PRE_VISIT_PARENT_TIME_BUDGET_MINUTES = 15;

const CATALOG = mergeFilterableCatalog([...allScales, ...noCostWorldScales]);
const SCHOOL_SENSITIVE = new Set([
  "aprendizagem",
  "tdah",
  "tea",
  "comportamento",
  "social",
  "funcionalidade",
  "linguagem",
]);

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function selectedPreVisitComplaints(input: PreVisitPlannerInput): string[] {
  const selected = unique(
    input.queixas?.length ? input.queixas : input.queixa ? [input.queixa] : [],
  );
  if (input.contexto === "ajuste-medicacao" && !selected.includes("efeitos")) {
    selected.push("efeitos");
  }
  return selected;
}

export function estimateScaleMinutes(scale: ScaleEntry): number {
  const matches = scale.tempo?.match(/\d+(?:[.,]\d+)?/g) ?? [];
  const nums = matches
    .slice(0, 2)
    .map((value) => Number(value.replace(",", ".")))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!nums.length) return 8;
  return Math.ceil(Math.max(...nums));
}

function ageCompatible(scale: ScaleEntry, ageMonths: number): boolean {
  return ageMonths >= scale.ageMin && ageMonths <= scale.ageMax;
}

function baseFillable(scale: ScaleEntry, ageMonths: number): boolean {
  if (!ageCompatible(scale, ageMonths)) return false;
  if (!scale.appRoute) return false;
  if (getImplementationStatus(scale) !== "complete") return false;
  if (getAssessmentUse(scale) === "psicoeducacao") return false;
  if (scale.suicideRiskInstrument || scale.psychosisRiskInstrument) return false;
  return true;
}

function parentFillable(scale: ScaleEntry, ageMonths: number): boolean {
  if (!baseFillable(scale, ageMonths) || !scale.respondente.includes("pais")) {
    return false;
  }
  if (scale.applicationMode && scale.applicationMode !== "questionario_pais") {
    return false;
  }
  return true;
}

function teacherFillable(scale: ScaleEntry, ageMonths: number): boolean {
  if (!baseFillable(scale, ageMonths) || !scale.respondente.includes("professor")) {
    return false;
  }
  if (
    scale.applicationMode &&
    scale.applicationMode !== "questionario_professor"
  ) {
    return false;
  }
  return true;
}

function purposeForContext(context: PreVisitPlannerContext): AssessmentUse {
  if (context === "ajuste-medicacao") return "monitorizacao";
  if (context === "retorno" || context === "acompanhamento") return "seguimento";
  return "triagem";
}

function runEngine(
  input: PreVisitPlannerInput,
  respondent: "pais" | "professor",
  candidates: ScaleEntry[],
  assessmentUse = purposeForContext(input.contexto),
): RefinedScaleMatch[] {
  const complaints = selectedPreVisitComplaints(input);
  const ctx: FilterContext = {
    queixas: complaints,
    ageMonths: input.idadeMeses,
    ageBand: { min: input.idadeMeses, max: input.idadeMeses },
    respondente: respondent,
    assessmentUse,
    isLiterate: null,
    isVerbal: null,
    selectedSignals: [],
  };
  return filterScalesWithClinicalRescue(candidates, ctx);
}

function qualityBonus(scale: ScaleEntry, context: PreVisitPlannerContext): number {
  const validation = scale.validacaoBrasil?.toLowerCase() ?? "";
  let bonus = validation.startsWith("sim") ? 5 : 0;
  if (
    scale.licencaUso === "autoral" &&
    ["retorno", "acompanhamento", "ajuste-medicacao"].includes(context)
  ) {
    bonus += 3;
  }
  const minutes = estimateScaleMinutes(scale);
  if (minutes <= 5) bonus += 3;
  else if (minutes <= 8) bonus += 1;
  else if (minutes > PRE_VISIT_PARENT_TIME_BUDGET_MINUTES) bonus -= 10;
  return bonus;
}

function complaintCoverage(scale: ScaleEntry, complaints: string[]): string[] {
  return complaints.filter((complaint) => scale.queixas.includes(complaint));
}

function adjustedScore(match: RefinedScaleMatch, input: PreVisitPlannerInput): number {
  return match.relevanceScore + qualityBonus(match.scale, input.contexto);
}

function reasonFor(
  match: RefinedScaleMatch,
  input: PreVisitPlannerInput,
  role: "principal" | "complementar",
): string {
  const complaints = selectedPreVisitComplaints(input);
  const covered = complaintCoverage(match.scale, complaints);
  const minutes = estimateScaleMinutes(match.scale);
  const purpose = getAssessmentUse(match.scale);
  const coverageText = covered.length
    ? `cobre ${covered.join(", ")}`
    : "acrescenta visão funcional complementar";
  return role === "principal"
    ? `Melhor combinação segura para idade e pais: ${coverageText}, finalidade ${purpose}, aplicação completa no app (~${minutes} min).`
    : `Complementa sem repetir apenas a mesma pergunta clínica: ${coverageText}, finalidade ${purpose}, aplicação completa (~${minutes} min).`;
}

function chooseParentBattery(
  matches: RefinedScaleMatch[],
  input: PreVisitPlannerInput,
): PlannedPreVisitScale[] {
  const complaints = selectedPreVisitComplaints(input);
  const sorted = [...matches].sort(
    (a, b) => adjustedScore(b, input) - adjustedScore(a, input),
  );
  const principal = sorted[0];
  if (!principal) return [];

  const result: PlannedPreVisitScale[] = [
    {
      slot: "principal",
      scale: principal.scale,
      reason: reasonFor(principal, input, "principal"),
      estimatedMinutes: estimateScaleMinutes(principal.scale),
      relevanceScore: principal.relevanceScore,
      inClinic: true,
    },
  ];

  const firstMinutes = estimateScaleMinutes(principal.scale);
  const firstCoverage = new Set(complaintCoverage(principal.scale, complaints));
  const firstUse = getAssessmentUse(principal.scale);

  const complement = sorted
    .slice(1)
    .map((match) => {
      const minutes = estimateScaleMinutes(match.scale);
      if (firstMinutes + minutes > PRE_VISIT_PARENT_TIME_BUDGET_MINUTES) {
        return null;
      }
      const coverage = complaintCoverage(match.scale, complaints);
      const newCoverage = coverage.filter((item) => !firstCoverage.has(item)).length;
      const sameUse = getAssessmentUse(match.scale) === firstUse;
      const sharedCoverage = coverage.filter((item) => firstCoverage.has(item)).length;
      const redundancyPenalty =
        sameUse && newCoverage === 0 && sharedCoverage > 0 ? 14 : 0;
      const diversityBonus = newCoverage * 9 + (sameUse ? 0 : 4);
      return {
        match,
        value: adjustedScore(match, input) + diversityBonus - redundancyPenalty,
      };
    })
    .filter(
      (value): value is { match: RefinedScaleMatch; value: number } =>
        value !== null,
    )
    .sort((a, b) => b.value - a.value)[0]?.match;

  if (complement) {
    result.push({
      slot: "complementar",
      scale: complement.scale,
      reason: reasonFor(complement, input, "complementar"),
      estimatedMinutes: estimateScaleMinutes(complement.scale),
      relevanceScore: complement.relevanceScore,
      inClinic: true,
    });
  }

  return result;
}

function shouldOfferSchoolForm(input: PreVisitPlannerInput): boolean {
  if (input.contexto === "avaliacao-escolar") return true;
  return selectedPreVisitComplaints(input).some((item) => SCHOOL_SENSITIVE.has(item));
}

export function planPreVisitScales(
  input: PreVisitPlannerInput,
): PlannedPreVisitScale[] {
  const parentCandidates = CATALOG.filter((scale) =>
    parentFillable(scale, input.idadeMeses),
  );
  let parentMatches = runEngine(input, "pais", parentCandidates);

  // Primeira consulta: a escala principal deve responder à triagem; um monitor
  // longitudinal pode entrar apenas como complemento e dentro do orçamento.
  if (input.contexto === "primeira-consulta") {
    const baseline = runEngine(
      input,
      "pais",
      parentCandidates.filter((scale) =>
        ["monitorizacao", "seguimento"].includes(getAssessmentUse(scale)),
      ),
      "monitorizacao",
    );
    const seen = new Set(parentMatches.map((item) => item.scale.id));
    parentMatches = [
      ...parentMatches,
      ...baseline.filter((item) => !seen.has(item.scale.id)),
    ];
  }

  const planned = chooseParentBattery(parentMatches, input);

  if (shouldOfferSchoolForm(input)) {
    const teacherCandidates = CATALOG.filter((scale) =>
      teacherFillable(scale, input.idadeMeses),
    );
    const teacherMatches = runEngine(input, "professor", teacherCandidates);
    const alreadyChosen = new Set(
      planned.flatMap((item) => (item.scale ? [item.scale.id] : [])),
    );
    const school = teacherMatches.find((item) => !alreadyChosen.has(item.scale.id));
    if (school) {
      planned.push({
        slot: "escola",
        scale: school.scale,
        reason:
          "Formulário separado para a escola: acrescenta observação de outro contexto e não consome o tempo da bateria respondida pelos pais no consultório.",
        estimatedMinutes: estimateScaleMinutes(school.scale),
        relevanceScore: school.relevanceScore,
        inClinic: false,
      });
    }
  }

  return planned;
}

export function estimatedParentBatteryMinutes(
  items: PlannedPreVisitScale[],
): number {
  return items
    .filter((item) => item.inClinic && item.scale)
    .reduce((sum, item) => sum + (item.estimatedMinutes ?? 0), 0);
}
