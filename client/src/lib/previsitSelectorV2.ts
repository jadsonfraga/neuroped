import type { ApplicationMode, Respondente, ScaleEntry } from "@/data/scaleFilter";
import { QUEIXA_COOCORRENCIA } from "@/data/scaleFilter";
import {
  clinicalHardBlock, filterScalesIntelligently, getApplicationMode, getAssessmentUse, getImplementationStatus,
  isLicenseRestricted, isPsychosisInstrument, isSuicideInstrument, type FilterContext, type RefinedScaleMatch,
} from "@/data/advancedFilterLogic";
import { firstLineByQueixa } from "@/data/preConsultaCurated";
import type { PreConsultaRecommendation, PreConsultaRecord } from "./preConsultaCore";
import { previsitRespondentVariant, previsitUpperMinutes } from "./preConsultaSafeRanking";

/**
 * Seletor v2 da pré-consulta: SEMPRE 3 escalas (Ouro/Prata/Bronze), todas aplicáveis por inteiro no app.
 *  vaga 1 (Ouro)   = domínio principal, respondente pedido, estágio coerente;
 *  vaga 2 (Prata)  = respondente complementar (escola ↔ pais ↔ adolescente) no mesmo domínio;
 *  vaga 3 (Bronze) = efeitos adversos (em medicação) ou comorbidade/função provável.
 * Quando não há ajuste perfeito, completa com a escala aplicável mais próxima e DECLARA o motivo
 * (`fallbackReason`). Nunca devolve escala de domínio estranho, de outro estágio incompatível sem aviso,
 * duas do mesmo grupo de redundância, licenciada ou instrumento de suicídio/psicose (segurança igual à v1).
 */
export interface PrevisitV2Input extends Pick<PreConsultaRecord, "idadeMeses" | "queixa" | "respondente" | "contexto"> {
  /** Sintomas marcados (rótulos de signalsAndSymptoms). Opcional. */
  sintomas?: string[];
  /** Diagnósticos firmados/suspeitas (ids de queixa: tea, tdah, epilepsia…). Opcional. */
  diagnosticos?: string[];
}
export type PrevisitSlot = "principal" | "complementar" | "comorbidade";
export interface PrevisitV2Recommendation extends PreConsultaRecommendation {
  slot: PrevisitSlot;
  reasons: string[];
  /** Presente quando a escala é a aplicável mais próxima, não o ajuste ideal. */
  fallbackReason?: string;
}

const contexts = new Set(["primeira-consulta", "retorno", "avaliacao-escolar", "ajuste-medicacao", "acompanhamento"]);
const schoolRelevant = new Set(["tea", "tdah", "aprendizagem", "comportamento", "social", "linguagem", "ansiedade", "toc", "tiques"]);
const SLOT_LABEL = { principal: "Ouro", complementar: "Prata", comorbidade: "Bronze" } as const;

/** Famílias com `queixas` amplas que só valem no próprio domínio (evita vazamento: ex. epilepsia aparecendo em aprendizagem). */
const FAMILY_DOMAIN: ReadonlyArray<[RegExp, string[]]> = [
  [/^ipn-epi-seg/, ["epilepsia"]], [/^ipn-pc-fun/, ["pc", "funcionalidade", "motor"]], [/^ipn-lfc/, ["linguagem"]],
  [/^ipn-tea/, ["tea", "social"]], [/^ipn-tdah-fe/, ["tdah", "cognicao"]],
];
/** Redundância: duas escalas do mesmo grupo não ocupam vagas distintas. */
const OVERLAP: Record<string, string> = {
  sdq: "broadband", psc17: "broadband", cbcl: "broadband", conners: "broadband", "world-sdq": "broadband",
  snap: "adhd-rating", vanderbilt: "adhd-rating", swan: "adhd-rating", "world-snap-iv-26": "adhd-rating",
  mchat: "tea-screen", "world-mchat-rf": "tea-screen", "q-chat-10": "tea-screen",
  phqa: "depression-self", cdi2: "depression-self", "world-phq-a": "depression-self",
  scared: "anxiety-rating", "world-scared-child-parent": "anxiety-rating",
  bears: "sleep-screen", cshq: "sleep-screen",
};
export function overlapGroupOf(scale: ScaleEntry): string {
  return scale.overlapGroup ?? OVERLAP[scale.id] ?? scale.id;
}
function inDomain(scale: ScaleEntry, domains: string[]): boolean {
  if (scale.primaryDomain) return domains.includes(scale.primaryDomain);
  const family = FAMILY_DOMAIN.find(([re]) => re.test(scale.id));
  if (family) return family[1].some((d) => domains.includes(d));
  return scale.queixas.some((q) => domains.includes(q));
}
function isBroad(scale: ScaleEntry) { return scale.queixas.length >= 4; }
function roleToMode(role: Respondente): ApplicationMode | null {
  return role === "pais" ? "questionario_pais" : role === "professor" ? "questionario_professor" : role === "autoaplicavel" ? "autoquestionario_crianca_adolescente" : null;
}
const ROLE_NAME: Record<string, string> = { pais: "pais/cuidadores", professor: "professor", autoaplicavel: "o próprio adolescente" };

