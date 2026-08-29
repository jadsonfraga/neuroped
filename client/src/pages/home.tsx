import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  FileText,
  Eye,
  Filter,
  LineChart,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Mascote } from "@/components/Mascote";
import { FavoritesRecents } from "@/components/FavoritesRecents";
import { appMetrics } from "@/data/appMetrics";
import { navigablePages } from "@/data/navigation";
import type { ScaleEntry } from "@/data/scaleFilter";
import { haptic } from "@/lib/haptic";
import { duration, easing } from "@/lib/motion";
import { softHover, softTap } from "@/lib/softSounds";
import { useAuth } from "@/contexts/AuthContext";
import { canRenderNavigationItem } from "@/security/routeGuardPolicy";
import {
  hasConfiguredMasterPin,
  isMasterPinUnlocked,
} from "@/lib/masterPin";

interface ClinicalFlow {
  href: string;
  title: string;
  subtitle: string;
  action: string;
  useCase: string;
  icon: LucideIcon;
  emphasis: "primary" | "gold" | "teal" | "blue" | "slate";
}

interface QuickAction {
  href: string;
  label: string;
  detail: string;
  icon: LucideIcon;
}

const clinicalFlows: ClinicalFlow[] = [
  {
    href: "/mchat",
    title: "Aplicar escala",
    subtitle:
      "Abra um instrumento implementado e registre o resultado no atendimento.",
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
    emphasis: "teal",
  },
  {
    href: "/avaliacao-cognitiva-infantil",
    title: "Avaliação Cognitiva Infantil",
    subtitle:
      "Triagem lúdica por faixa etária: visual, leitura, escrita e aritmética.",
    action: "Abrir avaliação",
    useCase: "Triagem 2–19 anos",
    icon: ClipboardCheck,
    emphasis: "blue",
  },
  {
    href: "/testes-reconhecimento",
    title: "Reconhecimento Visual Infantil",
    subtitle:
      "Triagem lúdica com frutas, transportes, corpo e conhecimentos gerais.",
    action: "Iniciar teste visual",
    useCase: "1–5 anos",
    icon: Eye,
    emphasis: "gold",
  },
  {
    href: "/marcos-desenvolvimento",
    title: "Marcos do Desenvolvimento",
    subtitle:
      "Checklist por idade (base OMS/CDC) para acompanhar o desenvolvimento.",
    action: "Ver marcos",
    useCase: "Desenvolvimento",
    icon: LineChart,
    emphasis: "slate",
  },
];

const quickActions: QuickAction[] = [
  {
    href: "/pacientes",
    label: "Pacientes",
    detail: "Abrir prontuários",
    icon: Users,
  },
  {
    href: "/agenda",
    label: "Agenda",
    detail: "Organizar atendimentos",
    icon: CalendarDays,
  },
  {
    href: "/laudo-neuroped",
    label: "Documentos",
    detail: "Laudos e relatórios",
    icon: FileText,
  },
];

const metricCards = [
  {
    label: "Escalas clínicas",
    value: appMetrics.scaleCount,
    detail: "instrumentos no catálogo",
    icon: ClipboardCheck,
  },
  {
    label: "Filtro inteligente",
    value: appMetrics.filterableInstrumentCount,
    detail: "itens pesquisáveis",
    icon: Filter,
  },
  {
    label: "Testes diretos",
    value: appMetrics.directTestCount,
    detail: "experiências aplicáveis",
    icon: Sparkles,
  },
  {
    label: "Ecossistema",
    value: appMetrics.pageCount,
    detail: "páginas integradas",
    icon: FileText,
  },
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function FlowCard({ flow, index }: { flow: ClinicalFlow; index: number }) {
  const Icon = flow.icon;

  return (
    <Link href={flow.href}>
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.045,
          duration: duration.normal,
          ease: easing.smooth,
        }}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.992 }}
        onMouseEnter={() => softHover()}
        onClick={() => {
          softTap();
          haptic.tap();
        }}
        className="np-v13-flow-card"
        data-tone={flow.emphasis}
        data-testid={`home-flow-${index + 1}`}
      >
        <div className="np-v13-flow-topline">
          <span className="np-v13-flow-icon" aria-hidden="true">
            <Icon strokeWidth={1.75} />
          </span>
          <ArrowUpRight className="np-v13-flow-arrow" aria-hidden="true" />
        </div>

        <div className="np-v13-flow-copy">
          <p>{flow.useCase}</p>
          <h3>{flow.title}</h3>
          <span>{flow.subtitle}</span>
        </div>

        <div className="np-v13-flow-footer">
          <span>{flow.action}</span>
          <ArrowRight aria-hidden="true" />
        </div>
      </motion.article>
    </Link>
  );
}

