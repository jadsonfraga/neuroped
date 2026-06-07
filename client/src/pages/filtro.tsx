import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  GraduationCap,
  Medal,
  RotateCcw,
  School,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { allScales, faixasEtarias, filterScales, queixas, type ScaleEntry } from "@/data/scaleFilter";
import { haptic } from "@/lib/haptic";
import { easing, duration } from "@/lib/motion";
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
  icon: LucideIcon;
  tone: string;
}

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

function scoreScale(scale: ScaleEntry, query: string, selectedQueixas: string[]) {
  const haystack = normalize(`${scale.name} ${scale.fullName} ${scale.description} ${scale.queixas.join(" ")} ${scale.respondente.join(" ")}`);
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  let score = 0;

  for (const token of tokens) {
    if (haystack.includes(token)) score += normalize(scale.name).includes(token) ? 6 : 2;
  }
  for (const queixa of selectedQueixas) {
    if (scale.queixas.includes(queixa)) score += 5;
  }
  if (scale.appRoute) score += 3;
  if (scale.prioridade === "triagem") score += 2;
  if (scale.respondente.includes("professor")) score += 1;
  return score;
}

function bestScalePool(query: string, selectedQueixas: string[], selectedAge: string | null) {
  const age = faixasEtarias.find((item) => item.id === selectedAge);
  const ageRange = age ? { min: age.min, max: age.max } : null;
  const base = selectedQueixas.length || ageRange ? filterScales(selectedQueixas, ageRange) : allScales;
  const scored = base
    .map((scale) => ({ scale, score: scoreScale(scale, query, selectedQueixas) }))
    .filter((item) => item.score > 0 || selectedQueixas.length > 0 || Boolean(ageRange))
    .sort((a, b) => b.score - a.score || a.scale.name.localeCompare(b.scale.name))
    .map((item) => item.scale);

  const fallback = allScales
    .map((scale) => ({ scale, score: scoreScale(scale, query, selectedQueixas) }))
    .sort((a, b) => b.score - a.score || a.scale.name.localeCompare(b.scale.name))
    .map((item) => item.scale);

  return uniqueById([...scored, ...fallback, ...allScales]);
}

function makeRecommendation(
  slot: RankingSlot,
  scale: ScaleEntry | undefined,
  fallback: RankedRecommendation,
  reason: string,
): RankedRecommendation {
  if (!scale) return fallback;
  return {
    ...fallback,
    scale,
    route: scale.appRoute || "/filtro",
    title: scale.name,
    subtitle: scale.fullName,
    reason,
    honestState: scale.appRoute
      ? "Teste implementado no app ou rota direta disponível."
      : "Melhor aproximação clínica no catálogo; aplicação direta ainda não está implementada.",
  };
}

