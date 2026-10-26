import { QUEIXA_COOCORRENCIA, type ScaleEntry, type Respondente, type ApplicationMode } from "@/data/scaleFilter";
import { BROADBAND_SCREENER_IDS, clinicalHardBlock, filterScalesWithClinicalRescue, outsideConditionAnchor, getApplicationMode, getAssessmentUse, getImplementationStatus, isLicenseRestricted, isPsychosisInstrument, isSuicideInstrument, type FilterContext, type RefinedScaleMatch } from "@/data/advancedFilterLogic";
import { curatedRouteKey, firstLineByQueixa } from "@/data/preConsultaCurated";
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

/** Queixa da pré-consulta → domínio do catálogo (quando o nome difere). */
export const PREVISIT_QUEIXA_DOMAIN: Record<string, string> = { cefaleia: "dor" };
/** Posições fixas da pré-consulta: sempre três para o respondente, quando há instrumentos seguros. */
export const PREVISIT_POSITIONS = ["Ouro", "Prata", "Bronze"] as const;

/** Família do instrumento: variantes do mesmo instrumento não ocupam duas posições. */
export function previsitFamily(scale: ScaleEntry): string {
  return scale.name.split(/\s+[·—–-]\s+/)[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
}

type Tier = "direta" | "seguimento" | "coocorrencia" | "banda-larga" | "tempo-maior" | "respondente-alternativo" | "dominio-proximo" | "funcional" | "funcional-tempo-maior";
const TIER_REASON: Record<Tier, string> = {
  direta: "Compatível com idade exata, queixa, respondente e finalidade; a curadoria clínica só ordena depois desses critérios.",
  seguimento: "Sem instrumento de seguimento compatível para esta queixa: reaplicar este instrumento de triagem para comparar com a aplicação anterior.",
  coocorrencia: "Complementar — menor aderência à queixa: cobre um domínio que costuma acompanhar esta queixa.",
  funcional: "Complementar — registro descritivo da autonomia e de pedido espontâneo de ajuda; instrumento autoral, sem diagnóstico isolado.",
  "funcional-tempo-maior": "Complementar — registro funcional de autonomia e pedido espontâneo de ajuda, acima de 15 min (até 30 min no catálogo); instrumento autoral sem diagnóstico isolado.",
  "banda-larga": "Complementar — menor aderência à queixa: rastreio amplo apropriado à idade e ao respondente.",
  "tempo-maior": "Complementar — instrumento relevante mais próximo, com tempo acima de 15 min (até 30 min informados no catálogo): não há alternativa mais curta compatível.",
  "dominio-proximo": "Complementar — domínio mais próximo disponível: não há instrumento aberto para esta queixa nesta idade; rastreio de desenvolvimento/comportamento apropriado à idade.",
  "respondente-alternativo": "Complementar — respondente alternativo: não há instrumento aberto para o respondente pedido nesta idade/queixa; quem responde são os pais/cuidadores (não é a escola).",
};
/** `fill`: completa posições vazias com o instrumento relevante mais próximo (rotulado). Sem `fill`, comportamento anterior. */
export interface PrevisitOptions { fill?: boolean }

export function safePrevisitRecommendations(catalog: ScaleEntry[], input: Input, options: PrevisitOptions = {}): PreConsultaRecommendation[] {
  if (!Number.isInteger(input.idadeMeses) || input.idadeMeses < 1 || input.idadeMeses > 227 || !input.queixa || !contexts.has(input.contexto)) return [];
  const respondent: Respondente | null = input.respondente === "pais" || input.respondente === "secretaria" ? "pais" : input.respondente === "professor" ? "professor" : input.respondente === "adolescente" ? "autoaplicavel" : null;
  if (!respondent) return [];
  const monitoring = ["retorno", "ajuste-medicacao", "acompanhamento"].includes(input.contexto);
  const domain = PREVISIT_QUEIXA_DOMAIN[input.queixa] ?? input.queixa;
  const queixas = input.contexto === "ajuste-medicacao" ? ["efeitos"] : [domain];
  const ctx: FilterContext = { ageMonths: input.idadeMeses, ageBand: { min: input.idadeMeses, max: input.idadeMeses }, queixas, respondente: respondent, assessmentUse: monitoring ? "monitorizacao" : "triagem", isLiterate: null, isVerbal: null, selectedSignals: [] };
  const seen = new Set<string>();
  const base = catalog.filter((scale) => {
    if (seen.has(scale.id)) return false;
    seen.add(scale.id);
    if (!scale.appRoute || getImplementationStatus(scale) !== "complete" || isLicenseRestricted(scale) || isSuicideInstrument(scale) || isPsychosisInstrument(scale)) return false;
    return getAssessmentUse(scale) !== "psicoeducacao";
  });
  // Idade, respondente, modo de aplicação, licença, segurança e teto de 15 min nunca relaxam;
  // só a finalidade (seguimento → triagem reaplicada) e o domínio (vizinho → banda larga) relaxam, nessa ordem.
  function suitable(scale: ScaleEntry, role: Respondente, useMonitoring: boolean, domains: string[]) {
    if (!scale.respondente.includes(role) || outsideConditionAnchor(scale, domains) || clinicalHardBlock(scale, { ...ctx, queixas: domains, respondente: role }) !== null) return false;
    const mode = getApplicationMode(scale);
    if (role === "pais" && mode !== "questionario_pais") return false;
    if (role === "professor" && mode !== "questionario_professor") return false;
    if (role === "autoaplicavel" && mode !== "autoquestionario_crianca_adolescente") return false;
    const use = getAssessmentUse(scale);
    return useMonitoring ? ["monitorizacao", "seguimento"].includes(use) : !["monitorizacao", "seguimento", "psicoeducacao"].includes(use);
  }
  function prioritize(matches: RefinedScaleMatch[], useMonitoring: boolean) {
    if (useMonitoring) return matches;
    const order = firstLineByQueixa[input.queixa] ?? firstLineByQueixa[domain] ?? [];
    const position = (scale: ScaleEntry) => {
      const index = order.indexOf(curatedRouteKey(scale.appRoute ?? ""));
      return index < 0 ? Number.MAX_SAFE_INTEGER : index;
    };
    return [...matches].sort((a, b) => position(a.scale) - position(b.scale) || b.relevanceScore - a.relevanceScore || a.scale.id.localeCompare(b.scale.id));
  }
  const withinTimeMax = (max: number) => ({ scale }: RefinedScaleMatch) => {
    const upper = previsitUpperMinutes(scale);
    return upper !== null && upper <= max;
  };
  function rankFor(role: Respondente, useMonitoring: boolean, domains: string[], maxMin = 15): ScaleEntry[] {
    const tierCtx: FilterContext = { ...ctx, queixas: domains, respondente: role, assessmentUse: useMonitoring ? "monitorizacao" : "triagem" };
    const candidates = base.map((s) => previsitRespondentVariant(s, role)).filter((s) => suitable(s, role, useMonitoring, domains));
    return prioritize(filterScalesWithClinicalRescue(candidates, tierCtx).filter(withinTimeMax(maxMin)), useMonitoring).map((m) => m.scale);
  }
  function broadband(role: Respondente, maxMin = 15): ScaleEntry[] {
    return BROADBAND_SCREENER_IDS.flatMap((id) => {
      const found = base.find((s) => s.id === id);
      const scale = found && previsitRespondentVariant(found, role);
      if (!scale || !suitable(scale, role, false, scale.queixas)) return [];
      const upper = previsitUpperMinutes(scale);
      return upper !== null && upper <= maxMin ? [scale] : [];
    });
  }
  function pickThree(role: Respondente, exclude: ReadonlySet<string>): Array<{ scale: ScaleEntry; tier: Tier }> {
    const neighbours = (QUEIXA_COOCORRENCIA[domain] ?? []).filter((q) => q !== domain);
    const ladder: Array<[Tier, () => ScaleEntry[]]> = [
      ["direta", () => rankFor(role, monitoring, queixas)],
      ...(monitoring && input.contexto !== "ajuste-medicacao" ? [["seguimento", () => rankFor(role, false, queixas)] as [Tier, () => ScaleEntry[]]] : []),
      ["coocorrencia", () => neighbours.length ? rankFor(role, false, neighbours) : []],
      ["banda-larga", () => broadband(role)],
    ];
    if (options.fill) {
      const near = (r: Respondente, maxMin: number) => [
        ...rankFor(r, monitoring, queixas, maxMin),
        ...(neighbours.length ? rankFor(r, false, neighbours, maxMin) : []),
        ...broadband(r, maxMin),
      ];
      const closest = (r: Respondente, maxMin: number) => base
        .map((sc) => previsitRespondentVariant(sc, r))
        .filter((sc) => ["atraso", "comportamento"].includes(sc.primaryDomain ?? sc.queixas[0] ?? "") && suitable(sc, r, false, sc.queixas) && (previsitUpperMinutes(sc) ?? 99) <= maxMin)
        .sort((a, b) => (previsitUpperMinutes(a) ?? 99) - (previsitUpperMinutes(b) ?? 99) || a.id.localeCompare(b.id));
      ladder.push(["tempo-maior", () => near(role, 30)]);
      ladder.push(["dominio-proximo", () => closest(role, 30)]);
      // Nunca substituir resposta escolar/autoaplicável por formulário dos pais
      // sem seleção explícita de outro informante. Um pódio incompleto é mais
      // seguro que atribuir a resposta ao respondente errado.
    }
    const picked: Array<{ scale: ScaleEntry; tier: Tier }> = [];
    const families = new Set<string>();
    for (const [tier, list] of ladder) {
      if (picked.length >= PREVISIT_POSITIONS.length) break;
      for (const scale of list()) {
        if (picked.length >= PREVISIT_POSITIONS.length) break;
        const family = previsitFamily(scale);
        if (exclude.has(scale.id) || picked.some((p) => p.scale.id === scale.id) || families.has(family)) continue;
        families.add(family);
        const functionalOutsideComplaint = (scale.id === "eaf" || scale.id === "efdi") && !scale.queixas.some((q) => queixas.includes(q));
        const functionalTier: Tier = (previsitUpperMinutes(scale) ?? 99) > 15 ? "funcional-tempo-maior" : "funcional";
        picked.push({ scale, tier: functionalOutsideComplaint ? functionalTier : tier });
      }
    }
    return picked;
  }
  const picked = pickThree(respondent, new Set());
  const result: PreConsultaRecommendation[] = picked.map(({ scale, tier }, i) => ({
    label: PREVISIT_POSITIONS[i],
    scale,
    reason: `${TIER_REASON[tier]} Formulário completo no app; até ${previsitUpperMinutes(scale)} min informados no catálogo. A recepção só auxilia a leitura.`,
  }));
  if (picked.length < PREVISIT_POSITIONS.length) {
    result.push({ label: PREVISIT_POSITIONS[picked.length], reason: `Só ${picked.length === 0 ? "nenhum instrumento" : picked.length === 1 ? "um instrumento" : "dois instrumentos"} do app ${picked.length === 1 ? "atende" : "atendem"} com segurança a idade, o respondente e o tempo informados. Não completar com instrumento inadequado.` });
  }
  if (respondent !== "professor" && (input.contexto === "avaliacao-escolar" || schoolRelevant.has(input.queixa))) {
    const used = new Set(picked.map((p) => p.scale.id));
    const school = rankFor("professor", false, queixas).find((s) => !used.has(s.id));
    if (school) result.push({ label: "Questionário escolar", scale: school, reason: "Aplicação separada, preenchida pelo professor. Não pedir aos pais que respondam pela escola; não somar informantes nem consumir o tempo da coleta familiar." });
  }
  return result;
}
