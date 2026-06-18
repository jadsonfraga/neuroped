import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  ClipboardCheck,
  FileText,
  Filter,
  LineChart,
  Pill,
  Search,
  Sparkles,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { BrandMark, BrandWatermark } from "@/components/BrandAssets";
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
    href: "/pacientes",
    title: "Pacientes e prontuário",
    subtitle: "Histórico, consultas, documentos e acompanhamento por paciente.",
    action: "Abrir pacientes",
    useCase: "Gestão longitudinal",
    icon: Users,
    emphasis: "blue",
  },
  {
    href: "/pant",
    title: "Documentos e receitas",
    subtitle: "Matrizes documentais e área preparada para assinatura externa.",
    action: "Abrir documentos",
    useCase: "Laudo · relatório · receita",
    icon: FileText,
    emphasis: "teal",
  },
  {
    href: "/satisfacao-medicacao",
    title: "Evolução e acompanhamento",
    subtitle: "Resposta terapêutica, satisfação medicamentosa e mudanças funcionais.",
    action: "Acompanhar evolução",
    useCase: "Retorno e seguimento",
    icon: LineChart,
    emphasis: "slate",
  },
];

// Hierarquia premium: o fluxo principal ganha o acento da marca; os demais usam
// um tratamento NEUTRO sofisticado (vidro fosco + hairline). Coesão > arco-íris.
const accentClasses: Record<ClinicalFlow["emphasis"], string> = {
  primary: "bg-gradient-to-br from-primary to-rose-600 text-white ring-1 ring-white/20 shadow-[0_8px_18px_-8px_hsl(var(--primary)/0.55)]",
  gold: "bg-foreground/[0.05] text-foreground/75 ring-1 ring-border/60",
  teal: "bg-foreground/[0.05] text-foreground/75 ring-1 ring-border/60",
  blue: "bg-foreground/[0.05] text-foreground/75 ring-1 ring-border/60",
  slate: "bg-foreground/[0.05] text-foreground/75 ring-1 ring-border/60",
};

