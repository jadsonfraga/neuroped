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

export const navigablePages = navSections.flatMap((section) => section.items);

export function getNavigationMatch(pathname: string): NavigationMatch | undefined {
  for (const section of navSections) {
    const item = section.items.find((candidate) => candidate.href === pathname);
    if (item) return { section, item };
  }
  return undefined;
}
