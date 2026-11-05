/**
 * Métricas reprodutíveis de qualidade do pódio do Filtro Clínico.
 *
 * Varre contextos SINTÉTICOS (perfis de idade exata, faixa etária, 1–2 queixas,
 * sinais marcados e respondentes) sobre o catálogo real e mede invariantes:
 * cobertura de queixas/sinais, cobertura da faixa, redundância de construto,
 * aplicabilidade, teto de 100 perguntas e respeito a idade/respondente.
 *
 * Uso: node --import tsx tests/tools/filter-quality-metrics.ts [--json]
 * Não lê nem grava dados de pacientes; é uma varredura do catálogo.
 */
import { allScales, faixasEtarias, queixas } from "../../client/src/data/scaleFilter.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import {
  filterScalesWithClinicalRescue,
  getApplicationMode,
  scaleCoversSelectedSignalExactly,
  getImplementationStatus,
  isAcuteRiskContext,
  type RefinedScaleMatch,
} from "../../client/src/data/advancedFilterLogic.ts";
import { selectCuratedTiers, selectPodium, PODIUM_QUESTION_CAP, estimatedQuestionCount } from "../../client/src/data/filterPodium.ts";
import { sameClinicalConstruct } from "../../client/src/data/filterPodiumComplementarity.ts";
import { getAllSignalsForQueixa } from "../../client/src/data/signalsAndSymptoms.ts";

interface Ctx {
  kind: "exact" | "band";
  label: string;
  queixas: string[];
  signals: string[];
  respondente: string | null;
  exactAge: number | null;
  band: { min: number; max: number } | null;
}

const allIds = new Set(allScales.map((s) => s.id));
const resolveRoute = (s: { id: string; appRoute?: string }) => {
  if (s.appRoute && s.appRoute !== "/filtro") return s.appRoute;
  if (allIds.has(s.id)) return `/generic-scale/${s.id}`;
  if (s.id.startsWith("world-")) return "/escalas-neuropsiquiatria";
  return null;
};
const seen = new Set<string>();
const catalog = mergeFilterableCatalog(allScales).filter((s) => {
  if (seen.has(s.id) || !resolveRoute(s)) return false;
  seen.add(s.id);
  return true;
});

const queixaIds = queixas.map((q) => q.id);
const respondents: Array<string | null> = [null, "pais", "professor", "clinico", "autoaplicavel", "teste_direto_crianca"];
const exactAges = [0, 4, 9, 12, 20, 30, 42, 54, 66, 80, 100, 132, 156, 190];
const contexts: Ctx[] = [];
const singles = queixaIds.map((q) => [q]);
const pairs: string[][] = [];
for (let i = 0; i < queixaIds.length; i++) for (let j = i + 1; j < queixaIds.length; j++) pairs.push([queixaIds[i], queixaIds[j]]);
const complaintSets = [...singles, ...pairs.filter((_, k) => k % 7 === 0)];
// Sinais COBERTUREIS: só entram sinais que pelo menos uma escala do catálogo cobre
// pela correspondência exata; sinal sem nenhuma tag não mede o pódio, mede o catálogo.
const coverableSignals = (q: string): string[] => {
  const out: string[] = [];
  for (const sig of getAllSignalsForQueixa(q) as Array<{ id: string; label: string }>) {
    const ctxSig = { queixas: [q], selectedSignals: [sig.id] };
    if (catalog.some((s) => scaleCoversSelectedSignalExactly(s, ctxSig))) out.push(sig.id);
    if (out.length >= 2) break;
  }
  return out;
};

for (const respondente of respondents) {
  for (const set of complaintSets) {
    for (const age of exactAges) {
      contexts.push({ kind: "exact", label: `exact:${age}`, queixas: set, signals: [], respondente, exactAge: age, band: null });
    }
    for (const band of faixasEtarias) {
      contexts.push({ kind: "band", label: `band:${band.id}`, queixas: set, signals: [], respondente, exactAge: null, band: { min: band.min, max: band.max } });
    }
  }
}
// Sinais marcados: um sinal por queixa de 1 queixa, em idades representativas.
for (const q of queixaIds) {
  for (const signal of coverableSignals(q)) {
    for (const age of [30, 90]) {
      contexts.push({ kind: "exact", label: `signal:${age}`, queixas: [q], signals: [signal], respondente: null, exactAge: age, band: null });
    }
  }
}

const containsExact = (s: { ageMin: number; ageMax: number }, age: number) => s.ageMin <= age && s.ageMax >= age;
const coversBand = (s: { ageMin: number; ageMax: number }, b: { min: number; max: number }) => s.ageMin <= b.min && s.ageMax >= b.max;
const overlapsBand = (s: { ageMin: number; ageMax: number }, b: { min: number; max: number }) => s.ageMax >= b.min && s.ageMin <= b.max;

interface Acc {
  contexts: number;
  contextsWithTrio: number;
  medals: number;
  medalsNotApplicable: number;
  exactAgeViolations: number;
  bandNoOverlapViolations: number;
  bandMedals: number;
  bandMedalsFull: number;
  bandMedalsPartial: number;
  respondentViolations: number;
  redundantPairs: number;
  contextsWithRedundantPair: number;
  capViolations: number;
  complaintsSelected: number;
  complaintsCovered: number;
  complaintsCoverable: number;
  complaintsCoverableAndCovered: number;
  signalContexts: number;
  signalContextsCovered: number;
  signalContextsWithSafeCandidate: number;
  acuteContexts: number;
  acuteBroadbandViolations: number;
  curatedCount: number;
}

