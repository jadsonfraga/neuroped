// Design: navegação clínica de alta clareza, com um sinal dourado Nesplora pontual e motion reduzido quando necessário.
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Search,
  ClipboardList,
  KeyRound,
  Trash2,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCommandPalette } from "@/lib/commandPaletteBus";
import { softTap, softHover, softWhoosh } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { easing, duration, fadeIn } from "@/lib/motion";
import { SkipNav } from "@/components/SkipNav";
import { OfflineBanner } from "@/components/ui/VisualStates";
import {
  featuredNavigation,
  navSections,
  getNavigationMatch,
} from "@/data/navigation";
import { isPublicRoute } from "@/lib/publicRoutes";
import { IS_PUBLIC_ZONE } from "@/lib/zone";
import { secureClearAll } from "@/lib/secureStorage";
import {
  clearMasterPinUnlock,
  hasConfiguredMasterPin,
  isMasterPinUnlocked,
} from "@/lib/masterPin";
import {
  clearLegacyOpenWorkspace,
  subscribeToLegacyOpenWorkspaceClear,
} from "@/lib/openWorkspaceCleanup";
import { useAuth } from "@/contexts/AuthContext";
import { canRenderNavigationItem } from "@/security/routeGuardPolicy";
import { ClinicSwitcher } from "@/components/ClinicSwitcher";

const NESPLORA_SITE_URL = "/nesplora/";

