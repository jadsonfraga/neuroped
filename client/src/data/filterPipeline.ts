import { allScales, faixasEtarias, type ScaleEntry } from "@/data/scaleFilter";
import { mergeFilterableCatalog } from "@/data/filterableCatalog";
import { noCostWorldScales } from "@/data/noCostWorldScales";
import {
  clinicianOnlyPenalty,
  curatedBoost,
  isPreConsulta,
  protectedLicenseKinds,
  unique,
} from "@/data/preConsultaCurated";

export interface ClinicalPattern {
  name: string;
  signature: string[];
  screening: string[];
  diagnostic?: string[];
  minAge?: number;
  maxAge?: number;
  allowedRespondentes?: ScaleEntry["respondente"][number][];
  reason: string;
}

export interface RankedRecommendation {
  slot: "Ouro" | "Prata" | "Bronze" | "Teste Direto" | "Questionario Escolar";
  scale: ScaleEntry | undefined;
  reason: string;
}

export const clinicalPatterns: ClinicalPattern[] = [
  { name: "Suspeita TEA em lactentes", signature: ["tea", "atraso"], screening: ["mchat"], diagnostic: ["cars"], minAge: 16, maxAge: 30, allowedRespondentes: ["pais"], reason: "M-CHAT-R/F e o rastreio de primeira linha para TEA entre 16 e 30 meses; CARS-2 entra como complemento clinico quando aplicavel." },
  { name: "TEA + comunicacao social", signature: ["tea", "linguagem"], screening: ["mchat"], diagnostic: ["cars"], minAge: 16, maxAge: 30, allowedRespondentes: ["pais"], reason: "TEA com queixa de linguagem em idade de toddler prioriza rastreio M-CHAT-R/F antes de instrumentos formais." },
  { name: "Suspeita TDAH escolar", signature: ["tdah", "comportamento"], screening: ["snap", "vanderbilt"], diagnostic: ["conners"], minAge: 72, allowedRespondentes: ["pais", "professor"], reason: "SNAP-IV e Vanderbilt cobrem sintomas nucleares em pais e escola a partir de 6 anos." },
  { name: "TDAH + ansiedade", signature: ["tdah", "ansiedade"], screening: ["snap", "scared"], diagnostic: ["conners"], minAge: 72, reason: "Bateria combinada inicia por TDAH nuclear e adiciona alvo ansioso/broadband." },
  { name: "TEA + TDAH", signature: ["tea", "tdah"], screening: ["mchat"], diagnostic: ["cars"], minAge: 16, maxAge: 30, allowedRespondentes: ["pais"], reason: "Em toddlers, TEA + TDAH prioriza rastreio de TEA e complementa comportamento/atencao." },
  { name: "Ansiedade + depressao", signature: ["ansiedade", "depressao"], screening: ["scared", "cdi2"], diagnostic: ["cbcl"], minAge: 96, allowedRespondentes: ["pais", "autoaplicavel"], reason: "SCARED rastreia ansiedade e deve ser combinado com instrumentos de humor apropriados para a idade." },
  { name: "Depressao + suicidio", signature: ["depressao", "suicidio"], screening: ["cssrs", "cdi2", "phqa"], diagnostic: ["cbcl"], minAge: 84, reason: "Risco suicida e prioridade de seguranca; C-SSRS deve subir para o topo e a triagem de humor precisa respeitar idade/respondente." },
  { name: "Aprendizagem + TDAH", signature: ["aprendizagem", "tdah"], screening: ["snap", "pdae"], diagnostic: ["conners"], minAge: 72, reason: "TDAH escolar com aprendizagem pede SNAP-IV e testes academicos/diretos." },
  { name: "Linguagem + atraso", signature: ["linguagem", "atraso"], screening: ["asq3", "denver"], maxAge: 66, allowedRespondentes: ["pais", "clinico"], reason: "Queixa de linguagem/desenvolvimento pequena deve iniciar por triagem parental ampla." },
  { name: "Aprendizagem escolar", signature: ["aprendizagem"], screening: ["pdae"], minAge: 72, allowedRespondentes: ["pais", "professor"], reason: "Rastreio pedagogico autoral e tarefas diretas sao primeira linha no app." },
  { name: "Cognicao", signature: ["cognicao"], screening: [], diagnostic: [], minAge: 48, reason: "Sondagens diretas sao primeira linha antes de instrumentos formais protegidos." },
];

