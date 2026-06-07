import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  Activity,
  Baby,
  BarChart3,
  BookOpen,
  Brain,
  BrainCog,
  Calculator,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  ClipboardPlus,
  CloudRain,
  FileSignature,
  FileText,
  Filter,
  Gauge,
  GraduationCap,
  HeartPulse,
  HelpCircle,
  Home,
  KeyRound,
  LineChart,
  ListChecks,
  MessageCircle,
  Moon,
  Pill,
  Puzzle,
  Ruler,
  Scale,
  School,
  ShieldAlert,
  ShieldCheck,
  SmilePlus,
  Sparkles,
  Stethoscope,
  Target,
  Thermometer,
  Users,
  Zap,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface NavigationMatch {
  section: NavSection;
  item: NavItem;
}

export const navSections: NavSection[] = [
  {
    title: "",
    items: [{ href: "/", label: "Início", icon: Home }],
  },
  {
    title: "Fluxo clínico",
    items: [
      { href: "/filtro", label: "Filtro Clínico Inteligente", icon: Filter },
      { href: "/escalas-neuropsiquiatria", label: "100 escalas mundiais", icon: BookOpen },
      { href: "/mchat", label: "Aplicar escala", icon: ClipboardCheck },
      { href: "/prontuario", label: "Prontuário clínico", icon: ClipboardPlus },
      { href: "/pacientes", label: "Pacientes", icon: Users },
      { href: "/satisfacao-medicacao", label: "Evolução / medicação", icon: LineChart },
    ],
  },
  {
    title: "Escalas",
    items: [
      { href: "/escalas-neuropsiquiatria", label: "100 escalas mundiais", icon: BookOpen },
      { href: "/mchat", label: "M-CHAT-R/F", icon: Baby },
      { href: "/cars", label: "CARS-2", icon: ClipboardCheck },
      { href: "/denver", label: "Denver II", icon: BookOpen },
      { href: "/asq3", label: "ASQ-3", icon: Baby },
      { href: "/snap", label: "SNAP-IV", icon: Activity },
      { href: "/sdq", label: "SDQ", icon: BarChart3 },
      { href: "/conners", label: "Conners", icon: ClipboardList },
      { href: "/cbcl", label: "CBCL", icon: ListChecks },
      { href: "/vanderbilt", label: "Vanderbilt", icon: Zap },
      { href: "/brief2", label: "BRIEF-2", icon: BrainCog },
      { href: "/abc", label: "ABC", icon: Gauge },
      { href: "/vineland", label: "Vineland-3", icon: Users },
      { href: "/scared", label: "SCARED", icon: ShieldAlert },
      { href: "/cdi2", label: "CDI-2", icon: CloudRain },
      { href: "/phqa", label: "PHQ-A", icon: HeartPulse },
      { href: "/cssrs", label: "C-SSRS", icon: ShieldAlert },
      { href: "/gmfcs", label: "GMFCS", icon: Accessibility },
      { href: "/tea", label: "Checklists TEA", icon: Puzzle },
      { href: "/tea-comportamentos", label: "Comport. TEA", icon: Sparkles },
    ],
  },
  {
    title: "Pacientes",
    items: [
      { href: "/pacientes", label: "Meus pacientes", icon: Users },
      { href: "/prontuario", label: "Anamnese / prontuário", icon: Stethoscope },
      { href: "/diario-sono", label: "Diário do sono", icon: Moon },
      { href: "/diario-alimentar", label: "Diário alimentar", icon: ClipboardList },
      { href: "/diario-escola", label: "Diário escolar", icon: School },
      { href: "/portal-familia", label: "Portal família", icon: MessageCircle },
    ],
  },
  {
    title: "Documentos",
    items: [
      { href: "/pant", label: "PANT", icon: FileText },
      { href: "/assinatura-digital", label: "Assinatura externa", icon: FileSignature },
      { href: "/fichas-registro", label: "Fichas de registro", icon: ClipboardList },
      { href: "/inventarios-escola", label: "Questionário escolar", icon: School },
      { href: "/avaliacao-multiprofissional", label: "Avaliação multiprofissional", icon: ClipboardCheck },
      { href: "/plano-terapeutico", label: "Plano terapêutico", icon: Target },
    ],
  },
  {
    title: "Medicamentos",
    items: [
      { href: "/farmacologia", label: "Farmacologia", icon: Pill },
      { href: "/calculadora-dose", label: "Calculadora de dose", icon: Calculator },
      { href: "/satisfacao-medicacao", label: "Satisfação medicação", icon: SmilePlus },
    ],
  },
  {
    title: "Ferramentas clínicas",
    items: [
      { href: "/fluxogramas", label: "Fluxogramas", icon: Brain },
      { href: "/marcos-desenvolvimento", label: "Marcos do desenvolvimento", icon: Calendar },
      { href: "/valores-referencia", label: "Valores de referência", icon: Thermometer },
      { href: "/curvas-crescimento", label: "Curvas de crescimento", icon: LineChart },
      { href: "/espasticidade", label: "Espasticidade", icon: Ruler },
      { href: "/classificacoes", label: "Classificações", icon: Scale },
      { href: "/caa", label: "CAA · Vou Falar", icon: MessageCircle },
    ],
  },
  {
    title: "Configurações / Ajuda",
    items: [
      { href: "/ajuda", label: "Ajuda", icon: HelpCircle },
      { href: "/sobre", label: "Sobre", icon: ShieldCheck },
      { href: "/sobre-neuroped", label: "Sobre o NeuroPed", icon: ShieldCheck },
      { href: "/acessibilidade", label: "Acessibilidade", icon: KeyRound },
      { href: "/qualidade", label: "Qualidade", icon: ShieldCheck },
    ],
  },
];

export const navigablePages = navSections.flatMap((section) => section.items);

export function findNavigationMatch(pathname: string): NavigationMatch | undefined {
  for (const section of navSections) {
    const item = section.items.find((candidate) => candidate.href === pathname);
    if (item) return { section, item };
  }
  return undefined;
}

export const getNavigationMatch = findNavigationMatch;