function buildRanking(query: string, selectedQueixas: string[], selectedAge: string | null): RankedRecommendation[] {
  const pool = bestScalePool(query, selectedQueixas, selectedAge);
  const firstDirect = pool.find((scale) => Boolean(scale.appRoute));
  const firstSchool = pool.find((scale) => scale.respondente.includes("professor"));
  const schoolRoute = firstSchool?.appRoute || "/inventarios-escola";

  return [
    makeRecommendation("Ouro", pool[0], {
      slot: "Ouro",
      route: "/filtro",
      title: "Sem escala perfeita",
      subtitle: "Refine idade, queixa ou termo pesquisado",
      reason: "O sistema não encontrou correspondência forte; exibe a melhor aproximação disponível.",
      honestState: "Parcial: depende de mais dados clínicos.",
      icon: Award,
      tone: "from-amber-500 via-yellow-600 to-red-800",
    }, "Maior compatibilidade combinando queixa, idade, respondente, prioridade e disponibilidade."),
    makeRecommendation("Prata", pool[1] || pool[0], {
      slot: "Prata",
      route: "/filtro",
      title: "Alternativa clínica",
      subtitle: "Instrumento complementar",
      reason: "Alternativa para ampliar leitura clínica quando a primeira opção não for suficiente.",
      honestState: "Parcial: usar como complemento.",
      icon: Medal,
      tone: "from-slate-400 via-slate-500 to-slate-700",
    }, "Alternativa complementar quando o instrumento ouro não for suficiente ou disponível."),
    makeRecommendation("Bronze", pool[2] || pool[1] || pool[0], {
      slot: "Bronze",
      route: "/filtro",
      title: "Terceira opção",
      subtitle: "Uso de apoio",
      reason: "Opção de apoio quando há limitação de tempo, idade ou respondente.",
      honestState: "Parcial: menor prioridade.",
      icon: Star,
      tone: "from-orange-500 via-amber-700 to-stone-800",
    }, "Terceira opção para apoio, triagem secundária ou contexto menos ideal."),
    makeRecommendation("Teste Direto", firstDirect || pool[0], {
      slot: "Teste Direto",
      route: "/filtro",
      title: "Nenhum teste direto localizado",
      subtitle: "Usar catálogo e julgamento clínico",
      reason: "Não há rota direta implementada para este perfil; a recomendação continua disponível como referência.",
      honestState: "Não testado no app como aplicação direta.",
      icon: ClipboardCheck,
      tone: "from-blue-600 via-indigo-700 to-slate-950",
    }, "Prioriza instrumento que já possui rota de aplicação dentro do app."),
    {
      slot: "Questionário Escolar",
      scale: firstSchool,
      route: schoolRoute,
      title: firstSchool?.name || "Inventários para Escola",
      subtitle: firstSchool?.fullName || "Questionários para professores e contexto pedagógico",
      reason: firstSchool
        ? "Inclui professor como respondente ou interface útil com escola."
        : "Não há escala escolar perfeita para o filtro; encaminha para inventários escolares disponíveis.",
      honestState: firstSchool?.appRoute
        ? "Rota direta disponível."
        : "Aproximação escolar honesta por módulo de inventários.",
      icon: School,
      tone: "from-emerald-600 via-teal-700 to-slate-950",
    },
  ];
}

function RankingCard({ item }: { item: RankedRecommendation }) {
  const Icon = item.icon;
  return (
    <Link href={item.route}>
      <Card className="group h-full cursor-pointer border-border/70 bg-card/90 transition hover:border-primary/40 hover:shadow-lg">
        <CardContent className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-start gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone} text-white shadow-md`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
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
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md">
            <Filter className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10">ranking obrigatório</Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Filtro Clínico Inteligente</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Toda busca retorna cinco saídas: Ouro, Prata, Bronze, Teste Direto e Questionário Escolar. Quando não houver encaixe perfeito, o app sinaliza aproximação.
            </p>
          </div>
        </div>
      </motion.header>

      <section className="space-y-3 rounded-[1.5rem] border border-border/70 bg-card/80 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ex.: autismo, TDAH, atraso, escola, ansiedade, sono..."
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
            {queixas.slice(0, 20).map((queixa) => {
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
              <strong>Leitura prudente:</strong> o ranking organiza instrumentos disponíveis; não inventa pontuação, não substitui diagnóstico e marca aproximações quando a rota direta ou o respondente ideal não existem.
            </CardContent>
          </Card>
        </section>
      ) : (
        <section className="grid gap-3 md:grid-cols-3">
          <Card className="border-dashed">
            <CardContent className="space-y-2 p-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black text-foreground">Digite ou selecione</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">Informe queixa, idade ou termo clínico para gerar o ranking obrigatório.</p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="space-y-2 p-4">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black text-foreground">Escola sempre aparece</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">O bloco escolar nunca fica ausente; se não houver escala perfeita, usa inventário escolar.</p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="space-y-2 p-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black text-foreground">Sem simulação</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">A recomendação mostra estado real: rota direta, aproximação ou catálogo sem aplicação direta.</p>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="rounded-3xl border border-border/70 bg-card/70 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="h-4 w-4 text-primary" />
          <span>Catálogo carregado: {allScales.length} instrumentos. Lógica clínica separada da camada visual via `scaleFilter`.</span>
        </div>
      </section>
    </div>
  );
}
