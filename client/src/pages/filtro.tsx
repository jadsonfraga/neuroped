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
import drJadsonConsultorio from "@/assets/images/dr-jadson-consultorio-superman.jpeg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { allScales, faixasEtarias, queixas, type ScaleEntry } from "@/data/scaleFilter";
import { mergeFilterableCatalog } from "@/data/filterableCatalog";
import { noCostWorldScales } from "@/data/noCostWorldScales";
import { haptic } from "@/lib/haptic";
import { softHover, softTap, softTick } from "@/lib/softSounds";

type Slot = "Ouro" | "Prata" | "Bronze" | "Teste Direto" | "Questionário Escolar";
type Tier = "ouro" | "prata" | "bronze";
type Row = [number, string, string, string, string, string, "Ouro" | "Prata" | "Bronze", "embed" | "permission" | "link"];

const REGISTRY_URL = "https://raw.githubusercontent.com/jadsonfraga/neuroped/main/data/neuroped_escalas_neuropsiquiatria_infantil_100.json";
const CORE_FILTERABLE_CATALOG = mergeFilterableCatalog(allScales);

const EUSM10_FILTER_SCALE: ScaleEntry = {
  id: "eusm10",
  name: "EUSM-10",
  fullName: "Escala Universal de Satisfação com Medicação",
  ageMin: 0,
  ageMax: 216,
  queixas: ["efeitos", "evolucao"],
  respondente: ["pais", "autoaplicavel", "clinico"],
  prioridade: "monitorizacao",
  tempo: "3–5 min",
  appRoute: "/eusm10",
  description: "Instrumento breve de 10 itens para acompanhar benefício percebido, tolerabilidade, adesão, segurança familiar e viabilidade prática de qualquer medicação nos últimos 7 a 14 dias. Útil quando há dúvida sobre efeitos colaterais, perda de eficácia, troca de dose, aceitação do paciente ou decisão compartilhada de manter a medicação.",
  fonte: "Dr. Jadson Fraga, NeuroPed — EUSM-10 (2026)",
  licencaUso: "autoral",
  validacaoBrasil: "Autoral — uso clínico local",
  scoringCutoff: "0–10 muito baixa; 11–20 baixa; 21–28 intermediária; 29–35 boa; 36–40 excelente",
  pendente_validacao_clinica: false,
};

