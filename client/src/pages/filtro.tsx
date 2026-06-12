import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  Award,
  Baby,
  BookOpen,
  Brain,
  ClipboardCheck,
  Filter,
  GraduationCap,
  HeartPulse,
  Medal,
  MessageCircle,
  Moon,
  Pill,
  RotateCcw,
  School,
  Search,
  ShieldAlert,
  Star,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { brandAssets } from "@/components/BrandAssets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DirectTestsRecommender } from "@/components/DirectTestsRecommender";
import { ParentTestsRecommender } from "@/components/ParentTestsRecommender";
import { OPBRecommendationCards } from "@/components/OPBRecommendationCards";
import { allScales, faixasEtarias, queixas, type ScaleEntry } from "@/data/scaleFilter";
import { norm, guessQueixas, guessRespondente } from "@/data/queixaMapping";
import { mergeFilterableCatalog } from "@/data/filterableCatalog";
import { noCostWorldScales } from "@/data/noCostWorldScales";
import { getOPBRecommendations } from "@/data/filterRecommendationsOPB";
import { RefinedSignalSelector } from "@/components/RefinedSignalSelector";
import {
  filterScalesIntelligently,
  generateContextualRecommendation,
  getApplicationMode,
  getImplementationStatus,
  SAFE_EMPTY_MESSAGE,
  type FilterContext,
  type RefinedScaleMatch,
} from "@/data/advancedFilterLogic";
import { haptic } from "@/lib/haptic";
import { softHover, softTap, softTick } from "@/lib/softSounds";

type Slot = "Ouro" | "Prata" | "Bronze" | "Teste Direto" | "Questionário Escolar" | "Satisfação Medicação";
type Tier = "ouro" | "prata" | "bronze";
type Row = [number, string, string, string, string, string, "Ouro" | "Prata" | "Bronze", "embed" | "permission" | "link"];

const REGISTRY_URL = "https://raw.githubusercontent.com/jadsonfraga/neuroped/main/data/neuroped_escalas_neuropsiquiatria_infantil_100.json";
// EUSM-10 agora vive no catálogo canônico (filterableCatalog, id "eusm10") — sem
// duplicata. CORE_FILTERABLE_CATALOG já o inclui.
const CORE_FILTERABLE_CATALOG = mergeFilterableCatalog(allScales);

// Conjunto canônico de ids que abrem como ficha técnica via catch-all
// (/generic-scale/:id renderiza qualquer escala de allScales — página real).
const ALL_SCALE_IDS = new Set(allScales.map((s) => s.id));

/**
 * Rota REAL para a qual uma escala abre (página renderizada de verdade):
 *  1. appRoute dedicado (validado contra App.tsx pelo guard audit:data — ROUTE_404);
 *  2. ficha técnica /generic-scale/:id quando o id existe em allScales (catch-all);
 *  3. catálogo mundial /escalas-neuropsiquiatria para escalas "world-*".
 * Retorna null quando a escala NÃO abre em lugar nenhum (deve sair do filtro).
 */
function resolveAppRoute(scale: ScaleEntry): string | null {
  if (scale.appRoute) return scale.appRoute;
  if (ALL_SCALE_IDS.has(scale.id)) return `/generic-scale/${scale.id}`;
  if (scale.id.startsWith("world-")) return "/escalas-neuropsiquiatria";
  return null;
}

// Só permanecem no filtro escalas que ABREM (req. do usuário: "só deverão ficar
// aquelas que abrem"). Qualquer escala sem rota real é removida do catálogo.
function opensInApp(scale: ScaleEntry): boolean {
  return resolveAppRoute(scale) !== null;
}

function unique(scales: ScaleEntry[]) {
  const seen = new Set<string>();
  return scales.filter((s) => seen.has(s.id) ? false : (seen.add(s.id), true));
}

function ageMonths(range: string) {
  const m = range.replace(",", ".").match(/([0-9.]+)\s*[–-]\s*([0-9.]+)/);
  return m ? { min: Math.round(Number(m[1]) * 12), max: Math.round(Number(m[2]) * 12) } : { min: 0, max: 216 };
}


function rowToScale(row: Row): ScaleEntry {
  const [n, sigla, nome, categoria, idade, respondente, selo, politica] = row;
  const a = ageMonths(idade);
  return {
    id: `world-registry-${String(n).padStart(3, "0")}`,
    name: sigla,
    fullName: nome,
    ageMin: a.min,
    ageMax: a.max,
    queixas: guessQueixas(categoria, `${sigla} ${nome}`),
    respondente: guessRespondente(respondente),
    prioridade: selo === "Bronze" ? "monitorizacao" : "triagem",
    tempo: "3–10 min",
    description: `Escala mundial sem custo. Política: ${politica}. Usar como triagem/monitoramento, nunca diagnóstico isolado.`,
    fonte: "Catálogo NeuroPed 100 escalas · verificar fonte oficial antes de embutir itens",
    licencaUso: politica === "embed" ? "livre" : "restrita",
  };
}

function matchAge(scale: ScaleEntry, selectedAge: string | null) {
  const age = faixasEtarias.find((a) => a.id === selectedAge);
  return !age || (scale.ageMax >= age.min && scale.ageMin <= age.max);
}

