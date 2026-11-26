import { useRef, useState } from "react";
import { BookOpen, Hand, Layers, MessageCircle, Repeat2, Smile } from "lucide-react";
import type { ExamResource } from "@/data/examResources";
import { ExamActivityResources } from "./ExamActivityResources";
import type { ExamExample } from "@/data/clinicalAssistantGuide";

import { ParticipantPace } from "./AssistantAccess";
import { assistantObservationLines, type AssistantObservation } from "@/lib/assistantObservation";

const icons = { face: Smile, hand: Hand, book: BookOpen, choice: Layers, turn: Repeat2, story: MessageCircle };
const button = "min-h-12 rounded-xl border bg-background px-4 py-2 text-sm font-semibold";

export function AssistantScope() {
  return <p className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm">
    <strong>Para a assistente:</strong> convide, ofereça uma pausa e anote só o que aconteceu. Não faça manobras físicas ou testes formais.
    O exame, a interpretação e a decisão clínica ficam com o médico.
  </p>;
}

export function ClinicalAssistantCard({ example, note, onNote, canPresent, resource }: {
  example: ExamExample; note: AssistantObservation; onNote: (field: keyof AssistantObservation, value: string) => void; canPresent: boolean; resource: ExamResource;
}) {
  const [presentation, setPresentation] = useState(0);
  const visual = useRef<HTMLDialogElement>(null);
  const Icon = icons[example.icon];
  const hasNote = assistantObservationLines(note).length > 0;
  return <details className="group rounded-xl border bg-card">
    <summary className="cursor-pointer list-none rounded-xl p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
      <span className="flex items-center gap-3">
        <Icon aria-hidden="true" className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 p-2 text-primary" />
        <span className="flex-1 font-semibold">{example.title}</span>
        <span className="text-sm text-muted-foreground">{hasNote ? "Com anotação" : <>
          <span className="group-open:hidden">Abrir</span><span className="hidden group-open:inline">Recolher</span>
        </>}</span>
      </span>
    </summary>
    <div className="space-y-3 border-t p-4">
      <ExamActivityResources resource={resource} alreadyRecorded={hasNote} onMissing={() => onNote("outcome", "materials-missing")} />
      {note.outcome === "materials-missing" && <div className="text-sm" role="status">
        Não aplicado: faltou material. <button type="button" onClick={() => onNote("outcome", "")} className="min-h-11 underline">Retirar marcação</button>
      </div>}
      <p className="text-sm"><strong>Faça assim. </strong>{example.material}</p>
      <p className="rounded-lg bg-primary/5 p-3"><strong>Diga: </strong>“{example.say}”</p>
      <p className="text-sm"><strong>Anote. </strong>{example.observe}</p>
      {canPresent && <>
        <button type="button" className={button} onClick={() => visual.current?.showModal()}>Mostrar cartão visual</button>
        {/* Reset only after closing; remounting on open removes the browser's initial focus target. */}
        <dialog ref={visual} aria-label={example.title} onClose={() => setPresentation(n => n + 1)} className="fixed inset-0 m-auto max-h-[90dvh] w-11/12 overflow-y-auto max-w-lg rounded-2xl bg-background p-5 text-center text-foreground backdrop:bg-slate-900">
          <Icon aria-hidden="true" className="mx-auto my-4 h-20 w-20 rounded-2xl bg-primary/10 p-4 text-primary" />
          <h3 className="mb-4 text-2xl font-bold sm:text-3xl">{example.title}</h3>
          <ParticipantPace key={presentation} closeLabel="Fechar cartão" onClose={() => visual.current?.close()}>
            <p className="text-xl">{example.say}</p>
          </ParticipantPace>
        </dialog>
      </>}
      <label className="block text-sm font-medium">O que aconteceu · {example.title}
        <textarea className="mt-1 block w-full rounded-lg border bg-background p-3" value={note.reaction} disabled={note.outcome === "materials-missing"} rows={2}
          placeholder="Ex.: pegou o giz e pediu outra folha."
          onChange={event => onNote("reaction", event.target.value)} />
      </label>
      <details className="rounded-lg border px-3">
        <summary className="flex min-h-12 cursor-pointer items-center text-sm font-semibold">Acrescentar proposta e apoio</summary>
        <label className="mb-3 block text-sm font-medium">O que foi oferecido · {example.title}
          <textarea className="mt-1 block w-full rounded-lg border bg-background p-3" value={note.invitation} disabled={note.outcome === "materials-missing"} rows={2}
            onChange={event => onNote("invitation", event.target.value)} />
        </label>
        <label className="mb-3 block text-sm font-medium">Apoio ou contexto · {example.title}
          <textarea className="mt-1 block w-full rounded-lg border bg-background p-3" value={note.support} rows={2}
            onChange={event => onNote("support", event.target.value)} />
        </label>
      </details>
    </div>
  </details>;
}
