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
  Eye,
  FileText,
  Filter,
  GraduationCap,
  Hand,
  HeartPulse,
  Medal,
  MessageCircle,
  Moon,
  Pill,
  Printer,
  RotateCcw,
  School,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Utensils,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SafeAssetImage, brandAssets, visualAssetRegistry } from "@/components/BrandAssets";
import { allScales, faixasEtarias, queixas, type ScaleEntry } from "@/data/scaleFilter";
import { mergeFilterableCatalog } from "@/data/filterableCatalog";
import { noCostWorldScales } from "@/data/noCostWorldScales";
import { haptic } from "@/lib/haptic";
import { softHover, softTap, softTick } from "@/lib/softSounds";

type Slot = "Ouro" | "Prata" | "Bronze" | "Teste Direto" | "Questionário Escolar";
type Tier = "ouro" | "prata" | "bronze";
type Row = [number, string, string, string, string, string, "Ouro" | "Prata" | "Bronze", "embed" | "permission" | "link"];
type Contexto = "familia" | "escola" | "consulta" | "triagem" | "direta";

type RecommendationBlock = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  icon: LucideIcon;
  tone: string;
  predicate: (scale: ScaleEntry) => boolean;
  fallback?: ScaleEntry[];
};

const REGISTRY_URL = "https://raw.githubusercontent.com/jadsonfraga/neuroped/main/data/neuroped_escalas_neuropsiquiatria_infantil_100.json";
const CORE_FILTERABLE_CATALOG = mergeFilterableCatalog(allScales);

const CURATED_FILTER_INSTRUMENTS: ScaleEntry[] = [
  { id: "reconhecimento-visual", name: "Reconhecimento Visual", fullName: "Teste lúdico de reconhecimento visual e pareamento", ageMin: 24, ageMax: 144, queixas: ["cognicao", "aprendizagem", "tea", "sensorial"], respondente: ["clinico", "crianca"], prioridade: "triagem", tempo: "8–12 min", appRoute: "/testes-reconhecimento", description: "Avalia nomeação, pareamento, memória visual, percepção e atenção compartilhada com figuras infantis." },
  { id: "cognitivos-divertidos", name: "Cognitivos Divertidos", fullName: "Bateria interativa breve de atenção, raciocínio e funções executivas", ageMin: 36, ageMax: 144, queixas: ["cognicao", "tdah", "aprendizagem", "funcionalidade"], respondente: ["clinico", "crianca"], prioridade: "triagem", tempo: "10–20 min", appRoute: "/neuropsicologia", description: "Indicado para triagem direta com criança pequena quando há atenção, raciocínio, controle inibitório e desempenho escolar em pauta." },
  { id: "pedagogicos-serie", name: "Pedagógicos por Série", fullName: "Instrumentos pedagógicos graduados por ano escolar", ageMin: 60, ageMax: 180, queixas: ["aprendizagem", "linguagem", "cognicao"], respondente: ["clinico", "professor"], prioridade: "diagnostica", tempo: "15–30 min", appRoute: "/testes-academicos", description: "Organiza leitura, escrita, matemática, consciência fonológica e desempenho por série escolar." },
  { id: "academico-interativo", name: "Acadêmico Interativo", fullName: "Triagem acadêmica lúdica de leitura, escrita e matemática", ageMin: 72, ageMax: 180, queixas: ["aprendizagem", "tdah", "cognicao"], respondente: ["clinico", "crianca", "professor"], prioridade: "triagem", tempo: "12–25 min", appRoute: "/testes-academicos", description: "Útil quando a queixa envolve rendimento escolar, série, atenção sustentada e habilidades acadêmicas funcionais." },
  { id: "tde2-adaptado", name: "TDE-2 Adaptado", fullName: "Triagem do desempenho escolar com leitura, escrita e aritmética", ageMin: 72, ageMax: 180, queixas: ["aprendizagem", "linguagem", "cognicao"], respondente: ["clinico", "crianca"], prioridade: "diagnostica", tempo: "25–40 min", appRoute: "/tde2", description: "Prioriza investigação acadêmica quando há dificuldade persistente por série escolar." },
  { id: "motricidade-fina", name: "Motricidade Fina", fullName: "Observação estruturada de pinça, coordenação visomotora e praxias", ageMin: 24, ageMax: 144, queixas: ["motor", "pc", "sensorial", "aprendizagem"], respondente: ["clinico", "crianca"], prioridade: "triagem", tempo: "8–15 min", appRoute: "/marcos-desenvolvimento", description: "Indicado para queixas de coordenação, preensão, recorte, traçado, lentidão grafomotora e autonomia fina." },
  { id: "escrita-desenho", name: "Escrita e Desenho", fullName: "Amostras lúdicas de grafismo, desenho, cópia e escrita espontânea", ageMin: 36, ageMax: 168, queixas: ["aprendizagem", "motor", "linguagem", "cognicao"], respondente: ["clinico", "crianca"], prioridade: "triagem", tempo: "10–18 min", appRoute: "/testes-academicos", description: "Ajuda a diferenciar dificuldade acadêmica, linguagem escrita, motricidade fina e planejamento visuoconstrutivo." },
  { id: "conhecimentos-gerais", name: "Conhecimentos Gerais", fullName: "Roteiro breve de repertório, orientação e raciocínio verbal", ageMin: 48, ageMax: 168, queixas: ["cognicao", "aprendizagem", "linguagem"], respondente: ["clinico", "crianca"], prioridade: "triagem", tempo: "8–12 min", appRoute: "/testes-academicos", description: "Complementa hipóteses de linguagem, repertório escolar, raciocínio verbal e oportunidades pedagógicas." },
];

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

