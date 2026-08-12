import type { ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  decideRouteAccess,
  isRouteSensitive,
  SENSITIVE_ROUTES,
} from "@/security/routeGuardPolicy";
import {
  hasConfiguredMasterPin,
  isMasterPinUnlocked,
} from "@/lib/masterPin";

export { isRouteSensitive, SENSITIVE_ROUTES };

type RouteRole = "admin" | "professional" | "reader" | "operator";

function operationalRolesForPath(path: string, roles?: RouteRole[]): RouteRole[] | undefined {
  if (!roles || path !== "/agenda" || roles.includes("operator")) return roles;
  // A agenda é a única superfície explicitamente compartilhada com a recepção.
  // O backend ainda exige vínculo operator -> profissional e filtra as ações.
  return [...roles, "operator"];
}

export function RouteGuard({ children, roles }: { children: ReactNode; roles?: RouteRole[] }) {
  const [location] = useLocation();
  const { accessMode, isAuthenticated, isLoading, user } = useAuth();
  const decision = decideRouteAccess({
    path: location,
    accessMode,
    isAuthenticated,
    isLoading,
    userRole: user?.role,
    allowedRoles: operationalRolesForPath(location, roles),
    localPinConfigured:
      accessMode === "local" && hasConfiguredMasterPin(),
    localPinUnlocked:
      accessMode === "local" && isMasterPinUnlocked(),
  });

  if (decision === "checking") {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center p-6 text-center"
        role="status"
        aria-live="polite"
      >
        <div>
          <div
            className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600"
            aria-hidden="true"
          />
          <p className="font-semibold text-slate-700">Verificando acesso seguro…</p>
          <p className="mt-1 text-xs text-slate-500">
            O conteúdo restrito só será exibido após validar a sessão.
          </p>
        </div>
      </div>
    );
  }

  if (decision === "login") {
    return <Redirect to={`/login?next=${encodeURIComponent(location)}`} />;
  }

  if (decision === "forbidden") {
    return (
      <section
        className="mx-auto my-10 max-w-lg rounded-2xl border border-destructive/25 bg-card p-6 text-center shadow-sm"
        role="alert"
      >
        <h1 className="text-lg font-bold text-foreground">Acesso não autorizado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu perfil não possui permissão para abrir esta área restrita.
        </p>
      </section>
    );
  }

  return <>{children}</>;
}

export { operationalRolesForPath };
