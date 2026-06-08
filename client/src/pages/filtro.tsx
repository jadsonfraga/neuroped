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
  const hasSearch = search.trim().length >= 2 || selectedQueixas.length > 0 || Boolean(selectedAge);
  const rankedPool = useMemo(() => pool(catalog, search, selectedQueixas, selectedAge), [catalog, search, selectedQueixas, selectedAge]);
  const direct = rankedPool.find((s) => Boolean(s.appRoute));
  const school = rankedPool.find((s) => s.respondente.includes("professor"));
  const ranking = [
    rec("Ouro", rankedPool[0], "Maior compatibilidade combinando queixa, idade, respondente, prioridade e disponibilidade.", "from-amber-500 via-yellow-600 to-red-800"),
    rec("Prata", rankedPool[1] || rankedPool[0], "Alternativa complementar quando o instrumento ouro não for suficiente ou disponível.", "from-slate-400 via-slate-500 to-slate-700"),
    rec("Bronze", rankedPool[2] || rankedPool[1] || rankedPool[0], "Terceira opção para apoio ou triagem secundária.", "from-orange-500 via-amber-700 to-stone-800"),
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
    <div className="page-enter container-filtro filter-260-shell space-y-5 pb-8 relative">
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
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">catálogo filtrável</p><p className="text-2xl font-black text-foreground">{catalog.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">mundiais</p><p className="text-2xl font-black text-foreground">{world.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">status</p><p className="text-2xl font-black text-foreground">{status}</p></CardContent></Card>
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-border/70 bg-card/80 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ex.: medicação, efeitos, satisfação, autismo, TDAH, escola, sono..." className="h-11 rounded-2xl pl-10 pr-10" data-testid="input-search" />
          {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Limpar busca"><X className="h-4 w-4" /></button>}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Idade</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {faixasEtarias.map((age) => <button key={age.id} onMouseEnter={() => softHover()} onClick={() => setSelectedAge((v) => v === age.id ? null : age.id)} className={`shrink-0 rounded-2xl border px-3 py-2 text-xs font-bold transition ${selectedAge === age.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}>{age.label}</button>)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Queixa clínica</p>
            {hasSearch && <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="h-7 gap-1 text-xs"><RotateCcw className="h-3.5 w-3.5" /> limpar</Button>}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {queixas.slice(0, 24).map((q) => <button key={q.id} onMouseEnter={() => softHover()} onClick={() => toggleQueixa(q.id)} className={`rounded-2xl border px-3 py-3 sm:px-3 sm:py-2 text-left text-xs font-bold transition flex items-center gap-2 min-h-12 sm:min-h-auto ${selectedQueixas.includes(q.id) ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background hover:border-primary/40 hover:bg-muted/60"}`}>{q.emoji && <span className="text-sm flex-shrink-0">{q.emoji}</span>}<span className="truncate">{q.label}</span></button>)}
          </div>
        </div>
      </section>

      {hasSearch ? <section className="space-y-3">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">saída obrigatória</p><h2 className="text-lg font-black text-foreground">Recomendações por prioridade clínica</h2></div>
        <div className="filter-260-grid">
          {ranking.map((item) => {
            const reasons = getRecommendationReasons(
              item.title !== "Sem escala ideal" ? rankedPool.find(s => s.name === item.title) : undefined,
              selectedQueixas,
              selectedAge
            );
            return (
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
      </section> : <section className="grid gap-3 md:grid-cols-3"><Card className="border-dashed"><CardContent className="space-y-2 p-4"><BookOpen className="h-5 w-5 text-primary" /><h2 className="text-sm font-black text-foreground">Base ampliada</h2><p className="text-xs leading-relaxed text-muted-foreground">Inclui escalas existentes, questionários aplicáveis, inventários e 100 escalas mundiais sem custo.</p></CardContent></Card><Card className="border-dashed"><CardContent className="space-y-2 p-4"><School className="h-5 w-5 text-primary" /><h2 className="text-sm font-black text-foreground">Escola aparece</h2><p className="text-xs leading-relaxed text-muted-foreground">O bloco escolar prioriza instrumentos com professor como respondente.</p></CardContent></Card><Card className="border-dashed"><CardContent className="space-y-2 p-4"><ShieldAlert className="h-5 w-5 text-primary" /><h2 className="text-sm font-black text-foreground">Licença visível</h2><p className="text-xs leading-relaxed text-muted-foreground">Escalas restritas ficam como ficha clínica até permissão formal.</p></CardContent></Card></section>}

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