// ─────────────────────────── Atalhos em destaque ───────────────────────────
// Recursos de alta frequência e conexões institucionais ficam acima da lista
// estrutural. O catálogo de escalas permanece acessível pelo filtro, sem ocupar
// dezenas de linhas na navegação principal.
function FeaturedShortcuts({
  collapsed,
  activeHref,
  canRenderClinicalLinks,
}: {
  collapsed: boolean;
  activeHref?: string;
  canRenderClinicalLinks: boolean;
}) {
  if (IS_PUBLIC_ZONE || !canRenderClinicalLinks) return null;

  const onPick = () => {
    softTap();
    haptic.select();
  };
  const isExternalShortcut = (href: string) => href === NESPLORA_SITE_URL;
  const toneClasses = {
    golden:
      "border-amber-300/75 bg-gradient-to-br from-amber-50 via-amber-100/90 to-amber-200/65 text-amber-950 shadow-[0_12px_28px_-18px_rgba(180,83,9,.72)] hover:border-amber-400 hover:shadow-[0_16px_34px_-18px_rgba(180,83,9,.82)] dark:border-amber-700/70 dark:from-amber-950/80 dark:via-amber-900/60 dark:to-amber-800/40 dark:text-amber-50",
    connection:
      "border-cyan-300/55 bg-gradient-to-br from-cyan-50/90 via-sky-50/70 to-primary/10 text-foreground shadow-[0_10px_24px_-20px_rgba(8,145,178,.7)] hover:border-cyan-400/75 hover:shadow-[0_14px_28px_-18px_rgba(8,145,178,.65)] dark:border-cyan-800/70 dark:from-cyan-950/55 dark:via-sky-950/40 dark:to-primary/10",
    priority:
      "border-primary/30 bg-gradient-to-br from-primary/15 via-primary/[0.08] to-chart-2/10 text-foreground shadow-sm hover:border-primary/50 hover:shadow-md",
  } as const;

  const renderCard = (
    item: (typeof featuredNavigation)[number],
    compact = false,
  ) => {
    const Icon = item.icon;
    const active = activeHref === item.href;
    const tone = item.tone ?? "priority";
    const card = (
      <div
        onClick={onPick}
        onMouseEnter={() => softHover()}
        data-testid={`featured-${item.label}`}
        className={`group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-[1rem] border px-3 transition-all duration-200 hover:-translate-y-0.5 ${compact ? "min-h-[58px] py-2" : "min-h-[68px] py-2.5"} ${toneClasses[tone]} ${active ? "ring-2 ring-primary/25 ring-offset-1 ring-offset-sidebar" : ""}`}
      >
        {tone === "golden" && (
          <span
            aria-hidden="true"
            className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/55 blur-2xl transition-transform duration-500 group-hover:scale-150 dark:bg-amber-100/15"
          />
        )}
        <span
          className={`relative z-10 flex shrink-0 items-center justify-center rounded-xl shadow-sm ${compact ? "h-8 w-8" : "h-9 w-9"} ${tone === "golden" ? "bg-amber-300 text-amber-950" : tone === "connection" ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-200" : "bg-primary text-primary-foreground"}`}
        >
          <Icon
            className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"}
            strokeWidth={2.1}
            aria-hidden="true"
          />
        </span>
        <span className="relative z-10 min-w-0 flex-1">
          <span
            className={`block leading-tight ${compact ? "line-clamp-2 whitespace-normal text-[10px] font-bold" : "truncate text-xs font-extrabold"}`}
          >
            {item.label}
          </span>
          {!compact && (
            <span className="mt-0.5 block truncate text-[10px] leading-tight opacity-70">
              {item.description}
            </span>
          )}
        </span>
        <span className="relative z-10 flex shrink-0 items-center gap-1 opacity-65 transition-transform group-hover:translate-x-0.5">
          {isExternalShortcut(item.href) ? (
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </span>
      </div>
    );

    return isExternalShortcut(item.href) ? (
      <a key={item.href} href={item.href} aria-label={`Abrir ${item.label}`}>
        {card}
      </a>
    ) : (
      <Link key={item.href} href={item.href}>
        {card}
      </Link>
    );
  };

  const primary = featuredNavigation.slice(0, 2);
  const supporting = featuredNavigation.slice(2);
  const iconRail = featuredNavigation.map((item) => {
    const Icon = item.icon;
    const active = activeHref === item.href;
    const tone = item.tone ?? "priority";
    const icon = (
      <div
        key={item.href}
        title={`${item.label}${item.description ? ` — ${item.description}` : ""}`}
        aria-label={item.label}
        onClick={onPick}
        onMouseEnter={() => softHover()}
        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${tone === "golden" ? "border-amber-300/80 bg-amber-200/80 text-amber-900 shadow-sm shadow-amber-500/25 dark:border-amber-700/70 dark:bg-amber-900/50 dark:text-amber-100" : tone === "connection" ? "border-cyan-300/60 bg-cyan-100/70 text-cyan-700 dark:border-cyan-800/70 dark:bg-cyan-950/50 dark:text-cyan-200" : "border-primary/30 bg-primary/15 text-primary"} ${active ? "ring-2 ring-primary/30" : ""}`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
    );
    return isExternalShortcut(item.href) ? (
      <a key={item.href} href={item.href}>
        {icon}
      </a>
    ) : (
      <Link key={item.href} href={item.href}>
        {icon}
      </Link>
    );
  });

  return (
    <div className="px-2 pt-2">
      {!collapsed ? (
        <>
          <div className="flex items-center justify-between px-1 pb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Acessos prioritários
            </p>
            <span className="rounded-full border border-sidebar-border bg-sidebar-accent/45 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
              app
            </span>
          </div>
          <div className="space-y-1.5">
            {primary.map((item) => renderCard(item))}
            <div className="grid grid-cols-2 gap-1.5">
              {supporting.map((item) => renderCard(item, true))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="lg:hidden">
            <div className="flex items-center justify-between px-1 pb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Acessos prioritários
              </p>
              <span className="rounded-full border border-sidebar-border bg-sidebar-accent/45 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                app
              </span>
            </div>
            <div className="space-y-1.5">
              {primary.map((item) => renderCard(item))}
              <div className="grid grid-cols-2 gap-1.5">
                {supporting.map((item) => renderCard(item, true))}
              </div>
            </div>
          </div>
          <div className="hidden flex-col items-center gap-1.5 lg:flex">
            {iconRail}
          </div>
        </>
      )}
    </div>
  );
}

const priorityNavHrefs = new Set([
  "/agenda",
  "/pacientes",
  "/laudo-neuroped",
  "/laudo-super",
  "/receita-c1",
]);

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { accessMode, isAuthenticated, isLoading, logout, user } = useAuth();
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("neuroped:theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("neuroped:sidebar-collapsed") === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches,
  );
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const mobileHeaderRef = useRef<HTMLElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const mobileMenuWasOpen = useRef(false);
  // As seções essenciais começam abertas; o restante permanece recolhido para
  // que a sidebar preserve ritmo de aplicativo mesmo com muitos módulos.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => ({
      principal: true,
      ATENDIMENTO: true,
      "TRIAGEM E FERRAMENTAS": true,
    }),
  );
  const [navHydrated, setNavHydrated] = useState(false);

  useEffect(() => {
    let idleId: number | undefined;
    const timerId = window.setTimeout(() => {
      const idleCallback = window.requestIdleCallback;
      if (idleCallback) {
        idleId = idleCallback(() => setNavHydrated(true), { timeout: 2000 });
      } else {
        setNavHydrated(true);
      }
    }, 1500);
    return () => {
      window.clearTimeout(timerId);
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("neuroped:theme", dark ? "dark" : "light");
    } catch {
      /* storage indisponível (modo privado/cota) — silencioso */
    }
  }, [dark]);

  useEffect(() => {
    try {
      localStorage.setItem("neuroped:sidebar-collapsed", collapsed ? "1" : "0");
    } catch {
      /* storage indisponível (modo privado/cota) — silencioso */
    }
  }, [collapsed]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setIsDesktop(media.matches);
      if (media.matches) setMobileOpen(false);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const drawerOpen = mobileOpen && !isDesktop;
    document.documentElement.classList.toggle("np-mobile-drawer-open", drawerOpen);
    document.body.classList.toggle("np-mobile-drawer-open", drawerOpen);
    return () => {
      document.documentElement.classList.remove("np-mobile-drawer-open");
      document.body.classList.remove("np-mobile-drawer-open");
    };
  }, [isDesktop, mobileOpen]);

  useEffect(() => {
    const setInert = (element: HTMLElement | null, disabled: boolean) => {
      if (disabled) element?.setAttribute("inert", "");
      else element?.removeAttribute("inert");
    };

    if (!mobileOpen || isDesktop) {
      setInert(sidebarRef.current, !isDesktop);
      setInert(mobileHeaderRef.current, false);
      setInert(mainContentRef.current, false);
      if (mobileMenuWasOpen.current) mobileMenuButtonRef.current?.focus();
      mobileMenuWasOpen.current = false;
      return;
    }

    // Remova `inert` antes de mover o foco. Focusar um descendente inerte e só
    // depois liberar a árvore falha silenciosamente em navegadores modernos.
    setInert(sidebarRef.current, false);
    setInert(mobileHeaderRef.current, true);
    setInert(mainContentRef.current, true);
    mobileMenuWasOpen.current = true;
    mobileCloseButtonRef.current?.focus();
    const sidebar = sidebarRef.current;
    // A classe np-mobile-drawer-open é o owner exclusivo da trava do shell.
    // O efeito dedicado remove somente essa classe, sem tocar em locks de
    // dialogs de terceiros que possam abrir ou fechar em outra ordem.

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab" || !sidebar) return;

      const focusable = [
        ...sidebar.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => !element.hasAttribute("hidden"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isDesktop, mobileOpen]);

  useEffect(() => {
    // Layout só fecha o shell. AppRouter é o único owner do reset instantâneo
    // do document.scrollingElement, evitando duas animações concorrentes.
    setMobileOpen(false);
    if (location !== "/") softWhoosh();
  }, [location]);

  useEffect(() => {
    if (accessMode !== "local") return;

    return subscribeToLegacyOpenWorkspaceClear(() => {
      // Oculta imediatamente qualquer dado já renderizado enquanto esta aba
      // descarta caches e rascunhos antes de recarregar o workspace vazio.
      document.body.style.visibility = "hidden";
      try {
        sessionStorage.removeItem("neuroped:pin-ok");
        sessionStorage.removeItem("neuroped:local-unlocked");
        localStorage.removeItem("neuroped:local-unlocked-persistent");
      } catch {
        /* storage indisponível — o reload ainda elimina o estado em memória */
      }
      clearMasterPinUnlock();
      void (async () => {
        try {
          await logout();
        } finally {
          window.location.hash = "#/";
          window.location.reload();
        }
      })();
    });
  }, [accessMode, logout]);

  // Auto-expande a seção que contém a rota atual e rola o item ativo para a vista
  // — o usuário sempre vê onde está e os instrumentos vizinhos, sem abrir nada.
  useEffect(() => {
    const match = getNavigationMatch(location);
    const title = match?.section.title;
    if (title)
      setOpenSections((prev) =>
        prev[title] ? prev : { ...prev, [title]: true },
      );
    const label = match?.item.label;
    if (!label) return;
    const t = setTimeout(() => {
      document
        .querySelector(`[data-testid="nav-${label}"]`)
        ?.scrollIntoView({ block: "nearest" });
    }, 80);
    return () => clearTimeout(t);
  }, [location]);

  const activeNavigation = getNavigationMatch(location);
  const showClinicalFlow =
    location !== "/" &&
    location !== "/login" &&
    location !== "/sessao-expirada";
  // Na zona pública (host das famílias) o menu mostra só o conteúdo aberto.
  const canRenderNavItem = (path: string) =>
    canRenderNavigationItem({
      path,
      accessMode,
      isAuthenticated,
      isLoading,
      userRole: user?.role,
      localPinConfigured: accessMode === "local" && hasConfiguredMasterPin(),
      localPinUnlocked: accessMode === "local" && isMasterPinUnlocked(),
    });
  const visibleSections = IS_PUBLIC_ZONE
    ? navSections
        .map((s) => ({
          ...s,
          items: s.items.filter((i) => isPublicRoute(i.href)),
        }))
        .filter((s) => s.items.length > 0)
    : navSections
        .map((s) => ({
          ...s,
          items: s.items.filter((i) => canRenderNavItem(i.href)),
        }))
        .filter((s) => s.items.length > 0);
  const flowSteps = [
    "Paciente",
    "Queixa",
    "Escala",
    "Aplicação",
    "Resultado",
    "Documento",
    "Histórico",
  ];
  const renderedSections = navHydrated
    ? visibleSections
    : visibleSections.filter(
        (section) =>
          !section.title || section.title === activeNavigation?.section.title,
      );

  async function handleSessionAction() {
    softTap();
    haptic.tap();
    if (accessMode === "local") {
      const confirmed = window.confirm(
        "Apagar permanentemente pacientes e resultados deste navegador? Faça um backup antes. Downloads e conteúdo já copiado não serão apagados.",
      );
      if (!confirmed) return;
      if (!clearLegacyOpenWorkspace()) {
        window.alert(
          "Não foi possível apagar os dados locais. Feche outras abas do NeuroPed e tente novamente.",
        );
        return;
      }
    }
    try {
      sessionStorage.removeItem("neuroped:pin-ok");
      sessionStorage.removeItem("neuroped:local-unlocked");
      localStorage.removeItem("neuroped:local-unlocked-persistent");
    } catch {
      /* storage indisponível — recarregar ainda força rechecagem do gate */
    }
    clearMasterPinUnlock();
    // No modo remoto, logout também revoga a família de refresh no servidor.
    // No modo local ele apenas encerra qualquer credencial residual da aba.
    await logout();
    await secureClearAll();
    window.location.hash = "#/";
    window.location.reload();
  }

  return (
    <div className="np-app-shell flex min-h-screen bg-background">
      <SkipNav />
      <OfflineBanner />

      {/* Mobile top header bar */}
      <header
        ref={mobileHeaderRef}
        className="np-app-mobile-header print:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b border-sidebar-border bg-sidebar/95 backdrop-blur-md lg:hidden"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: duration.normal, ease: easing.spring }}
            className="relative w-8 h-8"
          >
            <div
              className="h-full w-full rounded-xl overflow-hidden flex items-center justify-center ring-1 ring-white/25"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--chart-2)))",
                boxShadow: "0 4px 14px hsl(var(--primary) / 0.3)",
              }}
            >
              <img
                src="/dr-jadson-shield-badge.webp"
                alt="Dr. Jadson Fraga"
                width="256"
                height="256"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
            <span
              className="absolute -right-1 -bottom-1 flex h-3 w-3 items-center justify-center rounded-md bg-gradient-to-br from-amber-300 to-yellow-600 text-red-950 shadow-sm ring-1 ring-white/70 dark:ring-black/40"
              aria-hidden="true"
            >
              <Zap className="h-1.5 w-1.5" strokeWidth={3} />
            </span>
          </motion.div>
          <span
            className="text-base tracking-tight text-sidebar-foreground"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            NeuroPed
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={() => {
              softTap();
              haptic.tap();
              openCommandPalette();
            }}
            data-testid="button-command-palette-mobile"
            aria-label="Buscar escala, teste ou módulo"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={() => {
              softTap();
              haptic.tap();
              setDark(!dark);
            }}
            data-testid="button-theme-toggle-mobile"
            aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {dark ? (
              <Sun className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4" aria-hidden="true" />
            )}
          </Button>
          <Button
            ref={mobileMenuButtonRef}
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={() => {
              softTap();
              haptic.tap();
              setMobileOpen(true);
            }}
            data-testid="button-mobile-menu"
            aria-label="Abrir menu de navegação"
            aria-expanded={mobileOpen}
            aria-controls="sidebar-nav"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>
      </header>

      {/* Mobile backdrop com fade */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => {
              softTap();
              setMobileOpen(false);
            }}
            data-testid="mobile-backdrop"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        aria-hidden={!isDesktop && !mobileOpen ? true : undefined}
        role={!isDesktop ? "dialog" : undefined}
        aria-modal={!isDesktop && mobileOpen ? true : undefined}
        aria-label="Menu de navegação"
        className={[
          "print:hidden",
          "np-app-sidebar fixed left-0 top-0 h-full z-50 flex flex-col border-r border-sidebar-border bg-sidebar",
          "transition-transform duration-300 lg:transition-all lg:duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          collapsed ? "lg:w-16" : "lg:w-64",
          "w-64",
        ].join(" ")}
        style={{
          boxShadow: mobileOpen
            ? "0 0 60px hsl(var(--foreground) / 0.25)"
            : undefined,
        }}
      >
        {/* Logo + close button on mobile */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="relative flex-shrink-0 w-9 h-9">
            <div
              className="h-full w-full rounded-xl overflow-hidden flex items-center justify-center ring-1 ring-white/25"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--chart-2)))",
                boxShadow: "0 4px 14px hsl(var(--primary) / 0.35)",
              }}
            >
              <img
                src="/dr-jadson-shield-badge.webp"
                alt="Dr. Jadson Fraga"
                width="256"
                height="256"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
            <span
              className="absolute -right-1 -bottom-1 flex h-3.5 w-3.5 items-center justify-center rounded-md bg-gradient-to-br from-amber-300 to-yellow-600 text-red-950 shadow-sm ring-1 ring-white/70 dark:ring-black/40"
              aria-hidden="true"
            >
              <Zap className="h-2 w-2" strokeWidth={3} />
            </span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <h1
                className="text-base tracking-tight text-sidebar-foreground leading-tight"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                NeuroPed
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary leading-tight mt-0.5">
                Neuropediatria
              </p>
            </div>
          )}
          {/* Mobile close button */}
          <Button
            ref={mobileCloseButtonRef}
            variant="ghost"
            size="sm"
            className="px-2 lg:hidden ml-auto"
            onClick={() => {
              softTap();
              haptic.tap();
              setMobileOpen(false);
            }}
            data-testid="button-mobile-close"
            aria-label="Fechar menu de navegação"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>

        {/* Busca / Command palette */}
        <div className="px-2 pt-2 space-y-2">
          <button
            onClick={() => {
              softTap();
              haptic.tap();
              openCommandPalette();
            }}
            onMouseEnter={() => softHover()}
            data-testid="button-command-palette"
            aria-label={
              collapsed ? "Buscar escala, teste ou módulo" : undefined
            }
            className={`flex items-center gap-2 w-full min-h-[40px] rounded-lg border border-sidebar-border bg-sidebar-accent/40 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors ${
              collapsed ? "lg:justify-center lg:px-0 px-3" : "px-3"
            }`}
          >
            <Search className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {!collapsed && (
              <>
                <span className="text-xs">Buscar escala, teste ou módulo</span>
                <kbd className="ml-auto hidden text-[10px] font-mono px-1.5 py-0.5 rounded border border-sidebar-border bg-background/50 lg:inline-flex">
                  Ctrl K
                </kbd>
              </>
            )}
            {collapsed && (
              <span className="text-xs lg:hidden">
                Buscar escala, teste ou módulo
              </span>
            )}
          </button>
        </div>

        {/* Contexto SaaS: o servidor continua sendo a autoridade de autorização. */}
        <ClinicSwitcher collapsed={collapsed} />

        {/* Atalhos em destaque */}
        <FeaturedShortcuts
          collapsed={collapsed}
          activeHref={activeNavigation?.item.href}
          canRenderClinicalLinks={canRenderNavItem("/filtro")}
        />
        <div className="mx-3 mt-2 border-t border-sidebar-border/60" />

        {/* Navigation */}
        <nav
          id="sidebar-nav"
          className="flex-1 py-2 px-2 space-y-1 overflow-y-auto"
          aria-label="Navegação principal em grupos recolhíveis"
        >
          {renderedSections.map((section, si) => {
            const sectionKey = section.title || "principal";
            const sectionOpen =
              !section.title ||
              collapsed ||
              (openSections[sectionKey] ?? false);
            return (
              <div key={sectionKey || si} className="space-y-1">
                {section.title && !collapsed && (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSections((prev) => ({
                        ...prev,
                        [sectionKey]: !(prev[sectionKey] ?? false),
                      }))
                    }
                    className="flex w-full items-center gap-2 rounded-lg px-3 pt-3 pb-1 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-expanded={sectionOpen}
                    aria-controls={`nav-section-${si}`}
                  >
                    <span className="flex-1 truncate">{section.title}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${sectionOpen ? "rotate-180" : ""}`}
                      style={{
                        transitionDuration: "320ms",
                        transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)",
                      }}
                      aria-hidden="true"
                    />
                  </button>
                )}
                {collapsed && section.title && (
                  <div className="border-t border-sidebar-border my-1 hidden lg:block" />
                )}
                <AnimatePresence initial={false}>
                  {sectionOpen && (
                    <motion.div
                      id={`nav-section-${si}`}
                      className="space-y-1 overflow-hidden"
                      initial={false}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
                    >
                      {section.items.map((item) => {
                        const active =
                          activeNavigation?.item.href === item.href;
                        const priority =
                          priorityNavHrefs.has(item.href) ||
                          item.tone === "priority";
                        const connection = item.tone === "connection";
                        const golden = item.tone === "golden";
                        return (
                          <Link
                            key={`${sectionKey}-${item.href}-${item.label}`}
                            href={item.href}
                          >
                            <div
                              title={
                                golden
                                  ? `${item.label} — Vídeo-EEG domiciliar`
                                  : priority
                                    ? `${item.label} — acesso prioritário`
                                    : undefined
                              }
                              data-testid={`nav-${item.label}`}
                              onMouseEnter={() => softHover()}
                              onClick={() => {
                                softTap();
                                haptic.select();
                              }}
                              className={`relative flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg cursor-pointer border transition-all duration-200 ${
                                golden
                                  ? active
                                    ? "border-amber-300 bg-gradient-to-r from-amber-100 via-amber-300 to-amber-700 text-amber-950 font-extrabold shadow-lg shadow-amber-400/40 dark:border-amber-300 dark:from-amber-800 dark:via-amber-500 dark:to-amber-200 dark:text-amber-950"
                                    : "border-amber-300/90 bg-gradient-to-r from-amber-50 via-amber-200 to-amber-500/80 text-amber-950 font-bold shadow-md shadow-amber-400/30 hover:translate-x-0.5 hover:shadow-lg hover:shadow-amber-400/45 dark:border-amber-400 dark:from-amber-900 dark:via-amber-700 dark:to-amber-400 dark:text-amber-50"
                                  : connection
                                    ? active
                                      ? "border-cyan-400/70 bg-cyan-100/80 text-cyan-950 font-semibold shadow-sm dark:border-cyan-700 dark:bg-cyan-950/55 dark:text-cyan-100"
                                      : "border-cyan-300/45 bg-cyan-50/55 text-cyan-950 hover:border-cyan-400/70 hover:bg-cyan-100/75 hover:translate-x-0.5 dark:border-cyan-800/70 dark:bg-cyan-950/30 dark:text-cyan-100 dark:hover:bg-cyan-950/55"
                                    : priority
                                      ? active
                                        ? "border-amber-400 bg-amber-200/90 text-amber-950 font-semibold shadow-sm dark:border-amber-600 dark:bg-amber-950/60 dark:text-amber-100"
                                        : "border-amber-300/80 bg-amber-100/70 text-amber-950 hover:bg-amber-200/90 hover:translate-x-0.5 dark:border-amber-700/70 dark:bg-amber-950/35 dark:text-amber-100 dark:hover:bg-amber-950/60"
                                      : active
                                        ? "border-transparent bg-[linear-gradient(90deg,hsl(var(--primary)/0.18),transparent)] text-primary font-semibold shadow-sm"
                                        : "border-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-0.5"
                              } ${collapsed ? "lg:justify-center" : ""}`}
                            >
                              <item.icon
                                className={`w-4 h-4 flex-shrink-0 transition-transform ${
                                  golden
                                    ? "text-amber-800 drop-shadow-sm dark:text-amber-100"
                                    : connection
                                      ? "text-cyan-700 dark:text-cyan-200"
                                      : priority
                                        ? "text-amber-700 dark:text-amber-300"
                                        : active
                                          ? "text-primary scale-110"
                                          : ""
                                }`}
                                strokeWidth={active ? 2 : 1.75}
                                aria-hidden="true"
                              />
                              {!collapsed && (
                                <span className="text-xs truncate">
                                  {item.label}
                                </span>
                              )}
                              {collapsed && (
                                <span className="text-xs truncate lg:hidden">
                                  {item.label}
                                </span>
                              )}
                              {golden && !collapsed && (
                                <motion.span
                                  initial={{ opacity: 0.58, scale: 0.92 }}
                                  animate={{
                                    opacity: [0.58, 1, 0.58],
                                    scale: [0.92, 1.08, 0.92],
                                  }}
                                  transition={{
                                    duration: 1.9,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                  className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-900/15 text-amber-900 dark:bg-amber-100/20 dark:text-amber-100"
                                  aria-label="Acesso ao site de vídeo-EEG"
                                >
                                  <Zap
                                    className="h-3 w-3"
                                    strokeWidth={2.5}
                                    aria-hidden="true"
                                  />
                                </motion.span>
                              )}
                              {!collapsed && connection && !active && (
                                <ArrowUpRight
                                  className="ml-auto h-3.5 w-3.5 text-cyan-600/75 dark:text-cyan-300/75"
                                  aria-label="Acesso integrado"
                                />
                              )}
                              {active && !collapsed && (
                                <motion.div
                                  layoutId="nav-active-dot"
                                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                                  transition={{
                                    duration: 0.2,
                                    ease: easing.smooth,
                                  }}
                                />
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="p-2 border-t border-sidebar-border space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className={`w-full ${collapsed ? "lg:justify-center lg:px-0" : "justify-start"}`}
            onClick={() => {
              softTap();
              haptic.tap();
              setDark(!dark);
            }}
            data-testid="button-theme-toggle"
            aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {!collapsed && (
              <span className="ml-2 text-sm">
                {dark ? "Modo Claro" : "Modo Escuro"}
              </span>
            )}
            {collapsed && (
              <span className="ml-2 text-sm lg:hidden">
                {dark ? "Modo Claro" : "Modo Escuro"}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`w-full ${collapsed ? "lg:justify-center lg:px-0" : "justify-start"}`}
            onClick={handleSessionAction}
            data-testid={
              accessMode === "remote"
                ? "button-session-exit"
                : "button-clear-local-data"
            }
            aria-label={
              accessMode === "remote"
                ? "Sair — encerrar sessão"
                : "Apagar dados locais — dados clínicos deste navegador"
            }
          >
            {accessMode === "remote" ? (
              <KeyRound className="w-4 h-4" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {!collapsed && (
              <span className="ml-2 text-sm">
                {accessMode === "remote" ? "Sair" : "Apagar dados locais"}
              </span>
            )}
            {collapsed && (
              <span className="ml-2 text-sm lg:hidden">
                {accessMode === "remote" ? "Sair" : "Apagar dados locais"}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`w-full ${collapsed ? "lg:justify-center lg:px-0" : "justify-start"}`}
            onClick={() => {
              softTap();
              haptic.tap();
              setCollapsed(!collapsed);
            }}
            data-testid="button-sidebar-toggle"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
            {!collapsed && (
              <span className="ml-2 text-xs text-muted-foreground">
                Recolher
              </span>
            )}
            {collapsed && (
              <span className="ml-2 text-sm lg:hidden">Expandir</span>
            )}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main
        ref={mainContentRef}
        id="main-content"
        tabIndex={-1}
        aria-label="Conteúdo principal"
        className={`np-app-main flex-1 min-w-0 transition-all duration-300 pt-14 lg:pt-0 print:!ml-0 print:!pt-0 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}
      >
        {showClinicalFlow && (
          <div className="sticky top-14 lg:top-0 z-30 border-b border-border bg-background/90 backdrop-blur px-3 py-2">
            <div className="flex items-center gap-2 overflow-x-auto text-[11px] text-muted-foreground">
              <ClipboardList className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="shrink-0 font-semibold text-foreground">
                Fluxo clínico
              </span>
              {flowSteps.map((step, index) => {
                const active =
                  activeNavigation?.item.label
                    .toLowerCase()
                    .includes(step.toLowerCase()) ||
                  (index === 1 && location === "/filtro");
                return (
                  <span
                    key={step}
                    className={`shrink-0 rounded-full border px-2 py-1 ${active ? "border-primary/50 bg-primary/15 text-primary font-medium" : "border-border/60 bg-muted/30 text-muted-foreground/80"}`}
                  >
                    {step}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        <div className="np-app-content p-3 md:p-5 max-w-[1600px] mx-auto">
          <div className="min-h-[calc(100vh-4rem)]">{children}</div>
          {/* Aviso educativo: síntese sempre visível; fundamentação completa sob demanda. */}
          <aside
            role="note"
            aria-label="Aviso de finalidade educativa"
            className="np-legal-disclosure mt-8 rounded-2xl border border-amber-300/55 bg-amber-50/75 px-3.5 py-3 text-amber-950 shadow-sm dark:border-amber-800/45 dark:bg-amber-950/25 dark:text-amber-100"
          >
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-semibold leading-relaxed marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <span aria-hidden="true" className="text-sm">
                  ⚕️
                </span>
                <span className="flex-1">
                  Uso educativo — não substitui avaliação, diagnóstico ou
                  conduta profissional.
                </span>
                <span className="rounded-full border border-amber-400/45 bg-white/55 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-amber-900 transition group-open:hidden dark:bg-white/5 dark:text-amber-100">
                  Detalhes
                </span>
                <span className="hidden rounded-full border border-amber-400/45 bg-white/55 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-amber-900 group-open:inline-flex dark:bg-white/5 dark:text-amber-100">
                  Recolher
                </span>
              </summary>
              <div className="mt-3 border-t border-amber-300/45 pt-3 text-[11px] leading-relaxed text-amber-900/90 dark:border-amber-800/45 dark:text-amber-100/85">
                O NeuroPed é uma ferramenta de{" "}
                <strong className="font-semibold">informação e educação</strong>
                . Não é dispositivo médico e não realiza diagnóstico, prescrição
                ou tratamento. O conteúdo não estabelece relação médico-paciente
                e não substitui consulta, avaliação ou conduta de profissional
                habilitado. Em caso de dúvida, sintoma ou urgência, procure um
                médico ou serviço de saúde.{" "}
                <Link
                  href="/termos"
                  className="font-bold underline underline-offset-2 hover:opacity-80"
                >
                  Termos de Uso e Aviso Legal
                </Link>
                .
              </div>
            </details>
          </aside>
          {/* Assinatura autoral global: reconhecimento visível, sem competir com o conteúdo. */}
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-[9.5px] leading-snug text-muted-foreground/85">
            <img
              src="/dr-jadson-shield-badge.webp"
              alt=""
              width="256"
              height="256"
              loading="lazy"
              decoding="async"
              className="h-3.5 w-3.5 shrink-0 rounded-[0.3rem] object-cover opacity-75"
            />
            <span>NeuroPed é um projeto autoral de</span>
            <Link
              href="/sobre"
              className="font-bold text-foreground underline decoration-primary/40 underline-offset-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Dr. Jadson Fraga
            </Link>
            <span>· Conteúdo educativo e proprietário.</span>
          </p>
        </div>
      </main>
    </div>
  );
}
