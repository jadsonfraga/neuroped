import { isClinicalRoute } from "@/security/accessPolicy";

export type RouteAccessMode = "checking" | "remote" | "local";
export type RouteAccessDecision = "allow" | "checking" | "login";

interface RouteAccessInput {
  path: string;
  accessMode: RouteAccessMode;
  isAuthenticated: boolean;
  isLoading: boolean;
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
}: RouteAccessInput): RouteAccessDecision {
  if (!isClinicalRoute(path) || accessMode === "local") return "allow";
  if (accessMode === "checking" || isLoading) return "checking";
  return isAuthenticated ? "allow" : "login";
}
