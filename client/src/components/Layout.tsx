import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Home, ClipboardCheck, Baby, Activity,
  Moon, Sun, ChevronLeft, ChevronRight, BookOpen,
  BarChart3, ShieldAlert, ClipboardList, Users, FileText,
  CloudRain, HeartPulse, Wine, ListChecks, Zap,
  BrainCircuit, Gauge, Heart, Accessibility, Sparkles,
  Puzzle, Calendar, Fingerprint, Menu, X, GraduationCap,
  Stethoscope, Waves, Flame, VolumeX, UtensilsCrossed, AlertTriangle, Pill,
  Filter, User, BrainCog, Ear, School, ClipboardPlus, SmilePlus, HelpCircle,
  Target, Lightbulb, Calculator, TrendingUp, GitBranch,
  MessageCircle, FileSignature, BookMarked, ShieldCheck, Newspaper, KeyRound, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCommandPalette } from "@/components/CommandPalette";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { softTap, softHover, softWhoosh } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { easing, duration, fadeIn } from "@/lib/motion";
import { SkipNav } from "@/components/SkipNav";
import { OfflineBanner } from "@/components/ui/VisualStates";

interface NavSection {
  title: string;
  items: { href: string; label: string; icon: any }[];
}

const navSections: NavSection[] = [
  {
    title: "",
    items: [
      { href: "/", label: "Início", icon: Home },
    ],
  },
  {
    title: "Ferramentas",
    items: [
      { href: "/filtro", label: "Filtro Inteligente", icon: Filter },
      { href: "/prontuario", label: "Prontuário Clínico", icon: ClipboardPlus },
      { href: "/pacientes", label: "Meus Pacientes", icon: Users },
      { href: "/satisfacao-medicacao", label: "Satisfação Medicação", icon: SmilePlus },
      { href: "/caa", label: "CAA · Vou Falar", icon: MessageCircle },
      { href: "/assinatura-digital", label: "Assinatura Digital", icon: FileSignature },
    ],
  },
  {
    title: "Neurodesenvolvimento",
    items: [
      { href: "/mchat", label: "M-CHAT-R/F", icon: Baby },
      { href: "/cars", label: "CARS-2", icon: ClipboardCheck },
      { href: "/denver", label: "Denver II", icon: BookOpen },
      { href: "/asq3", label: "ASQ-3", icon: Baby },
      { href: "/gmfcs", label: "GMFCS", icon: Accessibility },
      { href: "/tea", label: "Checklists TEA", icon: Puzzle },
      { href: "/tea-comportamentos", label: "Comport. TEA", icon: Fingerprint },
    ],
  },
  {
    title: "Comportamento e TDAH",
    items: [
      { href: "/snap", label: "SNAP-IV", icon: Activity },
      { href: "/sdq", label: "SDQ", icon: BarChart3 },
      { href: "/conners", label: "Conners", icon: ClipboardList },
      { href: "/cbcl", label: "CBCL", icon: ListChecks },
      { href: "/vanderbilt", label: "Vanderbilt", icon: Zap },
      { href: "/brief2", label: "BRIEF-2", icon: BrainCircuit },
      { href: "/abc", label: "ABC", icon: Gauge },
      { href: "/vineland", label: "Vineland-3", icon: Users },
    ],
  },
  {
    title: "Saúde Mental",
    items: [
      { href: "/scared", label: "SCARED", icon: ShieldAlert },
      { href: "/cdi2", label: "CDI-2", icon: CloudRain },
      { href: "/phqa", label: "PHQ-A", icon: HeartPulse },
      { href: "/cssrs", label: "C-SSRS", icon: ShieldAlert },
      { href: "/crafft", label: "CRAFFT", icon: Wine },
      { href: "/psc17", label: "PSC-17", icon: ClipboardList },
      { href: "/gad7", label: "GAD-7", icon: AlertTriangle },
      { href: "/aq10", label: "AQ-10 (TEA Adulto)", icon: Puzzle },
    ],
  },
  {
    title: "Sono e Qualidade de Vida",
    items: [
      { href: "/cshq", label: "CSHQ", icon: Moon },
      { href: "/ygtss", label: "YGTSS", icon: Sparkles },
      { href: "/pedsql", label: "PedsQL", icon: Heart },
    ],
  },
  {
    title: "Diários Clínicos",
    items: [
      { href: "/diario-sono", label: "Diário do Sono", icon: Moon },
      { href: "/diario-alimentar", label: "Diário Alimentar", icon: UtensilsCrossed },
      { href: "/diario-escola", label: "Diário Escolar", icon: School },
      { href: "/epilepsia", label: "Diário Epilepsia", icon: Zap },
      { href: "/cefaleia", label: "Calendário Cefaleia", icon: Calendar },
    ],
  },
  {
    title: "Bateria Dr. Jadson",
    items: [
      { href: "/bateria-jadson", label: "Bateria (Hub)", icon: Stethoscope },
      { href: "/emdi", label: "EMDI", icon: Baby },
      { href: "/eaf", label: "EAF", icon: Users },
      { href: "/pdae", label: "PDAE", icon: GraduationCap },
      { href: "/ecsm", label: "ECSM", icon: Brain },
      { href: "/ips", label: "IPS", icon: Waves },
    ],
  },
  {
    title: "Regulação Emocional",
    items: [
      { href: "/ecar-si", label: "ECAR-SI", icon: ShieldAlert },
      { href: "/edi", label: "EDI", icon: CloudRain },
      { href: "/eai", label: "EAI", icon: AlertTriangle },
      { href: "/easi", label: "EASI", icon: Users },
      { href: "/ems", label: "EMS", icon: VolumeX },
      { href: "/etare", label: "ETARE", icon: UtensilsCrossed },
      { href: "/eaah", label: "EAAH", icon: Flame },
    ],
  },
  {
    title: "Testes Diretos (Criança)",
    items: [
      { href: "/testes-reconhecimento", label: "Cores/Letras/Animais/Corpo", icon: Baby },
      { href: "/testes-academicos", label: "Leitura/Escrita/Aritmética", icon: GraduationCap },
      { href: "/inventarios-auto", label: "Autoavaliação (8 áreas)", icon: ClipboardCheck },
      { href: "/tde2", label: "TDE-2 Adaptado", icon: BookOpen },
      { href: "/ahsd-tea", label: "Triagem AH/SD × TEA", icon: Sparkles },
    ],
  },
  {
    title: "Ferramentas Clínicas",
    items: [
      { href: "/calculadora-dose", label: "Calculadora de Dose", icon: Calculator },
      { href: "/curvas-crescimento", label: "Curvas de Crescimento", icon: TrendingUp },
      { href: "/orientacao-parental", label: "Orientação para Pais", icon: Heart },
      { href: "/fichas-registro", label: "Fichas Comerciais", icon: FileText },
      { href: "/espasticidade", label: "Espasticidade", icon: Activity },
      { href: "/classificacoes", label: "Classificações", icon: BookOpen },
      { href: "/fluxogramas", label: "Fluxogramas Clínicos", icon: GitBranch },
      { href: "/marcos-desenvolvimento", label: "Marcos do Desenvolvimento", icon: Baby },
      { href: "/valores-referencia", label: "Valores de Referência", icon: Activity },
    ],
  },
  {
    title: "Guias e Referências",
    items: [
      { href: "/neuropsicologia", label: "Avaliação Neuropsicológica", icon: BrainCog },
      { href: "/pac", label: "Processamento Auditivo", icon: Ear },
      { href: "/inventarios-escola", label: "Inventários p/ Escola", icon: School },
      { href: "/psiquiatria", label: "Psiquiatria Infantil", icon: GraduationCap },
      { href: "/farmacologia", label: "Farmacologia", icon: Pill },
      { href: "/pant", label: "PANT (100 Escalas)", icon: FileText },
      { href: "/avaliacao-multiprofissional", label: "Avaliação Multiprofissional", icon: ClipboardCheck },
      { href: "/plano-terapeutico", label: "Plano Terapêutico (PTI)", icon: Target },
      { href: "/plano-intervencao", label: "Intervenção por Habilidades", icon: Lightbulb },
      { href: "/sobre", label: "Sobre Dr. Jadson", icon: User },
      { href: "/ajuda", label: "Ajuda / FAQ", icon: HelpCircle },
    ],
  },
  {
    title: "Família",
    items: [
      { href: "/portal-familia", label: "Portal da Família", icon: Users },
      { href: "/portal-familia/novidades", label: "Novidades & Artigos", icon: Newspaper },
      { href: "/portal-familia/acesso", label: "Política de Acesso", icon: KeyRound },
    ],
  },
  {
    title: "Sobre",
    items: [
      { href: "/sobre-neuroped", label: "Natureza da Ferramenta", icon: Sparkles },
      { href: "/glossario", label: "Glossário", icon: BookMarked },
      { href: "/acessibilidade", label: "Acessibilidade", icon: Accessibility },
      { href: "/qualidade", label: "Qualidade", icon: ShieldCheck },
    ],
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    // Respeita preferência salva ou system
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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("neuroped:theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);

  // D6: persiste o estado recolhido da barra lateral.
  useEffect(() => {
    try {
      localStorage.setItem("neuroped:sidebar-collapsed", collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  // Close mobile menu on navigation + scroll to top + som sutil
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (location !== "/") softWhoosh();
  }, [location]);

  return (
    <div className="flex min-h-screen bg-background">
      <SkipNav />
      <OfflineBanner />

      {/* Mobile top header bar */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b border-sidebar-border bg-sidebar/95 backdrop-blur-md md:hidden">
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
            aria-label="Buscar (atalho Ctrl+K)"
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
                Escalas de Neuropediatria
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

        {/* Busca / Command palette (D2) */}
        <div className="px-2 pt-2">
          <button
            onClick={() => {
              softTap();
              haptic.tap();
              openCommandPalette();
            }}
            onMouseEnter={() => softHover()}
            data-testid="button-command-palette"
            aria-label="Buscar escalas e páginas (atalho Ctrl+K)"
            className={`flex items-center gap-2 w-full min-h-[40px] rounded-lg border border-sidebar-border bg-sidebar-accent/40 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors ${
              collapsed ? "md:justify-center md:px-0 px-3" : "px-3"
            }`}
          >
            <Search className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {!collapsed && (
              <>
                <span className="text-xs">Buscar…</span>
                <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border border-sidebar-border bg-background/50">
                  Ctrl K
                </kbd>
              </>
            )}
            {collapsed && <span className="text-xs md:hidden">Buscar…</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav id="sidebar-nav" className="flex-1 py-2 px-2 space-y-1 overflow-y-auto" aria-label="Navegação principal">
          {navSections.map((section, si) => (
            <div key={si}>
              {section.title && !collapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] px-3 pt-3 pb-1">
                  {section.title}
                </p>
              )}
              {collapsed && section.title && (
                <div className="border-t border-sidebar-border my-1 hidden md:block" />
              )}
              {section.items.map((item) => {
                const active = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
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
          ))}
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
            className={`w-full hidden md:flex ${collapsed ? "justify-center px-0" : "justify-start"}`}
            onClick={() => {
              softTap();
              haptic.tap();
              setCollapsed(!collapsed);
            }}
            data-testid="button-collapse-sidebar"
            aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" aria-hidden="true" /> : <ChevronLeft className="w-4 h-4" aria-hidden="true" />}
            {!collapsed && <span className="ml-2 text-sm">Recolher</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main
        id="main-content"
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "md:ml-16" : "md:ml-64"
        } ml-0 pt-14 md:pt-0`}
        tabIndex={-1}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 page-enter">
          {location !== "/" && (
            <button
              onClick={() => {
                softTap();
                haptic.tap();
                window.history.back();
              }}
              onMouseEnter={() => softHover()}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors group"
              data-testid="button-breadcrumb-back"
            >
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Voltar
            </button>
          )}
          {children}
        </div>
        <PerplexityAttribution />
      </main>
    </div>
  );
}