function norm(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function unique(scales: ScaleEntry[]) {
  const seen = new Set<string>();
  return scales.filter((s) => seen.has(s.id) ? false : (seen.add(s.id), true));
}

function ageMonths(range: string) {
  const m = range.replace(",", ".").match(/([0-9.]+)\s*[–-]\s*([0-9.]+)/);
  return m ? { min: Math.round(Number(m[1]) * 12), max: Math.round(Number(m[2]) * 12) } : { min: 0, max: 216 };
}

function guessQueixas(category: string, name: string) {
  const t = norm(`${category} ${name}`);
  const set = new Set<string>();
  if (/tea|autis|social|aq|cast|m-chat|assq|q-chat/.test(t)) set.add("tea");
  if (/desenvolvimento|milestone|swyc|cdc|gmcd|atraso/.test(t)) set.add("atraso");
  if (/tdah|adhd|snap|vanderbilt|weiss|wfirs|aten/.test(t)) set.add("tdah");
  if (/comport|external|agress|moas|nisonger|psc|sdq/.test(t)) set.add("comportamento");
  if (/ansiedade|anxiety|scared|scas|rcads|gad|pas/.test(t)) set.add("ansiedade");
  if (/depress|mood|phq|mfq|smfq|columbia depression/.test(t)) set.add("depressao");
  if (/suic|asq|c-ssrs|safe-t/.test(t)) set.add("suicidio");
  if (/trauma|tept|ptsd|cats|cries|cpss|tesi/.test(t)) set.add("trauma");
  if (/tic|tourette|ygtss|puts|moves/.test(t)) set.add("tiques");
  if (/mania|bipolar|cmrs|ymrs|pgbi|mdq|gbi/.test(t)) set.add("psicose");
  if (/eat|scoff|aliment/.test(t)) set.add("alimentacao");
  if (/sono|sleep|psq|bears/.test(t)) set.add("sono");
  if (/pain|dor/.test(t)) set.add("dor");
  if (/medic|remedio|farmaco|dose|efeito|side effect|adesao|tolerab|satisfacao/.test(t)) set.add("efeitos");
  if (/evolu|monitor|retorno|follow/.test(t)) set.add("evolucao");
  if (/cogn|promis|toolbox|life|family|peer|relationship|mobility|upper/.test(t)) set.add("funcionalidade");
  if (/school|professor|teacher|aprendiz/.test(t)) set.add("aprendizagem");
  return set.size ? Array.from(set) : ["funcionalidade"];
}

function guessRespondente(value: string): ScaleEntry["respondente"] {
  const t = norm(value);
  const set = new Set<ScaleEntry["respondente"][number]>();
  if (/pais|cuidador|parent|caregiver/.test(t)) set.add("pais");
  if (/professor|teacher|escola/.test(t)) set.add("professor");
  if (/clinico|entrevista|clinical/.test(t)) set.add("clinico");
  if (/adolescente|paciente|auto/.test(t)) set.add("autoaplicavel");
  return set.size ? Array.from(set) : ["pais"];
}

function rowToScale(row: Row): ScaleEntry {
  const [n, sigla, nome, categoria, idade, respondente, selo, politica] = row;
  const a = ageMonths(idade);
  // Explicit priority mapping for world registry seals
  const prioridadeMap: Record<string, "triagem" | "diagnostica" | "monitorizacao"> = {
    "Ouro": "diagnostica",
    "Prata": "diagnostica",
    "Bronze": "monitorizacao",
  };
  return {
    id: `world-registry-${String(n).padStart(3, "0")}`,
    name: sigla,
    fullName: nome,
    ageMin: a.min,
    ageMax: a.max,
    queixas: guessQueixas(categoria, `${sigla} ${nome}`),
    respondente: guessRespondente(respondente),
    prioridade: prioridadeMap[selo] || "triagem",
    tempo: "3–10 min", // TODO: Bug #20 — parse actual time values from source data instead of hardcoding
    description: `Escala mundial sem custo. Política: ${politica}. Usar como triagem/monitoramento, nunca diagnóstico isolado.`,
    fonte: "Catálogo NeuroPed 100 escalas · verificar fonte oficial antes de embutir itens",
    licencaUso: politica === "embed" ? "livre" : "restrita",
  };
}

function matchAge(scale: ScaleEntry, selectedAge: string | null) {
  if (!selectedAge) return true;
  const age = faixasEtarias.find((a) => a.id === selectedAge);
  // Return false if selectedAge ID not found (prevents matching with invalid ages)
  // FIX BUG-001: Use >= and <= instead of > and < to include boundary ages
  return age ? (scale.ageMax >= age.min && scale.ageMin <= age.max) : false;
}

function score(scale: ScaleEntry, query: string, selectedQueixas: string[], selectedAge: string | null) {
  const text = norm(`${scale.name} ${scale.fullName} ${scale.description} ${scale.queixas.join(" ")} ${scale.respondente.join(" ")} ${scale.fonte || ""}`);
  let value = 0;
  for (const token of norm(query).split(/\s+/).filter(Boolean)) if (text.includes(token)) value += norm(scale.name).includes(token) ? 3 : 2;
  for (const q of selectedQueixas) if (scale.queixas.includes(q)) value += 6;
  if (selectedAge && matchAge(scale, selectedAge)) value += 3;
  if (scale.prioridade === "triagem") value += 2;
  if (scale.respondente.includes("professor")) value += 1;
  if (scale.id.startsWith("world-")) value += 0.8;
  // appRoute bonus only for scales with relevant matches (prevents score overflow)
  const hasRelevantMatch = selectedQueixas.length === 0 || value > 0;
  if (scale.appRoute && hasRelevantMatch) value += 100;
  return value;
}

// Padrões clínicos ouro: assinatura de sintomas → escala padrão-ouro
interface ClinicalPattern {
  name: string;
  signature: string[]; // queixas que formam o padrão
  goldStandard: string; // ID da escala ouro (triagem ou diagnóstico)
  screening?: string; // ID escala de triagem (opcional)
  diagnostic?: string; // ID escala diagnóstica (opcional)
  minAge?: number; // idade mínima em meses (validação)
  maxAge?: number; // idade máxima em meses (validação) - FIX BUG-051
  reason: string;
}

const clinicalPatterns: ClinicalPattern[] = [
  // TEA: traço social + comportamento + linguagem/atraso
  { name: "Suspeita TEA (padrão social-comportamental)", signature: ["tea", "comportamento", "linguagem"], goldStandard: "ados2", reason: "ADOS-2 é padrão-ouro diagnóstico de TEA quando há combinação de déficit social, comportamento restritivo e comunicação" },
  { name: "Suspeita TEA em lactentes", signature: ["tea", "atraso"], goldStandard: "mchat", screening: "mchat", minAge: 16, reason: "M-CHAT-R/F é rastreio padrão-ouro para TEA entre 16-30 meses; sensibilidade 95%; se positivo, encaminhar para ADOS-2" },

  // TDAH: desatenção + hiperatividade + impulsividade/comportamento
  { name: "Suspeita TDAH (completo)", signature: ["tdah", "comportamento"], goldStandard: "snap", screening: "snap", minAge: 72, reason: "SNAP-IV para 6+ anos; pré-escolares: escala comportamento geral (CBCL, SDQ) - TDAH puro não é diagnóstico válido <6a" },
  { name: "TDAH complexo (com função executiva)", signature: ["tdah", "cognicao"], goldStandard: "brief2", diagnostic: "brief2", reason: "BRIEF-2 complementa TDAH avaliando inibição, flexibilidade, controle emocional; essencial para avaliação diagnóstica" },

  // Desenvolvimento global
  { name: "Atraso do desenvolvimento global", signature: ["atraso", "linguagem", "motor"], goldStandard: "bayley", minAge: 0, maxAge: 42, reason: "Bayley-III (CLINICIAN-administered) padrão-ouro 1-42m; NICU 0m: TIMP ou Dubowitz; Griffiths-III alternativa gratuita" },
  { name: "Atraso dev. pré-escolar (triagem)", signature: ["atraso"], goldStandard: "denver", screening: "denver", diagnostic: "bayley", minAge: 0, maxAge: 60, reason: "Denver II (CLINICIAN para triagem; ASQ-3 (PARENTAL) alternativa gratuita 1-60m sem acesso a clínico validada" },
  { name: "Avaliação neonatal (0-1 mês)", signature: ["neonatal"], goldStandard: "hine", minAge: 0, maxAge: 1, reason: "HINE (CLINICIAN-administered) exame neurológico padronizado recém-nascidos; 26 itens objetivos; detecta anormalidades precoces" },

  // Ansiedade infantil
  { name: "Transtorno de ansiedade (criança)", signature: ["ansiedade"], goldStandard: "scared", screening: "scared", diagnostic: "rcads", minAge: 96, reason: "SCARED (8+) ou SCARED-P (pais) para triagem; RCADS (8+) para diagnóstico; <8a: observação clínica" },
  { name: "Ansiedade + depressão comórbida", signature: ["ansiedade", "depressao"], goldStandard: "rcads", reason: "RCADS avalia 6 transtornos (ansiedade + depressão); distingue sintomas sobrepostos" },

  // Comportamento disruptivo
  { name: "Problemas comportamentais gerais", signature: ["comportamento"], goldStandard: "cbcl", screening: "cbcl", minAge: 18, maxAge: 216, reason: "CBCL (PARENTAL) triagem abrangente 18m-18a; 100 itens, 3 domínios; validada Brasil" },
  { name: "Transtorno Opositivo Desafiador (TOD)", signature: ["comportamento"], goldStandard: "ecbi", diagnostic: "ecbi", minAge: 24, maxAge: 84, reason: "ECBI (PARENTAL) específica 2-7a (desobediência/oposição); intensidade + impacto problema" },
  { name: "Comportamento + escola (triagem)", signature: ["comportamento", "aprendizagem"], goldStandard: "sdq", minAge: 48, maxAge: 180, reason: "SDQ (PARENTAL/PROFESSOR) triagem rápida 4-15a; equivalente ECBI em contexto escolar" },

  // Linguagem/Comunicação
  { name: "Atraso de linguagem/comunicação", signature: ["linguagem", "atraso"], goldStandard: "catclams", screening: "cdi-macarthur", minAge: 0, maxAge: 36, reason: "CAT/CLAMS (CLINICIAN-administered) para avaliação direta 0-36m; MacArthur CDI (pais) alternativa para vocabulário 8-37m" },

  // Paralisia Cerebral / Motor
  { name: "Paralisia cerebral (função motora grossa)", signature: ["pc", "motor"], goldStandard: "gmfm", diagnostic: "gmfm", minAge: 12, reason: "GMFM-88/66 (CLINICIAN-observed) para classificação funcional pós 12m; complementar com MRI para tipo de PC (espástica/discinética/atáxica)" },
  { name: "Paralisia cerebral (triagem)", signature: ["pc"], goldStandard: "gmfcs", screening: "gmfcs", diagnostic: "gmfm", minAge: 0, maxAge: 180, reason: "GMFCS (CLINICIAN-observed) triagem rápida 5 níveis; BASE para planejamento terapêutico; GMFM (>12m) mede mudança após terapia" },

  // Epilepsia
  { name: "Epilepsia (controle de crises)", signature: ["epilepsia"], goldStandard: "epilepsia-diario", screening: "epilepsia-diario", minAge: 0, maxAge: 216, reason: "Diário de crises (PARENTAL) monitorar frequência/tipo/resposta 0-18a; complementar com EEG/RM profissional para síndrome diagnóstico" },

  // Sono
  { name: "Distúrbios do sono pediátrico", signature: ["sono"], goldStandard: "cshq", minAge: 48, maxAge: 120, reason: "CSHQ para crianças 4-10 anos apenas (48-120m); adolescentes (120+ meses) usar BEARS ou PSQI em avaliação especializada" },

  // Depressão isolada
  { name: "Depressão infantojuvenil", signature: ["depressao"], goldStandard: "cdi2", screening: "cdi2", minAge: 84, reason: "CDI-2 para 7-17a; pré-escolares: observação clínica, entrevista parental (sem escala específica validada)" },

  // Trauma e TEPT
  { name: "Trauma e TEPT infantil", signature: ["trauma"], goldStandard: "cries", screening: "cries", diagnostic: "caps-ca", minAge: 48, maxAge: 216, reason: "CRIES (PARENTAL/CHILD) triagem TEPT 4-18a; CAPS-CA (CLINICIAN) diagnóstico definitivo; validada Brasil" },

  // Risco de suicídio
  { name: "Avaliação de risco suicida", signature: ["suicidio"], goldStandard: "cssrs", screening: "cssrs", diagnostic: "rfl-a", minAge: 84, maxAge: 216, reason: "C-SSRS (CHILD/PARENTAL) 7-18a; RFL-A fatores protetores; <7a riscos geralmente trauma/abuso associados" },

  // Problemas de aprendizagem
  { name: "Avaliação de desempenho escolar", signature: ["aprendizagem"], goldStandard: "tde", minAge: 72, reason: "TDE para avaliação de leitura/escrita/aritmética em escolares 6+; pré-escolares usar avaliação do desenvolvimento geral" },

  // Funcionalidade adaptativa
  { name: "Habilidades adaptativas/funcionalidade", signature: ["funcionalidade"], goldStandard: "vineland", minAge: 0, reason: "Vineland-3 completa para diagnóstico; V-ABC (abreviada) para triagem; versão survey vs interview conforme contexto" },

  // Dor e conforto
  { name: "Avaliação de dor pediátrica", signature: ["dor"], goldStandard: "faces", screening: "faces", minAge: 36, maxAge: 216, reason: "Faces Pain Scale-Revised (CHILD 3+) triagem; FLACC (CLINICIAN <3a); complementar com avaliação funcional e impacto" },

  // Alimentação detalhada
  { name: "Transtorno alimentar/seletividade", signature: ["alimentacao"], goldStandard: "bpfas", screening: "bpfas", minAge: 24, maxAge: 168, reason: "BPFAS (PARENTAL) triagem problemas alimentação 2-14a; covers seletividade/recusa/inadequação nutricional" },
];

function detectGoldStandard(selectedQueixas: string[], selectedAge: string | null, catalog: ScaleEntry[]): ClinicalPattern | null {
  if (selectedQueixas.length < 2) return null; // Precisa de 2+ sintomas para padrão

  // Build set of valid scale IDs for fast lookup
  const validIds = new Set(catalog.map(s => s.id));

  // Busca padrão com melhor match (quantas queixas coincidem)
  let bestMatch: { pattern: ClinicalPattern; score: number } | null = null;

  for (const pattern of clinicalPatterns) {
    // Skip pattern if gold standard doesn't exist in catalog
    if (!validIds.has(pattern.goldStandard)) {
      console.warn(`[gold-standard] Pattern "${pattern.name}" references unknown gold standard: ${pattern.goldStandard}`);
      continue;
    }

    const matchCount = pattern.signature.filter((s) => selectedQueixas.includes(s)).length;
    const score = matchCount / pattern.signature.length; // % de match

    if (matchCount >= 2 && (!bestMatch || score > bestMatch.score)) {
      // Validate that gold standard scale exists and covers the selected age
      const goldScale = catalog.find((s) => s.id === pattern.goldStandard);
      if (goldScale) {
        const ageIsValid = !selectedAge || matchAge(goldScale, selectedAge);
        if (ageIsValid) {
          bestMatch = { pattern, score };
        }
      }
    }
  }

  return bestMatch?.pattern ?? null;
}

function pool(catalog: ScaleEntry[], query: string, selectedQueixas: string[], selectedAge: string | null, selectedRespondente: ScaleEntry["respondente"][number] | null) {
  const base = catalog.filter((s) => {
    // Filtro de pré-consulta: apenas triagem/diagnóstico, não monitorização
    if (s.prioridade === "monitorizacao") return false;
    // Excluir queixas que são pós-consulta (reavaliação, efeitos colaterais, evolução)
    const postConsultComplaints = ["efeitos", "evolucao"];
    if (s.queixas.some((q) => postConsultComplaints.includes(q))) return false;

    const matchesQueixa = selectedQueixas.length === 0 || s.queixas.some((q) => selectedQueixas.includes(q));
    const matchesAge = matchAge(s, selectedAge);
    const matchesRespondente = !selectedRespondente || s.respondente.includes(selectedRespondente);
    return matchesQueixa && matchesAge && matchesRespondente;
  });
  const hasActiveFilters = selectedQueixas.length > 0 || selectedAge !== null || selectedRespondente !== null;
  const results = base.length || !hasActiveFilters ? base : [];
  return unique(results)
    .map((scale) => ({ scale, score: score(scale, query, selectedQueixas, selectedAge) }))
    .sort((a, b) => b.score - a.score || a.scale.name.localeCompare(b.scale.name))
    .map((x) => x.scale);
}

function tierFromSlot(slot: Slot): Tier | null {
  if (slot === "Ouro") return "ouro";
  if (slot === "Prata") return "prata";
  if (slot === "Bronze") return "bronze";
  return null;
}

function rec(slot: Slot, scale: ScaleEntry | undefined, reason: string, tone: string) {
  const restricted = scale?.licencaUso === "restrita" || scale?.licencaUso === "comercial" || scale?.licencaUso === "contato_autor";
  return {
    slot,
    tier: tierFromSlot(slot),
    // FIX BUG-003: Ensure route defaults even if scale is undefined
    route: scale?.appRoute || (scale?.id && scale.id.startsWith("world-") ? "/escalas-neuropsiquiatria" : "/filtro"),
    title: scale?.name || "Sem escala ideal",
    subtitle: scale?.fullName || "Refine idade, queixa ou termo pesquisado",
    reason,
    state: scale?.appRoute ? "Rota direta disponível." : restricted ? "Ficha clínica; não embutir itens/escore sem permissão formal." : "Catálogo filtrável; aplicação direta ainda não implementada.",
    source: scale?.fonte,
    tone,
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
  if (selectedQueixas.length > 0 && scale.queixas.some((q) => selectedQueixas.includes(q))) reasons.push("✓ Queixa");
  if (selectedAge && matchAge(scale, selectedAge)) reasons.push("✓ Idade");
  if (scale.appRoute) reasons.push("✓ Rota direta");
  if (scale.prioridade === "triagem") reasons.push("✓ Triagem");
  if (scale.respondente.includes("professor")) reasons.push("✓ Escola");
  return reasons.length ? reasons : ["✓ Compatibilidade geral"];
}

export default function FiltroPage() {
  const [search, setSearch] = useState("");
  const [selectedQueixas, setSelectedQueixas] = useState<string[]>([]);
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [selectedRespondente, setSelectedRespondente] = useState<ScaleEntry["respondente"][number] | null>(null);
  const [world, setWorld] = useState<ScaleEntry[]>(noCostWorldScales);
  const [status, setStatus] = useState<"loading" | "ok" | "fallback">("loading");

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

  const catalog = useMemo(() => unique([...CORE_FILTERABLE_CATALOG, EUSM10_FILTER_SCALE, ...world]), [world]);
  const hasSearch = search.trim().length >= 2 || selectedQueixas.length > 0 || selectedAge !== null || selectedRespondente !== null;
  const statusInfo = status === "loading"
    ? { label: "carregando", dot: "bg-amber-400 animate-pulse" }
    : status === "ok"
      ? { label: "completo", dot: "bg-emerald-500" }
      : { label: "base local", dot: "bg-muted-foreground" };
  const rankedPool = useMemo(() => pool(catalog, search, selectedQueixas, selectedAge, selectedRespondente), [catalog, search, selectedQueixas, selectedAge, selectedRespondente]);

  // Detecta padrão clínico ouro quando 2+ queixas selecionadas
  const detectedPattern = useMemo(() => detectGoldStandard(selectedQueixas, selectedAge, catalog), [selectedQueixas, selectedAge, catalog]);
  const goldStandardScale = useMemo(() => {
    if (!detectedPattern) return null;
    const inPool = rankedPool.find((s) => s.id === detectedPattern.goldStandard);
    if (inPool) return inPool;
    // Gold standard not in pool—ensure it exists in full catalog before recommending
    return catalog.find((s) => s.id === detectedPattern.goldStandard) || null;
  }, [detectedPattern, rankedPool, catalog]);

  const direct = rankedPool.find((s) => Boolean(s.appRoute)) || catalog.find((s) => {
    const postConsultComplaints = ["efeitos", "evolucao"];
    return s.appRoute && s.prioridade !== "monitorizacao" && !s.queixas.some((q) => postConsultComplaints.includes(q)) && matchAge(s, selectedAge);
  });
  const school = rankedPool.find((s) => s.respondente.includes("professor")) || catalog.find((s) => {
    const postConsultComplaints = ["efeitos", "evolucao"];
    return s.respondente.includes("professor") && s.prioridade !== "monitorizacao" && !s.queixas.some((q) => postConsultComplaints.includes(q)) && matchAge(s, selectedAge);
  });

  // FIX BUG-003: Guard against undefined when rankedPool is empty
  const fallback = rankedPool[0] || undefined;

  // Se há padrão ouro detectado, mostra ele como Ouro; caso contrário, usa ranking normal
  const ranking = goldStandardScale
    ? [
        rec("Ouro", goldStandardScale, `PADRÃO-OURO: ${detectedPattern!.reason}`, "from-amber-500 via-yellow-600 to-red-800"),
        rec("Prata", rankedPool[0], "Alternativa quando ouro indisponível ou insuficiente.", "from-slate-400 via-slate-500 to-slate-700"),
        rec("Bronze", rankedPool[1] || fallback, "Terceira opção para apoio ou triagem secundária.", "from-orange-500 via-amber-700 to-stone-800"),
        rec("Teste Direto", direct || fallback, "Instrumento com rota direta no app.", "from-blue-600 via-indigo-700 to-slate-950"),
        rec("Questionário Escolar", school || fallback, "Instrumento com respondente professor.", "from-emerald-600 via-teal-700 to-slate-950"),
      ]
    : [
        rec("Ouro", fallback, "Maior compatibilidade combinando queixa, idade, respondente, prioridade e disponibilidade.", "from-amber-500 via-yellow-600 to-red-800"),
        rec("Prata", rankedPool[1] || fallback, "Alternativa complementar quando o instrumento ouro não for suficiente ou disponível.", "from-slate-400 via-slate-500 to-slate-700"),
        rec("Bronze", rankedPool[2] || rankedPool[1] || fallback, "Terceira opção para apoio ou triagem secundária.", "from-orange-500 via-amber-700 to-stone-800"),
        rec("Teste Direto", direct || fallback, "Prioriza instrumento que já possui rota de aplicação dentro do app.", "from-blue-600 via-indigo-700 to-slate-950"),
        rec("Questionário Escolar", school || fallback, "Prioriza instrumentos com professor como respondente ou utilidade escolar.", "from-emerald-600 via-teal-700 to-slate-950"),
      ];

  const toggleQueixa = (id: string) => {
    softTick(); haptic.select();
    setSelectedQueixas((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const clearAll = () => {
    softTap(); haptic.tap(); setSearch(""); setSelectedAge(null); setSelectedQueixas([]); setSelectedRespondente(null);
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
    <div className="page-enter container-filtro filter-260-shell space-y-3 sm:space-y-5 pb-4 sm:pb-8 relative">
      {/* Mascote decorativo discreto */}
      {!hasSearch && (
        <div className="absolute -right-24 top-24 hidden lg:block opacity-30 pointer-events-none">
          <img
            src={drJadsonConsultorio}
            alt="Dr. Jadson"
            className="w-48 h-auto object-contain rounded-full shadow-lg"
            loading="lazy"
          />
        </div>
      )}
      <header className="rounded-[2rem] border border-border/70 bg-card/90 p-3 sm:p-5 shadow-sm backdrop-blur">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="filter-260-iconbox flex h-10 sm:h-12 w-10 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md"><Filter className="h-4 sm:h-5 w-4 sm:w-5" /></div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-1 sm:mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10 text-[10px] sm:text-xs">ranking · escalas + questionários</Badge>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-foreground">Filtro Clínico Inteligente</h1>
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">Cruza idade, queixa, respondente, rota direta e 100 escalas mundiais sem custo.</p>
          </div>
        </div>
      </header>

      <section className="grid gap-2 sm:gap-3 grid-cols-3 sm:grid-cols-3">
        <Card><CardContent className="p-2 sm:p-4"><p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-muted-foreground">catálogo filtrável</p><p className="text-2xl font-black tabular-nums text-foreground">{catalog.length}</p></CardContent></Card>
        <Card><CardContent className="p-2 sm:p-4"><p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-muted-foreground">mundiais</p><p className="text-2xl font-black tabular-nums text-foreground">{world.length}</p></CardContent></Card>
        <Card><CardContent className="p-2 sm:p-4"><p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-muted-foreground">status</p><p className="mt-1 flex items-center gap-2 text-lg font-black text-foreground"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusInfo.dot}`} aria-hidden="true" />{statusInfo.label}</p></CardContent></Card>
      </section>
      {status === "fallback" && <p className="-mt-2 px-1 text-[11px] leading-relaxed text-muted-foreground">Catálogo mundial online indisponível agora — usando a base local embutida, sem perda de função.</p>}

      <section className="space-y-2 sm:space-y-3 rounded-[1.5rem] border border-border/70 bg-card/80 p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ex.: medicação, efeitos, satisfação, autismo, TDAH, escola, sono..." className="h-11 rounded-2xl pl-10 pr-10" data-testid="input-search" />
          {search && <button type="button" onClick={() => setSearch("")} className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Limpar busca"><X className="h-4 w-4" /></button>}
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Idade</p>
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
            {faixasEtarias.map((age) => <button key={age.id} type="button" aria-pressed={selectedAge === age.id} onMouseEnter={() => softHover()} onClick={() => setSelectedAge((v) => v === age.id ? null : age.id)} className={`flex min-h-[44px] shrink-0 items-center rounded-2xl border px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${selectedAge === age.id ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"}`}>{age.label}</button>)}
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
            {queixas.slice(0, 24).map((q) => <button key={q.id} type="button" aria-pressed={selectedQueixas.includes(q.id)} onMouseEnter={() => softHover()} onClick={() => toggleQueixa(q.id)} className={`flex min-h-[44px] items-center rounded-2xl border px-3 py-2 text-left text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${selectedQueixas.includes(q.id) ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background hover:border-primary/40 hover:bg-muted/60"}`}>{q.emoji && <span className="text-sm flex-shrink-0">{q.emoji}</span>}<span className="truncate text-[11px] sm:text-xs">{q.label}</span></button>)}
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2 pt-1.5 sm:pt-2 border-t border-border/50">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Respondente</p>
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
            <button key="crianca" onMouseEnter={() => softHover()} onClick={() => setSelectedRespondente((v) => v === "autoaplicavel" ? null : "autoaplicavel")} className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedRespondente === "autoaplicavel" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}><span>🧒</span> <span className="hidden sm:inline">Direto</span></button>
            <button key="pais" onMouseEnter={() => softHover()} onClick={() => setSelectedRespondente((v) => v === "pais" ? null : "pais")} className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedRespondente === "pais" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}><span>👨‍👩‍👧</span> <span className="hidden sm:inline">Pais</span></button>
            <button key="professor" onMouseEnter={() => softHover()} onClick={() => setSelectedRespondente((v) => v === "professor" ? null : "professor")} className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedRespondente === "professor" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}><span>👨‍🏫</span> <span className="hidden sm:inline">Escola</span></button>
            <button key="clinico" onMouseEnter={() => softHover()} onClick={() => setSelectedRespondente((v) => v === "clinico" ? null : "clinico")} className={`shrink-0 rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold transition min-h-8 sm:min-h-10 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${selectedRespondente === "clinico" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}><span>👨‍⚕️</span> <span className="hidden sm:inline">Clínico</span></button>
          </div>
        </div>
      </section>

      {hasSearch ? <section ref={resultsSectionRef} className="space-y-3">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">saída obrigatória</p><h2 className="text-lg font-black text-foreground">Recomendações por prioridade clínica</h2></div>
        <div className="filter-260-grid">
          {ranking.map((item) => {
            const reasons = getRecommendationReasons(
              item.title !== "Sem escala ideal" ? rankedPool.find(s => s.name === item.title) : undefined,
              selectedQueixas,
              selectedAge
            );
            return (
              <Link key={item.slot} href={item.route} className="block h-full rounded-[18px] focus-visible:outline-none">
                <Card className={`filter-260-card group h-full cursor-pointer border-border/70 bg-card/90 transition hover:border-primary/40 hover:shadow-lg ${item.tier ? `tier-${item.tier}` : ""}`}>
                  <CardContent className="filter-260-card-content">
                    <div className="filter-260-medalrow">
                      <Badge variant="outline" className={`filter-260-medal ${item.tier ? `medal-${item.tier}` : "medal-direto"}`}>{item.slot}</Badge>
                    </div>
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
                    <div className="filter-260-evidence"><strong>Motivo:</strong> {item.reason}</div>
                    <div className="filter-260-why"><strong>Estado:</strong> {item.state}</div>
                    {item.source && <div className="filter-260-source"><strong>Fonte:</strong> {item.source}</div>}
                    <div className="mt-auto flex items-center justify-between text-xs font-bold text-primary"><span>{item.route === "/filtro" ? "Ver no catálogo" : "Abrir"}</span><ArrowRight className="h-4 w-4" /></div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
        <Card className="border-amber-200/70 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20"><CardContent className="p-4 text-xs leading-relaxed text-amber-900 dark:text-amber-100"><strong>Leitura prudente:</strong> o ranking organiza instrumentos disponíveis; não inventa pontuação, não substitui diagnóstico e marca escalas que exigem permissão.</CardContent></Card>
      </section> : <section className="space-y-5">
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
      </section>}

      <section className="rounded-3xl border border-border/70 bg-card/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">prévia do catálogo filtrado</p><h2 className="text-sm font-black text-foreground">{rankedPool.slice(0, 24).length} principais resultados</h2></div><Link href="/escalas-neuropsiquiatria" className="text-xs font-bold text-primary">Ver catálogo mundial</Link></div>
        <div className="filter-260-grid compact">
          {rankedPool.slice(0, 24).map((s) => { const visual = getScaleVisual(s); const Icon = visual.Icon; return (
            <div key={s.id} className="filter-260-card compact rounded-2xl border border-border/70 bg-background/70 transition hover:border-primary/30 hover:bg-background">
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
            </div>
          ); })}
        </div>
      </section>
    </div>
  );
}
