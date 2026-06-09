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
  Eye,
  FileSignature,
  FileText,
  Filter,
  Gauge,
  HeartHandshake,
  HeartPulse,
  HelpCircle,
  Home,
  KeyRound,
  LineChart,
  ListChecks,
  MessageCircle,
  Moon,
  Newspaper,
  PenTool,
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
    title: "Recepção e pré-consulta",
    items: [
      { href: "/pre-consulta", label: "Pré-consulta", icon: ClipboardCheck },
      { href: "/pre-retorno", label: "Pré-retorno", icon: ClipboardCheck },
      { href: "/pre-retorno", label: "Efeitos percebidos", icon: Pill },
      { href: "/recepcao", label: "Painel da recepção", icon: Users },
      { href: "/filtro", label: "Filtro Clínico Inteligente", icon: Filter },
    ],
  },
  {
    title: "Pacientes e evolução",
    items: [
      { href: "/pacientes", label: "Meus pacientes", icon: Users },
      { href: "/prontuario", label: "Anamnese / prontuário", icon: Stethoscope },
      { href: "/avaliacao-multiprofissional", label: "Avaliação multiprofissional", icon: ClipboardCheck },
      { href: "/plano-terapeutico", label: "Plano terapêutico", icon: Target },
      { href: "/plano-intervencao", label: "Plano de intervenção", icon: ClipboardPlus },
      { href: "/satisfacao-medicacao", label: "Evolução da medicação", icon: SmilePlus },
    ],
  },
  {
    title: "Família e escola",
    items: [
      { href: "/portal-familia", label: "Portal dos pais", icon: HeartHandshake },
      { href: "/orientacao-parental", label: "Orientação parental", icon: Users },
      { href: "/portal-familia/novidades", label: "Novidades para famílias", icon: Newspaper },
      { href: "/portal-familia/acesso", label: "Política de acesso", icon: KeyRound },
      { href: "/inventarios-escola", label: "Questionário escolar", icon: School },
      { href: "/diario-sono", label: "Diário do sono", icon: Moon },
      { href: "/diario-alimentar", label: "Diário alimentar", icon: ClipboardList },
      { href: "/diario-escola", label: "Diário escolar", icon: School },
      { href: "/caa", label: "CAA · Vou Falar", icon: MessageCircle },
    ],
  },
  {
    title: "Escalas principais",
    items: [
      { href: "/escalas-neuropsiquiatria", label: "100 escalas mundiais", icon: BookOpen },
      { href: "/mchat", label: "M-CHAT-R/F", icon: Baby },
      { href: "/cars", label: "CARS-2", icon: ClipboardCheck },
      { href: "/denver", label: "Denver II", icon: BookOpen },
      { href: "/asq3", label: "ASQ-3", icon: Baby },
      { href: "/snap", label: "SNAP-IV", icon: Activity },
      { href: "/sdq", label: "SDQ", icon: BarChart3 },
      { href: "/vanderbilt", label: "Vanderbilt", icon: Zap },
      { href: "/scared", label: "SCARED", icon: ShieldAlert },
      { href: "/phqa", label: "PHQ-A", icon: HeartPulse },
      { href: "/cssrs", label: "C-SSRS", icon: ShieldAlert },
    ],
  },
  {
    title: "Escalas complementares",
    items: [
      { href: "/conners", label: "Conners", icon: ClipboardList },
      { href: "/cbcl", label: "CBCL", icon: ListChecks },
      { href: "/brief2", label: "BRIEF-2", icon: BrainCog },
      { href: "/abc", label: "ABC", icon: Gauge },
      { href: "/vineland", label: "Vineland-3", icon: Users },
      { href: "/cdi2", label: "CDI-2", icon: CloudRain },
      { href: "/gmfcs", label: "GMFCS", icon: Accessibility },
      { href: "/cshq", label: "CSHQ", icon: Moon },
      { href: "/ygtss", label: "YGTSS", icon: Activity },
      { href: "/crafft", label: "CRAFFT", icon: ShieldAlert },
      { href: "/pedsql", label: "PedsQL", icon: HeartPulse },
      { href: "/psc17", label: "PSC-17", icon: BarChart3 },
      { href: "/gad7", label: "GAD-7", icon: ShieldAlert },
      { href: "/aq10", label: "AQ-10", icon: Puzzle },
    ],
  },
  {
    title: "Testes Diretos com a Criança",
    items: [
      { href: "/testes-reconhecimento", label: "Reconhecimento Visual", icon: Eye },
      { href: "/testes-academicos", label: "Leitura/Escrita/Aritmética", icon: School },
      { href: "/tde2", label: "TDE-2 Adaptado", icon: BookOpen },
      { href: "/academico-interativo", label: "Acadêmico Interativo", icon: Brain },
      { href: "/escrita-desenho", label: "Escrita e Desenho", icon: PenTool },
      { href: "/conhecimento-visual", label: "Conhecimento Visual", icon: Eye },
      { href: "/motricidade-teste", label: "Motricidade", icon: Accessibility },
      { href: "/conhecimentos-gerais", label: "Conhecimentos Gerais", icon: Sparkles },
      { href: "/funcoes-executivas", label: "Funções Executivas", icon: BrainCog },
      { href: "/atencao-concentracao", label: "Atenção e Concentração", icon: Brain },
      { href: "/linguagem-fonologia", label: "Linguagem e Fonologia", icon: MessageCircle },
    ],
  },
  {
    title: "Neurodesenvolvimento e escola",
    items: [
      { href: "/tea", label: "Checklists TEA", icon: Puzzle },
      { href: "/tea-comportamentos", label: "Comport. TEA", icon: Sparkles },
      { href: "/psiquiatria", label: "Guia psiquiátrico", icon: BrainCog },
      { href: "/bateria-jadson", label: "Bateria Jadson", icon: ClipboardCheck },
      { href: "/neuropsicologia", label: "Neuropsicologia", icon: BrainCog },
      { href: "/pac", label: "PAC", icon: Brain },
      { href: "/inventarios-auto", label: "Autoavaliação", icon: ClipboardList },
      { href: "/ahsd-tea", label: "AH/SD × TEA", icon: Sparkles },
    ],
  },
  {
    title: "Protocolos autorais",
    items: [
      { href: "/emdi", label: "EMDI", icon: ClipboardCheck },
      { href: "/eaf", label: "EAF", icon: ClipboardCheck },
      { href: "/pdae", label: "PDAE", icon: ClipboardCheck },
      { href: "/ecsm", label: "ECSM", icon: ClipboardCheck },
      { href: "/ips", label: "IPS", icon: ClipboardCheck },
      { href: "/ecar-si", label: "ECAR-SI", icon: ClipboardCheck },
      { href: "/edi", label: "EDI", icon: ClipboardCheck },
      { href: "/eai", label: "EAI", icon: ClipboardCheck },
      { href: "/easi", label: "EASI", icon: ClipboardCheck },
      { href: "/ems", label: "EMS", icon: ClipboardCheck },
      { href: "/etare", label: "ETARE", icon: ClipboardCheck },
      { href: "/eaah", label: "EAAH", icon: ClipboardCheck },
    ],
  },
  {
    title: "Documentos e laudos",
    items: [
      { href: "/pant", label: "PANT", icon: FileText },
      { href: "/assinatura-digital", label: "Assinatura externa", icon: FileSignature },
      { href: "/fichas-registro", label: "Fichas de registro", icon: ClipboardList },
    ],
  },
  {
    title: "Medicamentos e doses",
    items: [
      { href: "/farmacologia", label: "Farmacologia", icon: Pill },
      { href: "/calculadora-dose", label: "Calculadora de dose", icon: Calculator },
    ],
  },
  {
    title: "Referência clínica",
    items: [
      { href: "/fluxogramas", label: "Fluxogramas", icon: Brain },
      { href: "/marcos-desenvolvimento", label: "Marcos do desenvolvimento", icon: Calendar },
      { href: "/valores-referencia", label: "Valores de referência", icon: Thermometer },
      { href: "/curvas-crescimento", label: "Curvas de crescimento", icon: LineChart },
      { href: "/espasticidade", label: "Espasticidade", icon: Ruler },
      { href: "/classificacoes", label: "Classificações", icon: Scale },
      { href: "/epilepsia", label: "Diário de epilepsia", icon: Activity },
      { href: "/cefaleia", label: "Calendário de cefaleia", icon: Calendar },
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
