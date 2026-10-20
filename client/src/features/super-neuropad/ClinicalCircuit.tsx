import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, ClipboardCopy, Download, ExternalLink, RotateCcw, ShieldAlert, Stethoscope } from "lucide-react";
import { downloadTextDocument } from "@/lib/shareText";
import {
  buildCircuitReport, circuitForAge, CIRCUIT_METHODS, CIRCUIT_STATUSES,
  CIRCUIT_VIDEO_LINKS, type CircuitArea, type CircuitRecords, type CircuitStatus,
} from "./clinicalCircuit";

/**
 * Opcional e isolado da bateria principal: não entra em XP, contagem de itens,
 * resultado estatístico, PDF do jogo ou entrega automática à família.
 * Estado mantido em memória durante a passagem pelos seis mundos.
 */
export function ClinicalCircuit({ years, visible }: { years: number | null; visible: boolean }) {
  const [area, setArea] = useState<CircuitArea>("neurologico");
  const [active, setActive] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, CircuitStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [generalNote, setGeneralNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const all = years === null ? [] : circuitForAge(years);
  const tasks = years === null ? [] : circuitForAge(years, area);
  const task = tasks[Math.min(active, tasks.length - 1)];
  const recorded = all.filter((entry) => statuses[entry.id]).length;
  const records: CircuitRecords = Object.fromEntries(all.filter((entry) => statuses[entry.id]).map((entry) =>
    [entry.id, { status: statuses[entry.id], note: notes[entry.id] || "" }]));
  const report = years === null ? "" : buildCircuitReport(years, records, generalNote);
  if (years === null || !all.length) return null;
  const previous = () => { setActive((index) => Math.max(0, index - 1)); setFeedback(""); };
  const next = () => { setActive((index) => Math.min(tasks.length - 1, index + 1)); setFeedback(""); };
  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setFeedback("Registro copiado. Revise antes de incorporar ao prontuário.");
    } catch {
      downloadTextDocument(report, `super-neuropad-circuito-${years}a.txt`);
      setFeedback("Área de transferência indisponível; TXT baixado no dispositivo.");
    }
  };
  const reset = () => {
    if (!window.confirm("Apagar apenas as observações do circuito complementar desta criança? A bateria principal não será alterada.")) return;
    setStatuses({}); setNotes({}); setGeneralNote(""); setActive(0); setArea("neurologico"); setFeedback("");
  };
  return (
    <section className={visible ? "snp-panel space-y-4 p-4 sm:p-6" : "hidden"} aria-label="Circuito clínico complementar" data-testid="super-neuropad-clinical-circuit">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="snp-pixel flex items-center gap-2 text-base"><Stethoscope className="h-5 w-5" /> Missões clínicas extras</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold">
            Circuito opcional de exame neurológico e estado mental · {years} anos. Supervisão profissional.
            Não altera os seis mundos, o tempo da partida, XP ou pontuação. Nenhuma tarefa isolada estabelece diagnóstico.
          </p>
        </div>
        <span className="snp-chip bg-[var(--snp-sun-tint)]" aria-live="polite">{recorded}/{all.length} estações registradas</span>
      </div>
      <div className="snp-panel snp-panel--soft p-3 text-xs font-semibold" role="note">
        <ShieldAlert className="mr-1 inline-block h-4 w-4" />
        Exame presencial é obrigatório para inferir força, tônus, reflexos, pares cranianos ou sensibilidade.
        Registro descritivo, sem escores ou interpretação automática. Vídeos são demonstrações externas da técnica, nunca gravações da criança.
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Área clínica">
        {(["neurologico", "mental"] as const).map((option) => (
          <button key={option} type="button" aria-pressed={area === option} onClick={() => { setArea(option); setActive(0); setFeedback(""); }}
            className={`snp-option min-h-11 px-4 py-2 text-sm font-black ${area === option ? "bg-[var(--snp-sun)]" : "bg-[var(--snp-paper-fixed)]"}`}>
            {option === "neurologico" ? "🧠 Exame neurológico" : "💬 Estado mental"}
            {" · "}{all.filter((entry) => entry.area === option && statuses[entry.id]).length}/{all.filter((entry) => entry.area === option).length}
          </button>
        ))}
      </div>
      {task && (
        <article className="snp-panel snp-panel--soft space-y-3 p-4" data-testid="super-neuropad-clinical-station">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="snp-chip">Estação {active + 1} de {tasks.length} · {task.domain}</span>
            <span className="snp-chip">{CIRCUIT_METHODS[task.method]}</span>
          </div>
          <h3 className="text-xl font-black">{task.emoji} {task.title}</h3>
          <p className="text-sm font-semibold leading-relaxed">{task.guide}</p>
          <p className="text-sm"><strong>Descrever:</strong> {task.observe}</p>
          {task.safety && <div className="rounded-xl border-2 border-amber-700 bg-amber-50 p-3 text-sm font-semibold text-amber-950" role="alert">{task.safety}</div>}
          {task.video && <a className="snp-chip inline-flex min-h-11 items-center gap-2 bg-[var(--snp-sky-tint)]"
            href={CIRCUIT_VIDEO_LINKS[task.video].url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
            <ExternalLink className="h-4 w-4" /> Ver vídeo demonstrativo: {CIRCUIT_VIDEO_LINKS[task.video].label}
          </a>}
          <fieldset className="space-y-2">
            <legend className="text-sm font-black">Resultado observado — selecione somente após executar</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.entries(CIRCUIT_STATUSES) as [CircuitStatus,string][]).map(([key,label]) =>
                <button key={key} type="button" aria-pressed={statuses[task.id] === key}
                  onClick={() => { setStatuses((prior) => ({...prior,[task.id]:key})); setFeedback(""); }}
                  className={`snp-option flex min-h-11 items-center gap-2 px-3 py-2 text-left text-sm font-semibold ${statuses[task.id] === key ? "bg-[var(--snp-grass-tint)]" : "bg-[var(--snp-paper-fixed)]"}`}>
                  {statuses[task.id] === key ? <Check className="h-4 w-4 shrink-0" /> : <span aria-hidden="true" className="h-4 w-4 shrink-0" />} {label}
                </button>)}
            </div>
          </fieldset>
          <label className="block text-sm font-black">Achados objetivos ou motivo de não realização
            <textarea rows={3} maxLength={1800} value={notes[task.id] || ""} onChange={(event) => setNotes((prior) => ({ ...prior, [task.id]:event.target.value }))}
              className="mt-2 w-full rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-3 text-sm font-normal text-[var(--snp-ink-fixed)]"
              placeholder="Somente fatos efetivamente observados, condições, lateralidade, colaboração e limitações. Evite identificadores pessoais." />
          </label>
          {(notes[task.id] || "") && !statuses[task.id] && <p className="text-xs font-semibold">Selecione um resultado para incluir a nota na exportação.</p>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={previous} disabled={active === 0}
              className="snp-btn snp-btn--paper inline-flex min-h-11 items-center gap-1 px-4 py-2 text-sm disabled:opacity-50"><ChevronLeft className="h-4 w-4" /> Anterior</button>
            <select aria-label="Ir para estação" value={active} onChange={(event) => setActive(Number(event.target.value))}
              className="min-w-0 max-w-52 rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-2 text-sm text-[var(--snp-ink-fixed)]">
              {tasks.map((entry,index) => <option key={entry.id} value={index}>{index + 1}. {entry.title}{statuses[entry.id] ? " ✓" : ""}</option>)}
            </select>
            <button type="button" onClick={next} disabled={active === tasks.length - 1}
              className="snp-btn snp-btn--sky inline-flex min-h-11 items-center gap-1 px-4 py-2 text-sm disabled:opacity-50">Próxima <ChevronRight className="h-4 w-4" /></button>
          </div>
        </article>
      )}
      <label className="block text-sm font-black">Síntese adicional do examinador (opcional)
        <textarea rows={2} maxLength={2000} value={generalNote} onChange={(event) => setGeneralNote(event.target.value)}
          className="mt-2 w-full rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-3 text-sm font-normal text-[var(--snp-ink-fixed)]"
          placeholder="Limitações, necessidade de exame dirigido ou informações de fonte distinta, com proveniência." />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void copyReport()} disabled={!recorded && !generalNote.trim()}
          className="snp-btn snp-btn--sun inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"><ClipboardCopy className="h-4 w-4" /> Copiar registro clínico</button>
        <button type="button" onClick={() => { downloadTextDocument(report, `super-neuropad-circuito-${years}a.txt`); setFeedback("TXT clínico salvo localmente. Revise antes de incorporar ao prontuário."); }}
          disabled={!recorded && !generalNote.trim()}
          className="snp-btn snp-btn--paper inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"><Download className="h-4 w-4" /> Baixar TXT</button>
        <button type="button" onClick={reset} disabled={!recorded && !generalNote.trim() && !Object.values(notes).some(Boolean)}
          className="snp-btn snp-btn--slate inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"><RotateCcw className="h-4 w-4" /> Limpar circuito</button>
      </div>
      {feedback && <p className="text-xs font-semibold" role="status">{feedback}</p>}
      <p className="text-xs font-semibold opacity-80">Os registros permanecem apenas em memória até cópia ou exportação explícita. Não são anexados ao PDF da aventura nem enviados à família. Ao trocar de paciente/idade, são apagados. A avaliação médica integra dados de história, exame e fontes externas.</p>
    </section>
  );
}
