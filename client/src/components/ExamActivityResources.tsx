import { useId, useRef, useState, type PointerEvent } from "react";
import { examVisuals, materialChecklist, type ExamResource, type Picture, type Visual } from "@/data/examResources";
import { ParticipantPace } from "./AssistantAccess";

const image: Record<Picture, { label: string; path: string }> = {
  ball: { label: "Bola", path: "M50 19a31 31 0 1 0 0 62 31 31 0 1 0 0-62 M24 34l51 32 M25 66l51-32" },
  book: { label: "Livro", path: "M50 27Q31 13 13 24v53q20-9 37 5 17-14 37-5V24q-18-11-37 3v55 M22 37l18 3 M60 40l17-3" },
  bag: { label: "Mochila", path: "M40 25v-5a10 10 0 0 1 20 0v5 M21 82V43q0-17 17-17h24q17 0 17 17v39Z M32 59h36v15H32Z" },
  bottle: { label: "Garrafa", path: "M38 13h24v16H38Z M39 29v7c-9 5-14 11-14 25v22q0 7 8 7h34q8 0 8-7V61c0-14-5-20-14-25v-7 M26 58h48" },
  dog: { label: "Cachorro", path: "M25 51Q15 22 30 22l13 15h14l13-15q15 0 5 29v13q-4 18-25 18T25 64Z M39 55h1 M60 55h1 M45 65h10l-5 6Z" },
  cup: { label: "Copo", path: "M21 31h49l-6 43H30Z M70 40h12q12 0 9 12t-22 12 M19 82h66" },
  bench: { label: "Banco", path: "M18 25h64v26H18Z M17 57h67v11H17Z M26 68v16 M74 68v16" },
  tree: { label: "Árvore", path: "M44 82V63Q18 67 19 46q0-18 18-18 1-13 14-13t15 13q15 0 15 15 0 20-24 20v19Z" },
  sun: { label: "Sol", path: "M50 31a19 19 0 1 0 0 38 19 19 0 1 0 0-38 M50 9v11 M50 80v11 M9 50h11 M80 50h11 M21 21l9 9 M70 70l9 9 M21 79l9-9 M70 30l9-9" },
  moon: { label: "Lua", path: "M55 14Q30 33 47 56q14 17 36 6-8 24-34 24A36 36 0 0 1 55 14Z" },
  line: { label: "Traço reto", path: "M14 57h72" },
  wave: { label: "Traço ondulado", path: "M12 57q10-29 24 0t25 0 27 0" },
  home: { label: "Casa", path: "M10 44l40-29 40 29 M21 38v44h58V38 M42 82V58h16v24" },
  kite: { label: "Pipa", path: "M52 15l31 29-31 25-29-25Z M52 15v54q-5 6-13 8t-13 10 M23 44h60" },
  pencil: { label: "Lápis", path: "M20 79l6-20 41-41 16 16-41 41Z M26 59l16 16 M59 26l16 16" },
};

function DrawingBoard() {
  const [lines, setLines] = useState<string[]>([]);
  const active = useRef<number | null>(null);
  const points = useRef(0);
  function coordinate(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return [Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)) * 320,
      Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)) * 180].map(n => n.toFixed(1)).join(" ");
  }
  return <div className="space-y-2">
    <p className="text-sm">Desenhe com o dedo ou mouse. O rascunho some ao fechar. Para avaliar a pega, use papel e lápis.</p>
    <svg viewBox="0 0 320 180" preserveAspectRatio="none" role="img" aria-label="Prancha de desenho livre" data-testid="exam-drawing-board"
      className="h-44 w-full touch-none rounded-lg border bg-white text-slate-900 sm:h-56"
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0 || active.current !== null || points.current >= 600) return;
        const p = coordinate(event);
        active.current = event.pointerId;
        points.current += 1;
        event.currentTarget.setPointerCapture(event.pointerId);
        setLines(paths => [...paths, "M" + p + " L" + p]);
      }}
      onPointerMove={event => {
        if (active.current !== event.pointerId || points.current >= 600) return;
        const p = coordinate(event);
        points.current += 1;
        setLines(paths => paths.map((line, index) => index === paths.length - 1 ? line + " L" + p : line));
      }}
      onPointerUp={() => { active.current = null; }}
      onLostPointerCapture={() => { active.current = null; }}
      onPointerCancel={() => { active.current = null; }}>
      {lines.map((line, index) => <path key={index} d={line} stroke="currentColor" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />)}
    </svg>
    <button type="button" onClick={() => { points.current = 0; active.current = null; setLines([]); }}
      className="min-h-11 rounded-lg border bg-background px-3 text-sm">Limpar desenho</button>
  </div>;
}

