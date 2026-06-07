import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Award,
  BookOpen,
  ClipboardCheck,
  Filter,
  Medal,
  RotateCcw,
  School,
  Search,
  ShieldAlert,
  Star,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { allScales, faixasEtarias, queixas, type ScaleEntry } from "@/data/scaleFilter";
import { noCostWorldScales } from "@/data/noCostWorldScales";
import { haptic } from "@/lib/haptic";
import { softHover, softTap, softTick } from "@/lib/softSounds";

type RankingSlot = "Ouro" | "Prata" | "Bronze" | "Teste Direto" | "Questionário Escolar";

interface RankedRecommendation {
  slot: RankingSlot;
  scale?: ScaleEntry;
  route: string;
  title: string;
  subtitle: string;
  reason: string;
  honestState: string;
  tone: string;
}

const expandedScales: ScaleEntry[] = [...allScales, ...noCostWorldScales];

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function uniqueById(scales: ScaleEntry[]) {
  const seen = new Set<string>();
  return scales.filter((scale) => {
    if (seen.has(scale.id)) return false;
    seen.add(scale.id);
    return true;
  });
}

function matchesAge(scale: ScaleEntry, selectedAge: string | null) {
  const age = faixasEtarias.find((item) => item.id === selectedAge);
  if (!age) return true;
  return scale.ageMax >= age.min && scale.ageMin <= age.max;
}

function scoreScale(scale: ScaleEntry, query: string, selectedQueixas: string[], selectedAge: string | null) {
  const haystack = normalize([
    scale.name,
    scale.fullName,
    scale.description,
    scale.queixas.join(" "),
    scale.respondente.join(" "),
    scale.fonte || "",
    scale.licencaUso || "",
  ].join(" "));

  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  let score = 0;

  for (const token of tokens) {
    if (haystack.includes(token)) score += normalize(scale.name).includes(token) ? 7 : 2;
  }

  for (const queixa of selectedQueixas) {
    if (scale.queixas.includes(queixa)) score += 6;
  }

  if (selectedAge && matchesAge(scale, selectedAge)) score += 3;
  if (scale.appRoute) score += 3;
  if (scale.prioridade === "triagem") score += 2;
  if (scale.respondente.includes("professor")) score += 1;
  if (scale.id.startsWith("world-")) score += 0.8;

  return score;
}

function bestScalePool(query: string, selectedQueixas: string[], selectedAge: string | null) {
  const filtered = expandedScales.filter((scale) => {
    const matchQueixa = selectedQueixas.length === 0 || scale.queixas.some((q) => selectedQueixas.includes(q));
    return matchQueixa && matchesAge(scale, selectedAge);
  });

  const base = filtered.length ? filtered : expandedScales;
  return uniqueById(base)
    .map((scale) => ({ scale, score: scoreScale(scale, query, selectedQueixas, selectedAge) }))
    .sort((a, b) => b.score - a.score || a.scale.name.localeCompare(b.scale.name))
    .map((item) => item.scale);
}

function makeRecommendation(slot: RankingSlot, scale: ScaleEntry | undefined, reason: string, tone: string): RankedRecommendation {
  if (!scale) {
    return {
      slot,
      route: "/filtro",
      title: "Sem escala ideal",
      subtitle: "Refine idade, queixa ou termo pesquisado",
      reason: "O sistema não encontrou correspondência forte; exibe aproximação prudente.",
      honestState: "Parcial: depende de mais dados clínicos.",
      tone,
    };
  }

  const requiresPermission = scale.licencaUso === "restrita" || scale.licencaUso === "comercial" || scale.licencaUso === "contato_autor";

  return {
    slot,
    scale,
    route: scale.appRoute || (scale.id.startsWith("world-") ? "/escalas-neuropsiquiatria" : "/filtro"),
    title: scale.name,
    subtitle: scale.fullName,
    reason,
    honestState: scale.appRoute
      ? "Teste implementado no app ou rota direta disponível."
      : requiresPermission
        ? "Ficha clínica disponível; não embutir itens/escore sem permissão formal."
        : "Catálogo filtrável disponível; aplicação direta ainda não implementada.",
    tone,
  };
}

