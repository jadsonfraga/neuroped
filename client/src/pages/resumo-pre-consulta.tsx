import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardCopy, ClipboardList, Info, MessageCircleQuestion } from "lucide-react";
import { Link } from "wouter";
import { formatIsoDateBr } from "@/lib/clinicalDate";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/PageHero";
import { EvolucaoEscalasPanel } from "@/components/EvolucaoEscalasPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { AVISO_RESUMO, montarResumo, ROTULO_SUGESTAO } from "@/lib/resumoPreConsulta";
import { loadAllPatientResults } from "@/lib/patientResultsPagination";
import { apiRequest } from "@/lib/queryClient";
import { readRouteParam } from "@/lib/routeQuery";

interface Carga { nome: string; nascimento: string; cid: string; eventos: unknown[]; resultados: unknown[] }

const br = (iso: string): string => formatIsoDateBr(iso) ?? "—";

export default function ResumoPreConsultaPage() {
  const patientId = readRouteParam("patientId") || null;
  const { accessMode, isAuthenticated } = useAuth();
  const { activeClinicId } = useClinic();
  const remoto = accessMode === "remote" && isAuthenticated;
  const [carga, setCarga] = useState<Carga | null>(null);
  const [estado, setEstado] = useState<"idle" | "carregando" | "ok" | "erro">("idle");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!patientId || (remoto && !activeClinicId)) return;
    let cancelado = false;
    setEstado("carregando");
    const clinic = encodeURIComponent(activeClinicId ?? "");
    const pid = encodeURIComponent(patientId);
    (async () => {
      try {
        const patientUrl = remoto ? `/api/live/patients/${pid}?clinicId=${clinic}` : `/api/patients/${pid}`;
        const eventsUrl = remoto ? `/api/live/events?clinicId=${clinic}&patientId=${pid}` : `/api/clinical-core/events?patient_id=${pid}&days=3650`;
        const [pRes, eRes] = await Promise.all([apiRequest("GET", patientUrl), apiRequest("GET", eventsUrl)]);
        const pPayload = await pRes.json();
        const ePayload = await eRes.json();
        const p = remoto && pPayload?.profile ? { ...pPayload.profile, ...pPayload } : (pPayload?.patient ?? pPayload?.data ?? pPayload);
        let resultados: unknown[] = [];
        try {
          if (remoto) {
            const r = await (await apiRequest("GET", `/api/live/assessments?clinicId=${clinic}&patientId=${pid}`)).json();
            // Hoje o salvamento LIVE grava só título/respostas (sem escore): sem escore, a escala fica pendente.
            resultados = (Array.isArray(r?.data) ? r.data : []).map((a: any) => ({ id: a.id, payload: a.payload, scaleName: a.payload?.title ?? a.instrumentId, instrumentId: a.instrumentId, scaleVersion: a.instrumentVersion, appliedAt: a.appliedAt, totalScore: typeof a.totalScore === "number" ? a.totalScore : typeof a.payload?.totalScore === "number" ? a.payload.totalScore : null }));
          } else {
            resultados = await loadAllPatientResults(patientId);
          }
        } catch { /* sem escalas: o resumo segue com o prontuário */ }
        if (cancelado) return;
        setCarga({ nome: p?.name ?? "", nascimento: p?.birthDate ?? "", cid: p?.cid ?? p?.diagnosisCode ?? "", eventos: Array.isArray(ePayload?.data) ? ePayload.data : [], resultados });
        setEstado("ok");
      } catch {
        if (!cancelado) setEstado("erro");
      }
    })();
    return () => { cancelado = true; };
  }, [patientId, remoto, activeClinicId]);

  const resumo = useMemo(() => (carga ? montarResumo({ paciente: { nome: carga.nome, dataNascimento: carga.nascimento, cid: carga.cid }, eventos: carga.eventos, remoto, resultados: carga.resultados }) : null), [carga, remoto]);

  const copiar = async () => {
    if (!resumo) return;
    try { await navigator.clipboard.writeText(resumo.texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* clipboard indisponível */ }
  };

  return (
    <div className="space-y-5 pb-8" data-testid="page-resumo-pre-consulta">
      <PageHero icon={ClipboardList} eyebrow="antes da consulta" title="Resumo pré-consulta" subtitle="Histórico, o que mudou desde a última visita, pendências, evolução das escalas e perguntas sugeridas, só com dados já salvos." gradient="from-primary to-chart-2" />
      <div role="note" data-testid="resumo-aviso" className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
        <Info className="mt-0.5 h-4 w-4 shrink-0" /><p>{AVISO_RESUMO} Nenhum dado sai do navegador: não há IA externa neste resumo.</p>
      </div>
      {!patientId && <p className="text-sm text-muted-foreground" data-testid="resumo-sem-paciente">Abra esta tela a partir da ficha de um paciente. <Link href="/pacientes" className="underline">Ir para pacientes</Link></p>}
      {estado === "carregando" && <p className="text-xs text-muted-foreground">Carregando dados salvos…</p>}
      {estado === "erro" && <p role="alert" className="text-sm text-red-700" data-testid="resumo-erro">Não foi possível carregar os dados deste paciente.</p>}

      {resumo && (
        <>
          <section className="space-y-1 rounded-2xl border bg-card/80 p-4" data-testid="resumo-identificacao">
            <h2 className="text-sm font-bold">{resumo.paciente.nome || "Paciente sem nome"}{resumo.paciente.idade ? `, ${resumo.paciente.idade}` : ""}</h2>
            {resumo.paciente.cid && <p className="text-xs">CID registrado: {resumo.paciente.cid}</p>}
            {resumo.paciente.hipotese && <p className="text-xs">Hipótese registrada: {resumo.paciente.hipotese}</p>}
            <p className="text-xs text-muted-foreground" data-testid="resumo-ultima-visita">
              {resumo.ultimaVisita ? `Última consulta: ${br(resumo.ultimaVisita.data)} (há ${resumo.ultimaVisita.diasDesde} dia(s)) · ${resumo.totalVisitas} consulta(s) registrada(s)` : "Nenhuma consulta registrada."}
            </p>
          </section>

          <section className="space-y-2 rounded-2xl border bg-card/80 p-4" data-testid="resumo-historico">
            <h2 className="text-sm font-bold">Histórico</h2>
            {resumo.historico.queixa && <p className="text-sm"><strong>Queixa principal:</strong> {resumo.historico.queixa}</p>}
            {resumo.historico.anamnese.filter((a) => a.rotulo !== "Queixa principal").map((a) => <p key={a.rotulo} className="text-sm"><strong>{a.rotulo}:</strong> {a.texto}</p>)}
            {resumo.historico.marcosAlerta.map((m) => <p key={m} className="flex gap-2 text-sm text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{m}</p>)}
            {([["Medicações", resumo.historico.medicacoes], ["Terapias", resumo.historico.terapias], ["Exames", resumo.historico.exames]] as const).map(([titulo, itens]) => itens.length > 0 && (
              <div key={titulo}><p className="text-xs font-semibold">{titulo}</p><ul className="list-disc pl-5 text-sm">{itens.map((i) => <li key={i}>{i}</li>)}</ul></div>
            ))}
            {!resumo.historico.queixa && resumo.historico.anamnese.length === 0 && resumo.historico.medicacoes.length === 0 && <p className="text-xs text-muted-foreground">Sem histórico estruturado salvo no prontuário.</p>}
          </section>

          <section className="space-y-2 rounded-2xl border bg-card/80 p-4" data-testid="resumo-mudancas">
            <h2 className="text-sm font-bold">O que mudou desde a última visita</h2>
            {resumo.mudancas.length ? <ul className="list-disc pl-5 text-sm">{resumo.mudancas.map((m, i) => <li key={i} data-tipo={m.tipo}>{m.texto}</li>)}</ul> : <p className="text-xs text-muted-foreground">Nenhuma mudança registrada nos dados salvos.</p>}
          </section>

          <section className="space-y-2 rounded-2xl border bg-card/80 p-4" data-testid="resumo-pendencias">
            <h2 className="text-sm font-bold">Pendências</h2>
            {resumo.pendencias.length ? <ul className="list-disc pl-5 text-sm">{resumo.pendencias.map((m, i) => <li key={i} data-tipo={m.tipo}>{m.texto}</li>)}</ul> : <p className="text-xs text-muted-foreground">Nenhuma pendência identificada nos dados salvos.</p>}
          </section>

          <section className="space-y-2" data-testid="resumo-evolucao">
            <h2 className="text-sm font-bold">Evolução das escalas</h2>
            <EvolucaoEscalasPanel series={resumo.evolucao.series} pendentes={resumo.evolucao.pendentes} />
          </section>

          <section className="space-y-2 rounded-2xl border border-dashed bg-card/80 p-4" data-testid="resumo-perguntas">
            <h2 className="flex items-center gap-2 text-sm font-bold"><MessageCircleQuestion className="h-4 w-4" /> Perguntas sugeridas</h2>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200" data-testid="resumo-rotulo-sugestao">{ROTULO_SUGESTAO}</p>
            <ul className="list-disc pl-5 text-sm">{resumo.perguntas.map((q) => <li key={q}>{q}</li>)}</ul>
          </section>

          <Button variant="outline" className="gap-2" onClick={copiar} data-testid="resumo-copiar"><ClipboardCopy className="h-4 w-4" />{copiado ? "Copiado" : "Copiar resumo"}</Button>
        </>
      )}
    </div>
  );
}
