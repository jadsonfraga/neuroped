import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Moon, Sun, ChevronLeft, ChevronRight, ChevronDown, Menu, X, Search, ClipboardList, KeyRound, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCommandPalette } from "@/components/CommandPalette";
import { softTap, softHover, softWhoosh } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { easing, duration, fadeIn } from "@/lib/motion";
import { SkipNav } from "@/components/SkipNav";
import { OfflineBanner } from "@/components/ui/VisualStates";
import { navSections, getNavigationMatch } from "@/data/navigation";

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
    "Recepção e pré-consulta": true,
    "Escalas principais": true,
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
              <p className="text-[11px] text-muted-foreground leading-tight italic">
                App clínico guiado
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
          {!collapsed && (
            <Link href="/filtro">
              <div className="flex min-h-[38px] cursor-pointer items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/15">
                <Filter className="h-4 w-4" aria-hidden="true" />
                Filtrar por idade e queixa
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav id="sidebar-nav" className="flex-1 py-2 px-2 space-y-1 overflow-y-auto" aria-label="Navegação principal em grupos recolhíveis">
          {navSections.map((section, si) => {
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
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sectionOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                )}
                {collapsed && section.title && (
                  <div className="border-t border-sidebar-border my-1 hidden md:block" />
                )}
                {sectionOpen && (
                  <div id={`nav-section-${si}`} className="space-y-1">
                    {section.items.map((item) => {
                      // Exact match OR location starts with item href followed by /
                      // (e.g. /filtro active when on /generic-scale/:id if no closer match exists)
                      const active =
                        location === item.href ||
                        (item.href !== "/" && location.startsWith(item.href + "/"));
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
                                ? "bg-primary/10 text-primary font-semibold shadow-sm"
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
                  </div>
                )}
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
            {!collapsed && <span className="ml-2 text-sm">Recolher</span>}
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
                  <span key={step} className={`shrink-0 rounded-full border px-2 py-1 ${active ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card/60"}`}>
                    {step}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        <div className="p-3 md:p-5 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