function buildRanking(query: string, selectedQueixas: string[], selectedAge: string | null): RankedRecommendation[] {
  const pool = bestScalePool(query, selectedQueixas, selectedAge);
  const firstDirect = pool.find((scale) => Boolean(scale.appRoute));
  const firstSchool = pool.find((scale) => scale.respondente.includes("professor"));

  return [
    makeRecommendation("Ouro", pool[0], "Maior compatibilidade combinando queixa, idade, respondente, prioridade e disponibilidade.", "from-amber-500 via-yellow-600 to-red-800"),
    makeRecommendation("Prata", pool[1] || pool[0], "Alternativa complementar quando o instrumento ouro não for suficiente ou disponível.", "from-slate-400 via-slate-500 to-slate-700"),
    makeRecommendation("Bronze", pool[2] || pool[1] || pool[0], "Terceira opção para apoio, triagem secundária ou contexto menos ideal.", "from-orange-500 via-amber-700 to-stone-800"),
    makeRecommendation("Teste Direto", firstDirect || pool[0], "Prioriza instrumento que já possui rota de aplicação dentro do app.", "from-blue-600 via-indigo-700 to-slate-950"),
    makeRecommendation("Questionário Escolar", firstSchool || pool[0], "Prioriza instrumentos com professor como respondente ou utilidade escolar.", "from-emerald-600 via-teal-700 to-slate-950"),
  ];
}

function RankingIcon({ slot }: { slot: RankingSlot }) {
  if (slot === "Ouro") return <Award className="h-5 w-5" />;
  if (slot === "Prata") return <Medal className="h-5 w-5" />;
  if (slot === "Bronze") return <Star className="h-5 w-5" />;
  if (slot === "Teste Direto") return <ClipboardCheck className="h-5 w-5" />;
  return <School className="h-5 w-5" />;
}

