import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Baby,
  BookOpen,
  CreditCard,
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
 * Atalhos que ficam no topo do shell clínico. São os destinos de uso mais
 * frequente e as conexões institucionais que não devem se perder no catálogo.
 */
export const featuredNavigation: NavItem[] = [
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
  {
    href: "/filtro",
    label: "Filtro de Escalas",
    icon: Filter,
    tone: "golden",
    description: "Por idade e queixa",
  },
  {
    href: "/marcacao",
    // Rótulo curto para caber inteiro no drawer mobile; "marcação" segue
    // visível na descrição do card e pesquisável no command palette.
    label: "Secretaria IA",
    icon: Calendar,
    tone: "golden",
    description: "Marcação e agendamento",
  },
  {
    href: "/conecta",
    label: "NeuroPed Conecta",
    icon: Activity,
    tone: "golden",
    description: "Portais e conexões",
  },
  {
    href: "/servicos-clinica",
    label: "Serviços da Clínica",
    icon: Stethoscope,
    tone: "golden",
    description: "Avaliações e serviços",
  },
];

/**
 * A sidebar apresenta módulos e famílias de ferramentas. As escalas e testes
 * individuais continuam acessíveis pelas próprias rotas e pelo Filtro de
 * Escalas, mas não ocupam mais a navegação estrutural um a um.
 */
export const navSections: NavSection[] = [
  {
    title: "",
    items: [{ href: "/", label: "Início", icon: Home }],
  },
  {
    title: "CLÍNICA",
    items: [
      { href: "/planos", label: "Planos NeuroPed", icon: CreditCard },
      { href: "/assinatura", label: "Assinatura e equipe", icon: CreditCard },
      { href: "/agenda", label: "Agenda", icon: Calendar, tone: "priority" },
      {
        href: "/pacientes",
        label: "Pacientes / Prontuário",
        icon: Users,
        tone: "priority",
      },
      { href: "/memoria-clinica", label: "Memória clínica", icon: BrainCog },
      {
        href: "/neuroacompanhamento",
        label: "NeuroAcompanhamento",
        icon: Baby,
      },
      { href: "/diario-escola", label: "Diário escolar", icon: ClipboardList },
      {
        href: "/avaliacao-multiprofissional",
        label: "Avaliação multiprofissional",
        icon: ClipboardCheck,
      },
      { href: "/neuropsicologia", label: "Neuropsicologia", icon: BrainCog },
      {
        href: "/servicos-clinica",
        label: "Serviços da Clínica",
        icon: Stethoscope,
        tone: "golden",
      },
      { href: "/manus", label: "Integrações Manus", icon: Globe2 },
    ],
  },
  {
    title: "LAUDOS E RECEITAS",
    items: [
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
      {
        href: "/receita-c1-express",
        label: "Receita C1 Express",
        icon: Pill,
        tone: "priority",
      },
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
    ],
  },
  {
    title: "TRIAGEM E FERRAMENTAS",
    items: [
      { href: "/fluxograma", label: "Fluxograma Clínico", icon: Target },
      { href: "/filtro-escalas", label: "Triar sem cadastrar", icon: Filter },
      {
        href: "/bateria-jadson",
        label: "Bateria Jadson",
        icon: ClipboardCheck,
      },
      { href: "/pac", label: "PAC", icon: Brain },
      {
        href: "/inventarios-auto",
        label: "Autoavaliação",
        icon: ClipboardList,
      },
      { href: "/ahsd-tea", label: "AH/SD × TEA", icon: Sparkles },
      { href: "/psiquiatria", label: "Guia psiquiátrico", icon: BrainCog },
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
      { href: "/caa", label: "CAA · Vou Falar", icon: MessageCircle },
    ],
  },
  {
    title: "ACOMPANHAMENTO CLÍNICO",
    items: [
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
        href: "/conecta",
        label: "NeuroPed Conecta",
        icon: Activity,
        tone: "golden",
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
    title: "PORTAIS E SUPORTE",
    items: [
      {
        href: "/brincando-e-aprendendo",
        label: "Brincando e Aprendendo",
        icon: Sparkles,
      },
      { href: "/missao-saude", label: "Missão Saúde", icon: HeartPulse },
      {
        href: "/portal-familia/acesso",
        label: "Política de acesso",
        icon: KeyRound,
      },
      { href: "/ajuda", label: "Ajuda", icon: HelpCircle },
      { href: "/sobre", label: "Sobre", icon: ShieldCheck },
      { href: "/sobre-neuroped", label: "Sobre o NeuroPed", icon: ShieldCheck },
      { href: "/acessibilidade", label: "Acessibilidade", icon: KeyRound },
      { href: "/qualidade", label: "Qualidade", icon: ShieldCheck },
    ],
  },
];

const featuredSection: NavSection = {
  title: "DESTAQUES",
  items: featuredNavigation,
};
const allNavigationSections = [featuredSection, ...navSections];

/** Destinos estáticos não devem ser enviados para o roteador hash da SPA. */
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

/**
 * Rotas de instrumentos individuais continuam profundas para links salvos e
 * favoritos, mas aparecem semanticamente como parte do Filtro de Escalas.
 */
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
  "/crafft",
  "/pedsql",
  "/psc17",
  "/gad7",
  "/aq10",
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
  "/testes-academicos",
  "/escrita-desenho",
  "/conhecimento-visual",
  "/testes-reconhecimento",
  "/motricidade-teste",
  "/conhecimentos-gerais",
  "/tde2",
  "/pant",
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
