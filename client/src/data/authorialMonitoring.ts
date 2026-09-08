import source from "./authorialMonitoring.json";
import channelSource from "./authorialMonitoringChannel2026.json";
import mcriSource from "./authorialMonitoringMcri2026.json";
import reviewSource from "./authorialMonitoringReview20260908.json";
import type { ScaleEntry, Respondente } from "./scaleFilter";
import type { InteractiveScaleDef } from "./interactiveScaleItems";

interface MonitoringRecord {
  id: string;
  version: string;
  name: string;
  fullName: string;
  author: string;
  brand: string;
  validationStatus: "not_validated_authorial";
  clinicalReviewStatus: "pending" | "reviewed";
  ageMinMonths: number;
  ageMaxMonths: number;
  timeframeDays: number;
  queixas: string[];
  respondents: Respondente[];
  purpose: string;
  signalTags: string[];
  responseLabels?: string[];
  optionPoints?: number[];
  unscoredOptionIndexes?: number[];
  scoringNote?: string;
  applicationNote?: string;
  suppressGlobalScore?: boolean;
  catalogRole?: string;
  catalogStatus?: "active" | "historical";
  autoRecommend?: boolean;
  reviewProvenance?: string;
  domains: Array<{ name: string; itemIds: string[] }>;
  items: Array<{ id: string; text: string }>;
  redFlags: string[];
  source: { filename: string; integrity: string; date: string; kind: string };
}

interface MonitoringReviewOverride {
  version?: string;
  clinicalReviewStatus?: "pending" | "reviewed";
  respondents?: Respondente[];
  responseLabels?: string[];
  optionPoints?: number[];
  unscoredOptionIndexes?: number[];
  scoringNote?: string;
  applicationNote?: string;
  suppressGlobalScore?: boolean;
  catalogRole?: string;
  catalogStatus?: "active" | "historical";
  autoRecommend?: boolean;
  reviewProvenance?: string;
}

interface MonitoringReviewSource {
  reviewId: string;
  approvedAt: string;
  approvedBy: string;
  scope: string;
  overrides: Record<string, MonitoringReviewOverride>;
}

const LABELS = [
  "0 — não ocorreu/sem dificuldade",
  "1 — leve ou ocasional",
  "2 — frequente ou com impacto",
  "3 — muito frequente/intenso ou difícil de contornar",
];
const WARNING = "Instrumento clínico autoral de monitorização NeuroPed SDG. Não é teste psicométrico validado e não deve ser usado isoladamente para diagnóstico, indicação terapêutica ou perícia. Não há pontos de corte diagnósticos nem classificação de gravidade validada.";

