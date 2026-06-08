import type { ReactNode } from "react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocalUnlockGate } from "@/components/LocalUnlockGate";
import { hasClinicalUnlock } from "@/lib/localUnlock";

export const SENSITIVE_ROUTES = [
  "/pant",
  "/assinatura-digital",
  "/documentos",
  "/pacientes",
  "/paciente/",
  "/prontuario",
  "/calculadora-dose",
  "/farmacologia",
  "/satisfacao-medicacao",
  "/plano-terapeutico",
  "/plano-intervencao",
  "/avaliacao-multiprofissional",
  "/fichas-registro",
] as const;

export function isRouteSensitive(path: string): boolean {
  return SENSITIVE_ROUTES.some((p) => path.startsWith(p));
}

export function RouteGuard({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Array<"admin" | "professional" | "reader" | "operator">;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [locallyUnlocked, setLocallyUnlocked] = useState(() => hasClinicalUnlock());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center animate-pulse">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !locallyUnlocked) {
    return <LocalUnlockGate onUnlocked={() => setLocallyUnlocked(true)} />;
  }

  if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <Lock className="w-6 h-6 text-red-500" />
        </div>
        <h1 className="text-xl font-bold">Permissão insuficiente</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Seu papel ({user.role}) não tem acesso a este módulo. Contate um administrador.
        </p>
        <Button onClick={() => setLocation("/")}>Voltar</Button>
      </div>
    );
  }

  return <>{children}</>;
}
