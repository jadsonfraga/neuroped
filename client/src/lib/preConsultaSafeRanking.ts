import type { ScaleEntry, Respondente } from "@/data/scaleFilter";
import { clinicalHardBlock, filterScalesWithClinicalRescue, getApplicationMode, getAssessmentUse, getImplementationStatus, isLicenseRestricted, isPsychosisInstrument, isSuicideInstrument, type FilterContext } from "@/data/advancedFilterLogic";
import type { PreConsultaRecord, PreConsultaRecommendation } from "./preConsultaCore";

type Input = Pick<PreConsultaRecord, "idadeMeses" | "queixa" | "respondente" | "contexto">;
const contexts = new Set(["primeira-consulta", "retorno", "avaliacao-escolar", "ajuste-medicacao", "acompanhamento"]);
const schoolRelevant = new Set(["tea", "tdah", "aprendizagem", "comportamento", "social", "linguagem"]);
export function previsitUpperMinutes(scale: ScaleEntry): number | null {
  const value = scale.tempo?.toLowerCase() ?? "";
  if (!/min/.test(value) || /não aferido|nao aferido|não estimado/.test(value)) return null;
  const numbers = [...value.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(",", ".")));
  if (!numbers.length || numbers.some((n) => !Number.isFinite(n) || n <= 0)) return null;
  return Math.ceil(Math.max(...numbers));
}

/** Reutiliza bloqueios do motor canônico; não transforma incompatibilidade em mero peso baixo. */
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
    if (["psicoeducacao"].includes(getAssessmentUse(scale))) return false;
    return true;
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
  const candidates = base.filter((scale) => suitable(scale, respondent));
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
    const school = filterScalesWithClinicalRescue(base.filter((s) => suitable(s, "professor") && s.id !== primary?.id), schoolCtx)[0]?.scale;
    if (school) result.push({ label: "Questionário escolar", scale: school, reason: "Aplicação separada, preenchida pelo professor. Não pedir aos pais que respondam pela escola; não somar informantes nem consumir o tempo da coleta familiar." });
  }
  return result;
}