/** Schema-validated authorial sources supply both catalog metadata and delivered questions. This is structural validation only, not clinical or psychometric validation. */
export function validateMonitoringRecords(input: unknown): MonitoringRecord[] {
  if (!Array.isArray(input)) throw new Error("Catálogo autoral deve ser uma lista.");
  const ids = new Set<string>();
  const names = new Set<string>();
  return input.map((value) => {
    if (!value || typeof value !== "object") throw new Error("Registro autoral inválido.");
    const r = value as MonitoringRecord;
    const label = typeof r.id === "string" ? r.id : "sem-id";
    const fail = (field: string): never => { throw new Error(`${label}: ${field} inválido.`); };
    if (typeof r.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.id)) fail("id");
    if (ids.has(r.id)) fail("id duplicado");
    ids.add(r.id);
    for (const field of ["version", "name", "fullName", "purpose", "author", "brand"] as const) {
      if (typeof r[field] !== "string" || !r[field].trim()) fail(field);
    }
    const nameKey = r.name.normalize("NFKC").trim().toLocaleLowerCase("pt-BR");
    if (names.has(nameKey)) fail("nome duplicado");
    names.add(nameKey);
    if (r.validationStatus !== "not_validated_authorial") fail("validação");
    if (!["pending", "reviewed"].includes(r.clinicalReviewStatus)) fail("revisão clínica");
    if (!Number.isInteger(r.ageMinMonths) || !Number.isInteger(r.ageMaxMonths) || r.ageMinMonths < 0 || r.ageMinMonths > r.ageMaxMonths) fail("idade");
    if (!Number.isInteger(r.timeframeDays) || r.timeframeDays < 1) fail("janela temporal");
    if (!Array.isArray(r.respondents) || !r.respondents.length || r.respondents.some((x) => !["pais", "professor", "clinico", "autoaplicavel", "crianca", "teste_direto_crianca"].includes(x))) fail("respondente");
    for (const field of ["queixas", "signalTags", "redFlags"] as const) {
      if (!Array.isArray(r[field]) || r[field].some((x) => typeof x !== "string" || !x.trim())) fail(field);
    }
    if (!r.queixas.length) fail("queixas");

    const responseLabels = r.responseLabels ?? LABELS;
    if (!Array.isArray(responseLabels) || responseLabels.length < 2 || responseLabels.length > 8 || responseLabels.some((x) => typeof x !== "string" || !x.trim())) fail("opções de resposta");
    if (new Set(responseLabels).size !== responseLabels.length) fail("opções de resposta duplicadas");
    if (r.optionPoints !== undefined && (!Array.isArray(r.optionPoints) || r.optionPoints.length !== responseLabels.length || r.optionPoints.some((x) => typeof x !== "number" || !Number.isFinite(x)))) fail("pontuação das opções");
    if (r.unscoredOptionIndexes !== undefined) {
      if (!Array.isArray(r.unscoredOptionIndexes) || new Set(r.unscoredOptionIndexes).size !== r.unscoredOptionIndexes.length || r.unscoredOptionIndexes.some((x) => !Number.isInteger(x) || x < 0 || x >= responseLabels.length)) fail("opções sem escore");
    }
    if (r.scoringNote !== undefined && (typeof r.scoringNote !== "string" || !r.scoringNote.trim())) fail("regra de apuração");
    for (const field of ["applicationNote", "catalogRole", "reviewProvenance"] as const) {
      if (r[field] !== undefined && (typeof r[field] !== "string" || !r[field]!.trim())) fail(field);
    }
    if (r.suppressGlobalScore !== undefined && typeof r.suppressGlobalScore !== "boolean") fail("supressão de escore global");
    if (r.autoRecommend !== undefined && typeof r.autoRecommend !== "boolean") fail("recomendação automática");
    if (r.catalogStatus !== undefined && !["active", "historical"].includes(r.catalogStatus)) fail("status de catálogo");
    if (r.clinicalReviewStatus === "reviewed" && !r.reviewProvenance) fail("proveniência da revisão clínica");

    if (!r.source || !/^sha256:[a-f0-9]{64}$/.test(r.source.integrity) || typeof r.source.filename !== "string" || !r.source.filename.endsWith(".pdf")) fail("proveniência PDF");
    if (!Array.isArray(r.items) || !r.items.length || r.items.some((x) => typeof x.id !== "string" || typeof x.text !== "string" || !x.text.trim())) fail("itens");
    const itemIds = r.items.map((x) => x.id);
    if (new Set(itemIds).size !== itemIds.length) fail("item duplicado");
    if (!Array.isArray(r.domains) || !r.domains.length || r.domains.some((d) => typeof d.name !== "string" || !d.name.trim() || !Array.isArray(d.itemIds) || !d.itemIds.length)) fail("domínios");
    const assigned = r.domains.flatMap((d) => d.itemIds);
    if (assigned.length !== itemIds.length || new Set(assigned).size !== itemIds.length || assigned.some((id) => !itemIds.includes(id))) fail("cobertura dos domínios");
    return r;
  });
}

