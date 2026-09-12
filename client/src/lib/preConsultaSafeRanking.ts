import type { ScaleEntry, Respondente, ApplicationMode } from "@/data/scaleFilter";
import { clinicalHardBlock, filterScalesWithClinicalRescue, getApplicationMode, getAssessmentUse, getImplementationStatus, isLicenseRestricted, isPsychosisInstrument, isSuicideInstrument, type FilterContext } from "@/data/advancedFilterLogic";
import type { PreConsultaRecord, PreConsultaRecommendation } from "./preConsultaCore";

type Input = Pick<PreConsultaRecord, "idadeMeses" | "queixa" | "respondente" | "contexto">;
const contexts = new Set(["primeira-consulta", "retorno", "avaliacao-escolar", "ajuste-medicacao", "acompanhamento"]);
const schoolRelevant = new Set(["tea", "tdah", "aprendizagem", "comportamento", "social", "linguagem"]);
export function previsitUpperMinutes(scale: ScaleEntry): number | null {
  const match = (scale.tempo ?? "").match(/^\s*(?:~|≈|até|≤|cerca de)?\s*(\d+(?:[.,]\d+)?)(?:\s*[-–—a]\s*(\d+(?:[.,]\d+)?))?\s*min(?:utos)?\s*$/i);
  if (!match) return null;
  const values = [match[1], match[2]].filter(Boolean).map((n) => Number(n.replace(",", ".")));
  return values.every((n) => Number.isFinite(n) && n > 0) ? Math.ceil(Math.max(...values)) : null;
}

/** Só resolve ambiguidade de modo inferido; nunca altera modo explicitamente declarado. */
export function previsitRespondentVariant(scale: ScaleEntry, role: Respondente): ScaleEntry {
  if (scale.applicationMode || !scale.respondente.includes(role) || scale.respondente.includes("teste_direto_crianca")) return scale;
  const mode: ApplicationMode | undefined = role === "pais" ? "questionario_pais" : role === "professor" ? "questionario_professor" : role === "autoaplicavel" ? "autoquestionario_crianca_adolescente" : undefined;
  return mode ? { ...scale, applicationMode: mode } : scale;
}

export function safePrevisitRecommendations(catalog: ScaleEntry[], input: Input): PreConsultaRecommendation[] {
  if (!Number.isInteger(input.idadeMeses) || input.idadeMeses < 1 || input.idadeMeses > 227 || !input.queixa || !contexts.has(input.contexto)) return [];
  const respondent: Respondente | null = input.respondente === "pais" || input.respondente === "secretaria" ? "pais" : input.respondente === "professor" ? "professor" : input.respondente === "adolescente" ? "autoaplicavel" : null;
  if (!respondent) return [];
  const monitoring = ["retorno", "ajuste-medicacao", "acompanhamento"].includes(input.contexto);
  const queixas = input.contexto === "ajuste-medicacao" ? ["efeitos"] : [input.queixa];
  const ctx: FilterContext = { ageMonths: input.idadeMeses, ageBand: { min: input.idadeMeses, max: input.idadeMeses }, queixas, respondente: respondent, assessmentUse: monitoring ? "monitorizacao" : "triagem", isLiterate: null, isVerbal: null, selectedSignals: [] };
  const seen = new Set<string>();
  const base = catalog.filter((scale) => {
    if (seen.has(scale.id)) return false;
    seen.add(scale.id);
    if (!scale.appRoute || getImplementationStatus(scale) !== "complete" || isLicenseRestricted(scale) || isSuicideInstrument(scale) || isPsychosisInstrument(scale)) return false;
    return getAssessmentUse(scale) !== "psicoeducacao";
  });
  function suitable(scale: ScaleEntry, role: Respondente) {
    if (!scale.respondente.includes(role) || clinicalHardBlock(scale, { ...ctx, respondente: role }) !== null) return false;
    const mode = getApplicationMode(scale);
    if (role === "pais" && mode !== "questionario_pais") return false;
    if (role === "professor" && mode !== "questionario_professor") return false;
    if (role === "autoaplicavel" && mode !== "autoquestionario_crianca_adolescente") return false;
    const use = getAssessmentUse(scale);
    return monitoring ? ["monitorizacao", "seguimento"].includes(use) : !["monitorizacao", "seguimento", "psicoeducacao"].includes(use);
  }
  const candidates = base.map((s) => previsitRespondentVariant(s, respondent)).filter((s) => suitable(s, respondent));
  const ranked = filterScalesWithClinicalRescue(candidates, ctx).filter(({ scale }) => {
    const upper = previsitUpperMinutes(scale);
    return upper !== null && upper <= 15;
  });
  const primary = ranked[0]?.scale;
  const result: PreConsultaRecommendation[] = primary ? [{
    label: "Ouro", scale: primary,
    reason: `Compatível com idade exata, queixa, respondente e finalidade. Formulário completo no app; até ${previsitUpperMinutes(primary)} min informados no catálogo. Uma opção principal, sem repetir outra apenas para preencher posições. A recepção só auxilia a leitura.`,
  }] : [];
  if (respondent !== "professor" && (input.contexto === "avaliacao-escolar" || schoolRelevant.has(input.queixa))) {
    const schoolCtx = { ...ctx, respondente: "professor" as const };
    const schoolCandidates = base.map((s) => previsitRespondentVariant(s, "professor")).filter((s) => suitable(s, "professor") && s.id !== primary?.id);
    const school = filterScalesWithClinicalRescue(schoolCandidates, schoolCtx)[0]?.scale;
    if (school) result.push({ label: "Questionário escolar", scale: school, reason: "Aplicação separada, preenchida pelo professor. Não pedir aos pais que respondam pela escola; não somar informantes nem consumir o tempo da coleta familiar." });
  }
  return result;
}
