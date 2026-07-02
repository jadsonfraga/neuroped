import { Suspense, lazy } from "react";
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
