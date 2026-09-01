import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  Brain,
  CalendarClock,
  Clock3,
  FileText,
  Filter,
  HeartPulse,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Mascote } from "@/components/Mascote";
import { FavoritesRecents } from "@/components/FavoritesRecents";
import { appMetrics } from "@/data/appMetrics";
import { navigablePages } from "@/data/navigation";
import type { ScaleEntry } from "@/data/scaleFilter";
import { haptic } from "@/lib/haptic";
import { openCommandPalette } from "@/lib/commandPaletteBus";
import { easing, duration } from "@/lib/motion";
import { softHover, softTap } from "@/lib/softSounds";

interface HomeAction {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: "primary" | "teal" | "gold" | "slate";
}

const todayActions: HomeAction[] = [
  {
    href: "/agenda",
    label: "Abrir a Agenda",
    description: "Hoje, fila e próximos atendimentos",
    icon: CalendarClock,
    tone: "primary",
  },
  {
    href: "/pacientes",
    label: "Encontrar paciente",
    description: "Prontuário, histórico e contexto",
    icon: UsersRound,
    tone: "teal",
  },
  {
    href: "/filtro",
    label: "Escolher uma escala",
    description: "Por idade, queixa e objetivo",
    icon: Filter,
    tone: "gold",
  },
  {
    href: "/documentos",
    label: "Produzir documento",
    description: "Laudo, receita, plano ou assinatura",
    icon: FileText,
    tone: "slate",
  },
];

const journeyActions: HomeAction[] = [
  {
    href: "/assistente-clinico",
    label: "Avaliar",
    description: "Monte uma bateria com apoio de contexto",
    icon: Sparkles,
    tone: "gold",
  },
  {
    href: "/laudo-neuroped",
    label: "Documentar",
    description: "Feche o atendimento com clareza",
    icon: ShieldCheck,
    tone: "primary",
  },
  {
    href: "/neuroacompanhamento",
    label: "Acompanhar",
    description: "Veja evolução, diários e indicadores",
    icon: Activity,
    tone: "teal",
  },
  {
    href: "/portal-familia",
    label: "Conectar família",
    description: "Portais, orientação e comunicação",
    icon: HeartPulse,
    tone: "slate",
  },
];

const toneClasses: Record<HomeAction["tone"], string> = {
  primary: "bg-primary/10 text-primary ring-primary/15",
  teal: "bg-teal-500/10 text-teal-700 ring-teal-500/15 dark:text-teal-300",
  gold: "bg-amber-500/10 text-amber-700 ring-amber-500/15 dark:text-amber-300",
  slate: "bg-slate-500/10 text-slate-700 ring-slate-500/15 dark:text-slate-300",
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function activate() {
  softTap();
  haptic.tap();
}

function ActionCard({ action, index }: { action: HomeAction; index: number }) {
  const Icon = action.icon;
  return (
    <Link
      href={action.href}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.045,
          duration: duration.fast,
          ease: easing.smooth,
        }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.985 }}
        onMouseEnter={() => softHover()}
        onClick={activate}
        className="group flex min-h-[88px] cursor-pointer items-center gap-3 rounded-2xl border border-border/65 bg-card/80 p-3 sm:min-h-[104px] sm:gap-3.5 sm:p-4 shadow-[0_12px_34px_-28px_hsl(var(--foreground)/0.5)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-primary/25 hover:bg-card hover:shadow-[0_20px_42px_-28px_hsl(var(--primary)/0.32)]"
        data-testid={`home-action-${action.href.slice(1)}`}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 sm:h-11 sm:w-11 transition-transform duration-200 group-hover:scale-105 ${toneClasses[action.tone]}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.85} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
            {action.label}
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {action.description}
          </p>
        </div>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-muted-foreground/45 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      </motion.div>
    </Link>
  );
}

