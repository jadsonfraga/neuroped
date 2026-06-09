import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  Filter,
  LineChart,
  Pill,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AssetShowcase, BrandWatermark, SafeAssetImage, brandAssets } from "@/components/BrandAssets";
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
    title: "Aplicar Escala Clínica",
    subtitle: "Selecionar instrumento validado e registrar resultado da avaliação.",
    action: "Aplicar escala",
    useCase: "Consulta em andamento",
    icon: ClipboardCheck,
    emphasis: "primary",
  },
  {
    href: "/filtro",
    title: "Encontrar Instrumento Ideal",
    subtitle: "Filtro inteligente por idade, sintomatologia, objetivo clínico e contexto.",
    action: "Usar filtro clínico",
    useCase: "Dúvida sobre melhor instrumento",
    icon: Filter,
    emphasis: "gold",
  },
  {
    href: "/pacientes",
    title: "Gestão de Pacientes e Prontuário",
    subtitle: "Histórico clínico, documentos, avaliações anteriores e acompanhamento longitudinal.",
    action: "Abrir prontuário",
    useCase: "Gestão clínica longitudinal",
    icon: Users,
    emphasis: "blue",
  },
  {
    href: "/pant",
    title: "Documentos Médicos e Prescrições",
    subtitle: "Gerar laudo, relatório, receita e documentação com preparo para assinatura digital.",
    action: "Abrir documentos",
    useCase: "Laudo, relatório e prescrição",
    icon: FileText,
    emphasis: "teal",
  },
  {
    href: "/satisfacao-medicacao",
    title: "Monitoramento de Evolução Clínica",
    subtitle: "Acompanhar resposta terapêutica, tolerabilidade, adesão e mudanças funcionais.",
    action: "Acompanhar evolução",
    useCase: "Retorno e seguimento",
    icon: LineChart,
    emphasis: "slate",
  },
];

const emphasisClasses: Record<ClinicalFlow["emphasis"], string> = {
  primary: "from-slate-800 via-slate-700 to-slate-950 text-white ring-slate-400/30 shadow-lg",
  gold: "from-amber-600 via-amber-500 to-slate-900 text-white ring-amber-300/40 shadow-lg",
  teal: "from-teal-600 via-teal-700 to-slate-900 text-white ring-teal-300/40 shadow-lg",
  blue: "from-blue-600 via-blue-700 to-slate-900 text-white ring-blue-300/40 shadow-lg",
  slate: "from-slate-600 via-slate-700 to-slate-900 text-white ring-slate-300/40 shadow-lg",
};

const metricCards = [
  { label: "Escalas no catálogo", value: appMetrics.scaleCount, icon: ClipboardCheck },
  { label: "Itens filtráveis", value: appMetrics.filterableInstrumentCount, icon: Filter },
  { label: "Medicações", value: appMetrics.medicationCount, icon: Pill },
  { label: "Rotas/páginas", value: appMetrics.pageCount, icon: FileText },
];

const openingSkeletonRows = [96, 82, 68] as const;

const orbitAssets = [
  {
    id: "brain",
    src: brandAssets.illustrations.heroBrain,
    label: "Cérebro infantil",
    position: "left-4 top-6",
    delay: 0.1,
  },
  {
    id: "assessment",
    src: brandAssets.illustrations.childAssessment,
    label: "Avaliação infantil",
    position: "right-8 top-10",
    delay: 0.22,
  },
  {
    id: "team",
    src: brandAssets.illustrations.teamMultiprofessional,
    label: "Equipe multiprofissional",
    position: "left-10 bottom-8",
    delay: 0.34,
  },
] as const;

