/**
 * Diagnóstico do filtro: contagens por faceta e explicação de resultado vazio.
 *
 * Padrão de referência (Baymard/NN-g): facetas mostram QUANTOS resultados cada
 * opção daria; uma busca sem resultado diz qual restrição eliminou mais e
 * quantos instrumentos voltariam ao relaxá-la. Aqui isso é feito rodando o
 * MESMO motor clínico (filterScalesWithClinicalRescue) com um parâmetro de
 * cada vez — nunca uma reimplementação paralela das regras.
 *
 * Nada aqui relaxa nada sozinho. Bloqueios de segurança (idade mínima para
 * autoaplicável, psicose/mania, alfabetização, linguagem verbal) são
 * relatados como "bloqueado por segurança" e não têm botão de relaxamento.
 */
import {
  clinicalHardBlock,
  filterScalesWithClinicalRescue,
  isAcuteRiskContext,
  getApplicationMode,
  type FilterContext,
} from "@/data/advancedFilterLogic";
import type { Respondente, ScaleEntry } from "@/data/scaleFilter";
import { parseScaleMinutes } from "@/lib/scaleTime";

export interface FacetCountMap {
  [optionId: string]: number;
}

export interface FilterFacetCounts {
  respondente: FacetCountMap;
  faixa: FacetCountMap;
  finalidade: FacetCountMap;
  comunicacao: FacetCountMap;
  alfabetizacao: FacetCountMap;
  tempo: FacetCountMap;
}

export interface AgeBandOption {
  id: string;
  min: number;
  max: number;
}

/** Orçamento de tempo: instrumento sem tempo legível NÃO é excluído (fail-open visível). */
export function withinTimeBudget(scale: Pick<ScaleEntry, "tempo">, minutes: number | null | undefined): boolean {
  if (!minutes || minutes <= 0) return true;
  const parsed = parseScaleMinutes(scale.tempo);
  return parsed === null || parsed.min <= minutes;
}

export const TIME_BUCKETS: ReadonlyArray<{ id: string; label: string; minutes: number }> = [
  { id: "5", label: "≤ 5 min", minutes: 5 },
  { id: "10", label: "≤ 10 min", minutes: 10 },
  { id: "20", label: "≤ 20 min", minutes: 20 },
  { id: "45", label: "≤ 45 min", minutes: 45 },
];

function count(catalog: readonly ScaleEntry[], ctx: FilterContext, timeBudget: number | null): number {
  if (ctx.ageInputInvalid) return 0;
  const matches = filterScalesWithClinicalRescue([...catalog], ctx);
  const real = matches.filter((m) => !m.isBroadbandFallback);
  return real.filter((m) => withinTimeBudget(m.scale, timeBudget)).length;
}

/**
 * Contagens "e se eu escolher esta opção?" para cada faceta, mantendo as
 * demais seleções. Opção já selecionada devolve a contagem atual.
 */
export function computeFilterFacetCounts(
  catalog: readonly ScaleEntry[],
  ctx: FilterContext,
  options: {
    respondentes: readonly Respondente[];
    faixas: readonly AgeBandOption[];
    timeBudget?: number | null;
  },
): FilterFacetCounts {
  const timeBudget = options.timeBudget ?? null;
  const respondente: FacetCountMap = {};
  for (const r of options.respondentes) {
    respondente[r] = count(catalog, { ...ctx, respondente: r }, timeBudget);
  }
  const faixa: FacetCountMap = {};
  for (const band of options.faixas) {
    faixa[band.id] = count(
      catalog,
      { ...ctx, ageInputInvalid: false, ageMonths: Math.round((band.min + band.max) / 2), ageBand: { min: band.min, max: band.max } },
      timeBudget,
    );
  }
  const finalidade: FacetCountMap = {
    diagnostic: count(catalog, { ...ctx, assessmentUse: "diagnostico" }, timeBudget),
    monitoring: count(catalog, { ...ctx, assessmentUse: "monitorizacao" }, timeBudget),
  };
  const comunicacao: FacetCountMap = {
    verbal: count(catalog, { ...ctx, isVerbal: true }, timeBudget),
    nonverbal: count(catalog, { ...ctx, isVerbal: false }, timeBudget),
  };
  const alfabetizacao: FacetCountMap = {
    literate: count(catalog, { ...ctx, isLiterate: true }, timeBudget),
    preliterate: count(catalog, { ...ctx, isLiterate: false }, timeBudget),
  };
  const tempo: FacetCountMap = {};
  for (const bucket of TIME_BUCKETS) {
    tempo[bucket.id] = count(catalog, ctx, bucket.minutes);
  }
  return { respondente, faixa, finalidade, comunicacao, alfabetizacao, tempo };
}

export type RelaxDimension =
  | "queixa"
  | "respondente"
  | "idade"
  | "comunicacao"
  | "alfabetizacao"
  | "finalidade"
  | "sinais"
  | "tempo";

export interface RelaxationHint {
  dimension: RelaxDimension;
  /** Texto pronto: "Sem o respondente professor". */
  label: string;
  /** Quantos instrumentos seguros voltariam com esse ajuste. */
  countIfRelaxed: number;
  /** Para "queixa": manter só esta queixa. */
  keepQueixa?: string;
}