const acc: Acc = {
  complaintsCoverable: 0, complaintsCoverableAndCovered: 0,
  contexts: 0, contextsWithTrio: 0, medals: 0, medalsNotApplicable: 0, exactAgeViolations: 0,
  bandNoOverlapViolations: 0, bandMedals: 0, bandMedalsFull: 0, bandMedalsPartial: 0,
  respondentViolations: 0, redundantPairs: 0, contextsWithRedundantPair: 0, capViolations: 0,
  complaintsSelected: 0, complaintsCovered: 0, signalContexts: 0, signalContextsCovered: 0,
  signalContextsWithSafeCandidate: 0, acuteContexts: 0, acuteBroadbandViolations: 0, curatedCount: 0,
};

for (const c of contexts) {
  const ctx = {
    queixas: c.queixas,
    ageMonths: c.exactAge,
    ageBand: c.band,
    respondente: c.respondente as never,
    isVerbal: null,
    isLiterate: null,
    assessmentUse: null,
    selectedSignals: c.signals,
  };
  // Contrato atual do filtro: ageMonths só com idade exata; em faixa, nulo + ageBand.
  const engineCtx = { ...ctx, ageMonths: c.exactAge };
  const matches = filterScalesWithClinicalRescue(catalog, engineCtx as never);
  const refinedById = new Map(matches.map((m) => [m.scale.id, m]));
  const curated = selectCuratedTiers(c.queixas, c.exactAge, refinedById, c.respondente as never, c.band);
  const podium = selectPodium(matches, curated, {
    selectedQueixas: c.queixas,
    ageMonths: c.exactAge,
    selectedSignals: c.signals,
    ageBand: c.band,
  });
  acc.contexts++;
  const medals = [podium.ouro, podium.prata, podium.bronze].filter(Boolean) as RefinedScaleMatch[];
  if (medals.length === 3) acc.contextsWithTrio++;
  if (curated) acc.curatedCount++;
  if (isAcuteRiskContext(engineCtx as never)) {
    acc.acuteContexts++;
    if (matches.some((m) => m.isBroadbandFallback)) acc.acuteBroadbandViolations++;
  }
  let redundantInContext = 0;
  for (const m of medals) {
    acc.medals++;
    if (getImplementationStatus(m.scale) !== "complete") acc.medalsNotApplicable++;
    if (c.exactAge !== null && !containsExact(m.scale, c.exactAge)) acc.exactAgeViolations++;
    if (c.band) {
      acc.bandMedals++;
      if (!overlapsBand(m.scale, c.band)) acc.bandNoOverlapViolations++;
      if (coversBand(m.scale, c.band)) acc.bandMedalsFull++;
      else acc.bandMedalsPartial++;
    }
    if (c.respondente && c.respondente !== "teste_direto_crianca" && !m.scale.respondente.includes(c.respondente as never)) {
      acc.respondentViolations++;
    }
    if (c.respondente === "teste_direto_crianca" && getApplicationMode(m.scale) !== "teste_direto_crianca") {
      acc.respondentViolations++;
    }
  }
  for (let i = 0; i < medals.length; i++) for (let j = i + 1; j < medals.length; j++) {
    if (sameClinicalConstruct(medals[i], medals[j])) { redundantInContext++; }
  }
  acc.redundantPairs += redundantInContext;
  if (redundantInContext > 0) acc.contextsWithRedundantPair++;
  const total = medals.reduce((sum, m) => sum + estimatedQuestionCount(m.scale), 0);
  if (total > PODIUM_QUESTION_CAP) acc.capViolations++;
  for (const q of c.queixas) {
    acc.complaintsSelected++;
    const covered = medals.some((m) => m.scale.queixas.includes(q));
    if (covered) acc.complaintsCovered++;
    // Coberturável = existe pelo menos uma candidata SEGURA que fala à queixa.
    const coverable = matches.some((m) => m.scale.queixas.includes(q));
    if (coverable) acc.complaintsCoverable++;
    if (coverable && covered) acc.complaintsCoverableAndCovered++;
  }
  if (c.signals.length > 0) {
    acc.signalContexts++;
    const sigCtx = { queixas: c.queixas, selectedSignals: c.signals };
    if (medals.some((m) => scaleCoversSelectedSignalExactly(m.scale, sigCtx))) acc.signalContextsCovered++;
    if (matches.some((m) => scaleCoversSelectedSignalExactly(m.scale, sigCtx))) acc.signalContextsWithSafeCandidate++;
  }
}

const pct = (n: number, d: number) => (d === 0 ? null : Math.round((n / d) * 1000) / 10);
const report = {
  contexts: acc.contexts,
  trio3_pct: pct(acc.contextsWithTrio, acc.contexts),
  complaint_coverage_pct: pct(acc.complaintsCovered, acc.complaintsSelected),
  complaint_coverable_pct: pct(acc.complaintsCoverable, acc.complaintsSelected),
  complaint_covered_when_coverable_pct: pct(acc.complaintsCoverableAndCovered, acc.complaintsCoverable),
  medals_not_applicable: acc.medalsNotApplicable,
  exact_age_violations: acc.exactAgeViolations,
  band_no_overlap_violations: acc.bandNoOverlapViolations,
  band_medals_full_pct: pct(acc.bandMedalsFull, acc.bandMedals),
  band_medals_partial: acc.bandMedalsPartial,
  respondent_violations: acc.respondentViolations,
  redundant_pairs: acc.redundantPairs,
  contexts_with_redundant_pair: acc.contextsWithRedundantPair,
  cap_violations: acc.capViolations,
  signal_contexts: acc.signalContexts,
  signal_contexts_covered_pct: pct(acc.signalContextsCovered, acc.signalContexts),
  signal_contexts_with_safe_candidate: acc.signalContextsWithSafeCandidate,
  acute_contexts: acc.acuteContexts,
  acute_broadband_violations: acc.acuteBroadbandViolations,
  curated_contexts: acc.curatedCount,
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.table(report);
}
