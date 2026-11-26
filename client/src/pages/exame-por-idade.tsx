import { useReducer, useRef, useState } from "react";
import { AssistantScope, ClinicalAssistantCard } from "@/components/ClinicalAssistantCards";
import { ExamWelcome } from "@/components/ExamWelcome";
import { ExamSessionTrail } from "@/components/ExamSessionTrail";
import { AssistantAccess } from "@/components/AssistantAccess";
import { assistantObservationLines, emptyAssistantObservation, type AssistantObservation } from "@/lib/assistantObservation";
import { ExamResourceChecklist, ExamActivityResources } from "@/components/ExamActivityResources";
import { assistantExamResources, medicalExamResources } from "@/data/examResources";
import { examExamples } from "@/data/clinicalAssistantGuide";
import { examBands } from "@/data/exame-por-idade";
import { examStatuses, examVisit, initialExam, summarizeExam, type ExamStatus } from "@/lib/examVisitSession";

export default function ExamePorIdade() {
  const [visit, dispatch] = useReducer(examVisit, initialExam);
  const band = visit.band === null ? undefined : examBands[visit.band];
  const review = useRef<HTMLHeadingElement>(null);
  const age = useRef<HTMLSelectElement>(null);
  const records = summarizeExam(visit);
  const [assistantNotes, setAssistantNotes] = useState<Record<string, AssistantObservation>>({});
  const descriptive = Object.entries(assistantNotes).map(([title, note]) => ({ title, lines: assistantObservationLines(note) })).filter(({ lines }) => lines.length);
  const hasRecords = records.length > 0 || descriptive.length > 0;

  function finish() {
    if (hasRecords && !window.confirm("Encerrar e apagar as anotações temporárias deste exame? Confira antes se registrou o necessário no prontuário.")) return;
    dispatch({ type: "finish" });
    setAssistantNotes({});
    requestAnimationFrame(() => age.current?.focus());
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold">Exame neurológico e mental</h1>
        <p className="mt-1 text-muted-foreground">Escolha a idade para ver duas atividades práticas. A ficha médica completa fica logo abaixo.</p>
      </header>
      <div>
        <label htmlFor="exam-age" className="block font-semibold">Faixa etária</label>
        <select id="exam-age" ref={age} value={visit.band ?? ""} disabled={hasRecords}
          aria-describedby={hasRecords ? "exam-age-locked" : undefined}
          onChange={event => { setAssistantNotes({}); dispatch({ type: "select", band: event.target.value === "" ? null : Number(event.target.value) }); }}
          className="mt-2 block min-h-12 w-full rounded-lg border bg-background px-3 disabled:opacity-70">
          <option value="">Escolha a faixa etária</option>
          {examBands.map((item, index) => <option key={item.age} value={index}>{item.age}</option>)}
        </select>
      </div>
      {hasRecords && <p id="exam-age-locked" className="text-sm text-muted-foreground">Faixa vinculada aos registros. Para iniciar outro exame, revise e encerre este.</p>}
      {band && <div key={band.age} className="space-y-3">
        {!hasRecords && <ExamWelcome ageLabel={band.age} />}
        <ExamSessionTrail steps={[
          { id: "prepare", label: "Preparar", target: "exam-prepare" },
          { id: "activities", label: "Atividades", target: "exam-simple" },
          { id: "review", label: "Revisar", target: "exam-review" },
        ]} />
        <section aria-labelledby="exam-simple" className="space-y-3">
          <h2 id="exam-simple" tabIndex={-1} className="scroll-mt-24 text-lg font-semibold">Atividades guiadas · {band.age}</h2>
          <AssistantScope />
          <p className="text-sm text-muted-foreground">Escolha uma proposta, sem obrigação de fazer as duas. Aceite gesto, olhar, fala ou o meio de comunicação habitual. Se não der para tentar, anote o contexto, sem concluir que a criança não consegue.</p>
          <div className="space-y-2 rounded-xl border bg-card p-3">
            <h3 id="exam-prepare" tabIndex={-1} className="scroll-mt-24 text-sm font-semibold">Preparar a atividade</h3>
            <ExamResourceChecklist activities={assistantExamResources[band.age]} title="Conferir materiais das atividades guiadas" />
          </div>
          <AssistantAccess />
          {examExamples[band.age]?.map((example, index) => <ClinicalAssistantCard key={example.title} example={example} resource={assistantExamResources[band.age][index]}
            canPresent={visit.band !== null && visit.band >= 8} note={assistantNotes[example.title] ?? emptyAssistantObservation}
            onNote={(field, value) => setAssistantNotes(notes => ({ ...notes, [example.title]: { ...(notes[example.title] ?? emptyAssistantObservation), [field]: value } }))} />)}
        </section>
        <details className="space-y-3 rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold">Abrir ficha médica completa</summary>
          <div className="rounded-xl bg-muted p-4">
            <h2 className="font-semibold">Preparar · {band.age}</h2>
            <p className="mt-1">{band.setup}</p>
            <p className="mt-2 text-sm"><strong>Se precisar adaptar. </strong>{band.adapt}</p>
          </div>
          <ExamResourceChecklist activities={medicalExamResources[band.age]} title="Conferir materiais da ficha médica" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Conduzir e registrar</h2>
            <button type="button" onClick={() => { review.current?.scrollIntoView({ block: "start" }); review.current?.focus({ preventScroll: true }); }}
              className="min-h-11 rounded-lg border bg-card px-3 text-sm font-semibold">Revisar registros ({records.length} de {band.steps.length})</button>
          </div>
          <p className="text-sm text-muted-foreground">Abra o item que pretende examinar. Os demais ficam sem registro, sem marcação de normalidade.</p>
          {band.steps.map((item, index) => {
            const id = band.age + "/" + item.title;
            const entry = visit.records[index];
            return <details key={id} open={index === 0} className="rounded-xl border bg-card px-4">
              <summary className="cursor-pointer py-4 font-semibold">
                <span>{item.title}</span>
                {entry && <span className="ml-2 inline-block text-xs font-medium text-muted-foreground">{entry.status ? examStatuses[entry.status] : "Com anotação"}</span>}
              </summary>
              <div className="mb-3"><ExamActivityResources resource={medicalExamResources[band.age][index]} alreadyRecorded={Boolean(entry)}
                onMissing={() => dispatch({ type: "record", step: index, status: "materialsMissing" })} /></div>
              <p className="mb-2"><strong>Como examinar. </strong>{item.action}</p>
              <p className="mb-3"><strong>O que observar. </strong>{item.observe}</p>
              <label className="mb-3 block text-sm font-medium">Como foi avaliado · {item.title}
                <select value={entry?.status ?? ""} onChange={event => dispatch({ type: "record", step: index, status: event.target.value as ExamStatus | "" })}
                  className="mt-1 block min-h-11 w-full rounded-lg border bg-background p-2">
                  <option value="">Sem classificação</option>
                  {Object.entries(examStatuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
              <label className="mb-4 block text-sm">Observação temporária · {item.title}
                <textarea className="mt-1 block w-full rounded-lg border bg-background p-2" rows={2} value={entry?.note ?? ""}
                  placeholder="Descreva a resposta, o apoio usado ou o limite do que pôde observar."
                  onChange={event => dispatch({ type: "record", step: index, note: event.target.value })} />
              </label>
            </details>;
          })}
        </details>
        <section className="space-y-3 rounded-xl border bg-card p-4" aria-labelledby="exam-review">
          <h2 id="exam-review" ref={review} tabIndex={-1} className="scroll-mt-24 font-semibold">Revisar e encerrar</h2>
          {descriptive.length > 0 && <div>
            <h3 className="text-sm font-semibold">Observações das atividades guiadas</h3>
            <ul className="space-y-2" aria-label="Observações das atividades guiadas">
              {descriptive.map(({ title, lines }) => <li key={title} className="rounded-lg bg-muted/50 p-3 text-sm"><strong>{title}</strong>
                <p className="whitespace-pre-wrap break-words">{lines.join("\n")}</p></li>)}
            </ul>
          </div>}
          {records.length > 0 ? <ul className="space-y-2" aria-label="Registros do exame">
            {records.map(line => <li key={line.step} className="rounded-lg bg-muted/50 p-3 text-sm">
              <p><strong>{line.step}</strong> · {line.status}</p>
              {line.note && <p className="mt-1 whitespace-pre-wrap break-words">{line.note}</p>}
            </li>)}
          </ul> : <p className="text-sm text-muted-foreground">{descriptive.length ? "Sem registro na ficha médica." : "Nenhum registro neste exame."}</p>}
          <p className="text-sm text-muted-foreground">A síntese mostra apenas registros feitos nesta tela. Transcreva o necessário ao prontuário. O app não salva nem envia essas notas; elas somem ao sair ou recarregar.</p>
          <button type="button" onClick={finish} className="min-h-11 rounded-lg border border-destructive/40 bg-card px-3 text-sm font-semibold text-destructive">Encerrar e limpar</button>
        </section>
        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer font-semibold">Quando aprofundar o exame</summary>
          <p className="mt-2">Se a participação for limitada, ofereça pausa, demonstração ou comunicação alternativa e descreva a limitação. Em alteração aguda de consciência ou déficit focal súbito, interrompa o roteiro e priorize avaliação de urgência.</p>
          <p className="mt-2">Quando houver sofrimento, explore humor, percepção, pensamento e segurança em linguagem compreensível. Diante de risco atual de autoagressão, mantenha supervisão e acione avaliação urgente.</p>
        </details>
      </div>}
      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer py-2">Referências e versão do roteiro</summary>
        <p>Roteiro clínico observacional NeuroPed v1.4, sem validação psicométrica. As faixas orientam a abordagem. Os recursos não substituem avaliação presencial, instrumentos clínicos ou testes validados. A interpretação é clínica.</p>
        <ul className="list-disc space-y-1 pl-5 underline">
          <li><a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-z/s/saude-da-crianca/saude-da-crianca">Ministério da Saúde · Vigilância do desenvolvimento</a></li>
          <li><a href="https://www.cdc.gov/act-early/resources/milestones-checklist-by-age.html">CDC · Desenvolvimento por idade</a></li>
          <li><a href="https://aci.health.nsw.gov.au/ecat/paediatric/assessment/neurological">NSW Agency for Clinical Innovation · Exame neurológico pediátrico</a></li>
          <li><a href="https://med.stanford.edu/newborns/professional-education/photo-gallery/neuro-reflexes">Stanford Medicine · Exame neurológico do recém-nascido</a></li>
          <li><a href="https://www.rch.org.au/clinicalguide/guideline_index/Mental_state_examination/">Royal Children’s Hospital · Exame do estado mental</a></li>
        </ul>
      </details>
    </section>
  );
}

