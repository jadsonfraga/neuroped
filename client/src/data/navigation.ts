import type { LucideIcon } from "lucide-react";
import {
  Home,
  ClipboardCheck,
  Baby,
  Activity,
  Moon,
  BookOpen,
  BarChart3,
  ShieldAlert,
  ClipboardList,
  Users,
  FileText,
  CloudRain,
  HeartPulse,
  Wine,
  ListChecks,
  Zap,
  Brain,
  BrainCircuit,
  Gauge,
  Heart,
  Accessibility,
  Sparkles,
  Puzzle,
  Calendar,
  Fingerprint,
  GraduationCap,
  Stethoscope,
  Waves,
  Flame,
  VolumeX,
  UtensilsCrossed,
  AlertTriangle,
  Pill,
  Filter,
  User,
  BrainCog,
  Ear,
  School,
  ClipboardPlus,
  SmilePlus,
  HelpCircle,
  Target,
  Lightbulb,
  Calculator,
  TrendingUp,
  GitBranch,
  MessageCircle,
  FileSignature,
  BookMarked,
  ShieldCheck,
  Newspaper,
  KeyRound,
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
    title: "Ferramentas",
    items: [
      { href: "/filtro", label: "Filtro Clínico Inteligente", icon: Filter },
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
      { href: "/mania", label: "Mania", icon: Flame },
      { href: "/psicose", label: "Psicose", icon: Brain },
      { href: "/mutismo", label: "Mutismo", icon: VolumeX },
    ],
  },
  {
    title: "Funcional e Sensorial",
    items: [
      { href: "/spd", label: "Perfil Sensorial", icon: Sparkles },
      { href: "/sensory", label: "Sensorial", icon: Waves },
      { href: "/sono", label: "Sono", icon: Moon },
      { href: "/alimentacao", label: "Alimentação", icon: UtensilsCrossed },
      { href: "/dor", label: "Dor", icon: Heart },
      { href: "/epilepsia", label: "Epilepsia", icon: AlertTriangle },
    ],
  },
  {
    title: "Escolar e Desenvolvimento",
    items: [
      { href: "/escola", label: "Escola", icon: GraduationCap },
      { href: "/marcos", label: "Marcos", icon: Calendar },
      { href: "/pei", label: "PEI", icon: BookMarked },
      { href: "/funcionalidade", label: "Funcionalidade", icon: Target },
      { href: "/relatorio-escolar", label: "Relatório Escolar", icon: School },
    ],
  },
  {
    title: "Clínica",
    items: [
      { href: "/farmacologia", label: "Farmacologia", icon: Pill },
      { href: "/calculadoras", label: "Calculadoras", icon: Calculator },
      { href: "/evolucao", label: "Evolução", icon: TrendingUp },
      { href: "/documentos", label: "Documentos", icon: FileText },
      { href: "/assinaturas", label: "Assinaturas", icon: FileSignature },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/onboarding", label: "Onboarding", icon: Lightbulb },
      { href: "/tour", label: "Tour", icon: GitBranch },
      { href: "/ajuda", label: "Ajuda", icon: HelpCircle },
      { href: "/legal", label: "Legal", icon: ShieldCheck },
      { href: "/noticias", label: "Notícias", icon: Newspaper },
      { href: "/configuracoes", label: "Configurações", icon: KeyRound },
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
