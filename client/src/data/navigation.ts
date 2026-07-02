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
    title: "TRABALHO CLÍNICO",
    items: [
      { href: "/pre-consulta", label: "Pré-consulta", icon: ClipboardCheck },
      { href: "/pre-retorno", label: "Pré-retorno", icon: ClipboardCheck },
      { href: "/filtro", label: "Filtro Clínico Inteligente", icon: Filter },
      { href: "/fluxograma", label: "Fluxograma Clínico", icon: Target },
      { href: "/filtro-escalas", label: "Triar sem cadastrar", icon: Filter },
      { href: "/pacientes", label: "Meus pacientes", icon: Users },
      { href: "/prontuario", label: "Anamnese / prontuário", icon: Stethoscope },
      { href: "/avaliacao-multiprofissional", label: "Avaliação multiprofissional", icon: ClipboardCheck },
      { href: "/plano-terapeutico", label: "Plano terapêutico", icon: Target },
      { href: "/plano-intervencao", label: "Plano de intervenção", icon: ClipboardPlus },
      { href: "/satisfacao-medicacao", label: "Evolução da medicação", icon: SmilePlus },
      { href: "/efeitos-colaterais", label: "Efeitos percebidos", icon: Pill },
      { href: "/recepcao", label: "Painel da recepção", icon: Users },
      { href: "/diario-sono", label: "Diário do sono", icon: Moon },
      { href: "/diario-alimentar", label: "Diário alimentar", icon: ClipboardList },
      { href: "/epilepsia", label: "Diário de epilepsia", icon: Activity },
      { href: "/cefaleia", label: "Calendário de cefaleia", icon: Calendar },
      { href: "/escalas-neuropsiquiatria", label: "Escalas mundiais", icon: BookOpen },
      { href: "/mchat", label: "M-CHAT-R/F", icon: Baby },
      { href: "/cars", label: "CARS", icon: ClipboardCheck },
      { href: "/denver", label: "Denver II", icon: BookOpen },
      { href: "/asq3", label: "ASQ-3", icon: Baby },
      { href: "/snap", label: "SNAP-IV", icon: Activity },
      { href: "/sdq", label: "SDQ", icon: BarChart3 },
      { href: "/vanderbilt", label: "Vanderbilt", icon: Zap },
      { href: "/scared", label: "SCARED", icon: ShieldAlert },
      { href: "/phqa", label: "PHQ-A", icon: HeartPulse },
      { href: "/cssrs", label: "C-SSRS", icon: ShieldAlert },
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
      { href: "/tea", label: "Checklists TEA", icon: Puzzle },
      { href: "/tea-comportamentos", label: "Comport. TEA", icon: Sparkles },
      { href: "/psiquiatria", label: "Guia psiquiátrico", icon: BrainCog },
      { href: "/bateria-jadson", label: "Bateria Jadson", icon: ClipboardCheck },
      { href: "/neuropsicologia", label: "Neuropsicologia", icon: BrainCog },
      { href: "/pac", label: "PAC", icon: Brain },
      { href: "/inventarios-auto", label: "Autoavaliação", icon: ClipboardList },
      { href: "/ahsd-tea", label: "AH/SD × TEA", icon: Sparkles },
      { href: "/emdi", label: "EMDI", icon: ClipboardCheck },
      { href: "/eaf", label: "EAF", icon: ClipboardCheck },
      { href: "/ecsm", label: "ECSM", icon: ClipboardCheck },
      { href: "/ips", label: "IPS", icon: ClipboardCheck },
      { href: "/ecar-si", label: "ECAR-SI", icon: ClipboardCheck },
      { href: "/edi", label: "EDI", icon: ClipboardCheck },
      { href: "/eai", label: "EAI", icon: ClipboardCheck },
      { href: "/easi", label: "EASI", icon: ClipboardCheck },
      { href: "/ems", label: "EMS", icon: ClipboardCheck },
      { href: "/etare", label: "ETARE", icon: ClipboardCheck },
      { href: "/eaah", label: "EAAH", icon: ClipboardCheck },
      { href: "/testes-diretos", label: "Testes: bateria por faixa", icon: ClipboardCheck },
      { href: "/testes-academicos", label: "Testes: acadêmico", icon: ClipboardCheck },
      { href: "/escrita-desenho", label: "Testes: escrita e desenho", icon: ClipboardCheck },
      { href: "/conhecimento-visual", label: "Testes: conhecimento visual", icon: ClipboardCheck },
      { href: "/testes-reconhecimento", label: "Testes: reconhecimento visual", icon: ClipboardCheck },
      { href: "/avaliacao-cognitiva-infantil", label: "Testes: leitura/escrita/aritm.", icon: ClipboardCheck },
      { href: "/motricidade-teste", label: "Testes: motricidade", icon: ClipboardCheck },
      { href: "/conhecimentos-gerais", label: "Testes: conhecimentos gerais", icon: ClipboardCheck },
      { href: "/tde2", label: "TDE-2 Adaptado", icon: ClipboardCheck },
      { href: "/caa", label: "CAA · Vou Falar", icon: MessageCircle },
      { href: "/documentos", label: "Central de Documentos", icon: FileText },
      { href: "/laudo-neuroped", label: "Laudo Digital", icon: ClipboardPlus },
      { href: "/receita-c1-express", label: "Receita C1 Express ⚡", icon: Pill },
      { href: "/receita-c1", label: "Receita C1 (avançada)", icon: Pill },
      { href: "/verificar", label: "Verificar documento", icon: ShieldCheck },
      { href: "/pant", label: "PANT", icon: FileText },
      { href: "/assinatura-digital", label: "Assinatura externa", icon: FileSignature },
      { href: "/fichas-registro", label: "Fichas de registro", icon: ClipboardList },
    ],
  },
  {
    title: "REFERÊNCIA",
    items: [
      { href: "/medicamentos", label: "Medicamentos", icon: Pill },
      { href: "/farmacologia", label: "Farmacologia", icon: Pill },
      { href: "/calculadora-dose", label: "Calculadora de dose", icon: Calculator },
      { href: "/instrumentos-padronizados", label: "Instrumentos padronizados (Pearson/Hogrefe)", icon: BookOpen },
      { href: "/fluxogramas", label: "Fluxogramas", icon: Brain },
      { href: "/marcos-desenvolvimento", label: "Marcos do desenvolvimento", icon: Calendar },
      { href: "/valores-referencia", label: "Valores de referência", icon: Thermometer },
      { href: "/curvas-crescimento", label: "Curvas de crescimento", icon: LineChart },
      { href: "/espasticidade", label: "Espasticidade", icon: Ruler },
      { href: "/classificacoes", label: "Classificações", icon: Scale },
      { href: "/orientacao-parental", label: "Orientação parental", icon: Users },
      { href: "/portal-familia/acesso", label: "Política de acesso", icon: KeyRound },
      { href: "/ajuda", label: "Ajuda", icon: HelpCircle },
      { href: "/sobre", label: "Sobre", icon: ShieldCheck },
      { href: "/sobre-neuroped", label: "Sobre o NeuroPed", icon: ShieldCheck },
      { href: "/acessibilidade", label: "Acessibilidade", icon: KeyRound },
      { href: "/qualidade", label: "Qualidade", icon: ShieldCheck },
    ],
  },
];

export const navigablePages = navSections.flatMap((section) => section.items);

export function normalizeNavigationPath(pathname: string): string {
  const withoutHash = (pathname || "/").replace(/^#/, "");
  const withoutQuery = withoutHash.split("?")[0]?.split("#")[0] || "/";
  const path = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  return path !== "/" ? path.replace(/\/$/, "") : "/";
}

function matchesNavigationItem(pathname: string, href: string): boolean {
  const path = normalizeNavigationPath(pathname);
  const normalizedHref = normalizeNavigationPath(href);
  if (normalizedHref === "/") return path === "/";
  return path === normalizedHref || path.startsWith(`${normalizedHref}/`);
}

export function findNavigationMatch(pathname: string): NavigationMatch | undefined {
  const matches = navSections.flatMap((section) =>
    section.items
      .filter((item) => matchesNavigationItem(pathname, item.href))
      .map((item) => ({ section, item })),
  );

  return matches.sort((a, b) => b.item.href.length - a.item.href.length)[0];
}

export const getNavigationMatch = findNavigationMatch;
