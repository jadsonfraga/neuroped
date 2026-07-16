import type { ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { decideRouteAccess } from "@/security/routeGuardPolicy";

export const SENSITIVE_ROUTES = [
  "/pant",
  "/assinatura-digital",
  "/documentos",
  "/pacientes",
  "/paciente/",
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

export function isRouteSensitive(path: string): boolean {
  return SENSITIVE_ROUTES.some((p) => path.startsWith(p));
}

export function RouteGuard({ children }: { children: ReactNode; roles?: Array<"admin" | "professional" | "reader" | "operator"> }) {
  const [location] = useLocation();
  const { accessMode, isAuthenticated, isLoading } = useAuth();
  const decision = decideRouteAccess({
    path: location,
    accessMode,
    isAuthenticated,
    isLoading,
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
            O conteúdo clínico só será exibido após validar a sessão.
          </p>
        </div>
      </div>
    );
  }

  if (decision === "login") {
    return <Redirect to={`/login?next=${encodeURIComponent(location)}`} />;
  }

  return <>{children}</>;
}