const QUEIXA_EMOJIS: Record<string, string> = {
  atraso: "👶", tea: "🧩", tdah: "⚡", comportamento: "🔥", ansiedade: "😟", depressao: "🌧️", epilepsia: "⚕️", pc: "🏃", linguagem: "💬", sono: "😴", alimentacao: "🍽️", dor: "💗", cognicao: "🧠", aprendizagem: "📚", funcionalidade: "👨‍👩‍👧", neonatal: "🍼", suicidio: "🛡️", psicose: "🌪️", tiques: "🔁", efeitos: "💊", toc: "🔁", trauma: "🛡️", enurese: "💧", motor: "✋", sensorial: "👂", social: "🤝", autonomia: "🏠", evolucao: "📈",
};

const CONTEXTOS: Array<{ id: Contexto; label: string; emoji: string; hint: string }> = [
  { id: "familia", label: "Família", emoji: "👨‍👩‍👧", hint: "prioriza escalas para pais" },
  { id: "escola", label: "Escola", emoji: "🏫", hint: "inclui professor e série" },
  { id: "consulta", label: "Consulta", emoji: "🩺", hint: "organiza aplicação clínica" },
  { id: "triagem", label: "Triagem", emoji: "🥇", hint: "rápidos e sensíveis" },
  { id: "direta", label: "Direta com criança", emoji: "🎯", hint: "testes interativos" },
];

const SERIES_ESCOLARES = ["Pré-escola", "1º–2º ano", "3º–5º ano", "6º–9º ano", "Ensino médio"];

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
  if (/tea|autis|social|aq|cast|m-chat|assq|q-chat|interacao|comunicacao/.test(t)) set.add("tea");
  if (/desenvolvimento|milestone|swyc|cdc|gmcd|atraso/.test(t)) set.add("atraso");
  if (/tdah|adhd|snap|vanderbilt|weiss|wfirs|aten|executiv|inibicao/.test(t)) set.add("tdah");
  if (/comport|external|agress|moas|nisonger|psc|sdq/.test(t)) set.add("comportamento");
  if (/ansiedade|anxiety|scared|scas|rcads|gad|pas/.test(t)) set.add("ansiedade");
  if (/depress|mood|phq|mfq|smfq|columbia depression/.test(t)) set.add("depressao");
  if (/suic|asq|c-ssrs|safe-t/.test(t)) set.add("suicidio");
  if (/trauma|tept|ptsd|cats|cries|cpss|tesi/.test(t)) set.add("trauma");
  if (/tic|tourette|ygtss|puts|moves/.test(t)) set.add("tiques");
  if (/mania|bipolar|cmrs|ymrs|pgbi|mdq|gbi/.test(t)) set.add("psicose");
  if (/eat|scoff|aliment|seletiv/.test(t)) set.add("alimentacao");
  if (/sono|sleep|psq|bears/.test(t)) set.add("sono");
  if (/sensor/.test(t)) set.add("sensorial");
  if (/motor|motric|coord|graf/.test(t)) set.add("motor");
  if (/linguagem|fala|language|speech/.test(t)) set.add("linguagem");
  if (/pain|dor/.test(t)) set.add("dor");
  if (/medic|remedio|farmaco|dose|efeito|side effect|adesao|tolerab|satisfacao/.test(t)) set.add("efeitos");
  if (/evolu|monitor|retorno|follow/.test(t)) set.add("evolucao");
  if (/cogn|promis|toolbox|life|family|peer|relationship|mobility|upper/.test(t)) set.add("funcionalidade");
  if (/school|professor|teacher|aprendiz|academ|leitura|escrita/.test(t)) set.add("aprendizagem");
  return set.size ? Array.from(set) : ["funcionalidade"];
}

