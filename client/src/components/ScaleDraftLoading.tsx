import { Card, CardContent } from "@/components/ui/card";

/** Evita que uma resposta nova seja sobrescrita enquanto o rascunho é aberto. */
export function ScaleDraftLoading() {
  return (
    <Card className="border-card-border" role="status" aria-live="polite">
      <CardContent className="p-6 text-sm text-muted-foreground">
        Preparando rascunho protegido…
      </CardContent>
    </Card>
  );
}

export function ScaleDraftRestoredNotice({
  visible,
  onClear,
}: {
  visible: boolean;
  onClear: () => void | Promise<void>;
}) {
  if (!visible) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-950/30">
      <p className="text-xs text-amber-800 dark:text-amber-200">
        Rascunho protegido restaurado. Confirme que pertence a esta aplicação.
      </p>
      <button
        type="button"
        onClick={() => void onClear()}
        className="shrink-0 rounded-lg border border-amber-400/70 px-2.5 py-1 text-xs font-bold text-amber-800 transition hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/40"
        data-testid="button-clear-draft"
      >
        Começar do zero
      </button>
    </div>
  );
}
