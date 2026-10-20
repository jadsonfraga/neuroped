import { useState } from "react";
import { ClipboardCopy, Download, FileCheck2, ShieldCheck } from "lucide-react";
import { downloadTextDocument } from "@/lib/shareText";
import {
  buildReadinessReport, FOCUS_LABELS, EVIDENCE_SOURCE, EVIDENCE_STATUS, READINESS_VERSION,
  requirementsForAge, reviewDocumentarySufficiency,
  type ConsultationFocus, type EvidenceMap, type EvidenceStatus, type EvidenceSource,
} from "./assessmentReadiness";

/** Matriz independente do game: não preenche prontuário nem abre qualquer rota de emissão. */
export function AssessmentReadiness({ years, visible }: { years: number | null; visible: boolean }) {
  const [foci, setFoci] = useState<ConsultationFocus[]>([]);
  const [entries, setEntries] = useState<EvidenceMap>({});
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState("");
  if (years === null || !Number.isInteger(years) || years < 2 || years > 17) return null;

  const tasks = requirementsForAge(years,foci);
  const review = reviewDocumentarySufficiency(years,foci,entries);
  const task = tasks[Math.min(active,tasks.length - 1)];
  const report = buildReadinessReport(years,foci,entries);
  const changeFocus = (focus: ConsultationFocus) => {
    setFoci((prior) => prior.includes(focus) ? prior.filter((item)=>item !== focus) : [...prior,focus]);
    setActive(0);setMessage("");
  };
  const changeEntry = (id:string,field:"status"|"source"|"note",value:string) => {
    setEntries((prior)=>({
      ...prior,[id]:{...(prior[id] ?? {status:"pendente",note:""}),[field]:value}
    }));
    setMessage("");
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(report); setMessage("Matriz copiada. Nenhuma informação foi enviada ao servidor."); }
    catch {downloadTextDocument(report,`super-neuropad-documentacao-${years}a.txt`);setMessage("TXT baixado; acesso à área de transferência indisponível.");}
  };
  return (
    <section id="snp-documentary-readiness" className={visible ? "snp-panel space-y-4 p-4 sm:p-6" : "hidden"}
      aria-label="Matriz de documentação antes do laudo" data-testid="super-neuropad-documentary-readiness">
      <header>
        <h2 className="snp-pixel flex items-center gap-2 text-base"><FileCheck2 className="h-5 w-5" /> Revisão documental antes do laudo</h2>
        <p className="mt-2 text-sm font-semibold">Roteiro por faixa etária, queixa e fontes de informação · {years} anos · v{READINESS_VERSION}.
          Este espaço ajuda a identificar dados ainda não documentados. Não autoriza emissão, não diagnostica, não assina e não altera a partida.</p>
      </header>
      <div className="snp-panel snp-panel--soft p-3 text-sm font-semibold" role="note">
        <ShieldCheck className="mr-1 inline-block h-4 w-4" />
        A matriz é preenchida pelo profissional a partir de informação realmente disponível. Nenhuma resposta do jogo marca um campo como concluído.
        Informações identificáveis e conteúdos sensíveis devem permanecer exclusivamente no prontuário protegido.
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-black">Queixas em investigação (pode selecionar mais de uma)</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(FOCUS_LABELS) as [ConsultationFocus,string][]).map(([id,label]) => (
            <button type="button" key={id} aria-pressed={foci.includes(id)} onClick={()=>changeFocus(id)}
              className={`snp-option min-h-11 px-3 py-2 text-sm font-semibold ${foci.includes(id)?"bg-[var(--snp-sun)]":"bg-[var(--snp-paper-fixed)]"}`}>
              {foci.includes(id) ? "✓ " : "+ "}{label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="snp-panel snp-panel--soft p-4" role="status" data-testid="super-neuropad-readiness-summary">
        <p className="text-sm font-black">{review.completed} de {review.total} itens documentados ou justificados</p>
        <p className="mt-1 text-sm">{review.summary}</p>
        <p className="mt-1 text-xs">Pendentes: {review.pending.length} · Limitações declaradas: {review.limited.length} · Não pertinentes justificados: {review.justified.length}</p>
        {review.pending.length > 0 && <details className="mt-2 text-xs"><summary className="cursor-pointer font-black">Ver itens sem documentação suficiente</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">{review.pending.map((label)=><li key={label}>{label}</li>)}</ul>
        </details>}
      </div>
      {task && (
        <article className="snp-panel snp-panel--soft space-y-3 p-4" data-testid="super-neuropad-readiness-item">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="snp-chip">Revisão {active+1}/{tasks.length}</span>
            <span className="snp-chip">{task.focus ? FOCUS_LABELS[task.focus] : "Núcleo clínico comum"}</span>
            {task.clinicianOnly && <span className="snp-chip bg-[var(--snp-sun-tint)]">Somente médico</span>}
          </div>
          <h3 className="text-lg font-black">{task.title}</h3>
          <p className="text-sm font-semibold">{task.question}</p>
          <p className="text-xs font-semibold opacity-80">Fonte esperada: {task.sourceHint}</p>
          {task.ageHint && <p className="text-xs font-semibold">Por faixa etária: {task.ageHint}</p>}
          <label className="block text-sm font-black">Situação do documento/achado
            <select aria-label="Situação documental" className="mt-1 min-h-11 w-full rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-2 text-sm text-[var(--snp-ink-fixed)]"
              value={entries[task.id]?.status || "pendente"} onChange={(e)=>changeEntry(task.id,"status",e.target.value)}>
              {(Object.entries(EVIDENCE_STATUS) as [EvidenceStatus,string][]).map(([id,label])=><option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-black">Fonte real consultada
            <select aria-label="Fonte da evidência" className="mt-1 min-h-11 w-full rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-2 text-sm text-[var(--snp-ink-fixed)]"
              value={entries[task.id]?.source || ""} onChange={(e)=>changeEntry(task.id,"source",e.target.value)}>
              <option value="">Não informada</option>
              {(Object.entries(EVIDENCE_SOURCE) as [EvidenceSource,string][]).map(([id,label])=><option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-black">Descrição sucinta ou motivo da limitação
            <textarea aria-label="Descrição da evidência" rows={3} maxLength={1800} value={entries[task.id]?.note || ""}
              onChange={(e)=>changeEntry(task.id,"note",e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-3 text-sm font-normal text-[var(--snp-ink-fixed)]"
              placeholder="Registrar achado efetivo, fonte e circunstância; não inserir nome, telefone ou dados pessoais." />
          </label>
          <p className="text-xs font-semibold">Para contar como documentado é necessário indicar a fonte e descrever o dado. Exame físico e síntese diagnóstica exigem fonte profissional; limitação ou inaplicabilidade requer justificativa. Os campos essenciais não podem ser dispensados como inaplicáveis.</p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={()=>setActive((x)=>Math.max(0,x-1))} disabled={active===0}
              className="snp-btn snp-btn--paper min-h-11 px-3 py-2 text-sm disabled:opacity-50">← Anterior</button>
            <select aria-label="Ir para revisão" className="max-w-52 min-w-0 rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-2 text-sm text-[var(--snp-ink-fixed)]"
              value={active} onChange={(e)=>setActive(Number(e.target.value))}>
              {tasks.map((entry,index)=><option value={index} key={entry.id}>{index+1}. {entry.title}</option>)}
            </select>
            <button type="button" onClick={()=>setActive((x)=>Math.min(tasks.length-1,x+1))} disabled={active===tasks.length-1}
              className="snp-btn snp-btn--sky min-h-11 px-3 py-2 text-sm disabled:opacity-50">Próxima →</button>
          </div>
        </article>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={()=>void copy()}
          className="snp-btn snp-btn--sun inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm"><ClipboardCopy className="h-4 w-4" /> Copiar matriz</button>
        <button type="button" onClick={()=>{downloadTextDocument(report,`super-neuropad-documentacao-${years}a.txt`);setMessage("TXT da matriz salvo localmente.");}}
          className="snp-btn snp-btn--paper inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm"><Download className="h-4 w-4" /> Baixar TXT</button>
        <button type="button" onClick={()=>{
          if(window.confirm("Limpar todas as observações e focos da revisão documental atual? Não altera a partida.")){setEntries({});setFoci([]);setActive(0);setMessage("Matriz limpa.");}
        }} className="snp-btn snp-btn--slate min-h-11 px-4 py-2 text-sm">Limpar matriz</button>
      </div>
      {message && <p role="status" className="text-xs font-semibold">{message}</p>}
      <p className="text-xs font-semibold opacity-80">O checklist não substitui a revisão dos documentos originais, diagnóstico diferencial, análise de pertinência, consentimento quando indicado e aceite médico. Nenhuma indicação de prontidão equivale à liberação do laudo.</p>
    </section>
  );
}