function RankingCard({ item }: { item: RankedRecommendation }) {
  return (
    <Link href={item.route}>
      <Card className="group h-full cursor-pointer border-border/70 bg-card/90 transition hover:border-primary/40 hover:shadow-lg">
        <CardContent className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-start gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone} text-white shadow-md`}>
              <RankingIcon slot={item.slot} />
            </div>
            <div className="min-w-0 flex-1">
              <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-[0.14em]">{item.slot}</Badge>
              <h3 className="truncate text-sm font-black text-foreground group-hover:text-primary">{item.title}</h3>
              <p className="line-clamp-2 text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
          </div>
          <div className="space-y-2 rounded-2xl bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <p><strong className="text-foreground">Motivo:</strong> {item.reason}</p>
            <p><strong className="text-foreground">Estado:</strong> {item.honestState}</p>
            {item.scale?.fonte && <p><strong className="text-foreground">Fonte:</strong> {item.scale.fonte}</p>}
          </div>
          <div className="mt-auto flex items-center justify-between text-xs font-bold text-primary">
            <span>{item.route === "/filtro" ? "Ver no catálogo" : "Abrir"}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function FiltroPage() {
  const [search, setSearch] = useState("");
  const [selectedQueixas, setSelectedQueixas] = useState<string[]>([]);
  const [selectedAge, setSelectedAge] = useState<string | null>(null);

  const hasSearch = search.trim().length >= 2 || selectedQueixas.length > 0 || Boolean(selectedAge);
  const ranking = useMemo(() => buildRanking(search, selectedQueixas, selectedAge), [search, selectedQueixas, selectedAge]);
  const filteredPreview = useMemo(() => bestScalePool(search, selectedQueixas, selectedAge).slice(0, 24), [search, selectedQueixas, selectedAge]);

  const toggleQueixa = (id: string) => {
    softTick();
    haptic.select();
    setSelectedQueixas((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const clearAll = () => {
    softTap();
    haptic.tap();
    setSearch("");
    setSelectedAge(null);
    setSelectedQueixas([]);
  };

  return (
    <div className="page-enter space-y-5 pb-8">
      <header className="rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md">
            <Filter className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10">ranking obrigatório · base ampliada</Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Filtro Clínico Inteligente</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Agora inclui o catálogo mundial de escalas sem custo: o ranking cruza queixa, idade, respondente, rota direta, fonte e licença de uso.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">catálogo total</p><p className="text-2xl font-black text-foreground">{expandedScales.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">novas mundiais</p><p className="text-2xl font-black text-foreground">{noCostWorldScales.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">saída fixa</p><p className="text-2xl font-black text-foreground">5 blocos</p></CardContent></Card>
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-border/70 bg-card/80 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ex.: autismo, TDAH, atraso, escola, ansiedade, trauma, sono, PROMIS..."
            className="h-11 rounded-2xl pl-10 pr-10"
            data-testid="input-search"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Limpar busca">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Idade</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {faixasEtarias.map((age) => (
              <button
                key={age.id}
                onMouseEnter={() => softHover()}
                onClick={() => setSelectedAge((current) => current === age.id ? null : age.id)}
                className={`shrink-0 rounded-2xl border px-3 py-2 text-xs font-bold transition ${selectedAge === age.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
              >
                {age.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Queixa clínica</p>
            {hasSearch && (
              <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="h-7 gap-1 text-xs">
                <RotateCcw className="h-3.5 w-3.5" /> limpar
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {queixas.slice(0, 24).map((queixa) => {
              const selected = selectedQueixas.includes(queixa.id);
              return (
                <button
                  key={queixa.id}
                  onMouseEnter={() => softHover()}
                  onClick={() => toggleQueixa(queixa.id)}
                  className={`rounded-2xl border px-3 py-2 text-left text-xs font-bold transition ${selected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background hover:border-primary/40 hover:bg-muted/60"}`}
                >
                  {queixa.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {hasSearch ? (
        <section className="space-y-3" aria-label="Ranking obrigatório de recomendações">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">saída obrigatória</p>
              <h2 className="text-lg font-black text-foreground">Recomendações por prioridade clínica</h2>
            </div>
            <Badge variant="outline" className="hidden sm:inline-flex">5 blocos</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {ranking.map((item) => <RankingCard key={item.slot} item={item} />)}
          </div>
          <Card className="border-amber-200/70 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20">
            <CardContent className="p-4 text-xs leading-relaxed text-amber-900 dark:text-amber-100">
              <strong>Leitura prudente:</strong> o ranking organiza instrumentos disponíveis; não inventa pontuação, não substitui diagnóstico e marca escalas que exigem permissão antes de embutir itens ou escores.
            </CardContent>
          </Card>
        </section>
      ) : (
        <section className="grid gap-3 md:grid-cols-3">
          <Card className="border-dashed"><CardContent className="space-y-2 p-4"><BookOpen className="h-5 w-5 text-primary" /><h2 className="text-sm font-black text-foreground">Base ampliada</h2><p className="text-xs leading-relaxed text-muted-foreground">Inclui escalas já existentes e novas escalas mundiais sem custo.</p></CardContent></Card>
          <Card className="border-dashed"><CardContent className="space-y-2 p-4"><School className="h-5 w-5 text-primary" /><h2 className="text-sm font-black text-foreground">Escola aparece</h2><p className="text-xs leading-relaxed text-muted-foreground">O bloco escolar prioriza instrumentos com professor como respondente.</p></CardContent></Card>
          <Card className="border-dashed"><CardContent className="space-y-2 p-4"><ShieldAlert className="h-5 w-5 text-primary" /><h2 className="text-sm font-black text-foreground">Licença visível</h2><p className="text-xs leading-relaxed text-muted-foreground">Escalas restritas ficam como ficha clínica até permissão formal.</p></CardContent></Card>
        </section>
      )}

      <section className="rounded-3xl border border-border/70 bg-card/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">prévia do catálogo filtrado</p>
            <h2 className="text-sm font-black text-foreground">{filteredPreview.length} principais resultados</h2>
          </div>
          <Link href="/escalas-neuropsiquiatria" className="text-xs font-bold text-primary">Ver catálogo mundial</Link>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {filteredPreview.map((scale) => (
            <div key={scale.id} className="rounded-2xl border border-border/70 bg-background/70 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-foreground">{scale.name}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{scale.fullName}</p>
                </div>
                {scale.id.startsWith("world-") && <Badge variant="outline" className="shrink-0 text-[10px]">mundial</Badge>}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{scale.respondente.join(" · ")} · {Math.round(scale.ageMin / 12)}–{Math.round(scale.ageMax / 12)} anos</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
