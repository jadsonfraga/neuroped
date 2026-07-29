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

type SensitiveRoute = (typeof SENSITIVE_ROUTES)[number];

const DEFAULT_SENSITIVE_ROLES: readonly RouteUserRole[] = ["admin", "professional"];
const SENSITIVE_ROLE_OVERRIDES: Partial<
  Record<SensitiveRoute, readonly RouteUserRole[]>
> = {
  // A recepção opera a fila, mas não recebe acesso às demais áreas clínicas.
  "/recepcao": ["admin", "professional", "operator"],
};

function findSensitiveRoute(path: string): SensitiveRoute | undefined {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  return SENSITIVE_ROUTES.find(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isRouteSensitive(path: string): boolean {
  return findSensitiveRoute(path) !== undefined;
}

function getDefaultSensitiveRoles(
  path: string,
): readonly RouteUserRole[] | undefined {
  const route = findSensitiveRoute(path);
  return route ? SENSITIVE_ROLE_OVERRIDES[route] ?? DEFAULT_SENSITIVE_ROLES : undefined;
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
  const effectiveRoles = allowedRoles ?? getDefaultSensitiveRoles(path);
  if (effectiveRoles?.length && (!userRole || !effectiveRoles.includes(userRole))) {
    return "forbidden";
  }
  return "allow";
}
