import { BookOpen, Compass, ListChecks, Shapes } from "lucide-react";

const icons = { choose: Compass, prepare: ListChecks, activities: Shapes, record: BookOpen, review: BookOpen };
type Step = { id: keyof typeof icons; label: string; target?: string };

export function ExamSessionTrail({ steps, current }: { steps: readonly Step[]; current?: Step["id"] }) {
  const Region = current ? "section" : "nav";

  return (
    <Region role={current ? "group" : undefined} aria-label="Trilha da sessão"
      className="rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm font-semibold">Trilha da sessão</p>
        <p className="text-xs text-muted-foreground">No ritmo da criança, sem etapas obrigatórias.</p>
      </div>
      <ol className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {steps.map(({ id, label, target }) => {
          const Icon = icons[id];
          const active = current === id;
          const styles = "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium " +
            (active ? "border-primary/40 bg-primary/10 font-semibold" : "border-border bg-card");
          const content = <><Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" /><span>{label}</span></>;
          return <li key={id} aria-current={active ? "step" : undefined} className="sm:flex-1">
            {target ? <button type="button"
              className={styles + " w-full hover:border-primary/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"}
              onClick={() => {
                const destination = document.getElementById(target);
                destination?.focus({ preventScroll: true });
                destination?.scrollIntoView({ block: "start" });
              }}>{content}</button> : <span className={styles}>{content}</span>}
          </li>;
        })}
      </ol>
    </Region>
  );
}