function guessRespondente(value: string): ScaleEntry["respondente"] {
  const t = norm(value);
  const set = new Set<ScaleEntry["respondente"][number]>();
  if (/pais|cuidador|parent|caregiver/.test(t)) set.add("pais");
  if (/professor|teacher|escola/.test(t)) set.add("professor");
  if (/clinico|entrevista|clinical/.test(t)) set.add("clinico");
  if (/crianca|adolescente|paciente|auto/.test(t)) set.add("autoaplicavel");
  return set.size ? Array.from(set) : ["pais"];
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

function contextBoost(scale: ScaleEntry, selectedContext: Contexto | null) {
  if (!selectedContext) return 0;
  if (selectedContext === "familia") return scale.respondente.includes("pais") ? 5 : 0;
  if (selectedContext === "escola") return scale.respondente.includes("professor") || scale.queixas.includes("aprendizagem") ? 5 : 0;
  if (selectedContext === "direta") return scale.respondente.includes("crianca") || scale.respondente.includes("clinico") || Boolean(scale.appRoute) ? 4 : 0;
  if (selectedContext === "triagem") return scale.prioridade === "triagem" ? 4 : 0;
  return scale.respondente.includes("clinico") ? 3 : 0;
}

function scaleText(scale: ScaleEntry) {
  return norm(`${scale.name} ${scale.fullName} ${scale.description} ${scale.queixas.join(" ")} ${scale.respondente.join(" ")} ${scale.fonte || ""}`);
}

function score(scale: ScaleEntry, query: string, selectedQueixas: string[], selectedAge: string | null, selectedContext: Contexto | null, selectedSerie: string | null) {
  const text = scaleText(scale);
  let value = 0;
  for (const token of norm(query).split(/\s+/).filter(Boolean)) if (text.includes(token)) value += norm(scale.name).includes(token) ? 8 : 2.5;
  for (const q of selectedQueixas) if (scale.queixas.includes(q)) value += 7;
  if (selectedAge && matchAge(scale, selectedAge)) value += 4;
  value += contextBoost(scale, selectedContext);
  if (selectedSerie && (scale.queixas.includes("aprendizagem") || /serie|escolar|academ|tde|pedagog/.test(text))) value += 5;
  if (scale.appRoute) value += 3;
  if (scale.prioridade === "triagem") value += 2;
  if (scale.respondente.includes("professor")) value += 1;
  if (CURATED_FILTER_INSTRUMENTS.some((s) => s.id === scale.id)) value += 2.4;
  if (scale.id.startsWith("world-")) value += 0.8;
  return value;
}

function pool(catalog: ScaleEntry[], query: string, selectedQueixas: string[], selectedAge: string | null, selectedContext: Contexto | null, selectedSerie: string | null) {
  const base = catalog.filter((s) => (selectedQueixas.length === 0 || s.queixas.some((q) => selectedQueixas.includes(q))) && matchAge(s, selectedAge));
  return unique(base.length ? base : catalog)
    .map((scale) => ({ scale, score: score(scale, query, selectedQueixas, selectedAge, selectedContext, selectedSerie) }))
    .sort((a, b) => b.score - a.score || a.scale.name.localeCompare(b.scale.name))
    .map((x) => x.scale);
}

function tierFromSlot(slot: Slot): Tier | null {
  if (slot === "Ouro") return "ouro";
  if (slot === "Prata") return "prata";
  if (slot === "Bronze") return "bronze";
  return null;
}

function reasonForScale(scale: ScaleEntry | undefined, selectedQueixas: string[], selectedAge: string | null, selectedContext: Contexto | null, selectedSerie: string | null, fallback: string) {
  if (!scale) return fallback;
  const parts: string[] = [];
  const matched = selectedQueixas.map((id) => queixas.find((q) => q.id === id)?.label).filter(Boolean).slice(0, 3);
  if (matched.length) parts.push(`queixa envolve ${matched.join(", ").toLowerCase()}`);
  const age = faixasEtarias.find((a) => a.id === selectedAge)?.label;
  if (age) parts.push(`faixa etária ${age}`);
  const ctx = CONTEXTOS.find((c) => c.id === selectedContext);
  if (ctx) parts.push(`contexto ${ctx.label.toLowerCase()}`);
  if (selectedSerie) parts.push(`série escolar ${selectedSerie}`);
  if (scale.respondente.includes("crianca")) parts.push("permite teste direto com a criança");
  if (scale.respondente.includes("professor")) parts.push("inclui olhar escolar");
  if (scale.respondente.includes("pais")) parts.push("inclui escala familiar");
  if (scale.appRoute) parts.push("já possui rota no app");
  return `Indicado porque ${parts.length ? parts.join("; ") : "combina prioridade clínica, respondente e disponibilidade"}.`;
}

function rec(slot: Slot, scale: ScaleEntry | undefined, reason: string, tone: string) {
  const restricted = scale?.licencaUso === "restrita" || scale?.licencaUso === "comercial" || scale?.licencaUso === "contato_autor";
  return {
    slot,
    tier: tierFromSlot(slot),
    route: scale?.appRoute || (scale?.id.startsWith("world-") ? "/escalas-neuropsiquiatria" : "/filtro"),
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
  emoji: string;
}

function getScaleVisual(scale: ScaleEntry): ScaleVisual {
  const t = scaleText(scale);
  if (/reconhecimento|visual|olho|pareamento/.test(t)) return { label: "visual", Icon: Eye, emoji: "👁️", tone: "from-sky-600 via-blue-700 to-slate-950" };
  if (/motric|motor|graf|desenho|escrita/.test(t)) return { label: "motor fino", Icon: Hand, emoji: "✏️", tone: "from-orange-500 via-amber-700 to-stone-900" };
  if (/tea|autis|social|assq|m-chat|q-chat|cast|aq/.test(t)) return { label: "TEA / social", Icon: Brain, emoji: "🧩", tone: "from-violet-600 via-purple-700 to-slate-950" };
  if (/tdah|adhd|snap|vanderbilt|aten|weiss|wfirs|executiv/.test(t)) return { label: "atenção", Icon: Activity, emoji: "⚡", tone: "from-amber-500 via-orange-600 to-red-800" };
  if (/linguagem|fala|comunic|language|speech/.test(t)) return { label: "linguagem", Icon: MessageCircle, emoji: "💬", tone: "from-cyan-600 via-blue-700 to-slate-950" };
  if (/school|professor|teacher|aprendiz|leitura|escrita|aritmet|academ|serie|tde/.test(t)) return { label: "escola", Icon: GraduationCap, emoji: "📚", tone: "from-emerald-600 via-teal-700 to-slate-950" };
  if (/sono|sleep|bears|psq|cshq/.test(t)) return { label: "sono", Icon: Moon, emoji: "😴", tone: "from-indigo-700 via-blue-900 to-slate-950" };
  if (/aliment|seletiv|eat|scoff/.test(t)) return { label: "alimentação", Icon: Utensils, emoji: "🍽️", tone: "from-lime-600 via-emerald-700 to-slate-950" };
  if (/ansiedade|depress|humor|mood|phq|gad|scared|rcads|scas/.test(t)) return { label: "humor", Icon: HeartPulse, emoji: "😟", tone: "from-rose-600 via-red-700 to-slate-950" };
  if (/desenvolvimento|milestone|cdc|swyc|atraso|gmfcs/.test(t)) return { label: "desenvolvimento", Icon: Baby, emoji: "👶", tone: "from-blue-600 via-indigo-700 to-slate-950" };
  if (/eusm|medic|dose|farmaco|risperidona|metilfenidato|tolerab|adesao|efeito/.test(t)) return { label: "medicação", Icon: Pill, emoji: "💊", tone: "from-teal-600 via-cyan-700 to-slate-950" };
  if (/pais|parent|cuidador|family/.test(t)) return { label: "família", Icon: Users, emoji: "👨‍👩‍👧", tone: "from-slate-600 via-slate-800 to-slate-950" };
  return { label: "clínico", Icon: ClipboardCheck, emoji: "🩺", tone: "from-primary via-chart-2 to-slate-950" };
}

function blockMatches(block: RecommendationBlock, rankedPool: ScaleEntry[]) {
  return rankedPool.filter(block.predicate).slice(0, 4);
}

export default function FiltroPage() {
  const [search, setSearch] = useState("");
  const [selectedQueixas, setSelectedQueixas] = useState<string[]>([]);
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<Contexto | null>(null);
  const [selectedSerie, setSelectedSerie] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [world, setWorld] = useState<ScaleEntry[]>(noCostWorldScales);
  const [status, setStatus] = useState<"loading" | "ok" | "fallback">("loading");
  const resultsRef = useRef<HTMLElement | null>(null);

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

  const catalog = useMemo(() => unique([...CURATED_FILTER_INSTRUMENTS, ...CORE_FILTERABLE_CATALOG, EUSM10_FILTER_SCALE, ...world]), [world]);
  const hasSearch = search.trim().length >= 2 || selectedQueixas.length > 0 || Boolean(selectedAge) || Boolean(selectedContext) || Boolean(selectedSerie);
  const rankedPool = useMemo(() => pool(catalog, search, selectedQueixas, selectedAge, selectedContext, selectedSerie), [catalog, search, selectedQueixas, selectedAge, selectedContext, selectedSerie]);
  const direct = rankedPool.find((s) => Boolean(s.appRoute) && (s.respondente.includes("crianca") || s.respondente.includes("clinico")));
  const school = rankedPool.find((s) => s.respondente.includes("professor") || s.queixas.includes("aprendizagem"));
  const family = rankedPool.find((s) => s.respondente.includes("pais"));
  const selectedLabels = selectedQueixas.map((id) => queixas.find((q) => q.id === id)?.label).filter(Boolean);
  const assetSummary = visualAssetRegistry.map((asset) => asset.path).join(" · ");

  const ranking = [
    rec("Ouro", rankedPool[0], reasonForScale(rankedPool[0], selectedQueixas, selectedAge, selectedContext, selectedSerie, "Maior compatibilidade combinando queixa, idade, respondente, prioridade e disponibilidade."), "from-amber-500 via-yellow-600 to-red-800"),
    rec("Prata", rankedPool[1] || rankedPool[0], reasonForScale(rankedPool[1] || rankedPool[0], selectedQueixas, selectedAge, selectedContext, selectedSerie, "Alternativa complementar quando o instrumento ouro não for suficiente ou disponível."), "from-slate-400 via-slate-500 to-slate-700"),
    rec("Bronze", rankedPool[2] || rankedPool[1] || rankedPool[0], reasonForScale(rankedPool[2] || rankedPool[1] || rankedPool[0], selectedQueixas, selectedAge, selectedContext, selectedSerie, "Terceira opção para apoio ou triagem secundária."), "from-orange-500 via-amber-700 to-stone-800"),
    rec("Teste Direto", direct || rankedPool[0], reasonForScale(direct || rankedPool[0], selectedQueixas, selectedAge, selectedContext || "direta", selectedSerie, "Prioriza instrumento que já possui rota de aplicação dentro do app."), "from-blue-600 via-indigo-700 to-slate-950"),
    rec("Questionário Escolar", school || rankedPool[0], reasonForScale(school || rankedPool[0], selectedQueixas, selectedAge, selectedContext || "escola", selectedSerie, "Prioriza instrumentos com professor como respondente ou utilidade escolar."), "from-emerald-600 via-teal-700 to-slate-950"),
  ];

  const blocks: RecommendationBlock[] = [
    { id: "prioritarios", title: "Testes prioritários", subtitle: "maior aderência ao caso", emoji: "🥇", icon: Award, tone: "from-amber-500 via-yellow-600 to-red-800", predicate: (s) => rankedPool.slice(0, 5).some((r) => r.id === s.id) },
    { id: "cognitivos", title: "Testes cognitivos", subtitle: "atenção, raciocínio e funções executivas", emoji: "🧠", icon: Brain, tone: "from-violet-600 via-purple-700 to-slate-950", predicate: (s) => /cogn|aten|executiv|tdah|racioc/.test(scaleText(s)) || s.queixas.some((q) => ["cognicao", "tdah"].includes(q)) },
    { id: "visual", title: "Reconhecimento visual", subtitle: "pareamento, nomeação e percepção", emoji: "👁️", icon: Eye, tone: "from-sky-600 via-blue-700 to-slate-950", predicate: (s) => /visual|reconhecimento|pareamento|figura/.test(scaleText(s)) },
    { id: "grafomotor", title: "Escrita, desenho e motricidade fina", subtitle: "grafismo, pinça e coordenação", emoji: "✏️", icon: Hand, tone: "from-orange-500 via-amber-700 to-stone-900", predicate: (s) => /motric|motor|graf|desenho|escrita/.test(scaleText(s)) || s.queixas.some((q) => ["motor", "pc"].includes(q)) },
    { id: "aprendizagem", title: "Aprendizagem e série escolar", subtitle: "leitura, escrita, matemática e professor", emoji: "📚", icon: GraduationCap, tone: "from-emerald-600 via-teal-700 to-slate-950", predicate: (s) => s.queixas.includes("aprendizagem") || s.respondente.includes("professor") || /tde|academ|serie|escolar/.test(scaleText(s)) },
    { id: "tea", title: "TEA e comunicação social", subtitle: "interação, linguagem e sensorialidade", emoji: "🧩", icon: MessageCircle, tone: "from-purple-600 via-fuchsia-700 to-slate-950", predicate: (s) => s.queixas.includes("tea") || s.queixas.includes("social") || /tea|autis|social|comunic|sensor/.test(scaleText(s)) },
    { id: "tdah", title: "TDAH e funções executivas", subtitle: "atenção, hiperatividade e impulsividade", emoji: "⚡", icon: Zap, tone: "from-amber-500 via-orange-600 to-red-800", predicate: (s) => s.queixas.includes("tdah") || /tdah|adhd|aten|executiv|impuls/.test(scaleText(s)) },
    { id: "familia", title: "Escalas para família", subtitle: "pais e cuidadores", emoji: "👨‍👩‍👧", icon: Users, tone: "from-slate-600 via-slate-800 to-slate-950", predicate: (s) => s.respondente.includes("pais") },
    { id: "escola", title: "Escalas para escola", subtitle: "professor e diário escolar", emoji: "🏫", icon: School, tone: "from-cyan-600 via-blue-800 to-slate-950", predicate: (s) => s.respondente.includes("professor") },
    { id: "documentos", title: "Impressão/PDF/encaminhamento", subtitle: "saídas clínicas já existentes", emoji: "📝", icon: Printer, tone: "from-teal-600 via-cyan-700 to-slate-950", predicate: (s) => Boolean(s.appRoute) || s.respondente.includes("clinico"), fallback: [family || rankedPool[0]].filter(Boolean) as ScaleEntry[] },
  ];

  const nudgeResults = () => {
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 80);
  };

  const toggleQueixa = (id: string) => {
    softTick(); haptic.select();
    setSelectedQueixas((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
    nudgeResults();
  };

  const clearAll = () => {
    softTap(); haptic.tap(); setSearch(""); setSelectedAge(null); setSelectedQueixas([]); setSelectedContext(null); setSelectedSerie(null); setExpandedId(null);
  };

  const filterAssetStickers = [
    { src: brandAssets.illustrations.childAssessment, alt: "Avaliação infantil", label: "triagem direta" },
    { src: brandAssets.illustrations.heroBrain, alt: "Cérebro", label: "cognição" },
    { src: brandAssets.mascots.consultorioSuperman, alt: "Mascote do filtro", label: "guia clínico" },
  ];

  return (
    <div className="page-enter container-filtro filter-260-shell space-y-5 pb-8">
      <header className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur">
        <div className="pointer-events-none absolute right-4 top-4 hidden h-24 w-24 opacity-10 sm:block" aria-hidden="true">
          <SafeAssetImage src={brandAssets.illustrations.neuralAbstract} alt="" className="no-zoom-media h-full w-full object-contain" />
        </div>
        <div className="relative flex items-start gap-3">
          <div className="filter-260-iconbox flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md"><Filter className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10">ranking obrigatório · escalas + questionários + inventários</Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Filtro Clínico Inteligente</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Cruza idade, sinais e sintomas, queixa principal, contexto, série escolar, rota direta, fonte e licença para sugerir instrumentos com explicação clínica breve.</p>
          </div>
          <div className="asset-proportion-box hidden h-20 w-20 shrink-0 rounded-3xl border border-amber-200/30 bg-white/90 p-1.5 shadow-lg sm:flex">
            <SafeAssetImage src={brandAssets.mascots.consultorioSuperman} alt="Mascote auxiliar do filtro" className="no-zoom-media h-full w-full rounded-2xl object-contain" />
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">catálogo filtrável</p><p className="text-2xl font-black text-foreground">{catalog.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">assets auditados</p><p className="text-2xl font-black text-foreground">{visualAssetRegistry.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">status</p><p className="text-2xl font-black text-foreground">{status}</p></CardContent></Card>
      </section>

      <section className="space-y-4 rounded-[1.5rem] border border-border/70 bg-card/80 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); nudgeResults(); }} placeholder="Ex.: atenção, linguagem, TEA, sono, seletividade alimentar, motricidade fina, escrita, série escolar..." className="h-11 rounded-2xl pl-10 pr-10" data-testid="input-search" />
            {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Limpar busca"><X className="h-4 w-4" /></button>}
          </div>
          <div className="hidden items-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-[11px] text-muted-foreground lg:flex">
            <Sparkles className="h-4 w-4 text-amber-500" /> escolha sinais; o resultado aparece logo abaixo, sem saltar para o fim.
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">1. Idade / faixa etária</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {faixasEtarias.map((age) => <button key={age.id} onMouseEnter={() => softHover()} onClick={() => { setSelectedAge((v) => v === age.id ? null : age.id); nudgeResults(); }} className={`shrink-0 rounded-2xl border px-3 py-2 text-xs font-bold transition ${selectedAge === age.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}>{age.label}</button>)}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">2. Sinais, sintomas e queixa principal</p>
                <p className="text-xs text-muted-foreground">Mini cards por domínio, com badges e emojis clínico-lúdicos.</p>
              </div>
              {hasSearch && <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="h-7 gap-1 text-xs"><RotateCcw className="h-3.5 w-3.5" /> limpar</Button>}
            </div>
            <div className="symptom-domain-grid">
              {queixas.slice(0, 28).map((q) => {
                const selected = selectedQueixas.includes(q.id);
                return (
                  <button key={q.id} onMouseEnter={() => softHover()} onClick={() => toggleQueixa(q.id)} className={`symptom-domain-card ${selected ? "selected" : ""}`} aria-pressed={selected}>
                    <span className="symptom-domain-emoji emoji" aria-hidden="true">{QUEIXA_EMOJIS[q.id] || "✨"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="symptom-domain-title">{q.label}</span>
                      <span className="symptom-domain-hint">{selected ? "selecionado" : "toque para incluir"}</span>
                    </span>
                    <span className="symptom-domain-badge">{selected ? "✓" : "+"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="rounded-3xl border border-amber-200/30 bg-gradient-to-br from-amber-50/80 via-white/70 to-primary/5 p-3 dark:from-amber-950/20 dark:via-card/70 dark:to-primary/10">
            <div className="flex items-center gap-3">
              <div className="asset-proportion-box h-16 w-16 shrink-0 rounded-2xl bg-white/90 p-1 shadow-md">
                <SafeAssetImage src={brandAssets.illustrations.childAssessment} alt="Criança em avaliação" className="no-zoom-media h-full w-full rounded-xl object-contain" />
              </div>
              <div>
                <p className="text-sm font-black text-foreground">Guia lúdico</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">A interface fica mais viva, mas mantém leitura clínica e sobriedade.</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {filterAssetStickers.map((asset) => (
                <div key={asset.label} className="asset-proportion-box aspect-square rounded-2xl border border-white/60 bg-white/80 p-1.5 shadow-sm dark:border-white/10 dark:bg-background/60">
                  <SafeAssetImage src={asset.src} alt={asset.alt} className="no-zoom-media h-full w-full rounded-xl object-contain" />
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">3. Contexto de uso</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-5">
              {CONTEXTOS.map((ctx) => <button key={ctx.id} onMouseEnter={() => softHover()} onClick={() => { setSelectedContext((v) => v === ctx.id ? null : ctx.id); nudgeResults(); }} className={`rounded-2xl border px-3 py-2 text-left transition ${selectedContext === ctx.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40 hover:bg-muted/60"}`}><span className="emoji mr-1" aria-hidden="true">{ctx.emoji}</span><span className="text-xs font-black">{ctx.label}</span><span className="block text-[10px] opacity-75">{ctx.hint}</span></button>)}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">4. Série escolar quando aplicável</p>
            <div className="flex flex-wrap gap-2">
              {SERIES_ESCOLARES.map((serie) => <button key={serie} onMouseEnter={() => softHover()} onClick={() => { setSelectedSerie((v) => v === serie ? null : serie); nudgeResults(); }} className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${selectedSerie === serie ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}>📚 {serie}</button>)}
            </div>
          </div>
        </div>
      </section>

      {hasSearch ? <section ref={resultsRef} className="space-y-3 scroll-mt-24">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">saída obrigatória</p><h2 className="text-lg font-black text-foreground">Recomendações por prioridade clínica</h2><p className="text-xs text-muted-foreground">{selectedLabels.length ? `Selecionado: ${selectedLabels.join(" · ")}` : "Use busca, idade, sintomas, contexto ou série para refinar."}</p></div>
        <div className="filter-260-grid">
          {ranking.map((item) => (
            <Link key={item.slot} href={item.route} className="block h-full">
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
                  <div className="filter-260-evidence"><strong>Motivo:</strong> {item.reason}</div>
                  <div className="filter-260-why"><strong>Estado:</strong> {item.state}</div>
                  {item.source && <div className="filter-260-source"><strong>Fonte:</strong> {item.source}</div>}
                  <div className="mt-auto flex items-center justify-between text-xs font-bold text-primary"><span>{item.route === "/filtro" ? "Ver no catálogo" : "Abrir"}</span><ArrowRight className="h-4 w-4" /></div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="recommendation-block-grid">
          {blocks.map((block) => {
            const Icon = block.icon;
            const matches = blockMatches(block, rankedPool);
            const items = matches.length ? matches : (block.fallback || rankedPool.slice(0, 2));
            return (
              <Card key={block.id} className="overflow-hidden border-border/70 bg-card/85">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <div className={`filter-260-symbol small bg-gradient-to-br ${block.tone}`}><Icon className="h-4 w-4" /></div>
                    <div>
                      <h3 className="text-sm font-black text-foreground"><span className="emoji" aria-hidden="true">{block.emoji}</span> {block.title}</h3>
                      <p className="text-[11px] text-muted-foreground">{block.subtitle}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {items.slice(0, 3).map((scale) => {
                      const visual = getScaleVisual(scale);
                      return (
                        <div key={`${block.id}-${scale.id}`} className="rounded-2xl border border-border/70 bg-background/70 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-foreground"><span className="emoji" aria-hidden="true">{visual.emoji}</span> {scale.name}</p>
                              <p className="line-clamp-2 text-[11px] text-muted-foreground">{scale.fullName}</p>
                            </div>
                            <Badge variant="outline" className="filter-260-badge shrink-0">{visual.label}</Badge>
                          </div>
                          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{reasonForScale(scale, selectedQueixas, selectedAge, selectedContext, selectedSerie, "Instrumento compatível com o bloco clínico.")}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-amber-200/70 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20"><CardContent className="p-4 text-xs leading-relaxed text-amber-900 dark:text-amber-100"><strong>Leitura prudente:</strong> o ranking organiza instrumentos disponíveis; não inventa pontuação, não substitui diagnóstico e marca escalas que exigem permissão.</CardContent></Card>
      </section> : <section className="grid gap-3 md:grid-cols-3"><Card className="border-dashed"><CardContent className="space-y-2 p-4"><BookOpen className="h-5 w-5 text-primary" /><h2 className="text-sm font-black text-foreground">Base ampliada</h2><p className="text-xs leading-relaxed text-muted-foreground">Inclui escalas existentes, testes diretos, inventários e 100 escalas mundiais sem custo.</p></CardContent></Card><Card className="border-dashed"><CardContent className="space-y-2 p-4"><School className="h-5 w-5 text-primary" /><h2 className="text-sm font-black text-foreground">Escola aparece</h2><p className="text-xs leading-relaxed text-muted-foreground">O bloco escolar prioriza instrumentos por série, professor e aprendizagem.</p></CardContent></Card><Card className="border-dashed"><CardContent className="space-y-2 p-4"><ShieldAlert className="h-5 w-5 text-primary" /><h2 className="text-sm font-black text-foreground">Licença visível</h2><p className="text-xs leading-relaxed text-muted-foreground">Escalas restritas ficam como ficha clínica até permissão formal.</p></CardContent></Card></section>}

      <section className="rounded-3xl border border-border/70 bg-card/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">prévia do catálogo filtrado</p><h2 className="text-sm font-black text-foreground">{rankedPool.slice(0, 24).length} principais resultados</h2><p className="text-[11px] text-muted-foreground">Detalhes expandem dentro do próprio card, próximos ao clique.</p></div><Link href="/escalas-neuropsiquiatria" className="text-xs font-bold text-primary">Ver catálogo mundial</Link></div>
        <div className="filter-260-grid compact">
          {rankedPool.slice(0, 24).map((s) => { const visual = getScaleVisual(s); const Icon = visual.Icon; const isExpanded = expandedId === s.id; return (
            <div key={s.id} className="filter-260-card compact rounded-2xl border border-border/70 bg-background/70 transition hover:border-primary/30 hover:bg-background">
              <div className="filter-260-card-content compact">
                <button type="button" onClick={() => setExpandedId((current) => current === s.id ? null : s.id)} className="filter-260-head text-left">
                  <div className={`filter-260-symbol small bg-gradient-to-br ${visual.tone}`}><Icon className="h-4 w-4" strokeWidth={1.9} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><p className="filter-260-title small"><span className="emoji" aria-hidden="true">{visual.emoji}</span> {s.name}</p><p className="filter-260-subtitle line-clamp-2">{s.fullName}</p></div>
                      <div className="flex shrink-0 flex-col items-end gap-1"><Badge variant="outline" className="filter-260-badge">{visual.label}</Badge>{s.id.startsWith("world-") && <Badge variant="outline" className="filter-260-badge">mundial</Badge>}</div>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">{s.respondente.join(" · ")} · {Math.round(s.ageMin / 12)}–{Math.round(s.ageMax / 12)} anos</p>
                  </div>
                </button>
                {isExpanded && <div className="filter-inline-detail"><p><strong>Por que sugeriu:</strong> {reasonForScale(s, selectedQueixas, selectedAge, selectedContext, selectedSerie, "Instrumento compatível com o filtro atual.")}</p><p><strong>Aplicação:</strong> {s.tempo} · {s.prioridade} · {s.appRoute ? "rota direta disponível" : "catalogado"}</p>{s.appRoute && <Link href={s.appRoute} className="mt-2 inline-flex items-center gap-1 text-xs font-black text-primary">Abrir instrumento <ArrowRight className="h-3.5 w-3.5" /></Link>}</div>}
              </div>
            </div>
          ); })}
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-background/70 p-4 text-[11px] leading-relaxed text-muted-foreground">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p><strong>Assets mapeados nesta tela:</strong> {assetSummary}. Usados com propósito: mascote auxiliar no filtro, criança em avaliação para orientar sintomas, cérebro/ilustrações como figurinhas pequenas e textura neural discreta sem zoom ou corte.</p>
        </div>
      </section>
    </div>
  );
}
