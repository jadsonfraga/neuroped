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
  Grid2X2,
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
  /** Mantém o recurso no catálogo e na busca, sem ocupar a primeira camada da sidebar. */
  sidebar?: boolean;
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
 * Cinco atalhos de alta frequência. O restante continua acessível nos grupos
 * e no catálogo, mas não compete com o trabalho que começa todos os dias.
 */
export const featuredNavigation: NavItem[] = [
  {
    href: "/agenda",
    label: "Agenda",
    icon: Calendar,
    tone: "priority",
    description: "Hoje, fila e compromissos",
  },
  {
    href: "/pacientes",
    label: "Pacientes",
    icon: Users,
    tone: "priority",
    description: "Busca e prontuários",
  },
  {
    href: "/filtro",
    label: "Encontrar uma escala",
    icon: Filter,
    tone: "priority",
    description: "Por idade, queixa e objetivo",
  },
  {
    href: "/avaliacao-cognitiva-infantil",
    label: "Avaliação cognitiva infantil",
    icon: BrainCog,
    tone: "priority",
    description: "Perfil cognitivo por domínio",
  },
  {
    href: "/documentos",
    label: "Documentar",
    icon: FileText,
    tone: "priority",
    description: "Laudo, receita ou plano",
  },
];

/**
 * Primeiro nível da informação. Os nomes respondem ao que a pessoa veio fazer,
 * não à tecnologia que implementa a função. Destinos raros entram nos mesmos
 * hubs e continuam encontráveis pela busca global e pelo catálogo completo.
 */
