import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Compass,
  FileText,
  Filter,
  LockKeyhole,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  featuredNavigation,
  navSections,
  type NavItem,
  type NavSection,
} from "@/data/navigation";
import { isPublicRoute } from "@/lib/publicRoutes";
import { softHover, softTap } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";

const sectionCopy: Record<
  string,
  { eyebrow: string; description: string; tone: string }
> = {
  ATENDIMENTO: {
    eyebrow: "Trabalho diário",
    description:
      "Abra a consulta, o paciente e os documentos que mantêm o atendimento em movimento.",
    tone: "from-sky-500/15 via-transparent to-primary/10",
  },
  "CLÍNICA E ACOMPANHAMENTO": {
    eyebrow: "Jornada clínica",
    description:
      "Continue o cuidado ao longo do tempo, com acompanhamento e serviços conectados.",
    tone: "from-emerald-500/15 via-transparent to-teal-500/10",
  },
  "TRIAGEM E FERRAMENTAS": {
    eyebrow: "Decisão e avaliação",
    description:
      "Encontre escalas, testes diretos e instrumentos para organizar a próxima hipótese.",
    tone: "from-violet-500/15 via-transparent to-indigo-500/10",
  },
  "ACOMPANHAMENTO CLÍNICO": {
    eyebrow: "Seguimento",
    description:
      "Registre evolução, medicação, sono, cefaleia e sinais que pedem continuidade.",
    tone: "from-amber-500/15 via-transparent to-orange-500/10",
  },
  REFERÊNCIA: {
    eyebrow: "Consulta rápida",
    description:
      "Acesse instrumentos, classificações, marcos e referências sem atravessar o fluxo clínico.",
    tone: "from-cyan-500/15 via-transparent to-blue-500/10",
  },
  "PORTAIS E SUPORTE": {
    eyebrow: "Conectar e orientar",
    description:
      "Encontre ajuda, acessibilidade, família, serviços institucionais e informações do NeuroPed.",
    tone: "from-rose-500/15 via-transparent to-pink-500/10",
  },
};

type ExplorerFilter = "todos" | "destaques" | string;

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function sectionDomKey(title: string) {
  const slug = normalize(title).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "recursos";
}

function uniqueItems(items: NavItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

function ResourceLink({
  item,
  sectionTitle,
}: {
  item: NavItem;
  sectionTitle: string;
}) {
  const Icon = item.icon;
  const publicDestination = isPublicRoute(item.href);
  const isExternal = item.href === "/nesplora/";
  const label = `${item.label}${publicDestination ? "" : " — área clínica protegida"}`;
  const className =
    "group flex min-h-[72px] items-center gap-3 rounded-2xl border border-border/70 bg-background/75 px-3.5 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card hover:shadow-[0_14px_30px_-22px_rgba(15,23,42,.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99]";
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition duration-200 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon
          className="h-[18px] w-[18px]"
          strokeWidth={1.9}
          aria-hidden="true"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-foreground">
            {item.label}
          </span>
          {!publicDestination && (
            <LockKeyhole
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
              aria-label="Área protegida"
            />
          )}
        </span>
        <span className="mt-0.5 block line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {item.description || `Acesso em ${sectionTitle.toLowerCase()}.`}
        </span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground transition duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </>
  );

  return isExternal ? (
    <a
      href={item.href}
      className={className}
      aria-label={label}
      onMouseEnter={() => softHover()}
      onClick={() => {
        softTap();
        haptic.tap();
      }}
    >
      {content}
    </a>
  ) : (
    <Link
      href={item.href}
      className={className}
      aria-label={label}
      onMouseEnter={() => softHover()}
      onClick={() => {
        softTap();
        haptic.tap();
      }}
    >
      {content}
    </Link>
  );
}

