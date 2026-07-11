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

/**
 * Bloqueia rotas clínicas (dados de paciente/prontuário/medicação) quando não
 * há sessão autenticada. Sem sessão, redireciona para /login — que, após o
 * sucesso, devolve o profissional à rota pretendida. Rotas públicas/família
 * passam livremente. Enquanto a sessão ainda está sendo verificada
 * (isLoading), não redireciona, para não piscar a tela de login.
 */
export function RouteGuard({ children }: { children: ReactNode; roles?: Array<"admin" | "professional" | "reader" | "operator"> }) {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isClinicalRoute(location) && !isAuthenticated) {
    const next = encodeURIComponent(location);
    return <Redirect to={`/login?next=${next}`} />;
  }

  return <>{children}</>;
}
