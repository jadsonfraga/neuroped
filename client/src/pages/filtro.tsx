import { lazy, Suspense } from "react";

const FiltroEngine = lazy(() => import("@/pages/filtro-engine"));

/**
 * O catálogo do filtro é pesado e por isso continua em um chunk separado,
 * carregado só nesta rota. O que mudou: antes a rota parava em uma tela que
 * dizia "Preparando o catálogo clínico seguro" e, na verdade, não preparava
 * nada — ficava esperando um clique em "Abrir filtro agora". Não havia
 * requisito de segurança nessa etapa (o gate de acesso é o RouteGuard, e o
 * conteúdo do filtro não expõe dado de paciente); era apenas adiamento de
 * download convertido em trabalho para quem usa o app todo dia.
 *
 * Agora o carregamento começa no primeiro render e o esqueleto abaixo cobre a
 * espera. Nenhuma proteção foi removida.
 */
function FilterSkeleton() {
  return (
    <section
      className="mx-auto w-full max-w-5xl space-y-5"
      aria-busy="true"
      role="status"
      aria-live="polite"
      data-testid="filter-shell-loading"
    >
      <span className="sr-only">Carregando o catálogo clínico de escalas…</span>
      <div className="space-y-3">
        <div className="h-7 w-56 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted/70 motion-reduce:animate-none" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-11 w-32 shrink-0 animate-pulse rounded-full bg-muted/70 motion-reduce:animate-none"
          />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl border border-border/60 bg-muted/50 motion-reduce:animate-none"
          />
        ))}
      </div>
    </section>
  );
}

export default function FiltroPage() {
  return (
    <Suspense fallback={<FilterSkeleton />}>
      <FiltroEngine />
    </Suspense>
  );
}
