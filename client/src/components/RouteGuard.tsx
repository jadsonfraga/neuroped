import type { ReactNode } from "react";

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

// Acesso controlado exclusivamente pelo PrivateGate (PIN master).
// Este componente é transparente — não bloqueia nenhuma rota.
export function RouteGuard({ children }: { children: ReactNode; roles?: Array<"admin" | "professional" | "reader" | "operator"> }) {
  return <>{children}</>;
}