export function recommendPrevisitV2(catalog: ScaleEntry[], input: PrevisitV2Input): PrevisitV2Recommendation[] {
  if (!Number.isInteger(input.idadeMeses) || input.idadeMeses < 1 || input.idadeMeses > 227 || !input.queixa || !contexts.has(input.contexto)) return [];
  const requested: Respondente | null = input.respondente === "pais" || input.respondente === "secretaria" ? "pais" : input.respondente === "professor" ? "professor" : input.respondente === "adolescente" ? "autoaplicavel" : null;
  if (!requested) return [];
  const monitoring = ["retorno", "ajuste-medicacao", "acompanhamento"].includes(input.contexto);
  const medication = input.contexto === "ajuste-medicacao" || input.queixa === "efeitos";
  const dx = (input.diagnosticos ?? []).filter(Boolean);
  const mainDomains = [...new Set([input.queixa === "efeitos" ? (dx[0] ?? "efeitos") : input.queixa, ...dx])];
  const cooc = [...new Set(mainDomains.flatMap((d) => QUEIXA_COOCORRENCIA[d] ?? []))].filter((d) => !mainDomains.includes(d));

  const seenIds = new Set<string>();
  const pool = catalog.filter((scale) => {
    if (seenIds.has(scale.id)) return false;
    seenIds.add(scale.id);
    return !!scale.appRoute && getImplementationStatus(scale) === "complete" && !isLicenseRestricted(scale) && !isSuicideInstrument(scale) && !isPsychosisInstrument(scale) && getAssessmentUse(scale) !== "psicoeducacao";
  });

  const baseCtx = (role: Respondente, queixas: string[]): FilterContext => ({
    ageMonths: input.idadeMeses, ageBand: { min: input.idadeMeses, max: input.idadeMeses }, queixas, respondente: role,
    assessmentUse: monitoring ? "monitorizacao" : "triagem", isLiterate: null, isVerbal: null, selectedSignals: input.sintomas ?? [],
  });

  const chosen: PrevisitV2Recommendation[] = [];
  const usedIds = new Set<string>();
  const usedGroups = new Set<string>();

  interface Opts { role: Respondente; domains: string[]; stageStrict: boolean; maxMinutes: number; allowBroad: boolean; domainsForCtx?: string[]; }
  function candidates({ role, domains, stageStrict, maxMinutes, allowBroad }: Opts): RefinedScaleMatch[] {
    const mode = roleToMode(role);
    const variants = pool.map((s) => previsitRespondentVariant(s, role)).filter((s) => {
      if (usedIds.has(s.id) || usedGroups.has(overlapGroupOf(s))) return false;
      if (!s.respondente.includes(role) || (mode && getApplicationMode(s) !== mode)) return false;
      if (!inDomain(s, domains)) return false;
      if (!allowBroad && isBroad(s) && !s.primaryDomain && !domains.some((d) => s.queixas[0] === d)) return false;
      const upper = previsitUpperMinutes(s);
      if (upper === null || upper > maxMinutes) return false;
      const use = getAssessmentUse(s);
      if (stageStrict) return monitoring ? ["monitorizacao", "seguimento"].includes(use) : !["monitorizacao", "seguimento", "psicoeducacao"].includes(use);
      // Estágio relaxado: triagem curta pode ser reaplicada no seguimento; nunca instrumento só-diagnóstico em seguimento.
      return monitoring ? ["monitorizacao", "seguimento", "triagem"].includes(use) : !["monitorizacao", "seguimento", "psicoeducacao"].includes(use);
    });
    const ctx = baseCtx(role, domains);
    const ranked = filterScalesIntelligently(variants, ctx).filter((m) => clinicalHardBlock(m.scale, ctx) === null);
    const order = firstLineByQueixa[input.queixa] ?? [];
    const pos = (s: ScaleEntry) => { const i = order.indexOf(s.appRoute ?? ""); return i < 0 ? 99 : i; };
    const domainRank = (s: ScaleEntry) => { const i = domains.findIndex((d) => s.queixas.includes(d)); return i < 0 ? 99 : i; };
    return [...ranked].sort((a, b) => domainRank(a.scale) - domainRank(b.scale) || pos(a.scale) - pos(b.scale) || b.relevanceScore - a.relevanceScore || a.scale.id.localeCompare(b.scale.id));
  }

  function fill(slot: PrevisitSlot, ladder: Array<{ opts: Opts; fallbackReason?: string }>, why: string) {
    for (const step of ladder) {
      const pick = candidates(step.opts)[0];
      if (!pick) continue;
      const s = pick.scale;
      usedIds.add(s.id); usedGroups.add(overlapGroupOf(s));
      const role = step.opts.role;
      const reasons = [
        `idade exata de ${input.idadeMeses} meses dentro de ${s.ageMin}–${s.ageMax}`,
        `respondente: ${ROLE_NAME[role] ?? role}`,
        `estágio: ${monitoring ? "seguimento" : "primeira avaliação"}${step.opts.stageStrict ? "" : " (instrumento de triagem reaplicável)"}`,
        `domínio: ${step.opts.domains.join(", ")}`,
        "licença: uso livre ou autoral; formulário completo no app",
      ];
      const label = slot === "complementar" && role === "professor" ? "Questionário escolar" : SLOT_LABEL[slot];
      chosen.push({
        label: label as PreConsultaRecommendation["label"], scale: s, slot, reasons, fallbackReason: step.fallbackReason,
        reason: `${why} ${reasons.join("; ")}. Até ${previsitUpperMinutes(s)} min informados no catálogo. ${step.fallbackReason ? `Escala aplicável mais próxima (${step.fallbackReason}). ` : ""}A recepção só auxilia a leitura; não é diagnóstico.`,
      });
      return;
    }
  }

  const all = [...mainDomains, ...cooc];
  const T = 15;
  // Vaga 1 — domínio principal
  fill("principal", [
    { opts: { role: requested, domains: mainDomains, stageStrict: true, maxMinutes: T, allowBroad: false } },
    { opts: { role: requested, domains: mainDomains, stageStrict: true, maxMinutes: T, allowBroad: true } },
    { opts: { role: requested, domains: mainDomains, stageStrict: false, maxMinutes: T, allowBroad: true }, fallbackReason: "triagem do mesmo domínio, sem instrumento específico de seguimento" },
    { opts: { role: requested, domains: all, stageStrict: false, maxMinutes: T, allowBroad: true }, fallbackReason: "domínio comórbido relacionado" },
  ], "Escala principal do domínio.");
  // Vaga 2 — respondente complementar
  const comp: Respondente[] = requested === "pais"
    ? [...(input.contexto === "avaliacao-escolar" || schoolRelevant.has(input.queixa) ? ["professor" as const] : []), ...(input.idadeMeses >= 96 ? ["autoaplicavel" as const] : []), ...(input.idadeMeses < 96 && !schoolRelevant.has(input.queixa) ? ["professor" as const] : [])]
    : ["pais"];
  const slot2: Array<{ opts: Opts; fallbackReason?: string }> = [];
  for (const role of comp) {
    slot2.push({ opts: { role, domains: mainDomains, stageStrict: true, maxMinutes: T, allowBroad: true } });
    slot2.push({ opts: { role, domains: mainDomains, stageStrict: false, maxMinutes: T, allowBroad: true }, fallbackReason: "outro informante, triagem do mesmo domínio" });
  }
  slot2.push({ opts: { role: requested, domains: mainDomains, stageStrict: false, maxMinutes: T, allowBroad: true }, fallbackReason: "mesmo informante; não há instrumento do domínio para outro informante" });
  slot2.push({ opts: { role: requested, domains: all, stageStrict: false, maxMinutes: T, allowBroad: true }, fallbackReason: "mesmo informante; domínio comórbido relacionado" });
  fill("complementar", slot2, "Segundo olhar sobre o mesmo domínio, com informante complementar quando existe.");
  // Vaga 3 — efeitos adversos ou comorbidade/função
  const third: string[][] = medication && input.queixa !== "efeitos" ? [["efeitos"], cooc, ["sono", "funcionalidade"]] : medication ? [cooc, ["sono", "funcionalidade"]] : [cooc, ["sono", "funcionalidade"]];
  const slot3: Array<{ opts: Opts; fallbackReason?: string }> = [];
  for (const domains of third) {
    if (!domains.length) continue;
    for (const role of [requested, ...comp]) slot3.push({ opts: { role, domains, stageStrict: true, maxMinutes: T, allowBroad: false } });
    for (const role of [requested, ...comp]) slot3.push({ opts: { role, domains, stageStrict: false, maxMinutes: T, allowBroad: true }, fallbackReason: "comorbidade/função provável; sem instrumento do estágio exato" });
  }
  slot3.push({ opts: { role: requested, domains: mainDomains, stageStrict: false, maxMinutes: 30, allowBroad: true }, fallbackReason: "mesmo domínio; instrumento um pouco mais longo (até 30 min)" });
  slot3.push({ opts: { role: requested, domains: all, stageStrict: false, maxMinutes: 30, allowBroad: true }, fallbackReason: "domínio comórbido relacionado; até 30 min" });
  fill("comorbidade", slot3, medication ? "Segurança/efeitos da medicação ou comorbidade provável." : "Comorbidade ou impacto funcional provável.");
  return chosen;
}