export interface SafetyBlockSummary {
  reason: string;
  count: number;
}

export interface EmptyResultDiagnosis {
  acuteRisk: boolean;
  invalidAge: boolean;
  hints: RelaxationHint[];
  safetyBlocked: SafetyBlockSummary[];
}

const SAFETY_REASON_PREFIXES = [
  "Psicose/mania requer",
  "Autoaplicável requer",
  "Requer criança alfabetizada",
  "Requer alfabetização",
  "Requer linguagem verbal",
  "TDAH não recomendado",
];

/**
 * Explica um resultado vazio (ou só com fallback amplo): para cada restrição
 * ativa, quantos instrumentos seguros voltariam sem ela. Ordena do maior
 * ganho para o menor. Risco agudo e idade inválida não recebem sugestões de
 * relaxamento — são saídas clínicas válidas.
 */
export function diagnoseEmptyResult(
  catalog: readonly ScaleEntry[],
  ctx: FilterContext,
  options: { timeBudget?: number | null; queixaLabel?: (id: string) => string; respondentLabel?: (id: string) => string } = {},
): EmptyResultDiagnosis {
  const timeBudget = options.timeBudget ?? null;
  const acuteRisk = isAcuteRiskContext(ctx);
  const invalidAge = Boolean(ctx.ageInputInvalid);
  const hints: RelaxationHint[] = [];
  const queixaLabel = options.queixaLabel ?? ((id: string) => id);
  const respondentLabel = options.respondentLabel ?? ((id: string) => id);

  if (!acuteRisk && !invalidAge) {
    if (timeBudget) {
      hints.push({ dimension: "tempo", label: `Sem o limite de ${timeBudget} min`, countIfRelaxed: count(catalog, ctx, null) });
    }
    if (ctx.respondente) {
      hints.push({
        dimension: "respondente",
        label: `Sem fixar o respondente (${respondentLabel(ctx.respondente)})`,
        countIfRelaxed: count(catalog, { ...ctx, respondente: null }, timeBudget),
      });
    }
    if (ctx.selectedSignals?.length) {
      hints.push({ dimension: "sinais", label: "Sem os sinais marcados", countIfRelaxed: count(catalog, { ...ctx, selectedSignals: [] }, timeBudget) });
    }
    if (ctx.assessmentUse) {
      hints.push({ dimension: "finalidade", label: "Sem fixar a finalidade", countIfRelaxed: count(catalog, { ...ctx, assessmentUse: null }, timeBudget) });
    }
    if (ctx.isVerbal !== null && ctx.isVerbal !== undefined) {
      hints.push({ dimension: "comunicacao", label: "Sem fixar comunicação", countIfRelaxed: count(catalog, { ...ctx, isVerbal: null }, timeBudget) });
    }
    if (ctx.isLiterate !== null && ctx.isLiterate !== undefined) {
      hints.push({ dimension: "alfabetizacao", label: "Sem fixar alfabetização", countIfRelaxed: count(catalog, { ...ctx, isLiterate: null }, timeBudget) });
    }
    if (ctx.queixas.length > 1) {
      for (const queixa of ctx.queixas) {
        hints.push({
          dimension: "queixa",
          label: `Só a queixa ${queixaLabel(queixa)}`,
          countIfRelaxed: count(catalog, { ...ctx, queixas: [queixa] }, timeBudget),
          keepQueixa: queixa,
        });
      }
    }
    if (ctx.ageMonths !== null || ctx.ageBand) {
      // Idade nunca é "removida" como sugestão: a dica só informa que a
      // restrição etária é o gargalo, para a pessoa CONFERIR a idade.
      hints.push({ dimension: "idade", label: "Conferindo a idade informada", countIfRelaxed: count(catalog, { ...ctx, ageMonths: null, ageBand: null }, timeBudget) });
    }
  }
  hints.sort((a, b) => b.countIfRelaxed - a.countIfRelaxed);

  // Bloqueios de segurança entre instrumentos que casam queixa e respondente.
  const blocked = new Map<string, number>();
  if (!invalidAge) {
    for (const scale of catalog) {
      if (ctx.queixas.length && !scale.queixas.some((q) => ctx.queixas.includes(q))) continue;
      if (ctx.respondente) {
        if (ctx.respondente === "teste_direto_crianca") {
          if (getApplicationMode(scale) !== "teste_direto_crianca") continue;
        } else if (!scale.respondente.includes(ctx.respondente)) continue;
      }
      const reason = clinicalHardBlock(scale, ctx);
      if (!reason) continue;
      const prefix = SAFETY_REASON_PREFIXES.find((p) => reason.startsWith(p));
      if (!prefix) continue;
      blocked.set(reason, (blocked.get(reason) ?? 0) + 1);
    }
  }
  const safetyBlocked = [...blocked.entries()].map(([reason, n]) => ({ reason, count: n })).sort((a, b) => b.count - a.count);
  return { acuteRisk, invalidAge, hints: hints.filter((h) => h.countIfRelaxed > 0), safetyBlocked };
}
