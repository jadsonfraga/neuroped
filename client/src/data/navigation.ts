import type { LucideIcon } from "lucide-react";
import { LEGACY_DIRECT_TEST_REDIRECTS } from "@/data/legacyInstrumentRoutes";
import {
  Activity,
  Baby,
  Gamepad2,
  BookOpen,
  Brain,
  BrainCog,
  Calculator,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Filter,
  HeartPulse,
  HelpCircle,
  Images,
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

const superNeuroPadNavigation: NavItem = {
  href: "/super-neuropad-game",
  label: "Super NeuroPad Game",
  icon: Gamepad2,
  tone: "priority",
  description: "Aventura em 5 fases · secretária na pré-consulta · resultado em PDF",
};

const obs10Navigation: NavItem = {
  href: "/avaliacao-pre-consulta-faixa-etaria",
  label: "OBS-10 · Pré-Consulta",
  icon: Baby,
  tone: "priority",
  description: "Observação guiada · 13 faixas etárias · guia da assistente",
};

/**
 * Sonda Dez e OBS-10 abrem o bloco clínico; a rotina de atendimento vem a
 * seguir. Conexões usam um grupo compacto separado, independente da cor.
 */
export const featuredNavigation: NavItem[] = [
  superNeuroPadNavigation,
  {
    href: "/testes-diretos",
    label: "Sonda Dez · Avaliação Direta",
    icon: Sparkles,
    tone: "priority",
    description: "Avaliação direta pré-consulta · 10 min",
  },
  obs10Navigation,
  {
    href: "/testes-reconhecimento",
    label: "Reconhecimento Visual",
    icon: Images,
    tone: "priority",
    description: "Figuras por idade · reconhecer, nomear e parear",
  },
  {
    href: "/testes-cognitivos",
    label: "Testes cognitivos por faixa etária",
    icon: Brain,
    tone: "priority",
    description: "Aventura em 4 mundos · visual, leitura, escrita e aritmética",
  },
  {
    href: "/pacientes",
    label: "Pacientes / Prontuário",
    icon: Users,
    tone: "priority",
    description: "Abrir prontuário longitudinal",
  },
  {
    href: "/agenda",
    label: "Agenda & Gestão",
    icon: Calendar,
    tone: "priority",
    description: "Consultas e organização do atendimento",
  },
  {
    href: "/laudo-neuroped",
    label: "Laudos",
    icon: FileText,
    tone: "priority",
    description: "Documentação clínica",
  },
  {
    href: "/receita-c1",
    label: "Receita C1",
    icon: Pill,
    tone: "priority",
    description: "Prescrição clínica",
  },
  {
    href: "/filtro",
    label: "Filtro de Escalas",
    icon: Filter,
    tone: "priority",
    description: "Escolha por idade e queixa",
  },
  {
    href: "/escuta-clinica",
    label: "Escuta Clínica",
    icon: Waves,
    tone: "priority",
    description: "Áudio e anamnese estruturada",
  },
  {
    href: "/medicamentos",
    label: "Medicamentos",
    icon: Pill,
    tone: "priority",
    description: "Acompanhamento farmacológico",
  },
  {
    href: "/calculadora-dose",
    label: "Calculadora de dose",
    icon: Calculator,
    tone: "priority",
    description: "Apoio ao cálculo clínico",
  },
  {
    href: "/marcacao",
    label: "Secretaria IA",
    icon: Calendar,
    tone: "connection",
    description: "Agendamento próprio NeuroPad · 1 hora por paciente",
  },
  // prettier-ignore — formato preservado pelo guard de integração do Conecta.
  { href: "/conecta", label: "NeuroPed Conecta", icon: Activity, tone: "connection", description: "Portais e conexões" },
  {
    href: "/eletroencefalograma",
    label: "EEG & Vídeo-EEG",
    icon: Waves,
    tone: "connection",
    description: "Exames e orientação clínica",
  },
  {
    href: "/nesplora/",
    label: "Nesplora",
    icon: Brain,
    tone: "connection",
    description: "Experiência imersiva em VR",
  },
];

export const navSections: NavSection[] = [
  { title: "PRÉ-CONSULTA GUIADA", items: [superNeuroPadNavigation, obs10Navigation] },
  {
    title: "",
    items: [{ href: "/", label: "Início", icon: Home }],
  },
  {
    title: "ATENDIMENTO",
    items: [
      { href: "/pacientes", label: "Pacientes / Prontuário", icon: Users, tone: "priority" },
      { href: "/agenda", label: "Agenda & Gestão", icon: Calendar, tone: "priority" },
      { href: "/laudo-neuroped", label: "Laudos", icon: FileText, tone: "priority" },
      { href: "/receita-c1", label: "Receita C1", icon: Pill, tone: "priority" },
      { href: "/memoria-clinica", label: "Memória clínica", icon: BrainCog },
      { href: "/laudo-super", label: "Laudos SuperNeuroPed", icon: ShieldCheck },
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
      { href: "/filtro-escalas", label: "Triar sem cadastrar", icon: Filter, tone: "priority" },
      {
        href: "/testes-reconhecimento",
        label: "Teste de Reconhecimento Visual",
        icon: Images,
        tone: "priority",
        description: "Figuras e conceitos organizados por faixa etária",
      },
      {
        href: "/testes-cognitivos",
        label: "Testes cognitivos por faixa etária",
        icon: Brain,
        tone: "priority",
        description: "Visual, fala/leitura, letras/escrita e números · 1–19 anos",
      },
      {
        href: "/testes-diretos",
        label: "Sonda Dez · Avaliação Direta",
        icon: Sparkles,
        tone: "priority",
        description: "Aplicação guiada em 10 minutos",
      },
      { href: "/bateria-jadson", label: "Bateria Jadson", icon: ClipboardCheck },
      { href: "/fluxograma", label: "Fluxograma Clínico", icon: Target },
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
      { href: "/calculadora-dose", label: "Calculadora de dose", icon: Calculator, tone: "priority" },
      { href: "/epilepsia", label: "Diário de epilepsia", icon: Activity },
      { href: "/cefaleia", label: "Calendário de cefaleia", icon: Calendar },
      { href: "/diario-sono", label: "Diário do sono", icon: Moon },
      { href: "/diario-alimentar", label: "Diário alimentar", icon: ClipboardList },
      { href: "/farmacologia", label: "Farmacologia", icon: Pill },
      { href: "/conecta", label: "NeuroPed Conecta", icon: Activity, tone: "connection" },
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

function matchesNavigationItem(pathname: string, href: string): boolean {
  const path = normalizeNavigationPath(pathname);
  const normalizedHref = normalizeNavigationPath(href);
  if (normalizedHref === "/") return path === "/";
  return path === normalizedHref || path.startsWith(`${normalizedHref}/`);
}

const filterOwnedRoutes = new Set([
  "/mchat", "/cars", "/denver", "/asq3", "/snap", "/sdq", "/vanderbilt",
  "/scared", "/phqa", "/cssrs", "/conners", "/cbcl", "/brief2", "/abc",
  "/cdi2", "/gmfcs", "/cshq", "/ygtss", "/crafft", "/pedsql",
  "/psc17", "/gad7", "/aq10", "/tea", "/tea-comportamentos", "/emdi", "/eaf",
  "/ecsm", "/ips", "/ecar-si", "/edi", "/eai", "/easi", "/ems", "/etare",
  "/eaah", "/tde2", "/pant",
]);

/**
 * Rotas antigas de teste direto continuam resolvendo para a Sonda Dez —
 * derivadas do mapa de redirects (fonte única; padrões :param ficam de fora
 * porque a navegação compara caminhos literais normalizados). Só entram as
 * origens cujo destino é a própria Sonda Dez: /avaliacao-cognitiva-infantil
 * hoje redireciona para /testes-cognitivos, que tem item próprio no menu.
 */
const sondaOwnedRoutes = new Set(
  Object.entries(LEGACY_DIRECT_TEST_REDIRECTS)
    .filter(([route, target]) => !route.includes(":") && target === "/testes-diretos")
    .map(([route]) => route),
);

export function findNavigationMatch(pathname: string): NavigationMatch | undefined {
  const matches = allNavigationSections.flatMap((section) =>
    section.items
      .filter((item) => matchesNavigationItem(pathname, item.href))
      .map((item) => ({ section, item })),
  );
  // Destaques repetem destinos para acesso rápido; a seção real é quem deve
  // abrir e receber o auto-scroll. Rotas mais específicas continuam vencendo.
  const directMatch = matches.sort((a, b) =>
    b.item.href.length - a.item.href.length ||
    Number(a.section === featuredSection) - Number(b.section === featuredSection),
  )[0];
  if (directMatch) return directMatch;

  const normalizedPath = normalizeNavigationPath(pathname);
  if (sondaOwnedRoutes.has(normalizedPath) || normalizedPath.startsWith("/cognitive-lab/")) {
    const item = featuredNavigation.find((candidate) => candidate.href === "/testes-diretos");
    if (item) return { section: featuredSection, item };
  }
  if (
    filterOwnedRoutes.has(normalizedPath) ||
    normalizedPath.startsWith("/generic-scale/")
  ) {
    const item = featuredNavigation.find((candidate) => candidate.href === "/filtro");
    if (item) return { section: featuredSection, item };
  }
  return undefined;
}

export const getNavigationMatch = findNavigationMatch;
export { filterOwnedRoutes };
