import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { allScales, faixasEtarias, queixas, type ScaleEntry } from "@/data/scaleFilter";
import { mergeFilterableCatalog } from "@/data/filterableCatalog";
import { noCostWorldScales } from "@/data/noCostWorldScales";
import { curatedBoost, clinicianOnlyPenalty } from "@/data/preConsultaCurated";
import { haptic } from "@/lib/haptic";
import { softHover, softTap, softTick } from "@/lib/softSounds";

type Slot = "Ouro" | "Prata" | "Bronze" | "Teste Direto" | "Questionário Escolar";
type Tier = "ouro" | "prata" | "bronze";
type Row = [number, string, string, string, string, string, "Ouro" | "Prata" | "Bronze", "embed" | "permission" | "link"];

const REGISTRY_URL = "https://raw.githubusercontent.com/jadsonfraga/neuroped/main/data/neuroped_escalas_neuropsiquiatria_infantil_100.json";
const CORE_FILTERABLE_CATALOG = mergeFilterableCatalog(allScales);

// ── Filtro de PRÉ-CONSULTA ────────────────────────────────────────────────
// Propósito: triagem ANTES da consulta (uso da secretaria) — questionários para
// família/escola + testes diretos com a criança. Instrumentos de ACOMPANHAMENTO
// não se aplicam aqui e são removidos do filtro (continuam acessíveis em outras
// telas do app): diários, qualidade de vida/desfecho, monitorização de medicação
// e efeitos colaterais (todos `prioridade: "monitorizacao"`) e psicoeducação.
const PSICOEDUCACAO_ROUTES = new Set<string>(["/orientacao-parental", "/portal-familia"]);
const QUEIXAS_POS_CONSULTA = new Set<string>(["efeitos", "evolucao"]);

function isPreConsulta(s: ScaleEntry): boolean {
  if (s.prioridade === "monitorizacao") return false;
  if (s.appRoute && PSICOEDUCACAO_ROUTES.has(s.appRoute)) return false;
  return true;
}

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
  // Dedup por id E por fullName: colapsa duplicatas reais (ex.: bears/bears-new,
  // psq/psq-new) sem afetar instrumentos distintos de mesma sigla (ex.: as duas
  // AIMS têm fullName diferente, então sobrevivem).
  const seenId = new Set<string>();
  const seenName = new Set<string>();
  return scales.filter((s) => {
    const key = (s.fullName || s.name || "").toLowerCase().trim();
    if (seenId.has(s.id) || (key && seenName.has(key))) return false;
    seenId.add(s.id);
    if (key) seenName.add(key);
    return true;
  });
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
    prioridade: "triagem",
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

function score(scale: ScaleEntry, query: string, selectedQueixas: string[], selectedAge: string | null) {
  const text = norm(`${scale.name} ${scale.fullName} ${scale.description} ${scale.queixas.join(" ")} ${scale.respondente.join(" ")} ${scale.fonte || ""}`);
  let value = 0;
  for (const token of norm(query).split(/\s+/).filter(Boolean)) if (text.includes(token)) value += norm(scale.name).includes(token) ? 7 : 2;
  for (const q of selectedQueixas) if (scale.queixas.includes(q)) value += 6;
  if (selectedAge && matchAge(scale, selectedAge)) value += 3;
  if (scale.appRoute) value += 3;
  if (scale.prioridade === "triagem") value += 2;
  if (scale.respondente.includes("professor")) value += 1;
  if (scale.id.startsWith("world-")) value += 0.8;
  // Curadoria clínica de pré-consulta: primeira linha por queixa/comorbidade
  // domina o ranking; avaliações formais do médico (sem rota, só clínico) afundam.
  value += curatedBoost(scale.appRoute, selectedQueixas);
  value += clinicianOnlyPenalty(scale.appRoute, scale.respondente, scale.prioridade);
  return value;
}

