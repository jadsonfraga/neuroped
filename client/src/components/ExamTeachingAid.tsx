import { useId } from "react";
import { ChevronDown } from "lucide-react";
import type { TeachingAid, TeachingVisual } from "@/data/examTeachingAids";

const labels: Record<TeachingVisual, string> = {
  presence: "Duas cadeiras lado a lado, representando observação presencial com o cuidador",
  materials: "Uma caixa com materiais grandes, uma bola e um pano",
  book: "Um livro aberto com imagens simples nas páginas",
  drawing: "Uma folha e um giz grosso sobre uma mesa",
  choices: "Duas fichas de escolha, sem uma opção marcada",
  notes: "Um caderno aberto com linhas de anotação e uma caneta",
};

function Scene({ kind }: { kind: TeachingVisual }) {
  const id = useId();
  return <svg viewBox="0 0 176 108" role="img" aria-labelledby={id} className="h-auto w-full rounded-xl" focusable="false">
    <title id={id}>{labels[kind]}</title>
    <rect width="176" height="108" rx="12" fill="hsl(var(--muted))" />
    <path d="M16 88h144" fill="none" stroke="hsl(var(--border))" strokeWidth="2" strokeLinecap="round" />
    <g stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {kind === "presence" && <>
        <path d="M38 66V36c0-6 5-10 10-10h22c6 0 10 4 10 10v21M39 67h43V56H39zM45 68v17m29-17v17" fill="hsl(var(--primary) / .21)" />
        <path d="M95 67V47c0-5 4-9 9-9h18c5 0 9 4 9 9v11m-36 9h38V57H95zM101 69v16m24-16v16" fill="hsl(var(--accent))" />
        <path d="M80 20c5-5 11-5 16 0m-22-6c8-7 19-7 27 0" fill="none" />
      </>}
      {kind === "materials" && <>
        <circle cx="82" cy="43" r="17" fill="hsl(var(--primary) / .25)" /><path d="M68 40c8-7 18-6 28 2" fill="none" />
        <path d="M100 29c12 9 18 16 27 15l-9 22H96z" fill="hsl(var(--muted-foreground) / .34)" />
        <path d="M42 50h92l-9 36H51z" fill="hsl(var(--accent))" /><path d="M67 64h42m-37 9h31" />
      </>}
      {kind === "book" && <>
        <path d="M35 31c22-5 39-1 53 8 14-9 31-13 53-8v45c-18-1-37 2-53 9-16-7-35-10-53-9z" fill="hsl(var(--card))" />
        <path d="M88 39v46m13-31 24-5m-24 16 24-5" fill="none" />
        <path d="M49 65l10-13 12 11z" fill="hsl(var(--primary) / .20)" /><circle cx="72" cy="49" r="4" fill="hsl(var(--primary) / .32)" />
      </>}
      {kind === "drawing" && <>
        <path d="M41 29h74v54H41z" fill="hsl(var(--card))" />
        <path d="M54 68c9-13 18 6 28-6m-28-12h37" fill="none" stroke="hsl(var(--muted-foreground))" />
        <path d="m96 75 5-14 34-32 8 9-34 33z" fill="hsl(var(--primary) / .27)" />
        <path d="m130 34 8 9m-41 31 7-4" />
      </>}
      {kind === "choices" && <>
        <rect x="38" y="29" width="44" height="51" rx="7" fill="hsl(var(--card))" />
        <rect x="94" y="29" width="44" height="51" rx="7" fill="hsl(var(--card))" />
        <circle cx="60" cy="53" r="9" fill="hsl(var(--primary) / .20)" />
        <path d="M107 62l9-18 10 18z" fill="hsl(var(--muted-foreground) / .34)" />
      </>}
      {kind === "notes" && <>
        <rect x="48" y="24" width="76" height="62" rx="5" fill="hsl(var(--card))" />
        <path d="M62 24v62m11-44h35M73 52h35M73 62h24M73 72h18" fill="none" />
        <path d="m105 78 4-12 28-34 7 5-27 35z" fill="hsl(var(--muted-foreground) / .34)" />
      </>}
    </g>
  </svg>;
}

export function ExamTeachingAid({ aid }: { aid?: TeachingAid }) {
  if (!aid) return null;
  return <details className="group/teaching rounded-xl border bg-card px-3" data-testid="exam-teaching-aid">
    <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-sm font-semibold">
      Figura e exemplo para a equipe
      <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 group-open/teaching:rotate-180" />
    </summary>
    <figure className="grid gap-3 pb-3 pt-2 sm:grid-cols-[9rem_1fr] sm:items-start">
      <div className="w-full max-w-44"><Scene kind={aid.visual} /></div>
      <figcaption className="space-y-2 text-sm">
        <p><strong>Exemplo fictício de anotação.</strong> {aid.example}</p>
        <p className="text-muted-foreground">Para a equipe, não para apresentar à criança. Não copie o exemplo para o registro. Anote somente o que aconteceu.</p>
      </figcaption>
    </figure>
  </details>;
}
