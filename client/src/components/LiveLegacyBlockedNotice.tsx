import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Módulos que ainda só existem nas tabelas legadas *_demo (por dono, sem
 * clínica). Numa sessão LIVE autenticada eles não leem nem gravam ali: dados
 * clínicos fora do tenant violam a regra canônica do AGENTS.md. Registros
 * legados preexistentes não são apagados nem migrados por esta tela.
 */
export function useLiveLegacyBlocked(): boolean {
  const { accessMode, isAuthenticated } = useAuth();
  return accessMode === "remote" && isAuthenticated;
}

export function LiveLegacyBlockedNotice({ moduleName, alternative }: { moduleName: string; alternative?: string }) {
  return (
    <Card
      className="border-amber-300 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20"
      data-testid="live-legacy-blocked"
    >
      <CardContent className="flex items-start gap-3 p-5 text-sm leading-6 text-amber-950 dark:text-amber-100">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">{moduleName} indisponível no modo clínico LIVE.</p>
          <p className="mt-1">
            Este módulo ainda não tem armazenamento vinculado à clínica e ao paciente. Para não gravar dados clínicos fora
            da clínica, ele não lê nem grava nada nesta sessão. Registros anteriores não foram apagados nem enviados.
          </p>
          {alternative ? <p className="mt-1">{alternative}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