export function defaultPreConsultaCatalog(extraWorld: ScaleEntry[] = noCostWorldScales): ScaleEntry[] {
  return unique([...mergeFilterableCatalog(allScales), ...extraWorld]).filter(isPreConsulta);
}

export function matchAge(scale: ScaleEntry, selectedAge: string | null): boolean {
  if (!selectedAge) return true;
  const age = faixasEtarias.find((item) => item.id === selectedAge);
  return age ? scale.ageMax >= age.min && scale.ageMin <= age.max : false;
}

function norm(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function scoreScale(
  scale: ScaleEntry,
  query: string,
  selectedQueixas: string[],
  selectedAge: string | null,
): number {
  const text = norm(`${scale.name} ${scale.fullName} ${scale.description} ${scale.queixas.join(" ")} ${scale.respondente.join(" ")} ${scale.fonte || ""}`);
  let value = 0;
  for (const token of norm(query).split(/\s+/).filter(Boolean)) {
    if (text.includes(token)) value += norm(scale.name).includes(token) ? 3 : 2;
  }
  for (const queixa of selectedQueixas) if (scale.queixas.includes(queixa)) value += 6;
  if (selectedAge && matchAge(scale, selectedAge)) value += 3;
  if (scale.prioridade === "triagem") value += 2;
  if (scale.respondente.includes("professor")) value += 1;
  if (scale.id.startsWith("world-")) value += 0.8;
  if (scale.appRoute) value += 3;
  value += curatedBoost(scale.appRoute, selectedQueixas);
  value += clinicianOnlyPenalty(scale.appRoute, scale.respondente, scale.prioridade);
  return value;
}

export function poolScales(
  catalog: ScaleEntry[],
  query: string,
  selectedQueixas: string[],
  selectedAge: string | null,
  selectedRespondente: ScaleEntry["respondente"][number] | null = null,
): ScaleEntry[] {
  const base = catalog.filter((scale) => {
    const matchesQueixa = selectedQueixas.length === 0 || scale.queixas.some((queixa) => selectedQueixas.includes(queixa));
    const matchesAge = matchAge(scale, selectedAge);
    const matchesRespondente = !selectedRespondente
      || scale.respondente.includes(selectedRespondente)
      || (selectedRespondente === "autoaplicavel" && scale.respondente.includes("crianca"));
    return matchesQueixa && matchesAge && matchesRespondente;
  });
  const hasActiveFilters = selectedQueixas.length > 0 || selectedAge !== null || selectedRespondente !== null;
  const results = base.length || !hasActiveFilters ? base : [];
  return unique(results)
    .map((scale) => ({ scale, score: scoreScale(scale, query, selectedQueixas, selectedAge) }))
    .sort((a, b) => b.score - a.score || a.scale.name.localeCompare(b.scale.name))
    .map((item) => item.scale);
}

export function detectGoldStandard(
  selectedQueixas: string[],
  selectedAge: string | null,
  selectedRespondente: ScaleEntry["respondente"][number] | null,
  catalog: ScaleEntry[],
): ClinicalPattern | null {
  const patterns = clinicalPatterns
    .map((pattern) => ({
      pattern,
      matchCount: pattern.signature.filter((signature) => selectedQueixas.includes(signature)).length,
    }))
    .filter(({ pattern, matchCount }) => matchCount === pattern.signature.length || (pattern.signature.length === 1 && matchCount === 1));

  let best: { pattern: ClinicalPattern; score: number } | null = null;
  for (const { pattern, matchCount } of patterns) {
    const age = selectedAge ? faixasEtarias.find((item) => item.id === selectedAge) : null;
    const center = age ? (age.min + age.max) / 2 : null;
    if (center != null && pattern.minAge != null && center < pattern.minAge) continue;
    if (center != null && pattern.maxAge != null && center > pattern.maxAge) continue;
    if (selectedRespondente && pattern.allowedRespondentes && !pattern.allowedRespondentes.includes(selectedRespondente)) continue;
    const candidateIds = [...pattern.screening, ...(pattern.diagnostic || [])];
    const hasApplicableScale = candidateIds.some((id) => {
      const scale = catalog.find((item) => item.id === id);
      if (!scale || !matchAge(scale, selectedAge)) return false;
      if (!selectedRespondente) return true;
      return scale.respondente.includes(selectedRespondente) || (selectedRespondente === "autoaplicavel" && scale.respondente.includes("crianca"));
    });
    if (!hasApplicableScale && candidateIds.length > 0) continue;
    const score = matchCount / pattern.signature.length;
    if (!best || score > best.score) best = { pattern, score };
  }
  return best?.pattern ?? null;
}

function findPatternScale(
  pattern: ClinicalPattern | null,
  pool: ScaleEntry[],
  catalog: ScaleEntry[],
  selectedAge: string | null,
  selectedRespondente: ScaleEntry["respondente"][number] | null,
): ScaleEntry | null {
  if (!pattern) return null;
  const ids = [...pattern.screening, ...(pattern.diagnostic || [])];
  for (const id of ids) {
    const scale = pool.find((item) => item.id === id) || catalog.find((item) => item.id === id);
    if (!scale || !matchAge(scale, selectedAge)) continue;
    if (selectedRespondente && !scale.respondente.includes(selectedRespondente) && !(selectedRespondente === "autoaplicavel" && scale.respondente.includes("crianca"))) continue;
    return scale;
  }
  return null;
}

function pickNext(pool: ScaleEntry[], used: Set<string>, preferred?: ScaleEntry | null): ScaleEntry | undefined {
  const candidate = preferred && !used.has(preferred.id) ? preferred : pool.find((scale) => !used.has(scale.id));
  if (candidate) used.add(candidate.id);
  return candidate;
}

export function buildFilterRanking(
  catalog: ScaleEntry[],
  query: string,
  selectedQueixas: string[],
  selectedAge: string | null,
  selectedRespondente: ScaleEntry["respondente"][number] | null = null,
): { pool: ScaleEntry[]; pattern: ClinicalPattern | null; recommendations: RankedRecommendation[] } {
  const pool = poolScales(catalog, query, selectedQueixas, selectedAge, selectedRespondente);
  const pattern = detectGoldStandard(selectedQueixas, selectedAge, selectedRespondente, catalog);
  const gold = findPatternScale(pattern, pool, catalog, selectedAge, selectedRespondente);
  const used = new Set<string>();
  const ouro = pickNext(pool, used, gold || pool[0]);
  const prata = pickNext(pool, used);
  const bronze = pickNext(pool, used);
  const direct = pool.find((scale) => Boolean(scale.appRoute));
  const school = pool.find((scale) => scale.respondente.includes("professor"));

  return {
    pool,
    pattern,
    recommendations: [
      { slot: "Ouro", scale: ouro, reason: pattern ? `PADRAO-OURO: ${pattern.reason}` : "Maior compatibilidade combinando queixa, idade, respondente, prioridade e disponibilidade." },
      { slot: "Prata", scale: prata, reason: "Alternativa complementar quando o instrumento ouro nao for suficiente ou disponivel." },
      { slot: "Bronze", scale: bronze, reason: "Terceira opcao para apoio ou triagem secundaria; nao repete Ouro nem Prata." },
      { slot: "Teste Direto", scale: direct || pool[0], reason: "Prioriza instrumento que ja possui rota de aplicacao dentro do app." },
      { slot: "Questionario Escolar", scale: school || pool[0], reason: "Prioriza instrumentos com professor como respondente ou utilidade escolar." },
    ],
  };
}

export function isProtectedScale(scale: ScaleEntry | undefined): boolean {
  return Boolean(scale?.licencaUso && protectedLicenseKinds.has(scale.licencaUso));
}
