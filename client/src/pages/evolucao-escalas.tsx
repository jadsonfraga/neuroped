import { useEffect, useMemo, useState } from "react";
import { LineChart as LineChartIcon } from "lucide-react";
import { Link } from "wouter";
import { PageHero } from "@/components/PageHero";
import { EvolucaoEscalasPanel } from "@/components/EvolucaoEscalasPanel";
import { Label } from "@/components/ui/label";
import { calcularEvolucao, LIMIAR_PADRAO } from "@/lib/evolucaoEscalas";
import { loadAllPatientResults } from "@/lib/patientResultsPagination";
import { apiRequest } from "@/lib/queryClient";
import { readRouteParam } from "@/lib/routeQuery";

export default function EvolucaoEscalasPage() {
  const patientId = readRouteParam("patientId") || null;
  const [nome, setNome] = useState("");
  const [resultados, setResultados] = useState<unknown[]>([]);
  const [estado, setEstado] = useState<"idle" | "carregando" | "ok" | "erro">("idle");
  const [limiar, setLimiar] = useState(Math.round(LIMIAR_PADRAO * 100));

  useEffect(() => {
    if (!patientId) return;
    let cancelado = false;
    setEstado("carregando");
    (async () => {
      try {
        const resp = await apiRequest("GET", `/api/patients/${encodeURIComponent(patientId)}`);
        const payload = await resp.json();
        const p = payload?.patient ?? payload?.data ?? payload;
        const lista = await loadAllPatientResults(patientId);
        if (cancelado) return;
        setNome(p?.name ?? "");
        setResultados(lista);
        setEstado("ok");
      } catch {
        if (!cancelado) setEstado("erro");
      }
    })();
    return () => { cancelado = true; };
  }, [patientId]);

  const { series, pendentes } = useMemo(() => calcularEvolucao(resultados, { limiarAmplitude: limiar / 100 }), [resultados, limiar]);

  return (
    <div className="space-y-5 pb-8" data-testid="page-evolucao-escalas">
      <PageHero icon={LineChartIcon} eyebrow="acompanhamento" title="Evolução das escalas" subtitle="Escores salvos ao longo das consultas, faixas do app e alertas de mudança. Somente apoio à leitura clínica." gradient="from-primary to-chart-2" />
      {!patientId && <p className="text-sm text-muted-foreground" data-testid="evolucao-sem-paciente">Abra esta tela a partir da ficha de um paciente. <Link href="/pacientes" className="underline">Ir para pacientes</Link></p>}
      {estado === "carregando" && <p className="text-xs text-muted-foreground">Carregando aplicações…</p>}
      {estado === "erro" && <p role="alert" className="text-sm text-red-700" data-testid="evolucao-erro">Não foi possível carregar as aplicações deste paciente.</p>}
      {estado === "ok" && (
        <>
          <p className="text-sm" data-testid="evolucao-paciente">Paciente: <strong>{nome || "sem nome"}</strong></p>
          <div className="flex items-center gap-2">
            <Label htmlFor="evolucao-limiar" className="text-xs">Limiar de variação expressiva (% da amplitude)</Label>
            <input id="evolucao-limiar" data-testid="evolucao-limiar" type="number" min={5} max={100} step={5} value={limiar} onChange={(e) => setLimiar(Math.min(100, Math.max(5, Number(e.target.value) || 20)))} className="w-20 rounded-md border bg-background px-2 py-1 text-sm" />
          </div>
          <EvolucaoEscalasPanel series={series} pendentes={pendentes} />
        </>
      )}
    </div>
  );
}
