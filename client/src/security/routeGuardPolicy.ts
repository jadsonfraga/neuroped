import { isClinicalRoute } from "@/security/accessPolicy";

export type RouteAccessMode = "checking" | "remote" | "local";
export type RouteUserRole = "admin" | "professional" | "reader" | "operator";
export type RouteAccessDecision = "allow" | "checking" | "login" | "forbidden";

export const SENSITIVE_ROUTES = [
  "/pant",
  "/assinatura-digital",
  "/documentos",
  "/pacientes",
  "/memoria-clinica",
  "/paciente",
  "/prontuario",
  "/calculadora-dose",
  "/farmacologia",
  "/medicamentos",
  "/satisfacao-medicacao",
  "/plano-terapeutico",
  "/plano-intervencao",
  "/avaliacao-multiprofissional",
  "/fichas-registro",
  "/laudo-neuroped",
  "/laudo-super",
  "/receita-c1",
  "/receita-c1-express",
  "/diario-escola",
  "/neuroacompanhamento",
  "/inventarios-escola",
  "/generic-scale",
  "/cognitive-lab",
  "/testes-diretos",
  "/epilepsia",
  "/cefaleia",
  "/diario-sono",
  "/diario-alimentar",
  "/recepcao",
  "/conecta",
  "/agenda",
  "/manus",
] as const;

/**
 * Rotas clínicas já existentes nas quais o papel `reader` preserva acesso à UI.
 * A allowlist é exata (parâmetros `:id` ocupam um único segmento) e não autoriza
 * novas rotas ou descendentes. Escritas continuam bloqueadas pelo backend.
 */
export const READER_CLINICAL_ROUTES = [
  "/",
  "/mchat",
  "/cars",
  "/snap",
  "/denver",
  "/sdq",
  "/scared",
  "/conners",
  "/vineland",
  "/fluxograma",
  "/cdi2",
  "/phqa",
  "/cssrs",
  "/crafft",
  "/cbcl",
  "/vanderbilt",
  "/brief2",
  "/abc",
  "/asq3",
  "/pedsql",
  "/gmfcs",
  "/cshq",
  "/ygtss",
  "/tea",
  "/tea-comportamentos",
  "/psiquiatria",
  "/bateria-jadson",
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
  "/escalas-neuropsiquiatria",
  "/neuropsicologia",
  "/pac",
  "/ahsd-tea",
  "/tde2",
  "/testes-reconhecimento",
  "/testes-academicos",
  "/avaliacao-cognitiva-infantil",
  "/nova-avaliacao-cognitiva",
  "/academico-interativo",
  "/escrita-desenho",
  "/conhecimento-visual",
  "/motricidade-teste",
  "/conhecimentos-gerais",
  "/funcoes-executivas",
  "/atencao-concentracao",
  "/linguagem-fonologia",
  "/memoria-teste",
  "/processamento-visuoauditivo",
  "/inventarios-auto",
  "/psc17",
  "/gad7",
  "/aq10",
  "/aq50",
  "/classificacao/:id",
  "/ballard",
  "/biblioteca-instrumentos",
  "/espasticidade",
  "/classificacoes",
  "/fluxogramas",
  "/valores-referencia",
  "/pdae",
  "/eusm10",
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
  "/instrumentos-padronizados",
  "/qualidade",
] as const;

const DEFAULT_CLINICAL_ROLES: readonly RouteUserRole[] = [
  "admin",
  "professional",
];
const READER_CLINICAL_ROLES: readonly RouteUserRole[] = [
  "admin",
  "professional",
  "reader",
];
const CLINICAL_ROLE_OVERRIDES: ReadonlyArray<{
  route: string;
  roles: readonly RouteUserRole[];
}> = [
  // A recepção opera a fila, mas não recebe acesso às demais áreas clínicas.
  { route: "/recepcao", roles: ["admin", "professional", "operator"] },
  // A secretaria pode consultar e registrar memória operacional compartilhada;
  // o backend continua bloqueando memória clínica para esse perfil.
  { route: "/memoria-clinica", roles: ["admin", "professional", "operator"] },
];

function normalizePathname(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  return pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
}

function matchesExactRoutePattern(pathname: string, pattern: string): boolean {
  const pathSegments = pathname.split("/").filter(Boolean);
  const patternSegments = pattern.split("/").filter(Boolean);
  return (
    pathSegments.length === patternSegments.length &&
    patternSegments.every(
      (segment, index) =>
        segment.startsWith(":") || segment === pathSegments[index],
    )
  );
}

export function isRouteSensitive(path: string): boolean {
  const pathname = normalizePathname(path);
  return SENSITIVE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isReaderClinicalRoute(path: string): boolean {
  const pathname = normalizePathname(path);
  return READER_CLINICAL_ROUTES.some((pattern) =>
    matchesExactRoutePattern(pathname, pattern),
  );
}

function getDefaultClinicalRoles(path: string): readonly RouteUserRole[] {
  const pathname = normalizePathname(path);
  const override = CLINICAL_ROLE_OVERRIDES.find(
    ({ route }) => pathname === route,
  );
  if (override) return override.roles;
  return isReaderClinicalRoute(pathname)
    ? READER_CLINICAL_ROLES
    : DEFAULT_CLINICAL_ROLES;
}

interface RouteAccessInput {
  path: string;
  accessMode: RouteAccessMode;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole?: RouteUserRole | null;
  allowedRoles?: readonly RouteUserRole[];
  localPinConfigured?: boolean;
  localPinUnlocked?: boolean;
}

/**
 * Decide o acesso antes de qualquer página montar.
 *
 * No modo remoto, somente a allowlist pública abre sem sessão. Rotas clínicas
 * ficam bloqueadas enquanto o bootstrap de autenticação está em andamento e
 * redirecionam ao login apenas depois de a ausência de sessão ser confirmada.
 */
export function decideRouteAccess({
  path,
  accessMode,
  isAuthenticated,
  isLoading,
  userRole,
  allowedRoles,
  localPinConfigured = false,
  localPinUnlocked = false,
}: RouteAccessInput): RouteAccessDecision {
  if (!isClinicalRoute(path)) return "allow";
  if (accessMode === "checking" || isLoading) return "checking";
  if (accessMode === "local") {
    return localPinConfigured && localPinUnlocked ? "allow" : "forbidden";
  }
  if (!isAuthenticated) return "login";
  const effectiveRoles = allowedRoles ?? getDefaultClinicalRoles(path);
  if (
    effectiveRoles?.length &&
    (!userRole || !effectiveRoles.includes(userRole))
  ) {
    return "forbidden";
  }
  return "allow";
}

export function canRenderNavigationItem({
  path,
  accessMode,
  isAuthenticated,
  isLoading,
  userRole,
  localPinConfigured = false,
  localPinUnlocked = false,
}: Omit<RouteAccessInput, "allowedRoles">): boolean {
  return (
    decideRouteAccess({
      path,
      accessMode,
      isAuthenticated,
      isLoading,
      userRole,
      localPinConfigured,
      localPinUnlocked,
    }) === "allow"
  );
}
