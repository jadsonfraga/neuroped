import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import DocumentosPage from "./documentos";

export default function NotFound() {
  const [location] = useLocation();

  // Ponte temporária: mantém o item /documentos funcional mesmo antes da expansão completa do roteador.
  if (location === "/documentos") return <DocumentosPage />;

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
