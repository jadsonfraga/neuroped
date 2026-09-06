import { Suspense, lazy } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { RouteGuard } from "@/components/RouteGuard";

// Ponte de defesa em profundidade exigida pela política de acesso
// (scripts/guards/audit-access-policy.mjs): rota sensível mantém proteção
// mesmo se sair do roteador principal. Import LAZY de propósito — a rota
// dedicada em App.tsx casa antes deste catch-all, e o import estático puxava
// a página para o chunk principal, anulando o code-splitting.
const DocumentosPage = lazy(() => import("./documentos"));
const EspecialidadesPremiumPage = lazy(() => import("./especialidades-premium"));

export default function NotFound() {
  const [location] = useLocation();

  if (location === "/documentos") {
    return (
      <RouteGuard roles={["admin", "professional"]}>
        <Suspense fallback={null}>
          <DocumentosPage />
        </Suspense>
      </RouteGuard>
    );
  }

  // Superfície institucional pública, deliberadamente fullscreen. O portal
  // remove a página do contexto transformado/overflow do PageTransition e do
  // Layout clínico, de modo que o resultado renderizado ocupe o viewport real
  // sem a sidebar por baixo. Não há acesso a dados clínicos nesta superfície.
  if (location === "/especialidades" && typeof document !== "undefined") {
    return createPortal(
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-background" data-testid="especialidades-premium-surface">
        <Suspense fallback={null}>
          <EspecialidadesPremiumPage />
        </Suspense>
      </div>,
      document.body,
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-foreground">Página não encontrada</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Esta rota ainda não possui tela dedicada no NeuroPed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}