export const navSections: NavSection[] = [
  {
    title: "",
    items: [
      { href: "/", label: "Início", icon: Home },
      {
        href: "/explorar",
        label: "Todos os recursos",
        icon: Grid2X2,
        tone: "golden",
        description: "Catálogo completo do NeuroPed",
      },
    ],
  },
  {
    title: "TRABALHO DE HOJE",
    items: [
      { href: "/recepcao", label: "Recepção e fila", icon: Users },
      { href: "/pre-consulta", label: "Pré-consulta", icon: ClipboardCheck },
      { href: "/pre-retorno", label: "Pré-retorno", icon: ClipboardCheck },
      { href: "/memoria-clinica", label: "Memória clínica", icon: BrainCog },
      { href: "/diario-escola", label: "Diário escolar", icon: ClipboardList },
      {
        href: "/avaliacao-multiprofissional",
        label: "Avaliação multiprofissional",
        icon: ClipboardCheck,
      },
      { href: "/neuropsicologia", label: "Neuropsicologia", icon: BrainCog },
    ],
  },
  {
    title: "AVALIAR",
    items: [
      {
        href: "/filtro",
        label: "Encontrar uma escala",
        icon: Filter,
        tone: "golden",
        description: "Por idade, queixa e objetivo",
      },
      { href: "/filtro-escalas", label: "Triar sem cadastrar", icon: Filter },
      {
        href: "/assistente-clinico",
        label: "Assistente clínico",
        icon: Sparkles,
        tone: "golden",
        description: "Monte uma bateria orientada",
      },
      {
        href: "/bateria-jadson",
        label: "Bateria Jadson",
        icon: ClipboardCheck,
      },
      { href: "/pac", label: "PAC", icon: Brain, sidebar: false },
      {
        href: "/inventarios-auto",
        label: "Autoavaliação",
        icon: ClipboardList,
        sidebar: false,
      },
      {
        href: "/ahsd-tea",
        label: "AH/SD × TEA",
        icon: Sparkles,
        sidebar: false,
      },
      {
        href: "/psiquiatria",
        label: "Guia psiquiátrico",
        icon: BrainCog,
        sidebar: false,
      },
      {
        href: "/testes-diretos",
        label: "Testes por faixa etária",
        icon: ClipboardCheck,
      },
      { href: "/cognitive-lab", label: "Cognitive Lab", icon: BrainCog },
      {
        href: "/avaliacao-cognitiva-infantil",
        label: "Avaliação cognitiva infantil",
        icon: Brain,
      },
      {
        href: "/caa",
        label: "CAA · Vou Falar",
        icon: MessageCircle,
        sidebar: false,
      },
      {
        href: "/escalas-neuropsiquiatria",
        label: "Escalas de neuropsiquiatria",
        icon: BrainCog,
        sidebar: false,
      },
      {
        href: "/tea-checklists",
        label: "Checklists TEA",
        icon: ClipboardCheck,
      },
      {
        href: "/testes-academicos",
        label: "Testes acadêmicos",
        icon: BookOpen,
        sidebar: false,
      },
      {
        href: "/pdae",
        label: "PDAE-NEXUS escolar",
        icon: BookOpen,
        sidebar: false,
      },
      {
        href: "/testes-reconhecimento",
        label: "Reconhecimento visual",
        icon: Sparkles,
        sidebar: false,
      },
      {
        href: "/academico-interativo",
        label: "Acadêmico interativo",
        icon: Brain,
        sidebar: false,
      },
    ],
  },
  {
    title: "DOCUMENTAR",
    items: [
      {
        href: "/prontuario",
        label: "Prontuário clínico",
        icon: ClipboardList,
        tone: "priority",
      },
      {
        href: "/laudo-neuroped",
        label: "Laudos neuropediátricos",
        icon: FileText,
        tone: "priority",
      },
      {
        href: "/laudo-super",
        label: "Laudo SuperNeuroPed",
        icon: ShieldCheck,
        tone: "priority",
      },
      {
        href: "/receita-c1",
        label: "Receita C1",
        icon: Pill,
        tone: "priority",
      },
      { href: "/receita-c1-express", label: "Receita C1 Express", icon: Pill },
      {
        href: "/documentos",
        label: "Documentos clínicos",
        icon: ClipboardList,
      },
      {
        href: "/assinatura-digital",
        label: "Assinatura digital",
        icon: ShieldCheck,
      },
      {
        href: "/satisfacao-medicacao",
        label: "Satisfação com medicação",
        icon: HeartPulse,
      },
      { href: "/plano-terapeutico", label: "Plano terapêutico", icon: Target },
      {
        href: "/plano-intervencao",
        label: "Plano de intervenção",
        icon: Target,
      },
      {
        href: "/fichas-registro",
        label: "Fichas de registro",
        icon: ListChecks,
      },
    ],
  },
  {
    title: "ACOMPANHAR",
    items: [
      {
        href: "/neuroacompanhamento",
        label: "NeuroAcompanhamento",
        icon: Baby,
      },
      {
        href: "/medicamentos",
        label: "Medicamentos",
        icon: Pill,
        tone: "priority",
      },
      { href: "/farmacologia", label: "Farmacologia", icon: Pill },
      {
        href: "/calculadora-dose",
        label: "Calculadora de dose",
        icon: Calculator,
      },
      { href: "/diario-sono", label: "Diário do sono", icon: Moon },
      {
        href: "/diario-alimentar",
        label: "Diário alimentar",
        icon: ClipboardList,
      },
      { href: "/epilepsia", label: "Diário de epilepsia", icon: Activity },
      { href: "/cefaleia", label: "Calendário de cefaleia", icon: Calendar },
      {
        href: "/inventarios-escola",
        label: "Inventários escolares",
        icon: ClipboardList,
      },
    ],
  },
  {
    title: "REFERÊNCIA",
    items: [
      {
        href: "/instrumentos-padronizados",
        label: "Instrumentos padronizados",
        icon: BookOpen,
      },
      {
        href: "/biblioteca-instrumentos",
        label: "Biblioteca de instrumentos",
        icon: ListChecks,
      },
      { href: "/fluxogramas", label: "Fluxogramas", icon: Brain },
      { href: "/fluxograma", label: "Fluxograma clínico", icon: Brain },
      {
        href: "/marcos-desenvolvimento",
        label: "Marcos do desenvolvimento",
        icon: Calendar,
      },
      {
        href: "/valores-referencia",
        label: "Valores de referência",
        icon: Thermometer,
      },
      { href: "/ballard", label: "Ballard neonatal", icon: Baby },
      {
        href: "/curvas-crescimento",
        label: "Curvas de crescimento",
        icon: LineChart,
      },
      { href: "/espasticidade", label: "Espasticidade", icon: Ruler },
      { href: "/classificacoes", label: "Classificações", icon: Scale },
      {
        href: "/orientacao-parental",
        label: "Orientação parental",
        icon: Users,
      },
    ],
  },
  {
    title: "CONECTAR",
    items: [
      {
        href: "/nesplora/",
        label: "Nesplora",
        icon: Brain,
        tone: "golden",
        description: "Experiência imersiva em VR",
      },
      {
        href: "/eletroencefalograma",
        label: "EEG & Vídeo-EEG",
        icon: Waves,
        tone: "golden",
        description: "Exames e orientação clínica",
      },
      { href: "/marcacao", label: "Marcação · Secretaria IA", icon: Calendar },
      {
        href: "/conecta",
        label: "NeuroPed Conecta",
        icon: Activity,
        tone: "connection",
      },
      {
        href: "/servicos-clinica",
        label: "Serviços da Clínica",
        icon: Stethoscope,
      },
      { href: "/manus", label: "Integrações Manus", icon: Globe2 },
      {
        href: "/brincando-e-aprendendo",
        label: "Brincando e Aprendendo",
        icon: Sparkles,
      },
      { href: "/missao-saude", label: "Missão Saúde", icon: HeartPulse },
      { href: "/familia", label: "Área da família", icon: HeartPulse },
      { href: "/portal-familia", label: "Portal da família", icon: Users },
      {
        href: "/portal-familia/novidades",
        label: "Novidades do portal",
        icon: Sparkles,
      },
      {
        href: "/portal-familia/acesso",
        label: "Política de acesso",
        icon: KeyRound,
      },
      { href: "/agendar", label: "Autoagendamento", icon: Calendar },
      {
        href: "/efeitos-colaterais",
        label: "Efeitos colaterais",
        icon: HeartPulse,
      },
    ],
  },
  {
    title: "AJUDA E CONTA",
    items: [
      { href: "/verificar", label: "Verificar documento", icon: ShieldCheck },
      { href: "/glossario", label: "Glossário", icon: BookOpen },
      { href: "/termos", label: "Termos de uso", icon: FileText },
      { href: "/ajuda", label: "Ajuda", icon: HelpCircle },
      { href: "/sobre", label: "Sobre", icon: ShieldCheck },
      { href: "/sobre-neuroped", label: "Sobre o NeuroPed", icon: ShieldCheck },
      { href: "/acessibilidade", label: "Acessibilidade", icon: KeyRound },
      { href: "/qualidade", label: "Qualidade", icon: ShieldCheck },
    ],
  },
];

