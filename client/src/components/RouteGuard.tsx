import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center animate-pulse">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs text-muted-foreground">Verificando sessão…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto py-16 px-6 text-center space-y-5">
        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--chart-2) / 0.08))",
            border: "1px solid hsl(var(--primary) / 0.25)",
            boxShadow: "0 8px 24px hsl(var(--primary) / 0.12)",
          }}
        >
          <Lock className="w-7 h-7 text-primary" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Login necessário</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Áreas clínicas com dados identificáveis exigem autenticação nominal no backend seguro.
          </p>
        </div>
        <Button
          onClick={() => setLocation("/login")}
          className="w-full h-11 font-semibold"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--chart-2)))",
            boxShadow: "0 4px 16px hsl(var(--primary) / 0.3)",
          }}
        >
          Entrar na conta
        </Button>
      </div>
    );
  }

  if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
    return (
      <div className="max-w-sm mx-auto py-16 px-6 text-center space-y-5">
        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, hsl(var(--destructive) / 0.12), hsl(var(--destructive) / 0.06))",
            border: "1px solid hsl(var(--destructive) / 0.25)",
          }}
        >
          <ShieldAlert className="w-7 h-7 text-destructive" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Permissão insuficiente</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Seu perfil ({user.role}) não tem acesso a este módulo. Contate um administrador.
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/")} className="w-full h-11 font-semibold">
          Voltar ao início
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
