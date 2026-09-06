import source from "./authorialMonitoring.json";
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
  domains: Array<{ name: string; itemIds: string[] }>;
  items: Array<{ id: string; text: string }>;
  redFlags: string[];
  source: { filename: string; integrity: string; date: string; kind: string };
}

const LABELS = [
  "0 — não ocorreu/sem dificuldade",
  "1 — leve ou ocasional",
  "2 — frequente ou com impacto",
  "3 — muito frequente/intenso ou difícil de contornar",
];
const WARNING = "Instrumento clínico autoral de monitorização NeuroPed SDG. Não é teste psicométrico validado e não deve ser usado isoladamente para diagnóstico, indicação terapêutica ou perícia. Não há pontos de corte diagnósticos nem classificação de gravidade validada.";

/** One source supplies both catalog metadata and the delivered questions. */
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

export const authorialMonitoringRecords = validateMonitoringRecords(source);

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
  description: `${r.purpose}. Janela: últimos ${r.timeframeDays} dias. ${WARNING}`,
  fonte: `PDF autoral fornecido ao fluxo NeuroPed: ${r.source.filename}; v${r.version}; integridade ${r.source.integrity}.`,
  tipo: "Instrumento autoral de monitorização, não validado",
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
}));

export const authorialMonitoringItems: Record<string, InteractiveScaleDef> = Object.fromEntries(
  authorialMonitoringRecords.map((r) => {
    const labels = r.responseLabels ? [...r.responseLabels] : [...LABELS];
    const optionPoints = r.optionPoints ? [...r.optionPoints] : labels.map((_, index) => index);
    const hasUnscoredOptions = (r.unscoredOptionIndexes?.length ?? 0) > 0;
    const respondentInstruction = r.respondents.includes("professor")
      ? "Mantenha o mesmo respondente e contexto; família e escola preenchem separadamente."
      : "Mantenha o mesmo responsável/cuidador e o mesmo ambiente de observação sempre que possível.";
    const observabilityInstruction = hasUnscoredOptions
      ? "Quando não houver oportunidade de observar ou a informação for insuficiente, marque NO. NO registra ausência de observabilidade e nunca deve ser convertido em zero. Siga a apuração do PDF: domínio com NO ou item em branco fica incompleto; soma global somente com todos os itens válidos."
      : "Se um item não puder ser observado, deixe-o sem resposta: não conclua nem impute zero.";
    const scoringDescription = hasUnscoredOptions
      ? "O aplicativo registra as respostas por extenso. A apuração numérica é manual conforme o PDF: NO não recebe zero, domínio incompleto não é somado e a soma global só existe com todos os itens válidos. Compare longitudinalmente apenas o mesmo formulário, versão, respondente e ambiente."
      : "Compare com registros anteriores do mesmo respondente e contexto. Queda sugere menor dificuldade relatada; aumento sugere maior dificuldade relatada. Não é evidência isolada de resposta terapêutica ou de diagnóstico. Alertas clínicos independem da soma.";

    return [r.id, {
      instruction: `Responda sobre os últimos ${r.timeframeDays} dias. ${respondentInstruction} ${observabilityInstruction} Seguimento: Basal, S4, S8 e S12.`,
      infoBox: `${r.name} — v${r.version}. ${WARNING}${r.scoringNote ? ` ${r.scoringNote}` : ""}${r.redFlags.length ? ` Alertas independentes da soma: ${r.redFlags.join("; ")}.` : ""}`,
      labels,
      optionPoints,
      scoreDirection: "higher_worse" as const,
      totalLabel: hasUnscoredOptions
        ? `${r.name} — apuração manual conforme PDF; NO não recebe zero`
        : `${r.name} — soma descritiva (0–${r.items.length * 3}); sem ponto de corte`,
      domains: r.domains.map((d) => ({
        name: d.name,
        items: d.itemIds.map((id) => ({ text: r.items.find((item) => item.id === id)!.text })),
      })),
      // Uma faixa única evita transformar a soma em classificação de gravidade.
      bands: [{ minPct: 0, classification: "Registro descritivo — sem classificação diagnóstica", color: "amber", description: scoringDescription }],
    } satisfies InteractiveScaleDef];
  }),
);
