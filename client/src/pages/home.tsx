import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  ClipboardCheck,
  Clock3,
  FileText,
  Filter,
  LineChart,
  Pill,
  Search,
  Stethoscope,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Mascote } from "@/components/Mascote";
import { FavoritesRecents } from "@/components/FavoritesRecents";
import { appMetrics } from "@/data/appMetrics";
import { mergeFilterableCatalog } from "@/data/filterableCatalog";
import { navigablePages } from "@/data/navigation";
import { allScales } from "@/data/scaleFilter";
import { haptic } from "@/lib/haptic";
import { easing, duration } from "@/lib/motion";
import { softHover, softTap } from "@/lib/softSounds";

interface ClinicalFlow {
  href: string;
  title: string;
  subtitle: string;
  action: string;
  useCase: string;
  icon: LucideIcon;
  emphasis: "primary" | "gold" | "teal" | "blue" | "slate";
}

const homeSearchCatalog = mergeFilterableCatalog(allScales);

const clinicalFlows: ClinicalFlow[] = [
  {
    href: "/mchat",
    title: "Aplicar escala",
    subtitle: "Abra um instrumento implementado e registre o resultado no atendimento.",
    action: "Avaliar agora",
    useCase: "Consulta em andamento",
    icon: ClipboardCheck,
    emphasis: "primary",
  },
  {
    href: "/filtro",
    title: "Encontrar a escala ideal",
    subtitle: "Filtre por idade, queixa, objetivo e contexto de aplicação.",
    action: "Abrir filtro clínico",
    useCase: "Escolher instrumento",
    icon: Filter,
    emphasis: "gold",
  },
  {
    href: "/avaliacao-cognitiva-infantil",
    title: "Avaliação Cognitiva Infantil",
    subtitle: "Triagem lúdica por faixa etária: visual, leitura, escrita e aritmética.",
    action: "Abrir avaliação",
    useCase: "Triagem 2–19 anos",
    icon: ClipboardCheck,
    emphasis: "blue",
  },
  {
    href: "/medicamentos",
    title: "Medicamentos e doses",
    subtitle: "Farmacologia prática, calculadora de dose e monitorização.",
    action: "Abrir medicamentos",
    useCase: "Referência clínica",
    icon: Pill,
    emphasis: "teal",
  },
  {
    href: "/marcos-desenvolvimento",
    title: "Marcos do Desenvolvimento",
    subtitle: "Checklist por idade (base OMS/CDC) para acompanhar o desenvolvimento.",
    action: "Ver marcos",
    useCase: "Desenvolvimento",
    icon: LineChart,
    emphasis: "slate",
  },
];

// Acento sutil por fluxo: fundo tonal + ícone colorido + anel fino. Sem
// gradientes escuros pesados — leveza e coerência (nível premium).
const accentClasses: Record<ClinicalFlow["emphasis"], string> = {
  primary: "bg-rose-500/10 text-rose-600 ring-rose-500/15 dark:text-rose-400",
  gold: "bg-amber-500/10 text-amber-600 ring-amber-500/15 dark:text-amber-400",
  teal: "bg-teal-500/10 text-teal-600 ring-teal-500/15 dark:text-teal-400",
  blue: "bg-blue-500/10 text-blue-600 ring-blue-500/15 dark:text-blue-400",
  slate: "bg-slate-500/10 text-slate-600 ring-slate-500/15 dark:text-slate-300",
};

