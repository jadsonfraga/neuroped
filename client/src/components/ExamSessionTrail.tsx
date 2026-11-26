import { BookOpen, Compass, ListChecks, Shapes } from "lucide-react";

const icons = { choose: Compass, prepare: ListChecks, activities: Shapes, record: BookOpen, review: BookOpen };
type Step = { id: keyof typeof icons; label: string; target?: string };

export function ExamSessionTrail({ steps, current }: { steps: readonly Step[]; current?: Step["id"] }) {
  const Region = current ? "section" : "nav";
  const visibleSteps = current ? steps.filter(step => step.id === current) : steps;

  return (
    <Region role={current ? "group" : undefined} aria-label="Trilha da sessão"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border bg-card px-3 py-1.5">
      <p className="text-xs font-semibold text-muted-foreground">{current ? "Etapa atual" : "Atalhos da sessão"}</p>
      <ol className="flex flex-wrap gap-1.5">
        {visibleSteps.map(({ id, label, target }) => {
          const Icon = icons[id];
          const active = current === id;
          const styles = "inline-flex items-center gap-1.5 rounded-lg px-2 text-left text-sm font-medium " +
            (active ? "py-1 font-semibold text-primary" : "min-h-11 underline decoration-primary/40 underline-offset-4");
          const content = <><Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" /><span>{label}</span></>;
          return <li key={id} aria-current={active ? "step" : undefined} className="sm:flex-1">
            {target ? <button type="button"
              className={styles + " hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"}
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