function MetricCard({
  metric,
  index,
}: {
  metric: (typeof metricCards)[number];
  index: number;
}) {
  const Icon = metric.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.08 + index * 0.045,
        duration: duration.normal,
        ease: easing.smooth,
      }}
      className="np-v13-metric-card"
      data-testid="premium-metric-card"
    >
      <div className="np-v13-metric-heading">
        <p>{metric.label}</p>
        <span aria-hidden="true">
          <Icon strokeWidth={1.75} />
        </span>
      </div>
      <strong>
        {metric.value}
        <small>+</small>
      </strong>
      <p className="np-v13-metric-detail">{metric.detail}</p>
    </motion.article>
  );
}

export default function HomePage() {
  const { accessMode, isAuthenticated, isLoading, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [scaleSearchCatalog, setScaleSearchCatalog] = useState<ScaleEntry[]>(
    [],
  );
  const q = normalize(searchQuery.trim());
  const isSearching = q.length >= 2;
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }).format(new Date()),
    [],
  );
  const visibleQuickActions = useMemo(
    () =>
      quickActions.filter((action) =>
        canRenderNavigationItem({
          path: action.href,
          accessMode,
          isAuthenticated,
          isLoading,
          userRole: user?.role,
          localPinConfigured: accessMode === "local" && hasConfiguredMasterPin(),
          localPinUnlocked: accessMode === "local" && isMasterPinUnlocked(),
        }),
      ),
    [accessMode, isAuthenticated, isLoading, user?.role],
  );

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
      .filter((page) => normalize(`${page.label} ${page.href}`).includes(q))
      .map((page) => ({
        href: page.href,
        title: page.label,
        detail: "Página do app",
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

    return [...pages, ...scales].slice(0, 10);
  }, [q, scaleSearchCatalog]);

  return (
    <div
      className="np-v13-home page-enter proportion-safe-page"
      data-testid="premium-home-v13"
    >
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="np-v13-hero"
        data-testid="premium-hero"
      >
        <div className="np-v13-hero-grid">
          <div className="np-v13-hero-copy">
            <div
              className="np-v13-status"
              data-testid="premium-system-status"
            >
              <span aria-hidden="true" />
              <strong>NeuroPED OS</strong>
              <i aria-hidden="true" />
              <span>{todayLabel}</span>
            </div>

            <div className="np-v13-title-block">
              <h1 data-testid="text-page-title">
                Seu consultório,
                <span> em estado de foco.</span>
              </h1>
              <p>
                Acesse escalas, triagens, acompanhamento e documentos sem
                perder o contexto clínico — com menos ruído e mais precisão.
              </p>
            </div>

            <div
              className="np-v13-search"
              data-testid="search-container"
            >
              <Search aria-hidden="true" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar escala, teste, página ou módulo…"
                aria-label="Buscar escala, teste, página ou módulo"
                data-testid="input-search"
              />
              <kbd>⌘ K</kbd>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Limpar busca"
                >
                  <X aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="np-v13-actions">
              <Link
                href="/filtro"
                className="np-v13-primary-action"
                data-testid="premium-primary-action"
              >
                Encontrar escala ideal
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link
                href="/filtro-escalas?mode=flash"
                className="np-v13-secondary-action"
                data-testid="premium-secondary-action"
              >
                <Clock3 aria-hidden="true" />
                Triagem rápida
              </Link>
            </div>
          </div>

          <aside
            className="np-v13-control-panel"
            aria-label="Atalhos operacionais"
          >
            <div className="np-v13-panel-heading">
              <div>
                <p>Próximo passo</p>
                <h2>Fluxo do consultório</h2>
              </div>
              <span>
                <ShieldCheck aria-hidden="true" />
                Protegido
              </span>
            </div>

            <div className="np-v13-quick-actions">
              {visibleQuickActions.length > 0 ? (
                visibleQuickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.href} href={action.href}>
                      <div
                        className="np-v13-quick-link"
                        data-testid="premium-quick-link"
                      >
                        <span aria-hidden="true">
                          <Icon strokeWidth={1.7} />
                        </span>
                        <div>
                          <strong>{action.label}</strong>
                          <small>{action.detail}</small>
                        </div>
                        <ArrowUpRight aria-hidden="true" />
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div
                  className="np-v13-empty-result"
                  data-testid="premium-quick-actions-empty"
                >
                  Nenhum atalho operacional está disponível para este perfil.
                </div>
              )}
            </div>

            <div className="np-v13-panel-footer">
              <div>
                <strong>Ambiente clínico pronto</strong>
                <span>
                  A lógica, as permissões e a persistência segura permanecem
                  preservadas.
                </span>
              </div>
              <Mascote contexto="home" size="sm" fala="" />
            </div>
          </aside>
        </div>
      </motion.section>

      <section
        className="np-v13-metric-grid"
        aria-label="Indicadores do aplicativo"
        data-testid="premium-metric-grid"
      >
        {metricCards.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </section>

      {isSearching ? (
        <section
          className="np-v13-search-results"
          aria-label="Resultados da busca da home"
        >
          <div className="np-v13-section-heading">
            <div>
              <p>Busca clínica</p>
              <h2>Resultados rápidos</h2>
            </div>
            <span>{searchResults.length}</span>
          </div>

          <div className="np-v13-result-grid">
            {searchResults.length > 0 ? (
              searchResults.map((item) => (
                <Link key={`${item.href}-${item.title}`} href={item.href}>
                  <article className="np-v13-result-card">
                    <span aria-hidden="true">
                      <Stethoscope strokeWidth={1.75} />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.detail}</p>
                    </div>
                    <ArrowRight aria-hidden="true" />
                  </article>
                </Link>
              ))
            ) : (
              <div className="np-v13-empty-result">
                Nenhum atalho direto. Use o{" "}
                <Link href="/filtro">Filtro Clínico</Link> para aproximar por
                idade, objetivo e queixa.
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          <section
            className="np-v13-section"
            aria-labelledby="fluxos-principais"
          >
            <div className="np-v13-section-heading">
              <div>
                <p>Jornada clínica</p>
                <h2 id="fluxos-principais">Escolha por onde começar</h2>
              </div>
              <span className="np-v13-section-meta">
                Cinco fluxos essenciais
              </span>
            </div>

            <div
              className="np-v13-flow-grid"
              data-testid="premium-flow-grid"
            >
              {clinicalFlows.map((flow, index) => (
                <FlowCard key={flow.href} flow={flow} index={index} />
              ))}
            </div>
          </section>

          <section className="np-v13-lower-grid">
            <aside
              className="np-v13-responsible-note"
              role="note"
              data-testid="premium-responsible-note"
            >
              <div>
                <ShieldCheck aria-hidden="true" />
              </div>
              <div>
                <p>Uso responsável</p>
                <span>
                  As escalas apoiam rastreio, documentação e monitorização. A
                  decisão continua dependente de anamnese, exame, contexto e
                  julgamento clínico.
                </span>
              </div>
            </aside>

            <div className="np-v13-favorites">
              <FavoritesRecents />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
