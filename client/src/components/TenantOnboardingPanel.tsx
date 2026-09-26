import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { authFetch } from "@/lib/authClient";
import { parseOnboardingProgress } from "../../../shared/onboarding-progress";

/** Parent access is derived from backend permissions; the endpoint independently reauthorizes. */
export default function TenantOnboardingPanel({ clinicId, actorId }: { clinicId: string; actorId: string }) {
  const query = useQuery({
    queryKey: ["tenant-onboarding-progress", actorId, clinicId],
    enabled: Boolean(clinicId && actorId), retry: false, staleTime: 30_000, gcTime: 0,
    queryFn: async ({ signal }) => {
      const response = await authFetch(`/api/tenants/${encodeURIComponent(clinicId)}/onboarding`, { signal });
      if (!response.ok) throw new Error("ONBOARDING_UNAVAILABLE");
      return parseOnboardingProgress(await response.json());
    },
  });
  return <section className="mb-5 space-y-3 rounded-2xl border border-border p-5" aria-labelledby="tenant-onboarding-title">
    <h2 id="tenant-onboarding-title" className="font-bold">Ativação da clínica</h2>
    {query.isPending ? <p role="status">Consultando etapas registradas…</p>
      : query.isError ? <p role="alert">Progresso indisponível. Nenhuma etapa foi presumida.</p>
        : <>
          <p>{query.data.observedSteps} de {query.data.totalSteps} etapas com registro verificável neste painel.</p>
          <progress className="w-full" aria-label="Etapas registradas" max={query.data.totalSteps} value={query.data.observedSteps} />
          <ol className="space-y-2 text-sm">
            {query.data.steps.map(step => <li key={step.id}>
              <strong>{step.label}</strong>: {step.status === "observed" ? "registrado" : step.status === "not_measured" ? "validação externa não comprovada neste painel" : "não observado nos registros retidos"}
              {step.observedAt && <time className="ml-2 text-muted-foreground" dateTime={step.observedAt}>{new Date(step.observedAt).toLocaleString("pt-BR")}</time>}
            </li>)}
          </ol>
          <p className="text-xs text-muted-foreground">Este progresso não certifica cobrança real, receita ou prontidão comercial. Dados eliminados não permanecem neste retrato; checkout não é confirmação de pagamento.</p>
          <Link className="text-sm underline" href="/configuracoes?secao=plano">Abrir gestão do plano</Link>
        </>}
  </section>;
}
