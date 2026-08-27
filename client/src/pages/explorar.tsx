import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  FileText,
  Grid2X2,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { featuredNavigation, navSections } from "@/data/navigation";
import { currentHashPath, isPublicRoute } from "@/lib/publicRoutes";
import { useAuth } from "@/contexts/AuthContext";
import { canRenderNavigationItem } from "@/security/routeGuardPolicy";
import { hasConfiguredMasterPin, isMasterPinUnlocked } from "@/lib/masterPin";
import { easing, duration } from "@/lib/motion";
import { haptic } from "@/lib/haptic";
import { softHover, softTap } from "@/lib/softSounds";
import type { NavItem, NavSection } from "@/data/navigation";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function slugify(text: string): string {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function itemMatchesQuery(item: NavItem, query: string): boolean {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;
  return normalize(
    `${item.label} ${item.href} ${item.description ?? ""}`,
  ).includes(normalizedQuery);
}

const sectionDescriptions: Record<string, string> = {
  "TRABALHO DE HOJE":
    "Agenda, pacientes, fila e contexto para conduzir o atendimento sem perder o fio.",
  AVALIAR:
    "Encontre o instrumento certo e conduza triagens, baterias e testes com clareza.",
  DOCUMENTAR:
    "Transforme o raciocínio clínico em laudos, receitas, planos, fichas e documentos.",
  ACOMPANHAR:
    "Monitore tratamento, sintomas, diários e evolução ao longo do tempo.",
  REFERÊNCIA:
    "Biblioteca de consulta rápida para apoiar decisões, orientações e desenvolvimento.",
  CONECTAR: "Família, secretaria, experiências públicas e integração.",
  "AJUDA E CONTA":
    "Ajuda, acessibilidade, conformidade e informações do produto.",
};

const sectionIcons: Record<string, typeof Grid2X2> = {
  "TRABALHO DE HOJE": Stethoscope,
  AVALIAR: Sparkles,
  DOCUMENTAR: FileText,
  ACOMPANHAR: Calendar,
  REFERÊNCIA: BookOpen,
  CONECTAR: Grid2X2,
  "AJUDA E CONTA": ShieldCheck,
};

function uniqueItems(items: NavItem[]): NavItem[] {
  return Array.from(new Map(items.map((item) => [item.href, item])).values());
}

function CatalogCard({
  item,
  index,
  locked,
}: {
  item: NavItem;
  index: number;
  locked: boolean;
}) {
  const Icon = item.icon;
  const target = item.href;
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.018, 0.24),
        duration: duration.fast,
        ease: easing.smooth,
      }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      onMouseEnter={() => softHover()}
      onClick={() => {
        softTap();
        haptic.select();
      }}
      className={`group relative flex min-h-[92px] cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border p-3.5 transition-[border-color,box-shadow,background-color] duration-200 ${
        locked
          ? "border-border/70 bg-muted/25 hover:border-primary/20 hover:bg-muted/40"
          : "border-white/75 bg-card/85 shadow-[0_14px_38px_-30px_hsl(var(--foreground)/0.46)] hover:border-primary/25 hover:shadow-[0_22px_48px_-28px_hsl(var(--primary)/0.3)] dark:border-white/10"
      }`}
      data-testid={`explore-item-${item.href.replace(/[^a-z0-9]+/gi, "-")}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
          locked
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary"
        }`}
      >
        <Icon
          className="h-[18px] w-[18px]"
          strokeWidth={1.9}
          aria-hidden="true"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[13px] font-semibold text-foreground">
            {item.label}
          </h3>
          {locked && (
            <Badge
              variant="outline"
              className="shrink-0 gap-1 px-1.5 py-0 text-[9px] font-semibold"
            >
              <LockKeyhole className="h-2.5 w-2.5" aria-hidden="true" />
              Seguro
            </Badge>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
          {item.description ??
            (locked
              ? "Disponível após autenticação ou desbloqueio clínico."
              : "Abrir recurso no NeuroPed.")}
        </p>
      </div>
      {locked ? (
        <LockKeyhole
          className="h-4 w-4 shrink-0 text-muted-foreground/55"
          aria-hidden="true"
        />
      ) : (
        <ArrowRight
          className="h-4 w-4 shrink-0 text-muted-foreground/45 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      )}
    </motion.div>
  );

  return item.href === "/nesplora/" ? (
    <a
      href={target}
      aria-label={`Abrir ${item.label}`}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
    >
      {content}
    </a>
  ) : (
    <Link
      href={target}
      aria-label={`Abrir ${item.label}`}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}

function CatalogSection({
  section,
  query,
  canOpen,
  offset,
  expanded,
  onToggle,
}: {
  section: NavSection;
  query: string;
  canOpen: (path: string) => boolean;
  offset: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const items = uniqueItems(section.items).filter((item) =>
    itemMatchesQuery(item, query),
  );
  if (items.length === 0) return null;
  const Icon = sectionIcons[section.title] ?? Grid2X2;
  const sectionId = `explore-${slugify(section.title || "principal")}`;
  const isOpen = expanded || query.trim().length > 0;

  return (
    <section
      className="group rounded-2xl border border-border/60 bg-card/45 p-3.5 sm:p-4"
      data-testid={`explore-section-${slugify(section.title || "principal")}`}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-xl px-1 py-1 text-left transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${sectionId}-items`}
      >
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id={sectionId}
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {section.title || "Início"}
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {sectionDescriptions[section.title] ??
              "Acesso rápido ao ecossistema NeuroPed."}
          </p>
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
          {items.length}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div
          id={`${sectionId}-items`}
          className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {items.map((item, index) => (
            <CatalogCard
              key={`${section.title}-${item.href}`}
              item={item}
              index={offset + index}
              locked={!isPublicRoute(item.href) && !canOpen(item.href)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function ExplorarPage() {
  const [query, setQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    DESTAQUES: true,
    "TRABALHO DE HOJE": true,
  });
  const { accessMode, isAuthenticated, isLoading, user } = useAuth();
  const currentPath = currentHashPath();
  const canOpen = (path: string) =>
    canRenderNavigationItem({
      path,
      accessMode,
      isAuthenticated,
      isLoading,
      userRole: user?.role,
      localPinConfigured: accessMode === "local" && hasConfiguredMasterPin(),
      localPinUnlocked: accessMode === "local" && isMasterPinUnlocked(),
    });
  const sections = useMemo<NavSection[]>(() => {
    const highlights: NavSection = {
      title: "DESTAQUES",
      items: featuredNavigation.filter((item) => item.href !== "/nesplora/"),
    };
    return [
      highlights,
      ...navSections.filter((section) => section.title.trim().length > 0),
    ];
  }, []);
  const destinations = useMemo(
    () => uniqueItems(sections.flatMap((section) => section.items)),
    [sections],
  );
  const destinationCount = destinations.length;
  const publicCount = useMemo(
    () => destinations.filter((item) => isPublicRoute(item.href)).length,
    [destinations],
  );
  const filteredDestinationCount = useMemo(
    () => destinations.filter((item) => itemMatchesQuery(item, query)).length,
    [destinations, query],
  );
  const hasQuery = query.trim().length > 0;

  return (
    <div className="page-enter proportion-safe-page space-y-8 pb-12">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_42%),linear-gradient(135deg,hsl(var(--card)/0.95),hsl(var(--secondary)/0.42))] p-6 shadow-[0_30px_90px_-52px_hsl(var(--foreground)/0.45)] dark:border-white/10 sm:p-9"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary backdrop-blur">
            <Grid2X2 className="h-3.5 w-3.5" aria-hidden="true" />
            Catálogo NeuroPed
          </div>
          <div>
            <h1
              className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Tudo o que o app sabe fazer, em um só lugar.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Uma central de descoberta para localizar ferramentas de triagem,
              acompanhamento, documentos, portais e recursos avançados. Nada
              fica escondido por falta de uma aba.
            </p>
          </div>
          <div className="max-w-2xl space-y-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por função, página ou ferramenta…"
                aria-label="Buscar em todo o catálogo NeuroPed"
                aria-describedby="explore-search-status"
                className="h-12 rounded-2xl border-white/80 bg-card/80 pl-11 pr-4 text-sm shadow-sm backdrop-blur focus-visible:ring-primary/25 dark:border-white/10"
                data-testid="input-explore-search"
              />
            </div>
            <div className="flex min-h-6 items-center justify-between gap-3 px-1 text-[11px] text-muted-foreground">
              <span id="explore-search-status" role="status" aria-live="polite">
                {hasQuery
                  ? `${filteredDestinationCount} ${filteredDestinationCount === 1 ? "resultado" : "resultados"} para a busca`
                  : `${destinationCount} destinos disponíveis`}
              </span>
              {hasQuery && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="shrink-0 rounded-md px-2 py-1 font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Limpar busca
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1.5">
              <Check className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
              {destinationCount} destinos mapeados
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1.5">
              <Sparkles
                className="h-3.5 w-3.5 text-amber-500"
                aria-hidden="true"
              />
              {publicCount} acessos públicos
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1.5">
              <LockKeyhole
                className="h-3.5 w-3.5 text-primary"
                aria-hidden="true"
              />
              Recursos clínicos protegidos sem desaparecer
            </span>
          </div>
        </div>
      </motion.section>

      <section
        className="rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 text-sm leading-relaxed text-muted-foreground sm:p-5"
        aria-label="Orientação de acesso"
      >
        <div className="flex items-start gap-3">
          <LockKeyhole
            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <p>
            <strong className="font-semibold text-foreground">
              Descoberta pública, dados protegidos.
            </strong>{" "}
            Este catálogo mostra também as áreas profissionais para que nenhuma
            capacidade fique invisível. Ao abrir uma área clínica, o próprio
            sistema conduz para autenticação, PIN ou perfil autorizado, sem
            liberar prontuários ou dados sensíveis.
          </p>
        </div>
      </section>

      {filteredDestinationCount > 0 ? (
        <div className="space-y-10">
          {sections.map((section, index) => (
            <CatalogSection
              key={section.title || "principal"}
              section={section}
              query={query}
              canOpen={canOpen}
              offset={index * 12}
              expanded={expandedSections[section.title] ?? false}
              onToggle={() =>
                setExpandedSections((current) => ({
                  ...current,
                  [section.title]: !(current[section.title] ?? false),
                }))
              }
            />
          ))}
        </div>
      ) : (
        <section
          className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-card/60 p-8 text-center"
          aria-labelledby="explore-empty-title"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Search className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2
            id="explore-empty-title"
            className="mt-4 text-base font-semibold text-foreground"
          >
            Nenhum recurso encontrado
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Tente um termo mais amplo ou limpe a busca para voltar a ver todo o
            catálogo do NeuroPed.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Mostrar todos os recursos
          </button>
        </section>
      )}

      {currentPath !== "/" && (
        <Link
          href="/"
          className="mx-auto inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/70 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/25 hover:text-primary"
        >
          Voltar ao início
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
