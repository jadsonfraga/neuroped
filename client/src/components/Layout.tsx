import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Moon, Sun, ChevronLeft, ChevronRight, ChevronDown, Menu, X, Search, ClipboardList, KeyRound, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCommandPalette } from "@/lib/commandPaletteBus";
import { softTap, softHover, softWhoosh } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { easing, duration, fadeIn } from "@/lib/motion";
import { SkipNav } from "@/components/SkipNav";
import { OfflineBanner } from "@/components/ui/VisualStates";
import { navSections, getNavigationMatch } from "@/data/navigation";
import { isPublicRoute } from "@/lib/publicRoutes";
import { IS_PUBLIC_ZONE } from "@/lib/zone";

// ─────────────────────────── Atalhos em destaque ───────────────────────────
// Dois recursos-âncora do app, fixados no topo da sidebar (acima da lista longa)
// para que fiquem sempre à mão: o Filtro Clínico Inteligente e a Avaliação
// Cognitiva Infantil. Cartões desenhados à mão (não mapeados) para manter as
// classes Tailwind estáticas e o visual polido de cada acento.
function FeaturedShortcuts({ collapsed, activeHref }: { collapsed: boolean; activeHref?: string }) {
  const onPick = () => { softTap(); haptic.select(); };

  const FullCards = (
    <div className="space-y-1.5">
      <Link href="/filtro">
        <div
          onClick={onPick}
          onMouseEnter={() => softHover()}
          data-testid="featured-filtro"
          className={`group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
            activeHref === "/filtro"
              ? "border-primary/50 bg-gradient-to-br from-primary/20 via-primary/12 to-chart-2/12 shadow-sm"
              : "border-primary/25 bg-gradient-to-br from-primary/12 via-primary/[0.07] to-chart-2/10 hover:border-primary/40"
          }`}
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-2 text-white shadow-sm shadow-primary/30">
            <Filter className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold leading-tight text-foreground">Filtro de Escalas</span>
            <span className="block text-[10px] leading-tight text-muted-foreground">Por idade e queixa</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-primary/50 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </div>
      </Link>
      <Link href="/avaliacao-cognitiva-infantil">
        <div
          onClick={onPick}
          onMouseEnter={() => softHover()}
          data-testid="featured-avaliacao-cognitiva"
          className={`group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
            activeHref === "/avaliacao-cognitiva-infantil"
              ? "border-violet-400/50 bg-gradient-to-br from-violet-500/20 via-violet-500/12 to-blue-500/12 shadow-sm"
              : "border-violet-400/25 bg-gradient-to-br from-violet-500/12 via-violet-500/[0.07] to-blue-500/10 hover:border-violet-400/40"
          }`}
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-sm shadow-violet-600/30">
            <Brain className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold leading-tight text-foreground">Avaliação Cognitiva Infantil</span>
            <span className="block text-[10px] leading-tight text-muted-foreground">Triagem lúdica · 2–19 anos</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-violet-500/50 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </div>
      </Link>
    </div>
  );

  const IconRail = (
    <div className="flex flex-col items-center gap-1.5">
      <Link href="/filtro">
        <div
          onClick={onPick}
          title="Filtro de Escalas"
          aria-label="Filtro de Escalas"
          className={`flex h-10 w-10 items-center justify-center rounded-xl border text-primary transition-colors ${
            activeHref === "/filtro" ? "border-primary/50 bg-primary/20" : "border-primary/25 bg-gradient-to-br from-primary/15 to-chart-2/10 hover:border-primary/40"
          }`}
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
        </div>
      </Link>
      <Link href="/avaliacao-cognitiva-infantil">
        <div
          onClick={onPick}
          title="Avaliação Cognitiva Infantil"
          aria-label="Avaliação Cognitiva Infantil"
          className={`flex h-10 w-10 items-center justify-center rounded-xl border text-violet-600 dark:text-violet-400 transition-colors ${
            activeHref === "/avaliacao-cognitiva-infantil" ? "border-violet-400/50 bg-violet-500/20" : "border-violet-400/25 bg-gradient-to-br from-violet-500/15 to-blue-500/10 hover:border-violet-400/40"
          }`}
        >
          <Brain className="h-4 w-4" aria-hidden="true" />
        </div>
      </Link>
    </div>
  );

  return (
    <div className="px-2 pt-2">
      {!collapsed ? (
        <>
          <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Destaques</p>
          {FullCards}
        </>
      ) : (
        <>
          {/* Mobile (drawer largo): mostra os cartões completos */}
          <div className="md:hidden">
            <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Destaques</p>
            {FullCards}
          </div>
          {/* Desktop recolhido: trilha de ícones */}
          <div className="hidden md:block">{IconRail}</div>
        </>
      )}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
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
  // Chaves = títulos REAIS das seções (navigation.ts). Abre por padrão as duas
  // mais usadas; as demais começam recolhidas (a seção da rota atual auto-expande).
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({
    principal: true,
    "TRABALHO CLÍNICO": true,
    "REFERÊNCIA": true,
  }));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("neuroped:theme", dark ? "dark" : "light");
    } catch { /* storage indisponível (modo privado/cota) — silencioso */ }
  }, [dark]);

  useEffect(() => {
    try {
      localStorage.setItem("neuroped:sidebar-collapsed", collapsed ? "1" : "0");
    } catch { /* storage indisponível (modo privado/cota) — silencioso */ }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (location !== "/") softWhoosh();
  }, [location]);

  // Auto-expande a seção que contém a rota atual e rola o item ativo para a vista
  // — o usuário sempre vê onde está e os instrumentos vizinhos, sem abrir nada.
  useEffect(() => {
    const match = getNavigationMatch(location);
    const title = match?.section.title;
    if (title) setOpenSections((prev) => (prev[title] ? prev : { ...prev, [title]: true }));
    const label = match?.item.label;
    if (!label) return;
    const t = setTimeout(() => {
      document.querySelector(`[data-testid="nav-${label}"]`)?.scrollIntoView({ block: "nearest" });
    }, 80);
    return () => clearTimeout(t);
  }, [location]);

  const activeNavigation = getNavigationMatch(location);
  const showClinicalFlow = location !== "/" && location !== "/login" && location !== "/sessao-expirada";
  // Na zona pública (host das famílias) o menu mostra só o conteúdo aberto.
  const visibleSections = IS_PUBLIC_ZONE
    ? navSections
        .map((s) => ({ ...s, items: s.items.filter((i) => isPublicRoute(i.href)) }))
        .filter((s) => s.items.length > 0)
    : navSections;
  // Selo de conteúdo educativo — aparece nas páginas públicas (para famílias).
  const onPublicPage = isPublicRoute(location);
  const flowSteps = ["Paciente", "Queixa", "Escala", "Aplicação", "Resultado", "Documento", "Histórico"];

  function handleLocalLock() {
    softTap();
    haptic.tap();
    try {
      sessionStorage.removeItem("neuroped:pin-ok");
      sessionStorage.removeItem("neuroped:access");
      sessionStorage.removeItem("neuroped:local-unlocked");
      localStorage.removeItem("neuroped:local-unlocked-persistent");
    } catch { /* storage indisponível — recarregar ainda força rechecagem do gate */ }
    window.location.hash = "#/";
    window.location.reload();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SkipNav />
      <OfflineBanner />

      {/* Mobile top header bar */}
      <header className="print:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b border-sidebar-border bg-sidebar/95 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: duration.normal, ease: easing.spring }}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--chart-2)))",
              boxShadow: "0 4px 14px hsl(var(--primary) / 0.3)",
            }}
          >
            <Brain className="w-4 h-4 text-white" strokeWidth={1.75} />
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
            {dark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
          </Button>
          <Button
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
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
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
        className={[
          "print:hidden",
          "fixed left-0 top-0 h-full z-50 flex flex-col border-r border-sidebar-border bg-sidebar",
          "transition-transform duration-300 md:transition-all md:duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
          collapsed ? "md:w-16" : "md:w-64",
          "w-64",
        ].join(" ")}
        style={{
          boxShadow: mobileOpen ? "0 0 60px hsl(260 30% 15% / 0.25)" : undefined,
        }}
      >
        {/* Logo + close button on mobile */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--chart-2)))",
              boxShadow: "0 4px 14px hsl(var(--primary) / 0.35)",
            }}
          >
            <Brain className="w-5 h-5 text-white" strokeWidth={1.75} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <h1
                className="text-base tracking-tight text-sidebar-foreground leading-tight"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                NeuroPed
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/40 leading-tight mt-0.5">
                Neuropediatria
              </p>
            </div>
          )}
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="sm"
            className="px-2 md:hidden ml-auto"
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
            aria-label="Buscar escala, teste ou módulo"
            className={`flex items-center gap-2 w-full min-h-[40px] rounded-lg border border-sidebar-border bg-sidebar-accent/40 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors ${
              collapsed ? "md:justify-center md:px-0 px-3" : "px-3"
            }`}
          >
            <Search className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {!collapsed && (
              <>
                <span className="text-xs">Buscar escala, teste ou módulo</span>
                <kbd className="ml-auto hidden text-[10px] font-mono px-1.5 py-0.5 rounded border border-sidebar-border bg-background/50 md:inline-flex">
                  Ctrl K
                </kbd>
              </>
            )}
            {collapsed && <span className="text-xs md:hidden">Buscar escala, teste ou módulo</span>}
          </button>
        </div>

        {/* Atalhos em destaque */}
        <FeaturedShortcuts collapsed={collapsed} activeHref={activeNavigation?.item.href} />
        <div className="mx-3 mt-2 border-t border-sidebar-border/60" />

        {/* Navigation */}
        <nav id="sidebar-nav" className="flex-1 py-2 px-2 space-y-1 overflow-y-auto" aria-label="Navegação principal em grupos recolhíveis">
          {visibleSections.map((section, si) => {
            const sectionKey = section.title || "principal";
            const sectionOpen = !section.title || collapsed || (openSections[sectionKey] ?? false);
            return (
              <div key={sectionKey || si} className="space-y-1">
                {section.title && !collapsed && (
                  <button
                    type="button"
                    onClick={() => setOpenSections((prev) => ({ ...prev, [sectionKey]: !(prev[sectionKey] ?? false) }))}
                    className="flex w-full items-center gap-2 rounded-lg px-3 pt-3 pb-1 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-expanded={sectionOpen}
                    aria-controls={`nav-section-${si}`}
                  >
                    <span className="flex-1 truncate">{section.title}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${sectionOpen ? "rotate-180" : ""}`}
                      style={{ transitionDuration: "320ms", transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                      aria-hidden="true"
                    />
                  </button>
                )}
                {collapsed && section.title && (
                  <div className="border-t border-sidebar-border my-1 hidden md:block" />
                )}
                <AnimatePresence initial={false}>
                {sectionOpen && (
                  <motion.div
                    id={`nav-section-${si}`}
                    className="space-y-1 overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
                  >
                    {section.items.map((item) => {
                      const active = activeNavigation?.item.href === item.href;
                      return (
                        <Link key={`${sectionKey}-${item.href}-${item.label}`} href={item.href}>
                          <div
                            data-testid={`nav-${item.label}`}
                            onMouseEnter={() => softHover()}
                            onClick={() => {
                              softTap();
                              haptic.select();
                            }}
                            className={`flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg cursor-pointer transition-all duration-200 ${
                              active
                                ? "bg-[linear-gradient(90deg,hsl(var(--primary)/0.18),transparent)] text-primary font-semibold shadow-sm"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-0.5"
                            } ${collapsed ? "md:justify-center" : ""}`}
                          >
                            <item.icon
                              className={`w-4 h-4 flex-shrink-0 transition-transform ${
                                active ? "text-primary scale-110" : ""
                              }`}
                              strokeWidth={active ? 2 : 1.75}
                              aria-hidden="true"
                            />
                            {!collapsed && (
                              <span className="text-xs truncate">{item.label}</span>
                            )}
                            {collapsed && (
                              <span className="text-xs truncate md:hidden">{item.label}</span>
                            )}
                            {active && !collapsed && (
                              <motion.div
                                layoutId="nav-active-dot"
                                className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                                transition={{ duration: 0.2, ease: easing.smooth }}
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
            className={`w-full ${collapsed ? "md:justify-center md:px-0" : "justify-start"}`}
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
              <span className="ml-2 text-sm">{dark ? "Modo Claro" : "Modo Escuro"}</span>
            )}
            {collapsed && (
              <span className="ml-2 text-sm md:hidden">{dark ? "Modo Claro" : "Modo Escuro"}</span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`w-full ${collapsed ? "md:justify-center md:px-0" : "justify-start"}`}
            onClick={handleLocalLock}
            data-testid="button-local-lock"
            aria-label="Bloquear acesso local"
          >
            <KeyRound className="w-4 h-4" />
            {!collapsed && <span className="ml-2 text-sm">Bloquear acesso</span>}
            {collapsed && <span className="ml-2 text-sm md:hidden">Bloquear acesso</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`w-full ${collapsed ? "md:justify-center md:px-0" : "justify-start"}`}
            onClick={() => {
              softTap();
              haptic.tap();
              setCollapsed(!collapsed);
            }}
            data-testid="button-sidebar-toggle"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="ml-2 text-xs text-muted-foreground/60">Recolher</span>}
            {collapsed && <span className="ml-2 text-sm md:hidden">Expandir</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main
        id="main-content"
        className={`flex-1 min-w-0 transition-all duration-300 pt-14 md:pt-0 print:!ml-0 print:!pt-0 ${collapsed ? "md:ml-16" : "md:ml-64"}`}
      >
        {showClinicalFlow && (
          <div className="sticky top-14 md:top-0 z-30 border-b border-border bg-background/90 backdrop-blur px-3 py-2">
            <div className="flex items-center gap-2 overflow-x-auto text-[11px] text-muted-foreground">
              <ClipboardList className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="shrink-0 font-semibold text-foreground">Fluxo clínico</span>
              {flowSteps.map((step, index) => {
                const active = activeNavigation?.item.label.toLowerCase().includes(step.toLowerCase()) || (index === 1 && location === "/filtro");
                return (
                  <span key={step} className={`shrink-0 rounded-full border px-2 py-1 ${active ? "border-primary/50 bg-primary/15 text-primary font-medium" : "border-border/60 bg-muted/30 text-muted-foreground/80"}`}>
                    {step}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        <div className="p-3 md:p-5 max-w-[1600px] mx-auto">
          {onPublicPage && (
            <div
              role="note"
              className="mb-3 flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200"
            >
              <span aria-hidden="true" className="mt-px">ℹ️</span>
              <span><strong className="font-semibold">Conteúdo educativo.</strong> Estas informações apoiam e orientam as famílias — <strong className="font-semibold">não substituem</strong> a avaliação, o diagnóstico ou a conduta de um profissional de saúde.</span>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