const metricCards = [
  { label: "Escalas", value: appMetrics.scaleCount, icon: ClipboardCheck },
  { label: "Filtráveis", value: appMetrics.filterableInstrumentCount, icon: Filter },
  { label: "Medicações", value: appMetrics.medicationCount, icon: Pill },
  { label: "Páginas", value: appMetrics.pageCount, icon: FileText },
];

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function FlowCard({ flow, index }: { flow: ClinicalFlow; index: number }) {
  const Icon = flow.icon;
  const featured = flow.emphasis === "primary";
  return (
    <Link href={flow.href} className={featured ? "sm:col-span-2 xl:col-span-2" : ""}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: duration.normal, ease: easing.smooth }}
        whileHover={{ y: -6 }}
        whileTap={{ scale: 0.985 }}
        onMouseEnter={() => softHover()}
        onClick={() => {
          softTap();
          haptic.tap();
        }}
        className={`group relative flex h-full cursor-pointer overflow-hidden rounded-3xl border p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-[transform,box-shadow,border-color] duration-300 before:pointer-events-none before:absolute before:inset-x-5 before:top-0 before:z-10 before:h-px before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent hover:shadow-[0_18px_40px_-16px_rgba(0,0,0,0.22)] ${featured ? "flex-col justify-between gap-6 border-primary/25 bg-gradient-to-br from-primary/[0.1] via-primary/[0.04] to-transparent hover:border-primary/40 sm:flex-row sm:items-center sm:gap-8 sm:p-7" : "flex-col gap-5 border-border/60 bg-card/80 hover:border-border"}`}
        data-testid={`home-flow-${index + 1}`}
      >
        {featured && (
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl transition-opacity duration-500 group-hover:opacity-80" />
        )}
        {featured ? (
          <>
            <div className="relative flex items-start gap-4 sm:flex-1">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${accentClasses.primary}`}>
                <Icon className="h-7 w-7" strokeWidth={1.9} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-primary/80">{flow.useCase}</p>
                <h2 className="mt-1 text-[22px] font-semibold leading-tight tracking-[-0.015em] text-foreground sm:text-[25px]">{flow.title}</h2>
                <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">{flow.subtitle}</p>
              </div>
            </div>
            <span className="relative inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-[0_10px_24px_-8px_hsl(var(--primary)/0.6)] transition-transform duration-300 group-hover:scale-[1.03] sm:self-auto">
              {flow.action}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentClasses[flow.emphasis]}`}>
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground/40 transition-all duration-300 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </div>
            <div className="flex flex-1 flex-col">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">{flow.useCase}</p>
              <h2 className="mt-1.5 text-[17px] font-semibold leading-tight tracking-[-0.01em] text-foreground">{flow.title}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{flow.subtitle}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground/70 transition-colors group-hover:text-primary">
                {flow.action}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </>
        )}
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
    <div className="page-enter proportion-safe-page space-y-7 pb-10">
      {/* Hero — calmo, confiante, com a busca como ação principal */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-b from-primary/[0.07] via-card/40 to-card/20 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur sm:p-9"
      >
        <BrandWatermark className="-right-6 -top-6 h-44 w-44 opacity-60" />
        {/* Glows decorativos — profundidade de luz sutil (premium) */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-12 h-60 w-60 rounded-full bg-chart-2/10 blur-3xl" />
        {/* Textura de pontos sutil, esmaecida — profundidade premium */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(hsl(var(--foreground)/0.05)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_72%)]" />
        <div className="relative grid gap-7 lg:grid-cols-[1.45fr_0.55fr] lg:items-center">
          <div className="space-y-6">
            <BrandMark size="md" showWordmark subtitle="Painel clínico NeuroPed" />
            <div className="max-w-2xl space-y-3.5">
              <h1
                className="text-[2.5rem] leading-[1.04] tracking-[-0.02em] text-foreground sm:text-[3.25rem]"
                style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontWeight: 600 }}
                data-testid="text-page-title"
              >
                Decisão clínica, <span className="text-primary">com clareza</span>.
              </h1>
              <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Aplique escalas validadas, encontre o instrumento ideal por queixa e idade, acompanhe a evolução e gere documentos — tudo em um fluxo só.
              </p>
            </div>

            <div className="relative max-w-xl" data-testid="search-container">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar escala, questionário, paciente ou página…"
                className="h-12 rounded-2xl border-border/70 bg-background/80 pl-11 pr-14 text-[15px] shadow-sm transition-shadow focus-visible:shadow-md"
                data-testid="input-search"
              />
              {!searchQuery && (
                <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 items-center rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
                  ⌘K
                </kbd>
              )}
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

            {/* Métricas — faixa fina com divisores, em vez de caixas pesadas */}
            <div
              className="flex max-w-xl divide-x divide-border/50 overflow-hidden rounded-2xl border border-border/50 bg-card/50"
              aria-label="Métricas do app"
            >
              {metricCards.map((metric) => (
                <div key={metric.label} className="flex-1 px-3.5 py-3 transition-colors hover:bg-foreground/[0.025] sm:px-4">
                  <div className="text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">{metric.value}</div>
                  <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Hero autoral animado — "neuro-cosmos": logo-cérebro flutuando com
              órbitas e starfield. Tema espacial, da marca, com movimento premium. */}
          <div className="relative hidden lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: duration.slow, ease: easing.smooth, delay: 0.1 }}
              className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_50%_38%,#3b2a72,#1a1140_55%,#0b0820)] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.6)] ring-1 ring-black/10"
            >
              {/* starfield */}
              <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),radial-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] [background-position:0_0,13px_19px] [background-size:34px_34px,26px_26px]" />
              <motion.div aria-hidden="true" className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:48px_48px]" animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
              {/* glow central */}
              <div aria-hidden="true" className="absolute left-1/2 top-[40%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40 blur-3xl" />
              {/* órbitas (ecoam as órbitas neurais da logo) */}
              <motion.div aria-hidden="true" className="absolute left-1/2 top-[40%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }}>
                <span className="absolute -top-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-amber-300 shadow-[0_0_12px_3px_rgba(252,211,77,0.7)]" />
              </motion.div>
              <motion.div aria-hidden="true" className="absolute left-1/2 top-[40%] h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" animate={{ rotate: -360 }} transition={{ duration: 34, repeat: Infinity, ease: "linear" }}>
                <span className="absolute top-1/2 -right-[4px] h-2 w-2 -translate-y-1/2 rounded-full bg-violet-300 shadow-[0_0_10px_2px_rgba(196,181,253,0.7)]" />
              </motion.div>
              {/* núcleo luminoso abstrato (sem logo) — "neuro core" flutuando */}
              <motion.div
                className="absolute left-1/2 top-[40%] h-24 w-24 -translate-x-1/2 -translate-y-1/2"
                animate={{ y: [0, -9, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_35%_30%,#fbcfe8,#f43f5e_42%,#7c3aed)] shadow-[0_0_55px_14px_rgba(168,85,247,0.55)]" />
                <div className="absolute inset-0 rounded-full ring-1 ring-white/30" />
                <div aria-hidden="true" className="absolute left-[28%] top-[24%] h-5 w-5 rounded-full bg-white/40 blur-[3px]" />
              </motion.div>
              {/* badge de vidro flutuante */}
              <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 shadow-lg backdrop-blur-xl">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-rose-600 text-white shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold leading-tight text-white">{appMetrics.scaleCount} escalas validadas</p>
                  <p className="truncate text-[11px] text-white/70">Rastreio · diagnóstico · evolução</p>
                </div>
              </div>
            </motion.div>
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
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Fluxos principais</p>
                <h2 id="fluxos-principais" className="text-xl font-semibold tracking-tight text-foreground">Por onde começar</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