const featuredSection: NavSection = {
  title: "ATALHOS",
  items: featuredNavigation,
};
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

function matchesNavigationItem(pathname: string, href: string): boolean {
  const path = normalizeNavigationPath(pathname);
  const normalizedHref = normalizeNavigationPath(href);
  if (normalizedHref === "/") return path === "/";
  return path === normalizedHref || path.startsWith(`${normalizedHref}/`);
}

const filterOwnedRoutes = new Set([
  "/mchat",
  "/cars",
  "/denver",
  "/asq3",
  "/snap",
  "/sdq",
  "/vanderbilt",
  "/scared",
  "/phqa",
  "/cssrs",
  "/conners",
  "/cbcl",
  "/brief2",
  "/abc",
  "/vineland",
  "/cdi2",
  "/gmfcs",
  "/cshq",
  "/ygtss",
  "/tea",
  "/tea-comportamentos",
  "/emdi",
  "/eaf",
  "/ecsm",
  "/ips",
  "/ecar-si",
  "/edi",
  "/eai",
  "/easi",
  "/ems",
  "/etare",
  "/eaah",
  "/tde2",
  "/escrita-desenho",
  "/conhecimento-visual",
  "/testes-reconhecimento",
  "/motricidade-teste",
  "/conhecimentos-gerais",
  "/psc17",
  "/gad7",
  "/aq10",
  "/aq50",
  "/crafft",
  "/pedsql",
  "/pant",
  "/eusm10",
  "/generic-scale/:id",
  "/bayley",
  "/griffiths",
  "/rcads",
  "/masc2",
  "/leiter3",
  "/nepsy2",
  "/raven",
  "/wisc5",
  "/wppsi",
  "/pedicat",
  "/tde",
  "/confias",
  "/portage",
  "/vineland-completo",
  "/cbcl-interativo",
]);

export function findNavigationMatch(
  pathname: string,
): NavigationMatch | undefined {
  const matches = allNavigationSections.flatMap((section) =>
    section.items
      .filter((item) => matchesNavigationItem(pathname, item.href))
      .map((item) => ({ section, item })),
  );
  const directMatch = matches.sort(
    (a, b) => b.item.href.length - a.item.href.length,
  )[0];
  if (directMatch) return directMatch;

  const normalizedPath = normalizeNavigationPath(pathname);
  if (filterOwnedRoutes.has(normalizedPath)) {
    const item = featuredNavigation.find(
      (candidate) => candidate.href === "/filtro",
    );
    if (item) return { section: featuredSection, item };
  }
  return undefined;
}

export const getNavigationMatch = findNavigationMatch;
export { filterOwnedRoutes };
