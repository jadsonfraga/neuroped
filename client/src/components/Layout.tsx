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
  Settings2,
  Trash2,
  Zap,
  ArrowUpRight,
  Volume2,
  VolumeX,
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
import { useUiPreferences } from "@/hooks/useUiPreferences";

const NESPLORA_SITE_URL = "/nesplora/";

// ─────────────────────────── Atalhos em destaque ───────────────────────────
// Hierarquia deliberada em dois níveis: dois cartões-herói dourados (as
// conexões institucionais Nesplora e EEG) e, abaixo, uma grade de ações
// rápidas neutras com o ícone acima do rótulo — o rótulo centralizado quebra
// por palavra e nunca é cortado, em qualquer largura de drawer. Todo o visual
// vive em styles/sidebar-v13.css; aqui ficam apenas estrutura e estado.
function FeaturedShortcuts({
  collapsed,
  activeHref,
  canRenderNavItem,
}: {
  collapsed: boolean;
  activeHref?: string;
  canRenderNavItem: (path: string) => boolean;
}) {
  if (IS_PUBLIC_ZONE) return null;

  const visibleFeaturedNavigation = featuredNavigation.filter((item) =>
    canRenderNavItem(item.href),
  );
  if (visibleFeaturedNavigation.length === 0) return null;

  const onPick = () => {
    softTap();
    haptic.select();
  };
  const isExternalShortcut = (href: string) => href === NESPLORA_SITE_URL;
  const withLink = (
    item: (typeof featuredNavigation)[number],
    node: React.ReactNode,
  ) =>
    isExternalShortcut(item.href) ? (
      <a key={item.href} href={item.href}>
        {node}
      </a>
    ) : (
      <Link key={item.href} href={item.href}>
        {node}
      </Link>
    );

  const heroes = visibleFeaturedNavigation.slice(0, 2);
  const tiles = visibleFeaturedNavigation.slice(2);

  const renderHero = (item: (typeof featuredNavigation)[number]) => {
    const Icon = item.icon;
    const active = activeHref === item.href;
    return withLink(
      item,
      <div
        onClick={onPick}
        onMouseEnter={() => softHover()}
        data-testid={`featured-${item.label}`}
        data-active={active || undefined}
        className="np-side-hero group"
      >
        <span aria-hidden="true" className="np-side-hero__glow" />
        <span className="np-side-hero__icon">
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="np-side-hero__label">{item.label}</span>
          <span className="np-side-hero__desc">{item.description}</span>
        </span>
        <span className="np-side-hero__go">
          {isExternalShortcut(item.href) ? (
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </span>
      </div>,
    );
  };

  const renderTile = (item: (typeof featuredNavigation)[number]) => {
    const Icon = item.icon;
    const active = activeHref === item.href;
    return withLink(
      item,
      <div
        onClick={onPick}
        onMouseEnter={() => softHover()}
        data-testid={`featured-${item.label}`}
        data-active={active || undefined}
        title={item.description}
        className="np-side-tile group"
      >
        <span className="np-side-tile__icon">
          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="np-side-tile__label">{item.label}</span>
      </div>,
    );
  };

  const iconRail = visibleFeaturedNavigation.map((item) => {
    const Icon = item.icon;
    const active = activeHref === item.href;
    const golden = (item.tone ?? "priority") === "golden";
    return withLink(
      item,
      <div
        title={`${item.label}${item.description ? ` — ${item.description}` : ""}`}
        aria-label={item.label}
        onClick={onPick}
        onMouseEnter={() => softHover()}
        data-active={active || undefined}
        className={`np-side-rail-icon ${golden ? "np-side-rail-icon--golden" : ""}`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>,
    );
  });

  const expanded = (
    <>
      <div className="np-side-kicker">
        <p>Destaques</p>
        <span className="np-side-kicker__badge">app</span>
      </div>
      <div className="space-y-1.5">{heroes.map(renderHero)}</div>
      {tiles.length > 0 && (
        <>
          <div className="np-side-kicker np-side-kicker--sub">
            <p>Ações rápidas</p>
          </div>
          <div className="grid grid-cols-2 gap-1.5">{tiles.map(renderTile)}</div>
        </>
      )}
    </>
  );

  return (
    <div className="px-2 pt-3">
      {!collapsed ? (
        expanded
      ) : (
        <>
          <div className="lg:hidden">{expanded}</div>
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

const sessionRoleLabels: Record<string, string> = {
  admin: "Administrador",
  professional: "Profissional",
  reader: "Leitura",
  operator: "Operacional",
};

function sessionInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "•";
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { accessMode, isAuthenticated, isLoading, logout, user } = useAuth();
  const { soundOn, toggleSound } = useUiPreferences();
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
  // que a sidebar preserve ritmo de aplicativo mesmo com muitos módulos. A
  // escolha do usuário é lembrada entre visitas — reabrir tudo a cada sessão
  // desfaz a curadoria que ele mesmo fez.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      const defaults: Record<string, boolean> = {
        principal: true,
        ATENDIMENTO: true,
        "TRIAGEM E FERRAMENTAS": true,
      };
      if (typeof window === "undefined") return defaults;
      try {
        const saved = localStorage.getItem("neuroped:sidebar-sections");
        if (!saved) return defaults;
        const parsed = JSON.parse(saved) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return defaults;
        }
        const sanitized: Record<string, boolean> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === "boolean") sanitized[key] = value;
        }
        return { ...defaults, ...sanitized };
      } catch {
        return defaults;
      }
    },
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        "neuroped:sidebar-sections",
        JSON.stringify(openSections),
      );
    } catch {
      /* storage indisponível (modo privado/cota) — silencioso */
    }
  }, [openSections]);
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
    // prettier-ignore
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
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={toggleSound}
            data-testid="button-sound-toggle-mobile"
            aria-label={
              soundOn
                ? "Desativar sons da interface"
                : "Ativar sons da interface"
            }
            aria-pressed={soundOn}
            title={soundOn ? "Sons ligados" : "Sons desligados"}
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4" aria-hidden="true" />
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
        <div className="np-side-brand flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
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

        {/* Área central rolável: busca, atalhos e navegação rolam como um
            bloco único. Antes, apenas o <nav> rolava e os cards de acessos
            prioritários ficavam fixos, esmagando o menu em telas de celular. */}
        <div className="np-sidebar-scroll flex-1 min-h-0 overflow-y-auto">
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
          canRenderNavItem={canRenderNavItem}
        />
        <div className="np-side-divider mx-3 mt-3 border-t border-sidebar-border/60" />

        {/* Navigation */}
        <nav
          id="sidebar-nav"
          className="py-2 px-2 space-y-1"
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
                        // A lista fica calma por padrão: só o item ativo tem
                        // fundo + barra de acento (via CSS). Tons especiais
                        // sinalizam apenas pelo tinte do ícone e por um marcador
                        // discreto à direita, sem fundos gritando em série.
                        const tone = golden
                          ? "golden"
                          : connection
                            ? "connection"
                            : priority
                              ? "priority"
                              : "default";
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
                              data-tone={tone}
                              data-active={active || undefined}
                              onMouseEnter={() => softHover()}
                              onClick={() => {
                                softTap();
                                haptic.select();
                              }}
                              className={`np-nav-item relative flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg cursor-pointer ${collapsed ? "lg:justify-center" : ""}`}
                            >
                              <item.icon
                                className="np-nav-item__icon w-4 h-4 flex-shrink-0"
                                strokeWidth={active ? 2 : 1.75}
                                aria-hidden="true"
                              />
                              {!collapsed && (
                                <span className="np-nav-item__label text-xs truncate">
                                  {item.label}
                                </span>
                              )}
                              {collapsed && (
                                <span className="np-nav-item__label text-xs truncate lg:hidden">
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
                                  className="np-nav-item__zap ml-auto flex h-5 w-5 items-center justify-center rounded-full"
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
                                  className="np-nav-item__link-mark ml-auto h-3.5 w-3.5"
                                  aria-label="Acesso integrado"
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
        </div>

        {/* Rodapé: identidade da sessão primeiro, utilitários depois. */}
        <div className="np-side-footer p-2 border-t border-sidebar-border space-y-1.5">
          {accessMode === "remote" && isAuthenticated && user ? (
            // Quem está dentro — e a saída sempre à mão, sem ocupar uma
            // linha inteira de rodapé só para o verbo "Sair".
            <div
              className={`np-side-session ${collapsed ? "np-side-session--rail" : ""}`}
            >
              <span
                aria-hidden="true"
                className={`np-side-session__avatar ${collapsed ? "lg:hidden" : ""}`}
              >
                {sessionInitials(user.name)}
              </span>
              <span
                className={`np-side-session__id ${collapsed ? "lg:hidden" : ""}`}
              >
                <span className="np-side-session__name">{user.name}</span>
                <span className="np-side-session__role">
                  {sessionRoleLabels[user.role] ?? user.role}
                </span>
              </span>
              <a
                href="#/configuracoes"
                className="np-side-session__exit inline-flex h-8 items-center justify-center rounded-md px-2 hover:bg-sidebar-accent"
                data-testid="link-session-settings"
                aria-label="Configurações da conta e da clínica"
                title="Configurações"
              >
                <Settings2 className="w-4 h-4" />
                <span className="sr-only">Configurações</span>
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="np-side-session__exit px-2"
                onClick={handleSessionAction}
                data-testid="button-session-exit"
                aria-label="Sair — encerrar sessão"
                title={`Sair — ${user.name}`}
              >
                <KeyRound className="w-4 h-4" />
                <span className="sr-only">Sair</span>
              </Button>
            </div>
          ) : accessMode === "remote" ? (
            // Sem sessão (ex.: tela de login) o rodapé convida a entrar —
            // mostrar "Sair" deslogado era um contrassenso.
            <Link href="/login">
              <div
                className={`np-side-login ${collapsed ? "np-side-session--rail" : ""}`}
                onClick={() => {
                  softTap();
                  haptic.tap();
                }}
                data-testid="button-session-enter"
                title="Entrar com segurança"
              >
                <KeyRound className="w-4 h-4" aria-hidden="true" />
                <span className={collapsed ? "lg:hidden" : ""}>Entrar</span>
              </div>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={`w-full ${collapsed ? "lg:justify-center lg:px-0" : "justify-start"}`}
              onClick={handleSessionAction}
              data-testid="button-clear-local-data"
              aria-label="Apagar dados locais — dados clínicos deste navegador"
            >
              <Trash2 className="w-4 h-4" />
              <span
                className={`ml-2 text-sm ${collapsed ? "lg:hidden" : ""}`}
              >
                Apagar dados locais
              </span>
            </Button>
          )}
          <div
            className={`grid gap-1 ${collapsed ? "grid-cols-2 lg:grid-cols-1" : "grid-cols-2"}`}
          >
            <Button
              variant="ghost"
              size="sm"
              className={`np-side-utility ${collapsed ? "lg:justify-center lg:px-0" : "justify-start"}`}
              onClick={toggleSound}
              data-testid="button-sound-toggle"
              aria-label={
                soundOn
                  ? "Desativar sons da interface"
                  : "Ativar sons da interface"
              }
              aria-pressed={soundOn}
            >
              {soundOn ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span
                className={`ml-2 text-xs ${collapsed ? "lg:hidden" : ""}`}
              >
                {soundOn ? "Sons" : "Sem som"}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`np-side-utility ${collapsed ? "lg:justify-center lg:px-0" : "justify-start"}`}
              onClick={() => {
                softTap();
                haptic.tap();
                setDark(!dark);
              }}
              data-testid="button-theme-toggle"
              aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
            >
              {dark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
              <span
                className={`ml-2 text-xs ${collapsed ? "lg:hidden" : ""}`}
              >
                {dark ? "Claro" : "Escuro"}
              </span>
            </Button>
          </div>
          {/* Recolher só altera a largura da sidebar fixa de desktop; no
              drawer mobile o botão não tem efeito visível e apenas ocupava
              uma linha do rodapé. */}
          <div className="hidden lg:block">
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
            </Button>
          </div>
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
            {/* prettier-ignore */}
            <Link href="/sobre" className="font-bold text-foreground underline decoration-primary/40 underline-offset-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Dr. Jadson Fraga
            </Link>
            <span>· Conteúdo educativo e proprietário.</span>
          </p>
        </div>
      </main>
    </div>
  );
}
