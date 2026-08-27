import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const FiltroEngine = lazy(() => import("@/pages/filtro-engine"));

export default function FiltroPage() {
  return (
    <Suspense
      fallback={
        <section
          className="mx-auto flex min-h-[55vh] w-full max-w-3xl items-center justify-center rounded-3xl border border-border/70 bg-card/80 p-8 text-center shadow-sm"
          role="status"
          aria-live="polite"
          data-testid="filter-shell-loading"
        >
          <div className="space-y-2">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Preparando o catálogo clínico seguro…
            </p>
            <p className="text-xs text-muted-foreground">
              O conteúdo permanece nesta sessão e não é enviado a terceiros.
            </p>
          </div>
        </section>
      }
    >
      <FiltroEngine />
    </Suspense>
  );
}
