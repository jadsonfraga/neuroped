import { BarChart3, Timer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { SessionRecord } from "./session";
import { canAddMedicalReview, mediaClock } from "./evidence";
import { emptyPilot, pilotMetrics, WORK_PHASES, type PilotRecord, type WorkPhase } from "./pilot";

export function PilotPanel({ record, stage, activePhase, seconds, onStart, onStop, onChange }: {
  record: SessionRecord; stage: "setup" | "running" | "finished"; activePhase: WorkPhase | null; seconds: number;
  onStart: (phase: WorkPhase) => void; onStop: () => void; onChange: (p: PilotRecord) => void;
}) {
  const { accessMode, user } = useAuth(); const medical = canAddMedicalReview(accessMode, user?.role);
  const p = record.pilot ?? emptyPilot(); const metrics = pilotMetrics(record);
  function downloadMetrics() {
    if (activePhase || stage !== "finished") return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(metrics, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `OBS10-metricas-operacionais-${Date.now()}.json`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <details className="obs10-guide obs13-pilot" data-testid="obs13-pilot">
    <summary><BarChart3 size={19} /> Medir o trabalho da equipe · piloto operacional</summary>
    <p><strong>Opcional. Não avalia a criança.</strong> Inicie e pare cada etapa conscientemente. Só períodos marcados são medidos; ausência de marcação não é zero. Não há resultado de eficácia ou ganho de tempo calculado.</p>
    <div className="obs13-flow"><span>Preparar</span><span>Coletar até 10 min</span><span>Revisar</span><span>Entregar</span></div>
    <div className="obs13-clock-controls">{WORK_PHASES.map((phase) => <button type="button" key={phase} disabled={stage === "running" || (stage === "setup" && phase !== "Preparação") || (stage === "finished" && phase === "Preparação") || (phase === "Revisão médica" && !medical) || p.logs.length >= 100} onClick={() => onStart(phase)}><Timer size={16} />Cronometrar {phase.toLowerCase()}</button>)}</div>
    {activePhase && <div className="obs10-notice" role="status"><strong>{activePhase}: {mediaClock(seconds)}</strong><button type="button" onClick={onStop}>Parar medição desta etapa</button></div>}
    <p className="obs10-muted">Sair da aba para outro programa interrompe a medição. Medição pausada ou períodos não iniciados ficam fora do total. Pare antes de exportar. O cronômetro de coleta permanece independente e não ultrapassa dez minutos.</p>
    <dl className="obs13-measurements">{WORK_PHASES.map((phase) => <div key={phase}><dt>{phase}</dt><dd>{p.logs.some((l) => l.phase === phase) ? `${p.logs.filter((l) => l.phase === phase).reduce((n, l) => n + l.seconds, 0)} s registrados` : "Não medido"}</dd></div>)}</dl>
    {stage === "finished" && <>
      <label>Dificuldade operacional observada<select aria-label="Dificuldade operacional observada" value={p.difficulty} onChange={(ev) => onChange({ ...p, difficulty: ev.target.value as PilotRecord["difficulty"] })}>{["não informada", "nenhuma relatada", "áudio ou imagem", "interação com a tela", "material ou ambiente", "outra"].map((s) => <option key={s}>{s}</option>)}</select></label>
      <fieldset disabled={!medical}>
        <legend>Opinião do profissional · não é medida de acurácia</legend>
        <label>Utilidade para a consulta<select aria-label="Utilidade para a consulta" value={p.utility} onChange={(ev) => onChange({ ...p, utility: ev.target.value as PilotRecord["utility"] })}>{["não avaliada", "não acrescentou", "acrescentou parcialmente", "acrescentou informação útil"].map((s) => <option key={s}>{s}</option>)}</select></label>
        <label>Necessidade de repetir tarefas<select aria-label="Necessidade de repetir tarefas" value={p.repeatNeed} onChange={(ev) => onChange({ ...p, repeatNeed: ev.target.value as PilotRecord["repeatNeed"] })}>{["não avaliada", "não foi necessário", "repetição parcial", "repetição ampla"].map((s) => <option key={s}>{s}</option>)}</select></label>
      </fieldset>
      <button type="button" className="obs10-secondary" disabled={Boolean(activePhase)} onClick={downloadMetrics}>Exportar métricas sem textos clínicos</button>
      <p className="obs10-caution">Exportação distinta do registro clínico: sem nome, código, identificador de sessão, datas clínicas, texto livre, nomes de arquivos ou impressões digitais dos vídeos. Contagens e faixa etária ainda exigem cuidado em grupos pequenos; não são garantia de anonimato. Não some exportações repetidas da mesma aplicação.</p>
    </>}
    <details><summary>Antes de um piloto com crianças reais</summary><p>Faça simulação com adultos e dados fictícios no aparelho institucional; depois, aplicações supervisionadas e revisão pelo médico. Defina previamente critérios de segurança, aplicabilidade e utilidade. Pesquisa e divulgação de resultados dependem da governança ética e institucional aplicável. Esta tela não inicia pesquisa, não certifica treinamento nem comprova benefício clínico.</p></details>
  </details>;
}