function JourneyCard({ action, index }: { action: HomeAction; index: number }) {
  const Icon = action.icon;
  return (
    <Link
      href={action.href}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.12 + index * 0.045,
          duration: duration.fast,
          ease: easing.smooth,
        }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.985 }}
        onMouseEnter={() => softHover()}
        onClick={activate}
        className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/55 bg-card/55 px-3.5 py-3 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-card/90"
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${toneClasses[action.tone]}`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-foreground">
            {action.label}
          </p>
          <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
            {action.description}
          </p>
        </div>
        <ArrowRight
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      </motion.div>
    </Link>
  );
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [scaleSearchCatalog, setScaleSearchCatalog] = useState<ScaleEntry[]>(
    [],
  );
  const q = normalize(searchQuery.trim());
  const isSearching = q.length >= 2;

  useEffect(() => {
    if (!isSearching || scaleSearchCatalog.length > 0) return;
    let cancelled = false;
    void Promise.all([
      import("@/data/filterableCatalog"),
      import("@/data/scaleFilter"),
    ])
      .then(([{ mergeFilterableCatalog }, { allScales }]) => {
        if (!cancelled)
          setScaleSearchCatalog(mergeFilterableCatalog(allScales));
      })
      .catch(() => {
        if (!cancelled) setScaleSearchCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isSearching, scaleSearchCatalog.length]);

  const searchResults = useMemo(() => {
    if (q.length < 2) return [];
    const pages = navigablePages
      .filter((page) =>
        normalize(
          `${page.label} ${page.href} ${page.description ?? ""}`,
        ).includes(q),
      )
      .map((page) => ({
        href: page.href,
        title: page.label,
        detail: page.description ?? "Página do app",
      }));
    const scales = scaleSearchCatalog
      .filter((scale) =>
        normalize(
          `${scale.name} ${scale.fullName} ${scale.description} ${scale.queixas.join(" ")}`,
        ).includes(q),
      )
      .slice(0, 8)
      .map((scale) => ({
        href: scale.appRoute || "/filtro",
        title: scale.name,
        detail: scale.fullName,
      }));
    return [...pages, ...scales].slice(0, 12);
  }, [q, scaleSearchCatalog]);

  return (
    <div className="page-enter proportion-safe-page space-y-8 pb-12">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.14),transparent_36%),linear-gradient(135deg,hsl(var(--card)/0.98),hsl(var(--secondary)/0.44))] p-6 shadow-[0_30px_90px_-54px_hsl(var(--foreground)/0.46)] dark:border-white/10 sm:p-9"
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex items-start justify-between gap-6">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary backdrop-blur">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-40 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
              </span>
              Cockpit clínico
            </div>
            <div>
              <h1
                className="max-w-2xl text-3xl font-semibold leading-[0.98] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl"
                style={{ fontFamily: "var(--font-display)" }}
                data-testid="text-page-title"
              >
                O próximo passo do seu atendimento,{" "}
                <span className="np-title-gradient">sem ruído.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Comece pelo que precisa fazer agora. O restante do NeuroPed
                continua a um clique, organizado por jornada e protegido por
                contexto.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10.5px] text-muted-foreground">
              <span className="rounded-full border border-border/65 bg-card/65 px-3 py-1.5">
                {appMetrics.pageCount}+ páginas
              </span>
              <span className="rounded-full border border-border/65 bg-card/65 px-3 py-1.5">
                {appMetrics.scaleCount}+ instrumentos
              </span>
              <span className="rounded-full border border-border/65 bg-card/65 px-3 py-1.5">
                Fluxos com acesso seguro
              </span>
            </div>
          </div>
          <div className="hidden shrink-0 items-center justify-center pt-2 lg:flex">
            <Mascote contexto="home" size="md" className="relative z-10" />
          </div>
        </div>

        <div
          className="relative mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center"
          data-testid="search-container"
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-primary"
              aria-hidden="true"
            />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && searchResults[0]) {
                  event.preventDefault();
                  activate();
                  window.location.hash = searchResults[0].href;
                }
              }}
              placeholder="Buscar escala, paciente, documento ou módulo…"
              aria-label="Buscar escala, paciente, documento ou módulo"
              aria-keyshortcuts="Enter"
              className="h-14 rounded-2xl border-white/80 bg-card/85 pl-11 pr-10 text-sm shadow-[0_14px_35px_-22px_hsl(var(--foreground)/0.42)] backdrop-blur-xl transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-primary/30 focus-visible:shadow-[0_18px_42px_-22px_hsl(var(--primary)/0.4)] dark:border-white/10"
              data-testid="input-search"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              activate();
              openCommandPalette();
            }}
            onMouseEnter={() => softHover()}
            className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card/75 px-4 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/25 hover:text-primary"
            aria-label="Abrir busca avançada"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Busca avançada</span>
            <kbd
              aria-hidden="true"
              className="hidden rounded border border-border/70 bg-background/60 px-1.5 py-0.5 font-mono text-[9px] sm:inline-flex"
            >
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="relative mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>Sem cadastro?</span>
          <Link
            href="/filtro-escalas?mode=flash"
            onClick={activate}
            onMouseEnter={() => softHover()}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary/20 bg-card/70 px-3 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/35 hover:text-primary"
          >
            <Clock3 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Triagem rápida
          </Link>
          <span className="text-muted-foreground/80">
            modo efêmero, nada fica salvo
          </span>
        </div>
      </motion.section>

      {isSearching ? (
        <section className="space-y-4" aria-label="Resultados da busca da home">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Encontrabilidade
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                Resultados para “{searchQuery.trim()}”
              </h2>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {searchResults.length}
            </span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {searchResults.length > 0 ? (
              searchResults.map((item) => (
                <Link
                  key={`${item.href}-${item.title}`}
                  href={item.href}
                  onClick={activate}
                >
                  <div className="group flex cursor-pointer items-center gap-3.5 rounded-2xl border border-border/60 bg-card/80 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_12px_30px_-18px_hsl(var(--primary)/0.3)]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Stethoscope
                        className="h-[18px] w-[18px]"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[13px] font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground sm:col-span-2">
                Nada apareceu ainda. Tente termos como{" "}
                <strong className="font-semibold text-foreground">
                  agenda
                </strong>
                ,{" "}
                <strong className="font-semibold text-foreground">laudo</strong>
                , <strong className="font-semibold text-foreground">TEA</strong>{" "}
                ou abra o{" "}
                <Link
                  href="/explorar"
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                >
                  catálogo completo
                </Link>
                .
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="space-y-4" aria-labelledby="acoes-de-hoje">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  Comece aqui
                </p>
                <h2
                  id="acoes-de-hoje"
                  className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground"
                >
                  O que você precisa fazer?
                </h2>
              </div>
              <Link
                href="/explorar"
                onClick={activate}
                onMouseEnter={() => softHover()}
                className="hidden items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:inline-flex"
              >
                Ver todos os recursos{" "}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {todayActions.map((action, index) => (
                <ActionCard key={action.href} action={action} index={index} />
              ))}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
            <div className="rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Jornadas
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                    Tudo segue uma sequência clara
                  </h2>
                </div>
                <Brain className="h-5 w-5 text-primary/65" aria-hidden="true" />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {journeyActions.map((action, index) => (
                  <JourneyCard
                    key={action.href}
                    action={action}
                    index={index}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                    Clareza e segurança
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                    Acesso certo, no momento certo.
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    O NeuroPed mantém ferramentas avançadas visíveis sem
                    misturar contextos. Áreas clínicas pedem autenticação, PIN
                    ou perfil autorizado; portais familiares permanecem simples
                    e públicos.
                  </p>
                  <Link
                    href="/explorar"
                    onClick={activate}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/75"
                  >
                    Explorar o ecossistema{" "}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section
            className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]"
            aria-label="Atalhos pessoais e uso responsável"
          >
            <FavoritesRecents />
            <div className="rounded-2xl border border-amber-200/55 bg-amber-50/55 p-4 dark:border-amber-900/35 dark:bg-amber-950/15">
              <p className="text-xs leading-relaxed text-amber-950/80 dark:text-amber-100/85">
                <strong className="font-semibold">Uso responsável.</strong> As
                ferramentas orientam rastreio, documentação e monitorização. Não
                substituem anamnese, exame, julgamento clínico ou a conversa com
                a família.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