function applyApprovedReview(records: MonitoringRecord[]): MonitoringRecord[] {
  const review = reviewSource as MonitoringReviewSource;
  if (!review.reviewId || !review.approvedAt || !review.approvedBy || !review.scope || !review.overrides) {
    throw new Error("Metadados da revisão clínica autoral inválidos.");
  }
  const knownIds = new Set(records.map((record) => record.id));
  for (const id of Object.keys(review.overrides)) {
    if (!knownIds.has(id)) throw new Error(`Revisão clínica aponta instrumento desconhecido: ${id}`);
  }
  return records.map((record) => {
    const override = review.overrides[record.id];
    if (!override) return record;
    return {
      ...record,
      version: override.version ?? record.version,
      clinicalReviewStatus: override.clinicalReviewStatus ?? record.clinicalReviewStatus,
      respondents: override.respondents ?? record.respondents,
      responseLabels: override.responseLabels ?? record.responseLabels,
      optionPoints: override.optionPoints ?? record.optionPoints,
      unscoredOptionIndexes: override.unscoredOptionIndexes ?? record.unscoredOptionIndexes,
      scoringNote: override.scoringNote ?? record.scoringNote,
      applicationNote: override.applicationNote ?? record.applicationNote,
      suppressGlobalScore: override.suppressGlobalScore ?? record.suppressGlobalScore,
      catalogRole: override.catalogRole ?? record.catalogRole,
      catalogStatus: override.catalogStatus ?? record.catalogStatus,
      autoRecommend: override.autoRecommend ?? record.autoRecommend,
      reviewProvenance: override.reviewProvenance ?? record.reviewProvenance,
    };
  });
}

const rawAuthorialMonitoringRecords = validateMonitoringRecords([...source, ...channelSource, ...mcriSource]);
export const authorialMonitoringRecords = validateMonitoringRecords(applyApprovedReview(rawAuthorialMonitoringRecords));

export const authorialMonitoringCatalog: ScaleEntry[] = authorialMonitoringRecords.map((r) => ({
  id: r.id,
  name: r.name,
  fullName: `${r.fullName} — v${r.version}`,
  ageMin: r.ageMinMonths,
  ageMax: r.ageMaxMonths,
  queixas: r.queixas,
  respondente: r.respondents,
  prioridade: "monitorizacao",
  assessmentUse: "monitorizacao",
  tempo: "Não aferido",
  appRoute: `/generic-scale/${r.id}`,
  description: [r.catalogRole, r.purpose, `Janela: últimos ${r.timeframeDays} dias.`, r.applicationNote, WARNING].filter(Boolean).join(" "),
  fonte: `Base documental autoral: ${r.source.filename}; integridade ${r.source.integrity}. ${r.reviewProvenance ?? `Versão operacional registrada: ${r.version}.`}`,
  tipo: r.catalogStatus === "historical"
    ? "Instrumento autoral de monitorização — histórico, não validado"
    : "Instrumento autoral de monitorização, não validado",
  licencaUso: "autoral",
  pubmedId: null,
  validacaoBrasil: "Sem validação psicométrica publicada.",
  scoringCutoff: r.scoringNote ?? "Soma descritiva; sem pontos de corte diagnósticos ou de gravidade.",
  implementationStatus: "complete",
  pendente_validacao_clinica: r.clinicalReviewStatus !== "reviewed",
  pendencia: r.clinicalReviewStatus !== "reviewed" ? "Rascunho clínico autoral: revisão médica permanece necessária; disponibilidade no app não equivale a validação." : undefined,
  verbalRequirement: "indiferente",
  literacyRequirement: "indiferente",
  suicideRiskInstrument: false,
  psychosisRiskInstrument: false,
  signalTags: r.signalTags,
  autoRecommend: r.autoRecommend ?? true,
  catalogStatus: r.catalogStatus ?? "active",
}));