function pool(catalog: ScaleEntry[], query: string, selectedQueixas: string[], selectedAge: string | null) {
  const base = catalog.filter((s) => (selectedQueixas.length === 0 || s.queixas.some((q) => selectedQueixas.includes(q))) && matchAge(s, selectedAge));
  return unique(base.length ? base : catalog)
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
    route: scale?.appRoute || (scale?.id.startsWith("world-") ? "/escalas-neuropsiquiatria" : "/filtro"),
    title: scale?.name || "Sem escala ideal",
    subtitle: scale?.fullName || "Refine idade, queixa ou termo pesquisado",
    reason,
    state: scale?.appRoute ? "Rota direta disponível." : restricted ? "Ficha clínica; não embutir itens/escore sem permissão formal." : "Catálogo filtrável; aplicação direta ainda não implementada.",
    source: scale?.fonte,
    tone,
    pending: scale?.pendente_validacao_clinica === true,
    restricted,
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

export default function FiltroPage() {
  const [search, setSearch] = useState("");
  const [selectedQueixas, setSelectedQueixas] = useState<string[]>([]);
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
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

  const catalog = useMemo(() => unique([...CORE_FILTERABLE_CATALOG, EUSM10_FILTER_SCALE, ...world]).filter(isPreConsulta), [world]);
  const hasSearch = search.trim().length >= 2 || selectedQueixas.length > 0 || Boolean(selectedAge);
  const statusInfo = status === "loading"
    ? { label: "carregando", dot: "bg-amber-400 animate-pulse" }
    : status === "ok"
      ? { label: "completo", dot: "bg-emerald-500" }
      : { label: "base local", dot: "bg-muted-foreground" };
  const rankedPool = useMemo(() => pool(catalog, search, selectedQueixas, selectedAge), [catalog, search, selectedQueixas, selectedAge]);
  const direct = rankedPool.find((s) => Boolean(s.appRoute));
  const school = rankedPool.find((s) => s.respondente.includes("professor"));
  const ranking = [
    rec("Ouro", rankedPool[0], "Maior compatibilidade combinando queixa, idade, respondente, prioridade e disponibilidade.", "from-amber-500 via-yellow-600 to-red-800"),
    rec("Prata", rankedPool[1], "Alternativa complementar quando o instrumento ouro não for suficiente ou disponível.", "from-slate-400 via-slate-500 to-slate-700"),
    rec("Bronze", rankedPool[2], "Terceira opção para apoio ou triagem secundária.", "from-orange-500 via-amber-700 to-stone-800"),
    rec("Teste Direto", direct || rankedPool[0], "Prioriza instrumento que já possui rota de aplicação dentro do app.", "from-blue-600 via-indigo-700 to-slate-950"),
    rec("Questionário Escolar", school || rankedPool[0], "Prioriza instrumentos com professor como respondente ou utilidade escolar.", "from-emerald-600 via-teal-700 to-slate-950"),
  ];

  const toggleQueixa = (id: string) => {
    softTick(); haptic.select();
    setSelectedQueixas((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const clearAll = () => {
    softTap(); haptic.tap(); setSearch(""); setSelectedAge(null); setSelectedQueixas([]);
  };

  return (
    <div className="page-enter container-filtro filter-260-shell space-y-5 pb-8">
      <header className="rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="filter-260-iconbox flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md"><Filter className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10">ranking obrigatório · escalas + questionários + inventários</Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Filtro Clínico Inteligente</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Cruza idade, queixa, respondente, rota direta, fonte e licença usando a base interna, instrumentos suplementares e 100 escalas mundiais sem custo.</p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">catálogo filtrável</p><p className="text-2xl font-black tabular-nums text-foreground">{catalog.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">mundiais</p><p className="text-2xl font-black tabular-nums text-foreground">{world.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">status</p><p className="mt-1 flex items-center gap-2 text-lg font-black text-foreground"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusInfo.dot}`} aria-hidden="true" />{statusInfo.label}</p></CardContent></Card>
      </section>
      {status === "fallback" && <p className="-mt-2 px-1 text-[11px] leading-relaxed text-muted-foreground">Catálogo mundial online indisponível agora — usando a base local embutida, sem perda de função.</p>}

      <section className="space-y-3 rounded-[1.5rem] border border-border/70 bg-card/80 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ex.: medicação, efeitos, satisfação, autismo, TDAH, escola, sono..." className="h-11 rounded-2xl pl-10 pr-10" data-testid="input-search" />
          {search && <button type="button" onClick={() => setSearch("")} className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Limpar busca"><X className="h-4 w-4" /></button>}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Idade</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {faixasEtarias.map((age) => <button key={age.id} type="button" aria-pressed={selectedAge === age.id} onMouseEnter={() => softHover()} onClick={() => setSelectedAge((v) => v === age.id ? null : age.id)} className={`flex min-h-[44px] shrink-0 items-center rounded-2xl border px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${selectedAge === age.id ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"}`}>{age.label}</button>)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Queixa clínica</p>
            {hasSearch && <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="h-7 gap-1 text-xs"><RotateCcw className="h-3.5 w-3.5" /> limpar</Button>}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {queixas.filter((q) => !QUEIXAS_POS_CONSULTA.has(q.id)).slice(0, 24).map((q) => <button key={q.id} type="button" aria-pressed={selectedQueixas.includes(q.id)} onMouseEnter={() => softHover()} onClick={() => toggleQueixa(q.id)} className={`flex min-h-[44px] items-center rounded-2xl border px-3 py-2 text-left text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${selectedQueixas.includes(q.id) ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background hover:border-primary/40 hover:bg-muted/60"}`}>{q.label}</button>)}
          </div>
        </div>
      </section>

      {hasSearch ? <section className="space-y-3">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">saída obrigatória</p><h2 className="text-lg font-black text-foreground">Recomendações por prioridade clínica</h2></div>
        <div className="filter-260-grid">
          {ranking.map((item) => (
            <Link key={item.slot} href={item.route} className="block h-full rounded-[18px] focus-visible:outline-none">
              <Card className={`filter-260-card group h-full cursor-pointer border-border/70 bg-card/90 transition hover:border-primary/40 hover:shadow-lg ${item.tier ? `tier-${item.tier}` : ""}`}>
                <CardContent className="filter-260-card-content">
                  <div className="filter-260-medalrow flex-wrap gap-2">
                    <Badge variant="outline" className={`filter-260-medal ${item.tier ? `medal-${item.tier}` : "medal-direto"}`}>{item.slot}</Badge>
                    {item.pending && <Badge variant="outline" className="filter-260-badge border-amber-400/60 text-amber-700 dark:text-amber-300" title="Uso experimental — validação clínica pendente">validação pendente</Badge>}
                    {item.restricted && <Badge variant="outline" className="filter-260-badge border-primary/40 text-primary" title="Instrumento protegido — usar apenas conforme licença/autorização">protegida</Badge>}
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
  