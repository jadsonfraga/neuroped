import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Baby,
  BookOpen,
  Brain,
  BrainCog,
  Calculator,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Filter,
  Globe2,
  HeartPulse,
  HelpCircle,
  Home,
  KeyRound,
  LineChart,
  ListChecks,
  MessageCircle,
  Moon,
  Pill,
  Ruler,
  Scale,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Thermometer,
  Users,
  Waves,
} from "lucide-react";

export type NavTone = "golden" | "connection" | "priority";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tone?: NavTone;
  description?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface NavigationMatch {
  section: NavSection;
  item: NavItem;
}

/**
 * Atalhos por frequência de uso. A Sonda Dez abre o bloco clínico porque
 * substitui as superfícies antigas de teste direto com a criança.
 */
export const featuredNavigation: NavItem[] = [
  {
    href: "/testes-diretos",
    label: "Sonda Dez",
    icon: Sparkles,
    tone: "priority",
    description: "Avaliação direta pré-consulta · 10 min",
  },
  {
    href: "/especialidades",
    label: "Especialidades Premium",
    icon: Stethoscope,
    tone: "golden",
    description: "Vitrine institucional Dr. Jadson",
  },
  {
    href: "/filtro",
    label: "Filtro de Escalas",
    icon: Filter,
    tone: "priority",
    description: "Por idade e queixa",
  },
  {
    href: "/marcacao",
    label: "Secretaria IA",
    icon: Calendar,
    tone: "priority",
    description: "Pré-agendamento pelo BoaConsulta",
  },
  {
    href: "/escuta-clinica",
    label: "Escuta Clínica",
    icon: Waves,
    tone: "priority",
    description: "Áudio e anamnese estruturada",
  },
  {
    href: "/servicos-clinica",
    label: "Serviços da Clínica",
    icon: Stethoscope,
    tone: "priority",
    description: "Avaliações e serviços",
  },
  // prettier-ignore — formato preservado pelo guard de integração do Conecta.
  { href: "/conecta", label: "NeuroPed Conecta", icon: Activity, tone: "connection", description: "Portais e conexões" },
  {
    href: "/eletroencefalograma",
    label: "EEG & Vídeo-EEG",
    icon: Waves,
    tone: "golden",
    description: "Exames e orientação clínica",
  },
  {
    href: "/nesplora/",
    label: "Nesplora",
    icon: Brain,
    tone: "golden",
    description: "Experiência imersiva em VR",
  },
];

