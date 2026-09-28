import type { ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { requiresClinicContext } from "@/lib/clinicRoutePolicy";

/** Wait for the real membership before mounting tenant-dependent queries. */
export function ClinicRouteBoundary({ path, children }: { path: string; children: ReactNode }) {
  const { accessMode, isAuthenticated } = useAuth();
  const { activeClinic, isLoading, error, reloadClinics } = useClinic();
  if (accessMode !== "remote" || !isAuthenticated || !requiresClinicContext(path)) return <>{children}</>;
  if (isLoading) {
    return <div role="status" aria-live="polite" className="rounded-2xl border p-6 text-sm" data-testid="clinic-context-loading">
      Carregando vínculo com a clínica…
    </div>;
  }
  if (error || !activeClinic) {
    return <section role="status" className="space-y-3 rounded-2xl border p-6" data-testid="clinic-context-unavailable">
      <h1 className="text-xl font-bold">{error ? "Não foi possível carregar a clínica" : "Nenhuma clínica vinculada"}</h1>
      <p className="text-sm text-muted-foreground">
        {error
          ? "A consulta do vínculo falhou. Atualize para tentar novamente; os dados clínicos não foram substituídos por exemplos."
          : "Esta conta ainda não possui vínculo ativo com uma clínica. Solicite o convite à equipe responsável ou conclua a configuração institucional."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void reloadClinics()}>Atualizar vínculo</Button>
        <Button variant="outline" asChild><Link href="/configuracoes?secao=clinica">Ver configurações da clínica</Link></Button>
      </div>
      <p className="text-xs text-muted-foreground">Atualizar apenas consulta o vínculo existente; não cria clínica, assinatura ou permissões.</p>
    </section>;
  }
  return <>{children}</>;
}