export const authorialMonitoringItems: Record<string, InteractiveScaleDef> = Object.fromEntries(
  authorialMonitoringRecords.map((r) => {
    const labels = r.responseLabels ? [...r.responseLabels] : [...LABELS];
    const optionPoints = r.optionPoints ? [...r.optionPoints] : labels.map((_, index) => index);
    const hasUnscoredOptions = (r.unscoredOptionIndexes?.length ?? 0) > 0;
    const maxScoredPoint = Math.max(0, ...optionPoints.filter((_, index) => !(r.unscoredOptionIndexes ?? []).includes(index)));
    const hasProfessor = r.respondents.includes("professor");
    const hasClinician = r.respondents.includes("clinico");
    const respondentInstruction = hasProfessor && hasClinician
      ? "Mantenha o mesmo respondente e contexto por aplicação; família, escola/professor e clínico/profissional preenchem em formulários separados e não devem ter respostas combinadas numericamente."
      : hasProfessor
        ? "Mantenha o mesmo respondente e contexto; família e escola preenchem separadamente."
        : hasClinician
          ? "Mantenha o mesmo respondente e contexto por aplicação; cuidador e clínico registram separadamente quando ambos forem utilizados."
          : "Mantenha o mesmo responsável/cuidador e o mesmo ambiente de observação sempre que possível.";
    const observabilityInstruction = hasUnscoredOptions
      ? r.suppressGlobalScore
        ? "Quando não houver oportunidade de observar, o item não for aplicável ou a informação for insuficiente, marque NO. NO registra ausência de observabilidade/aplicabilidade e nunca deve ser convertido em zero. Domínio com NO ou item em branco fica incompleto; não calcule total global."
        : "Quando não houver oportunidade de observar ou a informação for insuficiente, marque NO. NO registra ausência de observabilidade e nunca deve ser convertido em zero. Siga a apuração registrada: domínio com NO ou item em branco fica incompleto; soma global somente com todos os itens válidos."
      : "Se um item não puder ser observado, deixe-o sem resposta: não conclua nem impute zero.";
    const scoringDescription = hasUnscoredOptions
      ? r.suppressGlobalScore
        ? "O aplicativo registra as respostas por extenso. A apuração numérica é por domínio: NO não recebe zero, domínio incompleto não é somado e não existe total global clínico. Compare longitudinalmente apenas o mesmo formulário, versão, respondente e ambiente."
        : "O aplicativo registra as respostas por extenso. A apuração numérica é manual: NO não recebe zero, domínio incompleto não é somado e a soma global só existe com todos os itens válidos. Compare longitudinalmente apenas o mesmo formulário, versão, respondente e ambiente."
      : "Compare com registros anteriores do mesmo respondente e contexto. Queda sugere menor dificuldade relatada; aumento sugere maior dificuldade relatada. Não é evidência isolada de resposta terapêutica ou de diagnóstico. Alertas clínicos independem da soma.";
    const applicationInstruction = r.applicationNote ? ` ${r.applicationNote}` : "";

    return [r.id, {
      instruction: `Responda sobre os últimos ${r.timeframeDays} dias. ${respondentInstruction} ${observabilityInstruction}${applicationInstruction} Repita no intervalo definido pelo plano clínico, mantendo versão, respondente e contexto comparáveis.`,
      infoBox: `${r.name} — v${r.version}. ${WARNING}${r.scoringNote ? ` ${r.scoringNote}` : ""}${r.redFlags.length ? ` Alertas independentes da soma: ${r.redFlags.join("; ")}.` : ""}`,
      labels,
      optionPoints,
      scoreDirection: "higher_worse" as const,
      suppressGlobalScore: r.suppressGlobalScore,
      totalLabel: r.suppressGlobalScore
        ? `${r.name} — interpretar por domínios; sem total global`
        : hasUnscoredOptions
          ? `${r.name} — apuração manual; NO não recebe zero`
          : `${r.name} — soma descritiva (0–${r.items.length * maxScoredPoint}); sem ponto de corte`,
      domains: r.domains.map((d) => ({
        name: d.name,
        items: d.itemIds.map((id) => ({ text: r.items.find((item) => item.id === id)!.text })),
      })),
      // Uma faixa única evita transformar a soma em classificação de gravidade.
      bands: [{ minPct: 0, classification: "Registro descritivo — sem classificação diagnóstica", color: "amber", description: scoringDescription }],
    } satisfies InteractiveScaleDef];
  }),
);