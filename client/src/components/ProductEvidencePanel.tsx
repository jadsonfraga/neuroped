import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import { parseProductEvidence, type ProductEvidence } from "../../../shared/product-evidence";

export function ProductEvidenceSummary({ evidence }: { evidence: ProductEvidence }) {
  return <div className="space-y-4" data-testid="product-evidence-summary">
    <p className="text-sm text-muted-foreground">Somente a clínica selecionada. Zero significa contagem observada; “não medido” significa ausência de evidência, nunca zero presumido.</p>
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {evidence.counters.map(item => <div key={item.id} className="rounded-xl border border-border p-3">
        <dt className="text-xs text-muted-foreground">{item.label}</dt>
        <dd className="text-xl font-semibold tabular-nums">{item.value.toLocaleString("pt-BR")}</dd>
      </div>)}
    </dl>
    {evidence.health ? <p className="text-sm">
      Verificação pontual do servidor: <strong>{evidence.health.reportedStatus}</strong>.
      Banco: {evidence.health.database}. Versão declarada da API: {evidence.health.reportedApiVersion}.
      <time className="ml-2" dateTime={evidence.health.reportedAt}>{new Date(evidence.health.reportedAt).toLocaleString("pt-BR")}</time>.
      Esta verificação não comprova disponibilidade histórica nem o SHA publicado.
    </p> : <p className="text-sm">Health check não observado neste retrato.</p>}
    <details className="rounded-xl border border-border p-3">
      <summary className="cursor-pointer font-semibold">Evidências ainda não conectadas ({evidence.unverified.length})</summary>
      <dl className="mt-3 space-y-2 text-sm">
        {evidence.unverified.map(item => <div key={item.id}><dt>{item.label}</dt><dd className="text-muted-foreground">Não medido — não é zero.</dd></div>)}
      </dl>
    </details>
    <p className="text-xs text-muted-foreground">Status “active” no banco não comprova cliente pagante. Documento publicado não certifica revisão profissional. Este painel não certifica prontidão comercial, conformidade legal ou recuperação de produção.</p>
    <p className="text-xs text-muted-foreground">Retrato gerado em <time dateTime={evidence.observedAt}>{new Date(evidence.observedAt).toLocaleString("pt-BR")}</time>.</p>
  </div>;
}

export default function ProductEvidencePanel({ clinicId, actorId }: { clinicId: string; actorId: string }) {
  const query = useQuery({
    queryKey: ["product-evidence", actorId, clinicId],
    enabled: Boolean(actorId && clinicId), retry: false, staleTime: 30_000, gcTime: 0,
    queryFn: async ({ signal }) => {
      const response = await authFetch(`/api/tenants/${encodeURIComponent(clinicId)}/product-evidence`, { signal });
      if (!response.ok) throw new Error("EVIDENCE_UNAVAILABLE");
      const evidence = parseProductEvidence(await response.json());
      if (evidence.clinicId !== clinicId) throw new Error("EVIDENCE_SCOPE_MISMATCH");
      return evidence;
    },
  });
  return <section className="mb-5 rounded-2xl border border-border p-4" aria-labelledby="product-evidence-title">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <h3 id="product-evidence-title" className="font-bold">Product Evidence</h3>
      <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Atualizar evidências</Button>
    </div>
    {query.isPending ? <p role="status">Consultando evidências autorizadas…</p>
      : query.isError ? <p role="alert">Evidências indisponíveis ou acesso não autorizado. Nenhum dado foi estimado.</p>
        : <ProductEvidenceSummary evidence={query.data} />}
  </section>;
}
