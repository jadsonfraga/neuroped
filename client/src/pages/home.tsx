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
  Search,
  Sparkles,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/BrandAssets";
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
  short: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  emphasis: "primary" | "gold" | "teal" | "blue" | "slate";
}

const homeSearchCatalog = mergeFilterableCatalog(allScales);

const clinicalFlows: ClinicalFlow[] = [
  { href: "/mchat", short: "Avaliar", title: "Aplicar escala", subtitle: "Abrir instrumento e registrar resultado", icon: ClipboardCheck, emphasis: "primary" },
  { href: "/filtro", short: "Filtro", title: "Encontrar escala ideal", subtitle: "Por idade, queixa e contexto", icon: Filter, emphasis: "gold" },
  { href: "/pacientes", short: "Pacientes", title: "Pacientes e prontuário", subtitle: "Histórico e acompanhamento", icon: Users, emphasis: "blue" },
  { href: "/pant", short: "Documentos", title: "Documentos e receitas", subtitle: "Laudo, relatório e prescrição", icon: FileText, emphasis: "teal" },
  { href: "/satisfacao-medicacao", short: "Evolução", title: "Evolução clínica", subtitle: "Resposta e seguimento", icon: LineChart, emphasis: "slate" },
];

// Ícones vibrantes estilo iFood — círculo colorido em gradiente, ícone branco.
const tileGradient: Record<ClinicalFlow["emphasis"], string> = {
  primary: "from-rose-500 to-red-600",
  gold: "from-amber-400 to-orange-500",
  blue: "from-blue-500 to-indigo-600",
  teal: "from-teal-400 to-emerald-600",
  slate: "from-violet-500 to-purple-600",
};

const metricCards = [
  { label: "Escalas", value: appMetrics.scaleCount },
  { label: "Filtráveis", value: appMetrics.filterableInstrumentCount },
  { label: "Medicações", value: appMetrics.medicationCount },
  { label: "Páginas", value: appMetrics.pageCount },
];

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function CategoryTile({ flow, index }: { flow: ClinicalFlow; index: number }) {
  const Icon = flow.icon;
  return (
    <Link href={flow.href}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: duration.normal, ease: easing.smooth }}
        whileTap={{ scale: 0.94 }}
        onMouseEnter={() => softHover()}
        onClick={() => { softTap(); haptic.tap(); }}
        className="group flex cursor-pointer flex-col items-center gap-2.5"
        data-testid={`home-flow-${index + 1}`}
      >
        <div className={`flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-gradient-to-br ${tileGradient[flow.emphasis]} shadow-[0_8px_20px_-8px_rgba(0,0,0,0.35)] ring-1 ring-white/20 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_14px_28px_-10px_rgba(0,0,0,0.4)] sm:h-[72px] sm:w-[72px]`}>
          <Icon className="h-7 w-7 text-white drop-shadow-sm" strokeWidth={2} aria-hidden="true" />
        </div>
        <span className="text-center text-[12px] font-semibold leading-tight text-foreground">{flow.short}</span>
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
    <div className="page-enter proportion-safe-page space-y-5 pb-10">
      {/* Topo — marca + busca arredondada grandona (assinatura iFood) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <BrandMark size="sm" showWordmark subtitle="Painel clínico" />
          <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary sm:inline-flex">
            {appMetrics.scaleCount} escalas
          </span>
        </div>
        <div className="relative" data-testid="search-container">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar escala, queixa, paciente…"
            className="h-12 rounded-full border-transparent bg-muted/70 pl-11 pr-11 text-[15px] shadow-sm transition-all focus-visible:bg-background focus-visible:shadow-md"
            data-testid="input-search"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isSearching ? (
        <section className="space-y-3" aria-label="Resultados da busca da home">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-extrabold tracking-tight text-foreground">Resultados</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">{searchResults.length}</span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {searchResults.length > 0 ? searchResults.map((item) => (
              <Link key={`${item.href}-${item.title}`} href={item.href}>
                <div className="group flex cursor-pointer items-center gap-3.5 rounded-2xl border border-border/50 bg-card p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm">
                    <Stethoscope className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[14px] font-bold text-foreground">{item.title}</h3>
                    <p className="truncate text-[12px] text-muted-foreground">{item.detail}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            )) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-5 text-[13px] text-muted-foreground sm:col-span-2">
                Nenhum atalho direto. Use o <Link href="/filtro" className="font-bold text-primary underline-offset-2 hover:underline">Filtro Clínico</Link> para aproximar por idade e queixa.
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          {/* Atalhos clínicos — categorias coloridas (iFood) */}
          <section aria-labelledby="atalhos">
            <h2 id="atalhos" className="mb-3 text-[15px] font-extrabold tracking-tight text-foreground">Atalhos clínicos</h2>
            <div className="grid grid-cols-5 gap-2 sm:gap-4">
              {clinicalFlows.map((flow, index) => <CategoryTile key={flow.href} flow={flow} index={index} />)}
            </div>
          </section>

          {/* Banner promocional — vermelho vibrante, CTA + mascote (iFood) */}
          <Link href="/filtro">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.normal, ease: easing.smooth }}
              whileTap={{ scale: 0.99 }}
              onMouseEnter={() => softHover()}
              onClick={() => { softTap(); haptic.tap(); }}
              className="relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-red-600 to-red-700 p-6 text-white shadow-[0_16px_40px_-16px_rgba(220,38,38,0.6)] sm:p-7"
            >
              <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="max-w-md space-y-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm">
                    <Sparkles className="h-3.5 w-3.5" /> Recomendação ouro
                  </span>
                  <h3 className="text-[22px] font-extrabold leading-tight tracking-tight sm:text-[26px]">Não sabe qual escala usar?</h3>
                  <p className="text-[13.5px] leading-relaxed text-white/85">Filtre por idade e queixa e receba a escala ideal — ouro, prata e bronze.</p>
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-red-600 shadow-sm">
                    Abrir filtro clínico <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="hidden shrink-0 sm:block">
                  <Mascote contexto="home" size="md" />
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Métricas — pills vibrantes */}
          <section className="flex flex-wrap gap-2" aria-label="Métricas do app">
            {metricCards.map((metric) => (
              <span key={metric.label} className="inline-flex items-baseline gap-1.5 rounded-full border border-border/50 bg-card px-3.5 py-2 shadow-sm">
                <span className="text-[15px] font-extrabold tabular-nums text-foreground">{metric.value}</span>
                <span className="text-[11px] font-semibold text-muted-foreground">{metric.label}</span>
              </span>
            ))}
          </section>

          <FavoritesRecents />

          <div className="rounded-2xl border border-amber-200/50 bg-amber-50/60 p-4 dark:border-amber-900/30 dark:bg-amber-950/15">
            <p className="text-[12.5px] leading-relaxed text-amber-900/90 dark:text-amber-100/90">
              <strong className="font-bold">Uso responsável.</strong> As escalas orientam rastreio, documentação e monitorização — não substituem julgamento clínico, anamnese, exame neurológico e integração com família e escola.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
