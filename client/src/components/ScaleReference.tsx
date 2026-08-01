import { BookOpen, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { scaleReferences } from "@/data/scaleReferences";

export function ScaleReference({ scaleId }: { scaleId: string }) {
  const reference = scaleReferences[scaleId];
  if (!reference) return null;

  return (
    <Card className="mt-6 overflow-hidden rounded-2xl border-border/70 bg-gradient-to-br from-primary/[0.04] via-card to-chart-2/[0.03] shadow-sm">
      <div className="h-1 bg-gradient-to-r from-primary via-chart-2 to-chart-3" />
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              evidência e proveniência
            </p>
            <h3 className="mt-0.5 text-sm font-black text-foreground">
              Referência bibliográfica
            </h3>
          </div>
        </div>

        <p className="rounded-xl border border-border/70 bg-background/70 p-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">
            {reference.authors} ({reference.year}).
          </span>{" "}
          <em>{reference.title}</em>
          {reference.journal && <span>. {reference.journal}.</span>}
        </p>

        {reference.note && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-300/50 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-100">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <p>{reference.note}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
