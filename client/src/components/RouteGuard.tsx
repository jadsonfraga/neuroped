import type { ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { isClinicalRoute } from "@/security/accessPolicy";

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

  if (
    !isLoading &&
    accessMode === "remote" &&
    isClinicalRoute(location) &&
    !isAuthenticated
  ) {
    return <Redirect to={`/login?next=${encodeURIComponent(location)}`} />;
  }

  return <>{children}</>;
}
