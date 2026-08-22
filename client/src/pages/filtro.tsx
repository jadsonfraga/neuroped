import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";

const FiltroEngine = lazy(() => import("@/pages/filtro-engine"));

export default function FiltroPage() {
  const [ready, setReady] = useState(false);
  const openFilter = () => setReady(true);

  if (!ready) {
    return (
      <section
        className="mx-auto flex min-h-[55vh] w-full max-w-3xl flex-col items-center justify-center gap-4 rounded-3xl border border-border/70 bg-card/80 p-8 text-center shadow-sm"
        aria-busy="true"
        data-testid="filter-shell-loading"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary" aria-hidden="true">
          <span className="text-2xl">⌛</span>
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Filtro de escalas</h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Preparando o catálogo clínico seguro. O conteúdo não é descartado nem enviado para terceiros.
          </p>
        </div>
        <Button
          type="button"
          onClick={openFilter}
          onFocus={openFilter}
          onPointerEnter={openFilter}
          data-testid="button-open-filter"
        >
          Abrir filtro agora
        </Button>
      </section>
    );
  }

  return (
    <Suspense
      fallback={
        <section className="mx-auto flex min-h-[55vh] w-full max-w-3xl items-center justify-center rounded-3xl border border-border/70 bg-card/80 p-8 text-center" role="status" aria-live="polite">
          <p className="text-sm text-muted-foreground">Carregando o catálogo clínico seguro…</p>
        </section>
      }
    >
      <FiltroEngine />
    </Suspense>
  );
}