export const navSections: NavSection[] = [
  {
    title: "",
    items: [{ href: "/", label: "Início", icon: Home }],
  },
  {
    title: "ATENDIMENTO",
    items: [
      { href: "/agenda", label: "Agenda & Gestão", icon: Calendar, tone: "priority" },
      { href: "/pacientes", label: "Pacientes / Prontuário", icon: Users, tone: "priority" },
      { href: "/memoria-clinica", label: "Memória clínica", icon: BrainCog },
      { href: "/laudo-neuroped", label: "Laudos", icon: FileText, tone: "priority" },
      { href: "/laudo-super", label: "Laudos SuperNeuroPed", icon: ShieldCheck },
      { href: "/receita-c1", label: "Receita C1", icon: Pill },
      { href: "/manus", label: "Integrações Manus", icon: Globe2 },
    ],
  },
  {
    title: "CLÍNICA E ACOMPANHAMENTO",
    items: [
      { href: "/especialidades", label: "Especialidades", icon: Stethoscope, tone: "golden" },
      { href: "/neuroacompanhamento", label: "NeuroAcompanhamento", icon: Baby },
      { href: "/diario-escola", label: "Diário escolar", icon: ClipboardList },
      { href: "/avaliacao-multiprofissional", label: "Avaliação multiprofissional", icon: ClipboardCheck },
      { href: "/neuropsicologia", label: "Neuropsicologia", icon: BrainCog },
      { href: "/servicos-clinica", label: "Serviços da Clínica", icon: Stethoscope, tone: "golden" },
    ],
  },
  {
    title: "TRIAGEM E FERRAMENTAS",
    items: [
      {
        href: "/testes-diretos",
        label: "Sonda Dez · Pré-consulta",
        icon: Sparkles,
        tone: "priority",
        description: "Aplicação guiada por idade em 10 minutos",
      },
      { href: "/fluxograma", label: "Fluxograma Clínico", icon: Target },
      { href: "/filtro-escalas", label: "Triar sem cadastrar", icon: Filter },
      { href: "/bateria-jadson", label: "Bateria Jadson", icon: ClipboardCheck },
      { href: "/pac", label: "PAC", icon: Brain },
      { href: "/inventarios-auto", label: "Autoavaliação", icon: ClipboardList },
      { href: "/ahsd-tea", label: "AH/SD × TEA", icon: Sparkles },
      { href: "/psiquiatria", label: "Guia psiquiátrico", icon: BrainCog },
      { href: "/caa", label: "CAA · Vou Falar", icon: MessageCircle },
    ],
  },
  {
    title: "ACOMPANHAMENTO CLÍNICO",
    items: [
      { href: "/medicamentos", label: "Medicamentos", icon: Pill, tone: "priority" },
      { href: "/farmacologia", label: "Farmacologia", icon: Pill },
      { href: "/calculadora-dose", label: "Calculadora de dose", icon: Calculator },
      { href: "/diario-sono", label: "Diário do sono", icon: Moon },
      { href: "/diario-alimentar", label: "Diário alimentar", icon: ClipboardList },
      { href: "/epilepsia", label: "Diário de epilepsia", icon: Activity },
      { href: "/cefaleia", label: "Calendário de cefaleia", icon: Calendar },
      { href: "/conecta", label: "NeuroPed Conecta", icon: Activity, tone: "golden" },
    ],
  },
  {
    title: "REFERÊNCIA",
    items: [
      { href: "/instrumentos-padronizados", label: "Instrumentos padronizados", icon: BookOpen },
      { href: "/biblioteca-instrumentos", label: "Biblioteca de instrumentos", icon: ListChecks },
      { href: "/fluxogramas", label: "Fluxogramas", icon: Brain },
      { href: "/marcos-desenvolvimento", label: "Marcos do desenvolvimento", icon: Calendar },
      { href: "/valores-referencia", label: "Valores de referência", icon: Thermometer },
      { href: "/curvas-crescimento", label: "Curvas de crescimento", icon: LineChart },
      { href: "/espasticidade", label: "Espasticidade", icon: Ruler },
      { href: "/classificacoes", label: "Classificações", icon: Scale },
      { href: "/orientacao-parental", label: "Orientação parental", icon: Users },
    ],
  },
  {
    title: "PORTAIS E SUPORTE",
    items: [
      { href: "/brincando-e-aprendendo", label: "Brincando e Aprendendo", icon: Sparkles },
      { href: "/missao-saude", label: "Missão Saúde", icon: HeartPulse },
      { href: "/portal-familia/acesso", label: "Política de acesso", icon: KeyRound },
      { href: "/ajuda", label: "Ajuda", icon: HelpCircle },
      { href: "/sobre", label: "Sobre", icon: ShieldCheck },
      { href: "/sobre-neuroped", label: "Sobre o NeuroPed", icon: ShieldCheck },
      { href: "/acessibilidade", label: "Acessibilidade", icon: KeyRound },
      { href: "/qualidade", label: "Qualidade", icon: ShieldCheck },
    ],
  },
];

const featuredSection: NavSection = { title: "DESTAQUES", items: featuredNavigation };
const allNavigationSections = [featuredSection, ...navSections];
const staticExternalNavigationRoutes = new Set(["/nesplora/"]);

export const navigablePages = Array.from(
  new Map(
    allNavigationSections
      .flatMap((section) => section.items)
      .filter((item) => !staticExternalNavigationRoutes.has(item.href))
      .map((item) => [item.href, item]),
  ).values(),
);

export function normalizeNavigationPath(pathname: string): string {
  const withoutHash = (pathname || "/").replace(/^#/, "");
  const withoutQuery = withoutHash.split("?")[0]?.split("#")[0] || "/";
  const path = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  return path !== "/" ? path.replace(/\/$/, "") : "/";
}