const heroMascotTiles = [
  {
    id: "consultorio-superman",
    src: brandAssets.mascots.consultorioSuperman,
    label: "Mascote consultório",
    className: "left-3 top-28 h-20 w-20 rotate-[-5deg]",
    delay: 0.18,
  },
  {
    id: "dr-arte",
    src: brandAssets.mascots.celebrationArt,
    label: "Mascote celebração",
    className: "right-4 top-32 h-20 w-20 rotate-[5deg]",
    delay: 0.32,
  },
] as const;

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function AstronautExplorer() {
  return (
    <motion.figure
      initial={{ opacity: 0, x: 18, rotate: 5 }}
      animate={{ opacity: 1, x: 0, y: [0, -7, 0], rotate: [2, -2, 2] }}
      transition={{ delay: 0.2, duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-5 right-4 w-44 rounded-[1.5rem] border border-amber-200/25 bg-slate-950/65 px-3 py-2 text-left shadow-xl backdrop-blur"
      aria-label="Menino astronauta explorando o NeuroPed"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0" aria-hidden="true">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-slate-100 to-amber-100 shadow-lg ring-2 ring-amber-200/60" />
          <div className="absolute left-2.5 top-3 h-8 w-9 rounded-full bg-gradient-to-br from-sky-200 via-slate-800 to-slate-950 ring-2 ring-white/70" />
          <div className="absolute left-4 top-5 h-1.5 w-1.5 rounded-full bg-white/80" />
          <div className="absolute -bottom-2 left-3.5 h-7 w-7 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-amber-100 shadow-md ring-2 ring-amber-200/50" />
          <div className="absolute -bottom-1 left-1 h-4 w-3 rounded-full bg-white shadow-sm" />
          <div className="absolute -bottom-1 right-1 h-4 w-3 rounded-full bg-white shadow-sm" />
          <Rocket className="absolute -right-2 -top-1 h-5 w-5 rotate-12 text-amber-300 drop-shadow" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">Guia Interativo</p>
          <p className="text-[11px] leading-snug text-amber-50/80">Assistente para navegação clínica</p>
        </div>
      </div>
    </motion.figure>
  );
}

function HomeOpeningVisual({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (value: string) => void }) {
  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-amber-200/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 p-4 text-white shadow-2xl shadow-slate-950/40 sm:p-6 lg:p-7">
      <BrandWatermark className="right-0 top-0 h-56 w-56 opacity-[0.08] dark:opacity-[0.1]" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-28 right-8 h-64 w-64 rounded-full bg-teal-300/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" aria-hidden="true" />

      <div className="relative grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border border-amber-200/20 bg-amber-300/15 text-amber-100 hover:bg-amber-300/15">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Experiência Premium
            </Badge>
            <Badge className="rounded-full border border-emerald-200/20 bg-emerald-300/10 text-emerald-50 hover:bg-emerald-300/10">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Sistema Clínico Profissional
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.88, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: duration.normal, ease: easing.smooth }}
              className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32"
            >
              <div className="absolute inset-0 rounded-[2rem] bg-amber-300/35 blur-xl" aria-hidden="true" />
              <SafeAssetImage
                src={brandAssets.masterShield}
                alt="Logo Dr. Jadson Fraga"
                className="no-zoom-media relative h-full w-full rounded-[1.65rem] bg-white object-contain p-1.5 shadow-2xl ring-2 ring-amber-200/70"
                fallbackClassName="h-full w-full"
              />
              <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-300 text-red-950 shadow-lg ring-2 ring-white/60" aria-hidden="true">
                <Star className="h-4 w-4 fill-current" />
              </span>
            </motion.div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-100/85">Dr. Jadson Fraga</p>
              <h1 className="text-3xl font-black leading-none tracking-tight sm:text-5xl" data-testid="text-page-title">
                NeuroPed
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-amber-50/85">
                Sistema de apoio neuropediátrico com interface inteligente: filtro clínico adaptativo, escalas validadas, documentação integrada e painel executivo para decisão clínica em tempo real.
              </p>
            </div>
          </div>

          <div className="grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Métricas reais do app">
            {metricCards.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/8 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-amber-100">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xl font-black text-white">{metric.value}</span>
                  </div>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-50/70">{metric.label}</p>
                </div>
              );
            })}
          </div>

          <div className="relative max-w-xl" data-testid="search-container">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-100/70" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar escala, questionário, inventário, página..."
              className="h-12 rounded-2xl border-white/15 bg-white/10 pl-10 pr-10 text-sm text-white placeholder:text-amber-50/55 focus-visible:ring-amber-200/60"
              data-testid="input-search"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-100/70 hover:text-white"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="relative min-h-[380px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/8 p-4 shadow-2xl backdrop-blur-md sm:min-h-[420px]">
          <div className="absolute inset-4 rounded-[1.6rem] border border-dashed border-amber-200/20" aria-hidden="true" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/15"
            aria-hidden="true"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
            className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-200/10"
            aria-hidden="true"
          />

          {orbitAssets.map((asset) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: [0, -7, 0], scale: 1 }}
              transition={{ delay: asset.delay, duration: 3.8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
              className={`asset-proportion-box absolute ${asset.position} hidden h-16 w-16 rounded-3xl border border-white/10 bg-white/90 p-2 shadow-lg sm:flex`}
            >
              <SafeAssetImage src={asset.src} alt={asset.label} className="no-zoom-media h-full w-full object-contain" />
            </motion.div>
          ))}

          {heroMascotTiles.map((asset) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, y: [0, -5, 0], scale: 1 }}
              transition={{ delay: asset.delay, duration: 4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
              className={`mascot-proportion-box absolute z-10 hidden rounded-[1.35rem] border border-amber-200/25 bg-white/95 p-1.5 shadow-xl sm:flex ${asset.className}`}
            >
              <SafeAssetImage src={asset.src} alt={asset.label} className="no-zoom-media h-full w-full rounded-[1rem] object-contain" />
            </motion.div>
          ))}

          <div className="relative z-10 flex h-full min-h-[350px] flex-col items-center justify-center gap-5 text-center">
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: duration.slow, ease: easing.smooth }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-amber-200/25 blur-2xl" aria-hidden="true" />
              <div className="mascot-proportion-box relative h-52 w-52 rounded-[2.25rem] border border-amber-200/30 bg-white/95 p-3 shadow-2xl sm:h-60 sm:w-60">
                <SafeAssetImage
                  src={brandAssets.mascots.superDoctor}
                  alt="Mascote Dr. Jadson SuperNeuroPed"
                  className="no-zoom-media h-full w-full object-contain"
                  fallbackClassName="h-full w-full"
                />
              </div>
            </motion.div>

            <AstronautExplorer />

            <div className="w-full max-w-xs rounded-3xl border border-white/10 bg-slate-950/45 p-3 text-left shadow-inner backdrop-blur">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">
                  <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
                  Carregando módulos clínicos
                </div>
                <span className="rounded-full bg-emerald-300/15 px-2 py-0.5 text-[10px] font-bold text-emerald-100">Pronto</span>
              </div>
              <div className="space-y-2" aria-hidden="true">
                {openingSkeletonRows.map((width, index) => (
                  <div key={width} className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ delay: 0.25 + index * 0.08, duration: 0.55, ease: easing.smooth }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-200 via-yellow-400 to-teal-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowCard({ flow, index }: { flow: ClinicalFlow; index: number }) {
  const Icon = flow.icon;
  return (
    <Link href={flow.href}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: duration.normal, ease: easing.smooth }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.985 }}
        onMouseEnter={() => softHover()}
        onClick={() => {
          softTap();
          haptic.tap();
        }}
        className="group h-full cursor-pointer rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm backdrop-blur transition-all hover:border-primary/40 hover:shadow-lg"
        data-testid={`home-flow-${index + 1}`}
      >
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md ring-1 ${emphasisClasses[flow.emphasis]}`}>
              <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-[0.12em]">
                {flow.useCase}
              </Badge>
              <h2 className="text-base font-black leading-tight text-foreground group-hover:text-primary">
                {flow.title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{flow.subtitle}</p>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2 text-xs font-bold text-primary">
            <span>{flow.action}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </div>
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
    <div className="page-enter proportion-safe-page flex flex-col min-h-[calc(100vh-3.5rem)] md:min-h-screen pb-8 space-y-6">
      <div className="flex items-center justify-center flex-1 pt-0 md:pt-0">
        <div className="w-full max-w-[1200px] px-3 sm:px-4 md:px-5">
          <HomeOpeningVisual searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 p-5 shadow-sm backdrop-blur sm:p-7">
        <BrandWatermark className="right-4 top-4 h-40 w-40" />
        <div className="asset-proportion-box pointer-events-none absolute bottom-4 left-4 h-16 w-16 rounded-2xl opacity-[0.06] grayscale contrast-125 dark:opacity-[0.08]" aria-hidden="true">
          <img src={brandAssets.legacyNeuroPedSymbol} alt="" className="no-zoom-media h-full w-full rounded-2xl object-contain" />
        </div>
        <div className="relative grid gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
          <div className="space-y-4">
            <div className="max-w-2xl space-y-2">
              <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">Fluxo Clínico Estruturado · Dados em Tempo Real</Badge>
              <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Painel de Decisão Clínica
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Acesso estruturado aos fluxos principais: aplicação de escalas, recomendação de instrumentos, gestão de pacientes, documentação médica e acompanhamento longitudinal. Dados atualizados em tempo real.
              </p>
            </div>
          </div>
          <div className="hidden justify-center lg:flex">
            <Mascote contexto="home" size="md" />
          </div>
        </div>
      </section>

      {isSearching ? (
        <section className="space-y-3" aria-label="Resultados da busca da home">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-foreground">Resultados rápidos</h2>
            <Badge variant="secondary">{searchResults.length}</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {searchResults.length > 0 ? searchResults.map((item) => (
              <Link key={`${item.href}-${item.title}`} href={item.href}>
                <Card className="cursor-pointer border-border/70 bg-card/90 transition hover:border-primary/40 hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-foreground">{item.title}</h3>
                      <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </CardContent>
                </Card>
              </Link>
            )) : (
              <Card className="border-dashed">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  Nenhum atalho direto encontrado. Use o Filtro Clínico Inteligente para aproximação por idade e queixa.
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="space-y-3" aria-labelledby="fluxos-principais">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">5 fluxos principais</p>
                <h2 id="fluxos-principais" className="text-xl font-black text-foreground">Escolha o próximo passo clínico</h2>
              </div>
              <Badge variant="outline" className="hidden sm:inline-flex">Cockpit 9.0</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {clinicalFlows.map((flow, index) => <FlowCard key={flow.href} flow={flow} index={index} />)}
            </div>
          </section>

          <AssetShowcase
            variant="clinical"
            title="Mascotes e figuras clínicas em uso"
            subtitle="Imagens oficiais do repositório integradas à experiência da Home com proporção estável, leitura limpa e função estética clara."
            max={6}
          />

          <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
            <Card className="border-amber-200/60 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-100">
                  <strong>Uso responsável:</strong> escalas orientam rastreio, documentação e monitorização. Elas não substituem julgamento clínico, anamnese, exame neurológico e integração com família/escola.
                </p>
              </CardContent>
            </Card>
            <FavoritesRecents />
          </section>
        </>
      )}
    </div>
  );
}
