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
import { isLiveBrowserLocalClinicalRouteDenied } from "@/lib/clinicalBrowserPersistencePolicy";

export { isRouteSensitive, SENSITIVE_ROUTES };

type RouteRole = "admin" | "professional" | "reader" | "operator";

/** Caminho + consulta da navegação atual, para retomar o destino após o login. */
function currentHashTarget(path: string): string {
  if (typeof window === "undefined") return path;
  const raw = window.location.hash.replace(/^#/, "");
  const queryIndex = raw.indexOf("?");
  const hashQuery = queryIndex >= 0 ? raw.slice(queryIndex) : "";
  if (hashQuery) return `${path}${hashQuery}`;
  const search = window.location.search;
  return search ? `${path}${search}` : path;
}

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
    // `location` já vem sem a query (o roteador separa caminho de consulta).
    // O destino pós-login precisa preservá-la: sem isso, um link profundo como
    // `#/prontuario?patientId=abc` voltaria depois do login como um prontuário
    // em branco, sem o paciente que motivou o acesso.
    return <Redirect to={`/login?next=${encodeURIComponent(currentHashTarget(location))}`} />;
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

  if (
    accessMode !== "checking" &&
    isLiveBrowserLocalClinicalRouteDenied(location, accessMode, isAuthenticated)
  ) {
    return (
      <section
        className="mx-auto my-10 max-w-xl rounded-2xl border border-amber-500/30 bg-card p-6 shadow-sm"
        role="status"
        data-testid="live-browser-local-clinical-route-blocked"
      >
        <h1 className="text-lg font-bold text-foreground">Recurso local bloqueado no LIVE</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Esta ferramenta mantém workspace ou histórico clínico no navegador e ainda não possui
          uma fonte tenant-aware equivalente no backend canônico. Em sessão LIVE remota ela não é
          montada, não lê dados antigos e não cria prontuário local paralelo.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          O recurso permanece disponível nos modos local/offline explicitamente destinados a esse uso.
        </p>
      </section>
    );
  }

  return <>{children}</>;
}

export { operationalRolesForPath };