import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { authFetch } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import { tenantMetricsSchema, type TenantMetrics } from "../../../shared/tenantMetrics";

export function TenantMetricsSummary({ metrics }: { metrics: TenantMetrics }) {
  const stats = [
    ["Hoje (UTC)", metrics.auditedActorsToday],
    ["Últimos 7 dias", metrics.auditedActors7Days],
    ["Últimos 30 dias", metrics.auditedActors30Days],
  ] as const;
  return <div className="space-y-4" data-testid="tenant-metrics-summary">
    <p className="text-sm leading-relaxed text-muted-foreground">
      Contas distintas com operações registradas na auditoria desta clínica.
      Não são visitas ao site, número de pacientes ou todos os acessos ao aplicativo.
    </p>
    <dl className="grid gap-3 sm:grid-cols-3">
      {stats.map(([label, value]) => <div key={label} className="rounded-2xl border border-border p-4">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-2 text-2xl font-semibold tabular-nums">{value.toLocaleString("pt-BR")}</dd>
      </div>)}
    </dl>
    <p className="text-sm">Operações auditadas em 30 dias: <strong>{metrics.auditedEvents30Days.toLocaleString("pt-BR")}</strong>.</p>
    <p className="text-xs leading-relaxed text-muted-foreground">
      Período em UTC: {metrics.window.from} até {metrics.window.toExclusive} (limite final exclusivo).
      O dia atual está em andamento. Visitantes e retenção ainda não são medidos.
    </p>
    <p className="rounded-xl border border-border p-3 text-xs leading-relaxed">
      Telemetria técnica da API: {metrics.apiInstrumentationBindingPresent ? "binding configurado" : "binding ausente neste ambiente"}.
      Configuração não comprova entrega nem histórico de eventos.
    </p>
  </div>;
}

export default function TenantMetricsPanel() {
  const { user, isAuthenticated, isLoading, accessMode } = useAuth();
  const { activeClinicId, activeClinic } = useClinic();
  const permitted = !isLoading && accessMode === "remote" && isAuthenticated && !user?.mustChangePassword
    && activeClinic?.status === "active" && (activeClinic.role === "owner" || activeClinic.role === "clinic_admin");
  const query = useQuery({
    queryKey: ["tenant-activity-metrics", user?.id, activeClinicId],
    enabled: Boolean(permitted && activeClinicId),
    retry: false,
    staleTime: 30_000,
    gcTime: 0,
    queryFn: async ({ signal }) => {
      if (!activeClinicId) throw new Error("METRICS_UNAVAILABLE");
      const response = await authFetch(`/api/tenants/${encodeURIComponent(activeClinicId)}/metrics`, { signal });
      if (!response.ok) throw new Error("METRICS_UNAVAILABLE");
      return tenantMetricsSchema.parse(await response.json());
    },
  });
  if (!permitted) return <p className="text-sm text-muted-foreground">Atividade disponível somente para proprietário(a) ou administrador(a) da clínica ativa.</p>;
  return <section className="rounded-3xl border border-primary/15 bg-card p-5 shadow-sm sm:p-6" aria-labelledby="tenant-metrics-title">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 id="tenant-metrics-title" className="text-base font-bold">Atividade auditada da clínica</h2>
      <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Atualizar métricas</Button>
    </div>
    {query.isPending ? <p role="status" className="text-sm text-muted-foreground">Carregando atividade auditada…</p>
      : query.isError ? <p role="alert" className="text-sm text-destructive">Métricas indisponíveis neste momento. Nenhum valor foi estimado.</p>
      : <TenantMetricsSummary metrics={query.data} />}
  </section>;
}
