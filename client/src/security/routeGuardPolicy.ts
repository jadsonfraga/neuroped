import { isClinicalRoute } from "@/security/accessPolicy";
import { LEGACY_DIRECT_TEST_REDIRECTS } from "@/data/legacyInstrumentRoutes";

export type RouteAccessMode = "checking" | "remote" | "local";
export type RouteUserRole = "admin" | "professional" | "reader" | "operator";
export type RouteAccessDecision = "allow" | "checking" | "login" | "forbidden";

export const SENSITIVE_ROUTES = [
  "/avaliacao-pre-consulta-faixa-etaria",
  "/pant",
  "/assinatura-digital",
  "/documentos",
  "/escuta-clinica",
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
  "/laudo-neuroped", "/laudo-super",
  "/receita-c1",
  "/receita-c1-express",
  "/diario-escola",
  "/neuroacompanhamento",
  "/inventarios-escola",
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
 * A allowlist é exata; escritas continuam bloqueadas pelo backend.
 */
export const READER_CLINICAL_ROUTES = [
  "/",
  "/onboarding",
  "/configuracoes",
  "/mchat",
  "/cars",
  "/snap",
  "/denver",
  "/sdq",
  "/scared",
  "/conners",
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
  "/instrumentos-padronizados",
  "/qualidade",
  // Superfície canônica de instrumento (ficha/aplicação). O reader sempre teve
  // acesso às páginas de escala (/mchat, /cars, /cbcl…) e às antigas fichas
  // nominais (/vineland, /wisc5…); ao consolidar tudo em /generic-scale/:id,
  // negar aqui removeria acesso que o papel já tinha. Escritas continuam
  // bloqueadas pelo backend e o registro autoral segue atrás do PIN master.
  "/generic-scale/:id",
  // Origens dos redirects legados de instrumento: precisam liberar o reader,
  // senão o guard bloqueia o bookmark antes do <Redirect> canônico rodar.
  "/wisc5",
  "/bayley",
  "/vineland",
  "/vineland-completo",
  "/leiter3",
  "/raven",
  "/wppsi",
  "/nepsy2",
  "/griffiths",
  "/masc2",
  "/rcads",
  "/tde",
  "/confias",
  "/pedicat",
  "/portage",
  "/cbcl-interativo",
] as const;

const DEFAULT_CLINICAL_ROLES: readonly RouteUserRole[] = ["admin", "professional"];
const READER_CLINICAL_ROLES: readonly RouteUserRole[] = ["admin", "professional", "reader"];
// A Sonda Dez foi desenhada para aplicação pela assistente. Ela não persiste
// dados e entrega somente registro observacional para revisão médica.
const DIRECT_TEST_ROLES: readonly RouteUserRole[] = [
  "admin",
  "professional",
  "operator",
];
const CLINICAL_ROLE_OVERRIDES: ReadonlyArray<{
  route: string;
  roles: readonly RouteUserRole[];
}> = [
  { route: "/recepcao", roles: ["admin", "professional", "operator"] },
  { route: "/testes-diretos", roles: DIRECT_TEST_ROLES },
  { route: "/avaliacao-pre-consulta-faixa-etaria", roles: DIRECT_TEST_ROLES },
  // As origens de redirect legado da Sonda Dez herdam a política do destino:
  // sem isso o guard decidiria a origem pelos papéis default (sem operator)
  // e bloquearia o bookmark da assistente antes de o <Redirect> rodar. Antes
  // desta unificação, 13 dessas rotas ainda liberavam o papel reader por
  // shim — acesso incidental que a rota canônica nunca concedeu.
  ...Object.keys(LEGACY_DIRECT_TEST_REDIRECTS).map((route) => ({
    route,
    roles: DIRECT_TEST_ROLES,
  })),
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
      (segment, index) => segment.startsWith(":") || segment === pathSegments[index],
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
  const override = CLINICAL_ROLE_OVERRIDES.find(({ route }) =>
    matchesExactRoutePattern(pathname, route),
  );
  if (override) return override.roles;
  return isReaderClinicalRoute(pathname) ? READER_CLINICAL_ROLES : DEFAULT_CLINICAL_ROLES;
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
  if (effectiveRoles?.length && (!userRole || !effectiveRoles.includes(userRole))) {
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