export function ExamResourceChecklist({ activities, title }: { activities: readonly ExamResource[]; title: string }) {
  const material = materialChecklist(activities);
  const [checked, setChecked] = useState<string[]>([]);
  const id = useId();
  const visuals = activities.filter(activity => activity.visual).length;
  return <details className="rounded-xl border bg-card p-3" data-testid="exam-material-checklist">
    <summary className="min-h-11 cursor-pointer py-2 font-semibold">{title}</summary>
    <p className="text-sm">Confira os materiais da faixa antes de começar. Preparar material não registra resultado.</p>
    <p className="my-2 text-sm text-muted-foreground">{visuals ? `${visuals} atividades com recurso na tela.` : "Nenhum estímulo de tela para esta seleção."}</p>
    {material.length > 0 ? <fieldset aria-describedby={id} className="space-y-1">
      <legend className="text-sm font-medium">Materiais presenciais e apoios</legend>
      <p id={id} className="text-xs text-muted-foreground">Use apenas os itens necessários às atividades escolhidas.</p>
      {material.map(item => <label key={item} className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" checked={checked.includes(item)} className="size-5 shrink-0"
          onChange={event => setChecked(items => event.target.checked ? [...items, item] : items.filter(value => value !== item))} />{item}
      </label>)}
    </fieldset> : <p className="text-sm">Nenhum material de mesa necessário.</p>}
  </details>;
}

export function ExamActivityResources({ resource, onMissing, alreadyRecorded = false }: { resource: ExamResource; onMissing: () => void; alreadyRecorded?: boolean }) {
  const visual: Visual | undefined = resource.visual ? examVisuals[resource.visual] : undefined;
  const dialog = useRef<HTMLDialogElement>(null);
  const [presentation, setPresentation] = useState(0);
  return <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
    <p className="text-sm"><strong>Prepare antes. </strong>{resource.preparation}</p>
    {resource.materials.length > 0 && <>
      <ul aria-label={"Materiais · " + resource.title} className="list-disc space-y-1 pl-6 text-sm">
        {resource.materials.map(material => <li key={material}>{material}</li>)}
      </ul>
      {!alreadyRecorded && <button type="button" onClick={onMissing} className="min-h-11 rounded-lg border bg-background px-3 text-sm">Registrar falta de material</button>}
    </>}
    {visual && <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="min-h-11 rounded-lg border bg-background px-3 text-sm font-semibold">Abrir recurso da atividade</button>
      <dialog ref={dialog} aria-label={visual.title} onClose={() => setPresentation(n => n + 1)}
        className="m-auto max-h-[90dvh] w-11/12 max-w-xl overflow-auto rounded-2xl bg-background p-4 text-foreground backdrop:bg-slate-900">
        <h3 className="mb-2 text-lg font-semibold">{visual.title}</h3>
        <ParticipantPace key={presentation} onClose={() => dialog.current?.close()} closeLabel="Fechar recurso">
          {visual.pictures && <div className="flex flex-wrap justify-center gap-2">
            {visual.pictures.map(picture => <svg key={picture} viewBox="0 0 100 100" role="img" aria-label={image[picture].label}
              className="h-24 w-24 rounded-lg border bg-white p-1 text-slate-900 sm:h-28 sm:w-28">
              <path d={image[picture].path} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>)}
          </div>}
          {visual.prompts && <ul className="my-3 grid gap-2 sm:grid-cols-2">{visual.prompts.map(prompt => <li key={prompt} className="rounded-lg border p-3 text-lg">{prompt}</li>)}</ul>}
          {visual.drawing && <DrawingBoard />}
        </ParticipantPace>
      </dialog>
    </>}
  </div>;
}
