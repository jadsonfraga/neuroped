import { useRef, useState } from "react";
import { Link } from "wouter";
import { AssistantAccess } from "@/components/AssistantAccess";
import { AssistantScope, ClinicalAssistantCard } from "@/components/ClinicalAssistantCards";
import { ExamResourceChecklist } from "@/components/ExamActivityResources";
import { assistantExamResources } from "@/data/examResources";
import { examExamples } from "@/data/clinicalAssistantGuide";
import { assistantObservationLines, emptyAssistantObservation, type AssistantObservation } from "@/lib/assistantObservation";

const ageBands = Object.keys(examExamples);

export default function ExameViaAssistente() {
  const [band, setBand] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<string, AssistantObservation>>({});
  const age = useRef<HTMLSelectElement>(null);
  const ageLabel = band === null ? "" : ageBands[band];
  const records = Object.entries(notes)
    .map(([title, note]) => ({ title, lines: assistantObservationLines(note) }))
    .filter(({ lines }) => lines.length > 0);
  const hasRecords = records.length > 0;

  function finish() {
    if (hasRecords && !window.confirm("Encerrar e apagar as observações temporárias desta atividade?")) return;
    setNotes({});
    setBand(null);
    requestAnimationFrame(() => age.current?.focus());
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6" data-testid="assistant-exam-guide">
      <header>
        <h1 className="text-2xl font-bold">Exame via assistente</h1>
        <p className="mt-1 text-muted-foreground">Guia de brincadeiras e observação por faixa etária. Não é ficha médica nem teste diagnóstico.</p>
      </header>
      <nav aria-label="Outra atividade observacional">
        <Link href="/testes-diretos?modo=observacao-social"
          className="inline-flex min-h-11 items-center rounded-lg border bg-card px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={event => {
            if (hasRecords && !window.confirm("Abrir Observação Social e descartar as anotações temporárias desta tela?")) event.preventDefault();
          }}>
          Abrir Observação Social
        </Link>
      </nav>
      <AssistantScope />
      <p className="text-sm text-muted-foreground">Não informe nome, documento ou contato. As anotações ficam só nesta tela e desaparecem ao sair ou recarregar.</p>
      <div>
        <label htmlFor="assistant-exam-age" className="block font-semibold">Faixa etária</label>
        <select id="assistant-exam-age" ref={age} value={band ?? ""} disabled={hasRecords}
          aria-describedby={hasRecords ? "assistant-exam-age-locked" : undefined}
          onChange={event => {
            setNotes({});
            setBand(event.target.value === "" ? null : Number(event.target.value));
          }}
          className="mt-2 block min-h-12 w-full rounded-lg border bg-background px-3 disabled:opacity-70">
          <option value="">Escolha a faixa etária</option>
          {ageBands.map((label, index) => <option key={label} value={index}>{label}</option>)}
        </select>
      </div>
      {hasRecords && <p id="assistant-exam-age-locked" className="text-sm text-muted-foreground">
        Para mudar de faixa ou iniciar outra atividade, revise e encerre este registro.
      </p>}
      {band !== null && ageLabel && <>
        <section key={ageLabel} aria-labelledby="assistant-exam-activities" className="space-y-3">
          <h2 id="assistant-exam-activities" className="text-lg font-semibold">Atividades guiadas · {ageLabel}</h2>
          <p className="text-sm text-muted-foreground">
            Escolha uma proposta. Use o meio habitual de comunicação e respeite pausas ou recusas. Se não houver oportunidade, descreva o contexto sem tirar conclusões.
          </p>
          <ExamResourceChecklist activities={assistantExamResources[ageLabel]} title="Conferir materiais das atividades guiadas" />
          <AssistantAccess />
          {examExamples[ageLabel]?.map((example, index) => <ClinicalAssistantCard key={example.title} example={example} resource={assistantExamResources[ageLabel][index]}
            canPresent={band >= 8} note={notes[example.title] ?? emptyAssistantObservation}
            onNote={(field, value) => setNotes(previous => ({
              ...previous, [example.title]: { ...(previous[example.title] ?? emptyAssistantObservation), [field]: value },
            }))} />)}
        </section>
        <section aria-labelledby="assistant-exam-review" className="space-y-3 rounded-xl border bg-card p-4">
          <h2 id="assistant-exam-review" className="font-semibold">Revisar e encerrar</h2>
          {hasRecords ? <ul className="space-y-2" aria-label="Observações temporárias">
            {records.map(({ title, lines }) => <li key={title} className="rounded-lg bg-muted/50 p-3 text-sm">
              <strong>{title}</strong><p className="whitespace-pre-wrap break-words">{lines.join("\n")}</p>
            </li>)}
          </ul> : <p className="text-sm text-muted-foreground">Nenhuma observação registrada.</p>}
          <p className="text-sm text-muted-foreground">Comunique os achados à equipe responsável. O app não salva nem envia este registro.</p>
          <button type="button" onClick={finish} className="min-h-11 rounded-lg border border-destructive/40 bg-card px-3 text-sm font-semibold text-destructive">Encerrar e limpar</button>
        </section>
      </>}
    </section>
  );
}
