import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  Brain, Home, ClipboardCheck, Baby, Activity,
  Moon, Sun, ChevronLeft, ChevronRight, BookOpen,
  BarChart3, ShieldAlert, ClipboardList, Users, FileText,
  CloudRain, HeartPulse, Wine, ListChecks, Zap,
  BrainCircuit, Gauge, Heart, Accessibility, Sparkles,
  Puzzle, Calendar, Fingerprint, Menu, X, GraduationCap,
  Stethoscope, Waves, Flame, VolumeX, UtensilsCrossed, AlertTriangle, Pill,
  Filter, User, BrainCog, Ear, School, ClipboardPlus, SmilePlus, HelpCircle,
  Target, Lightbulb, Calculator, TrendingUp, GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { playPipe } from "@/lib/sounds";
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
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Close mobile menu on navigation + scroll to top + sound
  const prevLocation = useState(location)[0];
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (location !== "/") playPipe();
  }, [location]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Acessibilidade: skip nav e banner offline */}
      <SkipNav />
      <OfflineBanner />

      {/* Mobile top header bar */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b border-sidebar-border bg-sidebar md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
            NeuroPed
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={() => setDark(!dark)}
            data-testid="button-theme-toggle-mobile"
            aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {dark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={() => setMobileOpen(true)}
            data-testid="button-mobile-menu"
            aria-label="Abrir menu de navegação"
            aria-expanded={mobileOpen}
            aria-controls="sidebar-nav"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>
      </header>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          data-testid="mobile-backdrop"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed left-0 top-0 h-full z-50 flex flex-col border-r border-sidebar-border bg-sidebar",
          // Mobile: slide in/out
          "transition-transform duration-300 md:transition-all md:duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible, collapsible width
          "md:translate-x-0",
          collapsed ? "md:w-16" : "md:w-64",
          // Mobile always full width sidebar (w-64)
          "w-64",
        ].join(" ")}
      >
        {/* Logo + close button on mobile */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <h1 className="text-sm font-bold tracking-tight text-sidebar-foreground leading-tight">
                NeuroPed
              </h1>
              <p className="text-xs text-muted-foreground leading-tight">
                Escalas e Questionários
              </p>
            </div>
          )}
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="sm"
            className="px-2 md:hidden ml-auto"
            onClick={() => setMobileOpen(false)}
            data-testid="button-mobile-close"
            aria-label="Fechar menu de navegação"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>

        {/* Navigation */}
        <nav id="sidebar-nav" className="flex-1 py-2 px-2 space-y-1 overflow-y-auto" aria-label="Navegação principal">
          {navSections.map((section, si) => (
            <div key={si}>
              {section.title && !collapsed && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-3 pb-1">
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
                      className={`flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg cursor-pointer transition-colors ${
                        active
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      } ${collapsed ? "md:justify-center" : ""}`}
                    >
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                      {!collapsed && (
                        <span className="text-xs truncate">{item.label}</span>
                      )}
                      {/* On mobile, always show label even when desktop is collapsed */}
                      {collapsed && (
                        <span className="text-xs truncate md:hidden">{item.label}</span>
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
            onClick={() => setDark(!dark)}
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
          {/* Collapse button only on desktop */}
          <Button
            variant="ghost"
            size="sm"
            className={`w-full hidden md:flex ${collapsed ? "justify-center px-0" : "justify-start"}`}
            onClick={() => setCollapsed(!collapsed)}
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
              onClick={() => window.history.back()}
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