const metricCards = [
  { label: "Escalas no catálogo", value: appMetrics.scaleCount, icon: ClipboardCheck },
  { label: "Itens no filtro inteligente", value: appMetrics.filterableInstrumentCount, icon: Filter },
  { label: "Medicações", value: appMetrics.medicationCount, icon: Pill },
  { label: "Páginas", value: appMetrics.pageCount, icon: FileText },
];

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function FlowCard({ flow, index }: { flow: ClinicalFlow; index: number }) {
  const Icon = flow.icon;
  return (
    <Link href={flow.href}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: duration.normal, ease: easing.smooth }}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.99 }}
        onMouseEnter={() => softHover()}
        onClick={() => {
          softTap();
          haptic.tap();
        }}
        className="group relative flex h-full cursor-pointer flex-col gap-5 overflow-hidden rounded-[1.75rem] border border-white/75 bg-card/90 p-5 shadow-[0_18px_55px_-38px_rgba(38,24,53,0.38)] backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-300 hover:border-primary/20 hover:shadow-[0_24px_60px_-32px_rgba(87,37,113,0.3)] dark:border-white/10"
        data-testid={`home-flow-${index + 1}`}
      >
        <div className="flex items-start justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 transition-transform duration-300 group-hover:scale-105 ${accentClasses[flow.emphasis]}`}>
            <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />
          </div>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground/40 transition-all duration-300 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </div>
        <div className="flex flex-1 flex-col">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {flow.useCase}
          </p>
          <h2 className="mt-1.5 text-[17px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
            {flow.title}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{flow.subtitle}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground/70 transition-colors group-hover:text-primary">
            {flow.action}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const q = normalize(searchQuery.trim());

  const searchResults = useMemo(() => {
    if (q.length < 2) return [];
    const pages = navigablePages
      .filter((page) => normalize(`${page.label} ${page.href}`).includes(q))
      .map((page) => ({ href: page.href, title: page.label, detail: "Página do app" }));
    const scales = homeSearchCatalog
      .filter((scale) => normalize(`${scale.name} ${scale.fullName} ${scale.description} ${scale.queixas.join(" ")}`).includes(q))
      .slice(0, 8)
      .map((scale) => ({ href: scale.appRoute || "/filtro", title: scale.name, detail: scale.fullName }));
    return [...pages, ...scales].slice(0, 10);
  }, [q]);

  const isSearching = q.length >= 2;

  return (
    <div className="page-enter proportion-safe-page space-y-9 pb-10">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="np-home-hero relative overflow-hidden rounded-[2rem] border border-white/70 p-6 shadow-[0_30px_90px_-52px_rgba(53,24,70,0.5)] sm:p-10 lg:min-h-[34rem] dark:border-white/10"
      >
        <div className="np-home-orb np-home-orb-one" aria-hidden="true" />
        <div className="np-home-orb np-home-orb-two" aria-hidden="true" />
        <div className="absolute right-2 top-2 lg:hidden">
          <Mascote contexto="home" size="sm" fala="" />
        </div>
        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/65 px-3 py-1.5 text-[11px] font-semibold text-primary shadow-sm backdrop-blur dark:bg-white/5">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-40 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
              </span>
              Painel clínico inteligente
            </div>
            <div className="max-w-3xl space-y-4">
              <h1
                className="max-w-2xl text-[2.65rem] font-semibold leading-[0.98] tracking-[-0.045em] text-foreground sm:text-[4rem] lg:text-[4.65rem]"
                style={{ fontFamily: "var(--font-display)" }}
                data-testid="text-page-title"
              >
                Menos ruído. <span className="np-title-gradient">Mais clareza clínica.</span>
              </h1>
              <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Escalas, triagem e acompanhamento em uma jornada segura, acolhedora e feita para o ritmo do consultório.
              </p>
            </div>

            <div className="relative max-w-2xl" data-testid="search-container">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-primary" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar escala ou página…"
                className="h-14 rounded-[1.15rem] border-white/80 bg-white/80 pl-13 pr-10 text-[15px] shadow-[0_14px_35px_-22px_rgba(45,25,58,0.4)] backdrop-blur-xl transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-primary/30 focus-visible:shadow-[0_18px_42px_-22px_rgba(91,42,116,0.4)] dark:border-white/10 dark:bg-slate-950/50"
                data-testid="input-search"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/filtro" className="np-primary-cta inline-flex min-h-11 items-center gap-2 rounded-2xl px-5 py-2.5 text-[13px] font-semibold text-white">
                Encontrar escala ideal
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/filtro-escalas?mode=flash" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-primary/15 bg-white/55 px-4 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10">
                <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
                Triagem rápida
              </Link>
            </div>

            <div
              className="grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/60 bg-white/45 sm:grid-cols-4 dark:border-white/10 dark:bg-white/5"
              aria-label="Métricas do app"
            >
              {metricCards.map((metric) => (
                <div key={metric.label} className="bg-white/35 px-3.5 py-3.5 dark:bg-slate-950/20">
                  <div className="text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">{metric.value}<span className="ml-0.5 text-primary">+</span></div>
                  <p className="mt-0.5 text-[10.5px] font-medium leading-tight text-muted-foreground">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative hidden min-h-[27rem] items-center justify-center lg:flex">
            <div className="absolute inset-8 rounded-full border border-white/40 bg-white/20 shadow-[inset_0_0_70px_rgba(255,255,255,0.35)] backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.03]" aria-hidden="true" />
            <Mascote contexto="home" size="lg" className="relative z-10" />
          </div>
        </div>
      </motion.section>

      {isSearching ? (
        <section className="space-y-4" aria-label="Resultados da busca da home">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Resultados rápidos</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{searchResults.length}</span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {searchResults.length > 0 ? searchResults.map((item) => (
              <Link key={`${item.href}-${item.title}`} href={item.href}>
                <div className="group flex cursor-pointer items-center gap-3.5 rounded-2xl border border-border/60 bg-card/80 p-3.5 transition-all duration-200 hover:border-border hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Stethoscope className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[14px] font-medium text-foreground">{item.title}</h3>
                    <p className="truncate text-[12px] text-muted-foreground">{item.detail}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </Link>
            )) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-5 text-[13px] text-muted-foreground sm:col-span-2">
                Nenhum atalho direto. Use o <Link href="/filtro" className="font-medium text-primary underline-offset-2 hover:underline">Filtro Clínico</Link> para aproximar por idade e queixa.
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="space-y-4" aria-labelledby="fluxos-principais">
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Sua jornada</p>
                <h2 id="fluxos-principais" className="text-2xl font-semibold tracking-[-0.03em] text-foreground">O cuidado começa por aqui</h2>
              </div>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
              {clinicalFlows.map((flow, index) => <FlowCard key={flow.href} flow={flow} index={index} />)}
            </div>
          </section>

          <section className="grid gap-3.5 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-2xl border border-amber-200/50 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/15">
              <p className="text-[12.5px] leading-relaxed text-amber-900/90 dark:text-amber-100/90">
                <strong className="font-semibold">Uso responsável.</strong> As escalas orientam rastreio, documentação e monitorização — não substituem julgamento clínico, anamnese, exame neurológico e integração com família e escola.
              </p>
            </div>
            <FavoritesRecents />
          </section>
        </>
      )}
    </div>
  );
}
