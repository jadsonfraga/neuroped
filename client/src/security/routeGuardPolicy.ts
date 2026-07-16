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
] as const;

const DEFAULT_SENSITIVE_ROLES: readonly RouteUserRole[] = ["admin", "professional"];

export function isRouteSensitive(path: string): boolean {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  return SENSITIVE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

interface RouteAccessInput {
  path: string;
  accessMode: RouteAccessMode;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole?: RouteUserRole | null;
  allowedRoles?: readonly RouteUserRole[];
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
}: RouteAccessInput): RouteAccessDecision {
  if (!isClinicalRoute(path) || accessMode === "local") return "allow";
  if (accessMode === "checking" || isLoading) return "checking";
  if (!isAuthenticated) return "login";
  const effectiveRoles = allowedRoles ?? (isRouteSensitive(path) ? DEFAULT_SENSITIVE_ROLES : undefined);
  if (effectiveRoles?.length && (!userRole || !effectiveRoles.includes(userRole))) {
    return "forbidden";
  }
  return "allow";
}
