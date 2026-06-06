import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const SENSITIVE_ROUTES = [
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
];

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center animate-pulse">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs text-muted-foreground">Verificando sessao...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <Lock className="w-6 h-6 text-amber-500" />
        </div>
        <h1 className="text-xl font-bold">Area profissional restrita</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Este modulo envolve dados clinicos, prontuario, prescricao ou informacoes identificaveis. Faca
          login com suas credenciais profissionais para acessar.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => setLocation("/login")}>Fazer login</Button>
          <Button variant="ghost" onClick={() => setLocation("/")}>
            Voltar a area educativa
          </Button>
        </div>
      </div>
    );
  }

  if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <Lock className="w-6 h-6 text-red-500" />
        </div>
        <h1 className="text-xl font-bold">Permissao insuficiente</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Seu papel ({user.role}) nao tem acesso a este modulo. Contate um administrador.
        </p>
        <Button onClick={() => setLocation("/")}>Voltar</Button>
      </div>
    );
  }

  return <>{children}</>;
}
