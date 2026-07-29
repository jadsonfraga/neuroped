import { isClinicalRoute } from "@/security/accessPolicy";

export type RouteAccessMode = "checking" | "remote" | "local";
export type RouteUserRole = "admin" | "professional" | "reader" | "operator";
export type RouteAccessDecision = "allow" | "checking" | "login" | "forbidden";

export const SENSITIVE_ROUTES = [
  "/pant",
  "/assinatura-digital",
  "/documentos",
  "/pacientes",
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
  "/receita-c1",
  "/receita-c1-express",
  "/diario-escola",
  "/inventarios-escola",
  "/generic-scale",
  "/cognitive-lab",
  "/testes-diretos",
  "/epilepsia",
  "/cefaleia",
  "/diario-sono",
  "/diario-alimentar",
  "/recepcao",
] as const;

const DEFAULT_CLINICAL_ROLES: readonly RouteUserRole[] = ["admin", "professional"];
const CLINICAL_ROLE_OVERRIDES: ReadonlyArray<{
  route: string;
  roles: readonly RouteUserRole[];
}> = [
  // A recepção opera a fila, mas não recebe acesso às demais áreas clínicas.
  { route: "/recepcao", roles: ["admin", "professional", "operator"] },
];

export function isRouteSensitive(path: string): boolean {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  return SENSITIVE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function getDefaultClinicalRoles(path: string): readonly RouteUserRole[] {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  const override = CLINICAL_ROLE_OVERRIDES.find(
    ({ route }) => pathname === route || pathname.startsWith(`${route}/`),
  );
  return override?.roles ?? DEFAULT_CLINICAL_ROLES;
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
  if (effectiveRoles?.length && (!userRole || !effectiveRoles.includes(userRole))) {
    return "forbidden";
  }
  return "allow";
}