// Realce textual leve para a busca livre. NÃO decide pertinência clínica —
// apenas reordena, dentro dos candidatos já validados pelo motor, os que casam
// com o termo digitado. (A segurança/score clínico vem do advancedFilterLogic.)
function searchBoost(scale: ScaleEntry, query: string) {
  const tokens = norm(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  const text = norm(`${scale.name} ${scale.fullName} ${scale.description} ${scale.queixas.join(" ")} ${scale.respondente.join(" ")} ${scale.fonte || ""}`);
  let value = 0;
  for (const token of tokens) if (text.includes(token)) value += norm(scale.name).includes(token) ? 7 : 2;
  return value;
}

// Padrões clínicos ouro: assinatura de sintomas → escala padrão-ouro
interface ClinicalPattern {
  name: string;
  signature: string[]; // queixas que formam o padrão
  goldStandard: string; // ID da escala ouro
  reason: string;
}

const clinicalPatterns: ClinicalPattern[] = [
  // TEA: traço social + comportamento + linguagem/atraso
  { name: "Suspeita TEA (padrão social-comportamental)", signature: ["tea", "comportamento", "linguagem"], goldStandard: "ados2", reason: "ADOS-2 é padrão-ouro diagnóstico de TEA quando há combinação de déficit social, comportamento restritivo e comunicação" },
  { name: "Suspeita TEA em lactentes", signature: ["tea", "atraso"], goldStandard: "mchat", reason: "M-CHAT-R/F é rastreio padrão-ouro para TEA entre 16-30 meses; sensibilidade 95%" },

  // TDAH: desatenção + hiperatividade + impulsividade/comportamento
  { name: "Suspeita TDAH (completo)", signature: ["tdah", "comportamento"], goldStandard: "snap", reason: "SNAP-IV é validado DSM-5 para triagem de TDAH com 18 itens diretos; responde pais/professor" },
  { name: "TDAH complexo (com função executiva)", signature: ["tdah", "cognicao"], goldStandard: "brief2", reason: "BRIEF-2 complementa TDAH avaliando inibição, flexibilidade, controle emocional—funções prejudicadas no TDAH" },

  // Desenvolvimento global
  { name: "Atraso do desenvolvimento global", signature: ["atraso", "linguagem", "motor"], goldStandard: "bayley", reason: "Bayley-III é padrão-ouro diagnóstico para atraso global em lactentes (<3 anos); avalia cognição, linguagem, motor" },
  { name: "Atraso dev. pré-escolar (triagem)", signature: ["atraso"], goldStandard: "denver", reason: "Denver II é rastreio padrão-ouro para marcos de desenvolvimento; 4 domínios, 30-45 itens" },

  // Ansiedade infantil
  { name: "Transtorno de ansiedade (criança)", signature: ["ansiedade"], goldStandard: "scared", reason: "SCARED é padrão-ouro para triagem de ansiedade em crianças; 41 itens, 5 subescalas (pânico, generalizada, separação, social, evitação escolar)" },
  { name: "Ansiedade + depressão comórbida", signature: ["ansiedade", "depressao"], goldStandard: "rcads", reason: "RCADS avalia 6 transtornos (ansiedade + depressão); distingue sintomas sobrepostos" },

  // Comportamento disruptivo
  { name: "Problemas comportamentais gerais", signature: ["comportamento"], goldStandard: "cbcl", reason: "CBCL é padrão-ouro para triagem de psicopatologia infantil; 100 itens, problemas internalizantes/externalizantes/sociais" },
  { name: "Comportamento + escola (triagem)", signature: ["comportamento", "aprendizagem"], goldStandard: "sdq", reason: "SDQ é breve (25 itens) com versão criança/pais/professor; detecta problemas comportamentais e acadêmicos" },

  // Linguagem/Comunicação
  { name: "Atraso de linguagem/comunicação", signature: ["linguagem", "atraso"], goldStandard: "catclams", reason: "CAT/CLAMS avalia marcos cognitivos e linguísticos em lactentes; 15-20 min, simples, validado" },
];

function detectGoldStandard(selectedQueixas: string[], _selectedAge: string | null): ClinicalPattern | null {
  if (selectedQueixas.length < 2) return null; // Precisa de 2+ sintomas para padrão

  // Busca padrão com melhor match (quantas queixas coincidem)
  let bestMatch: { pattern: ClinicalPattern; score: number } | null = null;

  for (const pattern of clinicalPatterns) {
    const matchCount = pattern.signature.filter((s) => selectedQueixas.includes(s)).length;
    const score = matchCount / pattern.signature.length; // % de match

    if (matchCount >= 2 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { pattern, score };
    }
  }

  return bestMatch?.pattern ?? null;
}

// Fonte ÚNICA de verdade: roda o motor clínico (advancedFilterLogic) sobre o
// catálogo e, dentro dos candidatos seguros, aplica o realce de busca.
// Pode retornar [] — NUNCA cai para o catálogo inteiro (sem fallback perigoso).
function rankSafely(catalog: ScaleEntry[], ctx: FilterContext, query: string): RefinedScaleMatch[] {
  const matches = filterScalesIntelligently(unique(catalog), ctx);
  if (!query.trim()) return matches;
  return [...matches].sort(
    (a, b) =>
      b.relevanceScore + searchBoost(b.scale, query) - (a.relevanceScore + searchBoost(a.scale, query))
  );
}

function tierFromSlot(slot: Slot): Tier | null {
  if (slot === "Ouro") return "ouro";
  if (slot === "Prata") return "prata";
  if (slot === "Bronze") return "bronze";
  return null;
}

const CLINICAL_TIER_LABEL: Record<RefinedScaleMatch["tier"], string> = {
  gold: "ajuste clínico ouro",
  silver: "ajuste clínico prata",
  bronze: "ajuste clínico bronze",
  conditional: "ajuste condicional",
};

function rec(slot: Slot, match: RefinedScaleMatch | undefined, reason: string, tone: string) {
  const scale = match?.scale;
  // Estado HONESTO vindo do motor (req. 3): aplicação completa vs ficha vs externo.
  const state = match
    ? match.implementationLabel
    : "Sem opção complementar segura para este perfil.";
  return {
    slot,
    tier: tierFromSlot(slot),
    // Toda escala recomendada abre uma página real: aplicação completa, ficha
    // técnica (/generic-scale/:id) ou catálogo mundial. Nunca mais o loop /filtro.
    route: scale ? (resolveAppRoute(scale) ?? "/filtro") : "/filtro",
    title: scale?.name || "Sem escala segura",
    subtitle: scale?.fullName || "Refine idade, queixa ou respondente",
    reason,
    state,
    source: scale?.fonte,
    tone,
    hasScale: Boolean(scale),
    // Saída do motor de filtragem avançada (advancedFilterLogic)
    clinicalTier: match ? CLINICAL_TIER_LABEL[match.tier] : null,
    confidence: match?.confidenceLevel ?? null,
    warnings: match?.warningFlags ?? [],
    clinicalReason: match?.clinicalReason ?? null,
    implementationStatus: match?.implementationStatus ?? null,
  };
}

function icon(slot: Slot) {
  if (slot === "Ouro") return <Award className="h-5 w-5" />;
  if (slot === "Prata") return <Medal className="h-5 w-5" />;
  if (slot === "Bronze") return <Star className="h-5 w-5" />;
  if (slot === "Teste Direto") return <ClipboardCheck className="h-5 w-5" />;
  return <School className="h-5 w-5" />;
}

interface ScaleVisual {
  label: string;
  Icon: LucideIcon;
  tone: string;
}

function getScaleVisual(scale: ScaleEntry): ScaleVisual {
  const t = norm(`${scale.name} ${scale.fullName} ${scale.description} ${scale.queixas.join(" ")} ${scale.respondente.join(" ")}`);

  if (/tea|autis|social|assq|m-chat|q-chat|cast|aq/.test(t)) return { label: "TEA / social", Icon: Brain, tone: "from-violet-600 via-purple-700 to-slate-950" };
  if (/tdah|adhd|snap|vanderbilt|aten|weiss|wfirs/.test(t)) return { label: "atenção", Icon: Activity, tone: "from-amber-500 via-orange-600 to-red-800" };
  if (/linguagem|fala|comunic|language|speech/.test(t)) return { label: "linguagem", Icon: MessageCircle, tone: "from-cyan-600 via-blue-700 to-slate-950" };
  if (/school|professor|teacher|aprendiz|leitura|escrita|aritmet|academ/.test(t)) return { label: "escola", Icon: GraduationCap, tone: "from-emerald-600 via-teal-700 to-slate-950" };
  if (/sono|sleep|bears|psq|cshq/.test(t)) return { label: "sono", Icon: Moon, tone: "from-indigo-700 via-blue-900 to-slate-950" };
  if (/ansiedade|depress|humor|mood|phq|gad|scared|rcads|scas/.test(t)) return { label: "humor", Icon: HeartPulse, tone: "from-rose-600 via-red-700 to-slate-950" };
  if (/desenvolvimento|milestone|cdc|swyc|atraso|motor|gmfcs/.test(t)) return { label: "desenvolvimento", Icon: Baby, tone: "from-blue-600 via-indigo-700 to-slate-950" };
  if (/eusm|medic|dose|farmaco|risperidona|metilfenidato|tolerab|adesao|efeito/.test(t)) return { label: "medicação", Icon: Pill, tone: "from-teal-600 via-cyan-700 to-slate-950" };
  if (/pais|parent|cuidador|family/.test(t)) return { label: "família", Icon: Users, tone: "from-slate-600 via-slate-800 to-slate-950" };

  return { label: "clínico", Icon: ClipboardCheck, tone: "from-primary via-chart-2 to-slate-950" };
}

function getRecommendationReasons(scale: ScaleEntry | undefined, selectedQueixas: string[], selectedAge: string | null): string[] {
  if (!scale) return [];
  const reasons: string[] = [];

  // Motivo contextual por idade
  if (selectedAge && matchAge(scale, selectedAge)) {
    if (scale.ageMin > 0) {
      const minYears = Math.round(scale.ageMin / 12);
      reasons.push(`✓ Recomendado a partir de ${minYears} anos`);
    } else {
      reasons.push("✓ Aplicável nesta faixa etária");
    }
  } else if (selectedAge && !matchAge(scale, selectedAge)) {
    const minYears = Math.round(scale.ageMin / 12);
    reasons.push(`⚠ Recomendado apenas a partir de ${minYears} anos`);
  }

  // Motivo contextual por queixa
  if (selectedQueixas.length > 0) {
    const matchedQueixas = scale.queixas.filter((q) => selectedQueixas.includes(q));
    if (matchedQueixas.length > 0) {
      if (matchedQueixas.length === 1) {
        reasons.push(`✓ Cobre sintoma: ${matchedQueixas[0]}`);
      } else {
        reasons.push(`✓ Cobre ${matchedQueixas.length} sintomas selecionados`);
      }
    }
  }

  // Motivo contextual por respondente
  if (scale.respondente.includes("professor")) {
    reasons.push("✓ Respondente: Professor");
  } else if (scale.respondente.includes("pais")) {
    reasons.push("✓ Respondente: Pais/Cuidador");
  } else if (scale.respondente.includes("clinico")) {
    reasons.push("✓ Respondente: Clínico (observação direta)");
  }

  if (scale.appRoute) {
    reasons.push(getImplementationStatus(scale) === "complete" ? "✓ Aplicação completa no app" : "✓ Ficha técnica no app");
  }
  if (scale.prioridade === "triagem") reasons.push("✓ Instrumento de triagem");

  return reasons.length ? reasons : ["✓ Compatibilidade geral"];
}

export default function FiltroPage() {
  const [search, setSearch] = useState("");
  const [selectedQueixas, setSelectedQueixas] = useState<string[]>([]);
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [selectedRespondente, setSelectedRespondente] = useState<ScaleEntry["respondente"][number] | null>(null);
  const [selectedCommunication, setSelectedCommunication] = useState<"verbal" | "nonverbal" | null>(null);
  const [selectedLiteracy, setSelectedLiteracy] = useState<"literate" | "preliterate" | null>(null);
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<"diagnostic" | "monitoring" | null>(null);
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const [world, setWorld] = useState<ScaleEntry[]>(noCostWorldScales);
  const [status, setStatus] = useState<"loading" | "ok" | "fallback">("loading");

  // Auto-close welcome tour on /filtro — ensures filter content is visible immediately
  useEffect(() => {
    try {
      localStorage.setItem("np_tour_v2_done", "1");
      localStorage.setItem("np_tour_intro_v2", "1");
    } catch { /* tour é best-effort */ }
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(REGISTRY_URL, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((data: { escalas?: Row[] }) => {
        const parsed = (data.escalas || []).map(rowToScale);
        if (parsed.length !== 100) throw new Error("registro incompleto");
        if (alive) { setWorld(unique([...noCostWorldScales, ...parsed])); setStatus("ok"); }
      })
      .catch(() => { if (alive) setStatus("fallback"); });
    return () => { alive = false; };
  }, []);

  // Catálogo do filtro = só escalas que ABREM (têm rota real). Escalas sem
  // destino renderizável são removidas — nunca recomendamos um beco sem saída.
  const catalog = useMemo(() => unique([...CORE_FILTERABLE_CATALOG, ...world]).filter(opensInApp), [world]);
  const hasSearch = search.trim().length >= 2 || selectedQueixas.length > 0 || Boolean(selectedAge) || Boolean(selectedRespondente) || Boolean(selectedCommunication) || Boolean(selectedLiteracy) || Boolean(selectedAssessmentType);

  // === MOTOR CLÍNICO (advancedFilterLogic) — fonte ÚNICA de verdade ===
  const filterContext = useMemo<FilterContext>(() => {
    const ageRange = selectedAge ? faixasEtarias.find((a) => a.id === selectedAge) : null;
    const ageMonths = ageRange ? Math.round((ageRange.min + ageRange.max) / 2) : null;
    return {
      queixas: selectedQueixas,
      ageMonths,
      ageBand: ageRange ? { min: ageRange.min, max: ageRange.max } : null,
      respondente: selectedRespondente ?? null,
      isVerbal: selectedCommunication === "verbal" ? true : selectedCommunication === "nonverbal" ? false : null,
      isLiterate: selectedLiteracy === "literate" ? true : selectedLiteracy === "preliterate" ? false : null,
      assessmentUse:
        selectedAssessmentType === "diagnostic" ? "diagnostico" : selectedAssessmentType === "monitoring" ? "monitorizacao" : null,
      selectedSignals: selectedSignalIds,
    };
  }, [selectedQueixas, selectedAge, selectedRespondente, selectedCommunication, selectedLiteracy, selectedAssessmentType, selectedSignalIds]);

  // Candidatos seguros, já ordenados por pertinência clínica. PODE SER VAZIO.
  const refinedMatches = useMemo(() => rankSafely(catalog, filterContext, search), [catalog, filterContext, search]);
  const refinedById = useMemo(() => new Map(refinedMatches.map((m) => [m.scale.id, m])), [refinedMatches]);
  const rankedPool = useMemo(() => refinedMatches.map((m) => m.scale), [refinedMatches]);
  const hasSafeResults = refinedMatches.length > 0;
  const clinicalRecommendation = useMemo(() => generateContextualRecommendation(refinedMatches), [refinedMatches]);

  // Padrão-ouro curado só vale se a escala for um candidato SEGURO neste contexto.
  const detectedPattern = useMemo(() => detectGoldStandard(selectedQueixas, selectedAge), [selectedQueixas, selectedAge]);
  const goldStandardMatch = useMemo(
    () => (detectedPattern ? refinedById.get(detectedPattern.goldStandard) ?? null : null),
    [detectedPattern, refinedById]
  );

  // === PÓDIO COMPLEMENTAR (req. 9): Ouro/Prata/Bronze nunca repetem o mesmo id ===
  const podium = useMemo(() => {
    const empty = { ouro: undefined, prata: undefined, bronze: undefined, direct: undefined, school: undefined } as Record<
      "ouro" | "prata" | "bronze" | "direct" | "school",
      RefinedScaleMatch | undefined
    >;
    if (!hasSafeResults) return empty;

    const used = new Set<string>();
    const take = (pred: (m: RefinedScaleMatch) => boolean) => {
      const found = refinedMatches.find((m) => !used.has(m.scale.id) && pred(m));
      if (found) used.add(found.scale.id);
      return found;
    };

    let ouro: RefinedScaleMatch | undefined;
    if (goldStandardMatch && !used.has(goldStandardMatch.scale.id)) {
      ouro = goldStandardMatch;
      used.add(goldStandardMatch.scale.id);
    } else {
      ouro = take(() => true);
    }

    const ouroMode = ouro?.applicationMode ?? null;
    const ouroQueixas = new Set(ouro?.scale.queixas ?? []);
    // Prata: complementar — modo de aplicação OU domínio diferente do Ouro; senão, próximo distinto.
    const prata =
      take((m) => m.applicationMode !== ouroMode || !m.scale.queixas.some((q) => ouroQueixas.has(q))) ?? take(() => true);
    const bronze = take(() => true);

    // Slots categóricos (podem coincidir com o pódio — propósito distinto).
    const direct = refinedMatches.find((m) => getApplicationMode(m.scale) === "teste_direto_crianca");
    const school = refinedMatches.find((m) => getApplicationMode(m.scale) === "questionario_professor");
    return { ouro, prata, bronze, direct, school };
  }, [refinedMatches, hasSafeResults, goldStandardMatch]);

  const isGoldPattern = Boolean(goldStandardMatch && podium.ouro?.scale.id === goldStandardMatch.scale.id);
  const ranking = [
    rec(
      "Ouro",
      podium.ouro,
      isGoldPattern
        ? `PADRÃO-OURO: ${detectedPattern!.reason}`
        : "Melhor instrumento para idade, queixa, finalidade e respondente.",
      "from-amber-500 via-yellow-600 to-red-800"
    ),
    rec("Prata", podium.prata, "Complementar: domínio ou modo de aplicação diferente do Ouro.", "from-slate-400 via-slate-500 to-slate-700"),
    rec("Bronze", podium.bronze, "Apoio secundário ou triagem breve adicional.", "from-orange-500 via-amber-700 to-stone-800"),
    rec("Teste Direto", podium.direct, "Instrumento aplicado diretamente com a criança.", "from-blue-600 via-indigo-700 to-slate-950"),
    rec("Questionário Escolar", podium.school, "Questionário respondido por professor/contexto escolar.", "from-emerald-600 via-teal-700 to-slate-950"),
  ];

  const toggleQueixa = (id: string) => {
    softTick(); haptic.select();
    setSelectedQueixas((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const clearAll = () => {
    softTap(); haptic.tap(); setSearch(""); setSelectedAge(null); setSelectedQueixas([]); setSelectedRespondente(null); setSelectedCommunication(null); setSelectedLiteracy(null); setSelectedAssessmentType(null);
  };

  const resultsSectionRef = useRef<HTMLDivElement>(null);

  // Scroll suavemente para resultados quando aparecem
  useEffect(() => {
    if (hasSearch && resultsSectionRef.current) {
      setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [hasSearch]);

  return (
    <div className="page-enter container-filtro filter-260-shell pb-4 sm:pb-8">
      {/* Full-width header */}
      <header className="rounded-[2rem] border border-border/70 bg-card/90 p-3 sm:p-5 shadow-sm backdrop-blur mb-3 sm:mb-5">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="filter-260-iconbox flex h-10 sm:h-12 w-10 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md"><Filter className="h-4 sm:h-5 w-4 sm:w-5" /></div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-1 sm:mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10 text-[10px] sm:text-xs">ranking · escalas + questionários</Badge>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-foreground">Filtro Clínico Inteligente</h1>
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">Cruza idade, queixa, respondente, rota direta e 100 escalas mundiais sem custo.</p>
          </div>
        </div>
      </header>

      {/* Stats — full width */}
      <section className="grid gap-2 sm:gap-3 grid-cols-3 sm:grid-cols-3 mb-4 sm:mb-6">
        <Card><CardContent className="p-2 sm:p-4"><p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-muted-foreground">filtrável</p><p className="text-xl sm:text-2xl font-black text-foreground">{catalog.length}</p></CardContent></Card>
        <Card><CardContent className="p-2 sm:p-4"><p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-muted-foreground">mundiais</p><p className="text-xl sm:text-2xl font-black text-foreground">{world.length}</p></CardContent></Card>
        <Card><CardContent className="p-2 sm:p-4"><p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-muted-foreground">status</p><p className="text-xl sm:text-2xl font-black text-foreground">{status}</p></CardContent></Card>
      </section>

      {/* Two-column grid: Controls (left) + Results (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-max">

        {/* LEFT COLUMN — Controls (Sticky on Desktop) */}
        <div className="lg:col-span-1 space-y-3 sm:space-y-4 lg:sticky lg:top-5 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">

          {/* Search & Filters */}
          <section className="space-y-2 sm:space-y-3 rounded-[1.5rem] border border-border/70 bg-card/80 p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Medicação, autismo, TDAH, ansiedade..." className="h-9 sm:h-11 rounded-2xl pl-10 pr-10 text-sm" data-testid="input-search" />
          {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Limpar busca"><X className="h-4 w-4" /></button>}
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Idade</p>
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
            {faixasEtarias.map((age) => <button key={age.id} type="button" aria-pressed={selectedAge === age.id} aria-label={`Faixa etária ${age.label}`} onMouseEnter={() => softHover()} onClick={() => setSelectedAge((v) => v === age.id ? null : age.id)} className={`shrink-0 rounded-2xl border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold transition ${selectedAge === age.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}>{age.label}</button>)}
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground truncate">Queixa</p>
              {detectedPattern && <span className="shrink-0 inline-block px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-[9px] sm:text-[10px] font-bold text-amber-900 dark:text-amber-200 whitespace-nowrap">🧠 {detectedPattern.name.split('(')[0]}</span>}
            </div>
            {hasSearch && <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="h-6 sm:h-7 gap-1 px-2 text-xs"><RotateCcw className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> <span className="hidden sm:inline">limpar</span></Button>}
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {queixas.slice(0, 24).map((q) => <button key={q.id} type="button" aria-pressed={selectedQueixas.includes(q.id)} aria-label={q.label} onMouseEnter={() => softHover()} onClick={() => toggleQueixa(q.id)} className={`rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 min-h-9 sm:min-h-auto ${selectedQueixas.includes(q.id) ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background hover:border-primary/40 hover:bg-muted/60"}`}>
              <span className="truncate text-[11px] sm:text-xs leading-tight">{q.label}</span>
            </button>)}
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2 pt-1.5 sm:pt-2 border-t border-border/50">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Respondente</p>
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
            <button key="crianca" type="button" aria-pressed={selectedRespondente === "autoaplicavel"} aria-label="Respondente: criança (teste direto)" onMouseEnter={() => softHover()} onClick={() => setSelectedRespondente((v) => v === "autoaplicavel" ? null : "autoaplicavel")} className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedRespondente === "autoaplicavel" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}><span aria-hidden="true">🧒</span> <span className="hidden sm:inline">Direto</span></button>
            <button key="pais" type="button" aria-pressed={selectedRespondente === "pais"} aria-label="Respondente: pais ou cuidador" onMouseEnter={() => softHover()} onClick={() => setSelectedRespondente((v) => v === "pais" ? null : "pais")} className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedRespondente === "pais" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}><span aria-hidden="true">👨‍👩‍👧</span> <span className="hidden sm:inline">Pais</span></button>
            <button key="professor" type="button" aria-pressed={selectedRespondente === "professor"} aria-label="Respondente: professor ou escola" onMouseEnter={() => softHover()} onClick={() => setSelectedRespondente((v) => v === "professor" ? null : "professor")} className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedRespondente === "professor" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}><span aria-hidden="true">👨‍🏫</span> <span className="hidden sm:inline">Escola</span></button>
            <button key="clinico" type="button" aria-pressed={selectedRespondente === "clinico"} aria-label="Respondente: clínico (observação direta)" onMouseEnter={() => softHover()} onClick={() => setSelectedRespondente((v) => v === "clinico" ? null : "clinico")} className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedRespondente === "clinico" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}><span aria-hidden="true">👨‍⚕️</span> <span className="hidden sm:inline">Clínico</span></button>
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2 pt-1.5 sm:pt-2 border-t border-border/50">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Comunicação</p>
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
            <button key="verbal" type="button" aria-pressed={selectedCommunication === "verbal"} aria-label="Comunicação: criança verbal (fala)" onMouseEnter={() => softHover()} onClick={() => setSelectedCommunication((v) => v === "verbal" ? null : "verbal")} className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedCommunication === "verbal" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}><span aria-hidden="true">🗣️</span> <span className="hidden sm:inline">Fala</span></button>
            <button key="nonverbal" type="button" aria-pressed={selectedCommunication === "nonverbal"} aria-label="Comunicação: criança não-verbal" onMouseEnter={() => softHover()} onClick={() => setSelectedCommunication((v) => v === "nonverbal" ? null : "nonverbal")} className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedCommunication === "nonverbal" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}><span aria-hidden="true">🤐</span> <span className="hidden sm:inline">Não-Verbal</span></button>
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2 pt-1.5 sm:pt-2 border-t border-border/50">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Alfabetização</p>
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
            <button key="literate" type="button" aria-pressed={selectedLiteracy === "literate"} aria-label="Alfabetização: criança alfabetizada" onMouseEnter={() => softHover()} onClick={() => setSelectedLiteracy((v) => v === "literate" ? null : "literate")} className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedLiteracy === "literate" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}><span aria-hidden="true">📖</span> <span className="hidden sm:inline">Alfabetizada</span></button>
            <button key="preliterate" type="button" aria-pressed={selectedLiteracy === "preliterate"} aria-label="Alfabetização: criança pré-alfabetizada" onMouseEnter={() => softHover()} onClick={() => setSelectedLiteracy((v) => v === "preliterate" ? null : "preliterate")} className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedLiteracy === "preliterate" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}><span aria-hidden="true">👶</span> <span className="hidden sm:inline">Pré-Alfab.</span></button>
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2 pt-1.5 sm:pt-2 border-t border-border/50">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tipo de Avaliação</p>
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
            <button key="diagnostic" type="button" aria-pressed={selectedAssessmentType === "diagnostic"} aria-label="Tipo de avaliação: diagnóstico" onMouseEnter={() => softHover()} onClick={() => setSelectedAssessmentType((v) => v === "diagnostic" ? null : "diagnostic")} className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedAssessmentType === "diagnostic" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}><span aria-hidden="true">🔍</span> <span className="hidden sm:inline">Diagnóstico</span></button>
            <button key="monitoring" type="button" aria-pressed={selectedAssessmentType === "monitoring"} aria-label="Tipo de avaliação: monitorização" onMouseEnter={() => softHover()} onClick={() => setSelectedAssessmentType((v) => v === "monitoring" ? null : "monitoring")} className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedAssessmentType === "monitoring" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}><span aria-hidden="true">📊</span> <span className="hidden sm:inline">Monitorização</span></button>
          </div>
        </div>
      </section>

      {/* Mascote Inteligente — muda com padrão detectado */}
      {!hasSearch && (
        <div className="flex justify-center mt-4">
          <img
            src={detectedPattern ? brandAssets.mascots.consultorioSuperman : brandAssets.mascots.superDoctor}
            alt="Dr. Jadson — seu assistente de diagnóstico"
            className="w-32 h-auto rounded-2xl shadow-lg hover:scale-105 transition-transform"
            loading="lazy"
          />
        </div>
      )}

      {/* Refined Signal Selector — appears when 1 queixa + age selected */}
      {selectedQueixas.length === 1 && selectedAge && (
        <section className="rounded-2xl border border-teal-200/40 bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:border-teal-800/40 dark:from-teal-950/20 dark:to-cyan-950/20 p-4 sm:p-5">
          <RefinedSignalSelector
            queixaId={selectedQueixas[0]}
            queixaLabel={queixas.find(q => q.id === selectedQueixas[0])?.label || ""}
            ageMonths={Math.round(((faixasEtarias.find(f => f.id === selectedAge)?.min ?? 0) + (faixasEtarias.find(f => f.id === selectedAge)?.max ?? 0)) / 2)}
            selectedSignalIds={selectedSignalIds}
            onSignalToggle={(signalId) => {
              setSelectedSignalIds(prev =>
                prev.includes(signalId) ? prev.filter(x => x !== signalId) : [...prev, signalId]
              );
            }}
            onRecommendationSelect={(rec) => {
              softTick(); haptic.select();
              console.log("Recomendação selecionada:", rec);
            }}
          />
        </section>
      )}
        </div>

        {/* RIGHT COLUMN — Results (lg:col-span-2) */}
        {hasSearch && (
      <section ref={resultsSectionRef} className="space-y-3 lg:col-span-2">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">saída obrigatória</p><h2 className="text-lg font-black text-foreground">Recomendações por prioridade clínica</h2></div>

        {/* Síntese clínica do motor de filtragem avançada */}
        {refinedMatches.length > 0 && (
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 p-3 sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">síntese clínica</p>
            <p className="mt-1 text-sm font-bold text-foreground">{clinicalRecommendation}</p>
          </div>
        )}

        {/* Recomendações OPB Estruturadas (se queixa única + idade válida) */}
        {(() => {
          if (selectedQueixas.length === 1 && selectedAge) {
            const ageRange = faixasEtarias.find(a => a.id === selectedAge);
            const ageMonths = ageRange ? Math.round((ageRange.min + ageRange.max) / 2) : null;
            const opbRec = ageMonths ? getOPBRecommendations(selectedQueixas[0], ageMonths) : null;

            if (opbRec) {
              return (
                <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 sm:p-6">
                  <OPBRecommendationCards
                    recommendations={opbRec}
                    onSelectScale={(scaleId) => {
                      // Usuário pode clicar no botão para selecionar a escala
                      console.log("Selecionou escala:", scaleId);
                    }}
                  />
                </div>
              );
            }
          }
          return null;
        })()}

        {/* Testes Diretos Recomendados */}
        <DirectTestsRecommender
          selectedQueixas={selectedQueixas}
          selectedAge={selectedAge}
          faixasEtarias={faixasEtarias}
        />

        {/* Testes para Pais Recomendados */}
        <ParentTestsRecommender
          selectedQueixas={selectedQueixas}
          selectedAge={selectedAge}
          faixasEtarias={faixasEtarias}
        />

        {!hasSafeResults ? (
          <Card className="border-2 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <CardContent className="flex items-start gap-3 p-5 text-sm font-bold text-amber-900 dark:text-amber-100">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{SAFE_EMPTY_MESSAGE}</span>
            </CardContent>
          </Card>
        ) : (
        <div className="filter-260-grid">
          {ranking.map((item) => {
            const reasons = item.hasScale
              ? getRecommendationReasons(rankedPool.find((s) => s.name === item.title), selectedQueixas, selectedAge)
              : [];
            const ctaLabel = !item.hasScale
              ? "—"
              : item.implementationStatus === "complete"
                ? "Abrir aplicação"
                : item.route === "/filtro"
                  ? "Ver no catálogo"
                  : "Ver ficha técnica";
            const cardInner = (
                <Card className={`filter-260-card group h-full border-border/70 bg-card/90 transition ${item.hasScale ? "cursor-pointer hover:border-primary/40 hover:shadow-lg" : "opacity-70"} ${item.tier ? `tier-${item.tier}` : ""}`}>
                  <CardContent className="filter-260-card-content">
                    <div className="filter-260-medalrow flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className={`filter-260-medal ${item.tier ? `medal-${item.tier}` : "medal-direto"}`}>{item.slot}</Badge>
                      {item.clinicalTier && <Badge variant="secondary" className="filter-260-badge text-[10px]">{item.clinicalTier}{item.confidence !== null ? ` · ${item.confidence}%` : ""}</Badge>}
                    </div>
                    {item.warnings.length > 0 && (
                      <div className="rounded-lg border border-red-300 bg-red-50 px-2 py-1.5 text-[11px] font-bold leading-snug text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                        {item.warnings.map((w) => <p key={w}>{w}</p>)}
                      </div>
                    )}
                    <div className="filter-260-head">
                      <div className={`filter-260-symbol bg-gradient-to-br ${item.tone}`}>{icon(item.slot)}</div>
                      <div className="min-w-0 flex-1">
                        <h3 className="filter-260-title group-hover:text-primary">{item.title}</h3>
                        <p className="filter-260-subtitle">{item.subtitle}</p>
                      </div>
                    </div>
                    {reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {reasons.map((r) => <Badge key={r} variant="secondary" className="filter-260-badge text-[10px]">{r}</Badge>)}
                      </div>
                    )}
                    {item.hasScale && <div className="filter-260-evidence"><strong>Motivo:</strong> {item.reason}</div>}
                    <div className="filter-260-why"><strong>Estado:</strong> {item.state}</div>
                    {item.source && <div className="filter-260-source"><strong>Fonte:</strong> {item.source}</div>}
                    <div className="mt-auto flex items-center justify-between text-xs font-bold text-primary"><span>{ctaLabel}</span>{item.hasScale && <ArrowRight className="h-4 w-4" />}</div>
                  </CardContent>
                </Card>
            );
            return item.hasScale ? (
              <Link key={item.slot} href={item.route} className="block h-full">{cardInner}</Link>
            ) : (
              <div key={item.slot} className="block h-full">{cardInner}</div>
            );
          })}
        </div>
        )}
        <Card className="border-amber-200/70 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20"><CardContent className="p-4 text-xs leading-relaxed text-amber-900 dark:text-amber-100"><strong>Leitura prudente:</strong> o ranking organiza instrumentos disponíveis; não inventa pontuação, não substitui diagnóstico e marca escalas que exigem permissão.</CardContent></Card>
        </section>
        )}

        {!hasSearch && (
        <section className="lg:col-span-2 space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="border-dashed"><CardContent className="space-y-2 p-4"><BookOpen className="h-5 w-5 text-primary" /><h2 className="text-sm font-black text-foreground">Base ampliada</h2><p className="text-xs leading-relaxed text-muted-foreground">Inclui escalas existentes, questionários aplicáveis, inventários e 100 escalas mundiais sem custo.</p></CardContent></Card>
          <Card className="border-dashed"><CardContent className="space-y-2 p-4"><School className="h-5 w-5 text-primary" /><h2 className="text-sm font-black text-foreground">Escola aparece</h2><p className="text-xs leading-relaxed text-muted-foreground">O bloco escolar prioriza instrumentos com professor como respondente.</p></CardContent></Card>
          <Card className="border-dashed"><CardContent className="space-y-2 p-4"><ShieldAlert className="h-5 w-5 text-primary" /><h2 className="text-sm font-black text-foreground">Licença visível</h2><p className="text-xs leading-relaxed text-muted-foreground">Escalas restritas ficam como ficha clínica até permissão formal.</p></CardContent></Card>
        </div>
        <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 p-6">
          <CardContent className="space-y-3">
            <div className="flex items-start gap-4">
              <div className="text-5xl">🧠</div>
              <div className="flex-1">
                <h3 className="font-black text-foreground mb-2">Como usar o Filtro</h3>
                <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                  <li>Selecione a <strong>idade</strong> da criança</li>
                  <li>Escolha os <strong>sinais e sintomas</strong> observados</li>
                  <li>Veja as <strong>recomendações</strong> organizadas por prioridade</li>
                  <li>Clique para <strong>abrir</strong> o instrumento escolhido</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
        </section>
        )}

      </div>

      {/* Catálogo resumido — Full Width */}
      <section className="rounded-3xl border border-border/70 bg-card/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">prévia do catálogo filtrado</p><h2 className="text-sm font-black text-foreground">{rankedPool.slice(0, 24).length} principais resultados</h2></div><Link href="/escalas-neuropsiquiatria" className="text-xs font-bold text-primary">Ver catálogo mundial</Link></div>
        <div className="filter-260-grid compact">
          {rankedPool.slice(0, 24).map((s) => { const visual = getScaleVisual(s); const Icon = visual.Icon; return (
            <Link key={s.id} href={resolveAppRoute(s) ?? "/filtro"} className="filter-260-card compact block rounded-2xl border border-border/70 bg-background/70 transition cursor-pointer hover:border-primary/30 hover:bg-background">
              <div className="filter-260-card-content compact">
                <div className="filter-260-head">
                  <div className={`filter-260-symbol small bg-gradient-to-br ${visual.tone}`}><Icon className="h-4 w-4" strokeWidth={1.9} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><p className="filter-260-title small">{s.name}</p><p className="filter-260-subtitle line-clamp-2">{s.fullName}</p></div>
                      <div className="flex shrink-0 flex-col items-end gap-1"><Badge variant="outline" className="filter-260-badge">{visual.label}</Badge>{s.id.startsWith("world-") && <Badge variant="outline" className="filter-260-badge">mundial</Badge>}</div>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">{s.respondente.join(" · ")} · {Math.round(s.ageMin / 12)}–{Math.round(s.ageMax / 12)} anos</p>
                  </div>
                </div>
              </div>
            </Link>
          ); })}
        </div>
      </section>
    </div>
  );
}