function SectionCard({
  section,
  query,
  open,
  onToggle,
}: {
  section: NavSection;
  query: string;
  open: boolean;
  onToggle: () => void;
}) {
  const sectionKey = sectionDomKey(section.title);
  const meta = sectionCopy[section.title] ?? {
    eyebrow: "Recursos",
    description: "Ferramentas e conteúdos disponíveis no ecossistema NeuroPed.",
    tone: "from-primary/10 via-transparent to-chart-2/10",
  };
  const items = uniqueItems(section.items).filter((item) => {
    if (!query.trim()) return true;
    const haystack = normalize(
      `${item.label} ${item.description ?? ""} ${section.title}`,
    );
    return haystack.includes(normalize(query));
  });
  if (items.length === 0) return null;

  return (
    <section
      className={`overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br ${meta.tone} p-4 shadow-sm sm:p-5`}
      aria-labelledby={`explore-${sectionKey}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`explore-items-${sectionKey}`}
        className="group mb-0 flex w-full items-start justify-between gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            {meta.eyebrow}
          </span>
          <span
            id={`explore-${sectionKey}`}
            className="mt-1 block text-lg font-black tracking-tight text-foreground"
          >
            {section.title || "Recursos"}
          </span>
          <span className="mt-1 block max-w-2xl text-xs leading-relaxed text-muted-foreground">
            {meta.description}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-full bg-background/60 text-[10px]"
          >
            {items.length} recursos
          </Badge>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>
      {open && (
        <div
          id={`explore-items-${sectionKey}`}
          className="mt-4 grid gap-2.5 md:grid-cols-2"
        >
          {items.map((item) => (
            <ResourceLink
              key={item.href}
              item={item}
              sectionTitle={section.title || "recursos"}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function ExplorarPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ExplorerFilter>("todos");
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(["ATENDIMENTO", "TRIAGEM E FERRAMENTAS"]),
  );
  const sections = useMemo(
    () => navSections.filter((section) => section.title),
    [],
  );
  const filteredSections = useMemo(() => {
    const normalizedFilter = normalize(filter);
    if (filter === "todos") return sections;
    return sections.filter((section) =>
      normalize(section.title).includes(normalizedFilter),
    );
  }, [filter, sections]);
  const totalResources = useMemo(
    () =>
      uniqueItems([
        ...featuredNavigation,
        ...sections.flatMap((section) => section.items),
      ]).length,
    [sections],
  );
  const matchingItems = useMemo(
    () =>
      uniqueItems([
        ...featuredNavigation,
        ...sections.flatMap((section) => section.items),
      ]).filter((item) =>
        normalize(`${item.label} ${item.description ?? ""}`).includes(
          normalize(query),
        ),
      ),
    [query, sections],
  );
  const hasQuery = query.trim().length > 0;

  return (
    <div className="page-enter container mx-auto w-full max-w-7xl space-y-5 pb-8 sm:space-y-7">
      <header className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-primary/[0.12] via-card/90 to-card/60 p-5 shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                NeuroPed · explorador
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-[-0.03em] text-foreground sm:text-4xl">
              Encontre o próximo passo.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Todos os recursos do app organizados por jornada. Comece pelo que
              precisa agora; o restante continua a um clique, com acesso
              protegido quando necessário.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-border/60 bg-background/60 px-3 py-2.5 text-center">
              <p className="text-xl font-black text-foreground">
                {totalResources}
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground">
                recursos
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 px-3 py-2.5 text-center">
              <p className="text-xl font-black text-foreground">
                {sections.length}
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground">
                jornadas
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 px-3 py-2.5 text-center">
              <p className="text-xl font-black text-foreground">1</p>
              <p className="text-[10px] font-semibold text-muted-foreground">
                busca
              </p>
            </div>
          </div>
        </div>
      </header>

      <section
        className="sticky top-2 z-10 rounded-2xl border border-border/70 bg-background/90 p-3 shadow-sm backdrop-blur sm:p-4"
        aria-label="Buscar recursos"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar paciente, escala, laudo, diário ou módulo…"
              aria-label="Buscar recurso por nome ou descrição"
              className="h-11 rounded-xl pl-10 pr-10"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div
            className="flex gap-1.5 overflow-x-auto pb-0.5"
            role="tablist"
            aria-label="Filtrar jornadas"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filter === "todos"}
              onClick={() => setFilter("todos")}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${filter === "todos" ? "bg-primary text-primary-foreground shadow-sm" : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
            >
              Tudo
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === "destaques"}
              onClick={() => setFilter("destaques")}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${filter === "destaques" ? "bg-primary text-primary-foreground shadow-sm" : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
            >
              Destaques
            </button>
            {sections.map((section) => (
              <button
                key={section.title}
                type="button"
                role="tab"
                aria-selected={filter === section.title}
                onClick={() => setFilter(section.title)}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${filter === section.title ? "bg-primary text-primary-foreground shadow-sm" : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {filter === "destaques" && !hasQuery && (
        <section
          className="rounded-[1.75rem] border border-primary/20 bg-primary/[0.04] p-4 sm:p-5"
          aria-labelledby="explore-featured-title"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Alta frequência
              </p>
              <h2
                id="explore-featured-title"
                className="mt-1 text-lg font-black text-foreground"
              >
                Comece pelo que move o atendimento
              </h2>
            </div>
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {featuredNavigation.map((item) => (
              <ResourceLink
                key={item.href}
                item={item}
                sectionTitle="destaques"
              />
            ))}
          </div>
        </section>
      )}

      {hasQuery && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5 text-xs"
          role="status"
          aria-live="polite"
        >
          <span>
            <strong className="text-foreground">{matchingItems.length}</strong>{" "}
            recurso{matchingItems.length === 1 ? "" : "s"} encontrado
            {matchingItems.length === 1 ? "" : "s"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setFilter("todos");
            }}
            className="h-7 px-2 text-xs"
          >
            Limpar
          </Button>
        </div>
      )}

      <main
        className="space-y-4 sm:space-y-5"
        aria-label="Recursos organizados por jornada"
      >
        {filteredSections.map((section) => (
          <SectionCard
            key={section.title}
            section={section}
            query={query}
            open={Boolean(query.trim()) || openSections.has(section.title)}
            onToggle={() =>
              setOpenSections((current) => {
                const next = new Set(current);
                if (next.has(section.title)) next.delete(section.title);
                else next.add(section.title);
                return next;
              })
            }
          />
        ))}
        {hasQuery && matchingItems.length === 0 && (
          <section className="rounded-[1.75rem] border border-dashed border-border bg-card/60 p-8 text-center">
            <FileText
              className="mx-auto h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="mt-3 text-lg font-black text-foreground">
              Nenhum recurso com esse nome
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
              Tente uma palavra clínica, o nome de uma escala ou uma tarefa como
              “laudo”, “sono” ou “escola”.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setQuery("")}
            >
              Ver todos os recursos
            </Button>
          </section>
        )}
      </main>

      <section
        className="grid gap-3 md:grid-cols-3"
        aria-label="Orientações do explorador"
      >
        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <CheckCircle2
            className="h-5 w-5 text-emerald-600"
            aria-hidden="true"
          />
          <h2 className="mt-2 text-sm font-black text-foreground">
            Organizado por trabalho
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Os grupos representam o que você precisa fazer, não apenas o tipo
            técnico da tela.
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <LockKeyhole className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="mt-2 text-sm font-black text-foreground">
            Proteção visível
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Recursos clínicos aparecem, mas continuam passando pelo acesso e
            pela autorização corretos.
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <Filter className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="mt-2 text-sm font-black text-foreground">
            Busca transversal
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Digite uma intenção e vá direto ao destino, sem precisar lembrar em
            qual grupo ele mora.
          </p>
        </div>
      </section>
    </div>
  );
}
