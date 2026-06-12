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
  Search,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AssetShowcase, BrandMark, BrandWatermark, brandAssets } from "@/components/BrandAssets";
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
    title: "Avaliar criança / Aplicar escala",
    subtitle: "Abrir instrumento implementado e registrar resultado clínico.",
    action: "Aplicar escala",
    useCase: "Consulta em andamento",
    icon: ClipboardCheck,
    emphasis: "primary",
  },
  {
    href: "/filtro",
    title: "Encontrar escala ideal",
    subtitle: "Filtrar por idade, queixa, objetivo e contexto de aplicação.",
    action: "Usar filtro clínico",
    useCase: "Dúvida sobre melhor instrumento",
    icon: Filter,
    emphasis: "gold",
  },
  {
    href: "/pacientes",
    title: "Pacientes e prontuário",
    subtitle: "Organizar histórico, consulta, documentos e acompanhamento por paciente.",
    action: "Abrir pacientes",
    useCase: "Gestão clínica longitudinal",
    icon: Users,
    emphasis: "blue",
  },
  {
    href: "/pant",
    title: "Documentos médicos / PANT / Receita C1",
    subtitle: "Acessar matrizes documentais e área preparada para assinatura externa.",
    action: "Abrir documentos",
    useCase: "Laudo, relatório e prescrição",
    icon: FileText,
    emphasis: "teal",
  },
  {
    href: "/satisfacao-medicacao",
    title: "Evolução clínica / acompanhamento",
    subtitle: "Monitorar resposta terapêutica, satisfação medicamentosa e mudanças funcionais.",
    action: "Acompanhar evolução",
    useCase: "Retorno e seguimento",
    icon: LineChart,
    emphasis: "slate",
  },
];

const emphasisClasses: Record<ClinicalFlow["emphasis"], string> = {
  primary: "from-red-800 via-red-700 to-slate-950 text-amber-100 ring-amber-300/40",
  gold: "from-amber-500 via-yellow-600 to-red-800 text-white ring-amber-200/50",
  teal: "from-teal-700 via-cyan-800 to-slate-950 text-cyan-50 ring-cyan-200/40",
  blue: "from-blue-700 via-indigo-800 to-slate-950 text-blue-50 ring-blue-200/40",
  slate: "from-slate-700 via-slate-800 to-slate-950 text-slate-50 ring-slate-300/30",
};

const metricCards = [
  { label: "Escalas no catálogo", value: appMetrics.scaleCount, icon: ClipboardCheck },
  { label: "Itens filtráveis", value: appMetrics.filterableInstrumentCount, icon: Filter },
  { label: "Medicações", value: appMetrics.medicationCount, icon: Pill },
  { label: "Rotas/páginas", value: appMetrics.pageCount, icon: FileText },
];

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg ring-1 ${emphasisClasses[flow.emphasis]}`} style={{ boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)" }}>
              <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-[0.12em] font-bold">
                {flow.useCase}
              </Badge>
              <h2 className="text-lg font-black leading-snug text-foreground group-hover:text-primary transition-colors">
                {flow.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{flow.subtitle}</p>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold transition-all" style={{ background: "rgba(15, 148, 136, 0.08)", color: "var(--np-color-primary)" }}>
            <span>{flow.action}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
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
    <div className="page-enter proportion-safe-page space-y-6 pb-8">
      {/* Hero section — Premium visual com gradiente clínico */}
      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 p-5 shadow-md backdrop-blur sm:p-7" style={{
        background: "linear-gradient(135deg, rgba(15, 148, 136, 0.08) 0%, rgba(61, 20, 40, 0.06) 100%)",
        borderColor: "rgba(15, 148, 136, 0.2)",
      }}>
        <BrandWatermark className="right-4 top-4 h-40 w-40" />
        <div className="asset-proportion-box pointer-events-none absolute bottom-4 left-4 h-16 w-16 rounded-2xl opacity-[0.06] grayscale contrast-125 dark:opacity-[0.08]" aria-hidden="true">
          <img src={brandAssets.legacyNeuroPedSymbol} alt="" className="no-zoom-media h-full w-full rounded-2xl object-contain" />
        </div>
        <div className="relative grid gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
          <div className="space-y-5">
            <BrandMark size="md" showWordmark subtitle="Painel clínico NeuroPed" />
            <div className="max-w-2xl space-y-3">
              <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10 font-semibold">
                🏥 Plataforma Clínica Premium · Integrada
              </Badge>
              <h1
                className="text-4xl font-black tracking-tight sm:text-5xl leading-tight"
                style={{
                  fontFamily: "Cormorant Garamond, Georgia, serif",
                  color: "hsl(var(--foreground))",
                }}
                data-testid="text-page-title"
              >
                Painel de Decisão Clínica
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Navegue pelos 5 fluxos principais: aplicar escala de rastreio, encontrar instrumento ideal por queixa, gerenciar pacientes, gerar documentos clínicos ou acompanhar evolução terapêutica.
              </p>
            </div>
            <div className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Métricas reais do app">
              {metricCards.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="rounded-2xl border shadow-sm transition-all hover:shadow-md p-4"
                    style={{
                      borderColor: "rgba(15, 148, 136, 0.3)",
                      background: "linear-gradient(135deg, rgba(15, 148, 136, 0.05) 0%, rgba(61, 20, 40, 0.02) 100%)",
                    }}
                  >
                    <div className="flex items-center gap-2.5 text-primary">
                      <Icon className="h-5 w-5 text-teal-600" />
                      <span className="text-2xl font-black text-foreground">{metric.value}</span>
                    </div>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="relative max-w-xl" data-testid="search-container">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar escala, questionário, inventário, página..."
                className="h-11 rounded-2xl border-border/80 bg-background/70 pl-10 pr-10 text-sm"
                data-testid="input-search"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
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
              <Badge variant="outline" className="hidden sm:inline-flex">Painel 9.0</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {clinicalFlows.map((flow, index) => <FlowCard key={flow.href} flow={flow} index={index} />)}
            </div>
          </section>

          <AssetShowcase
            variant="clinical"
            title="Mascotes e figuras clínicas em uso"
            subtitle="As imagens oficiais do repositório aparecem com proporção preservada, sem zoom forçado nem cortes agressivos."
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
