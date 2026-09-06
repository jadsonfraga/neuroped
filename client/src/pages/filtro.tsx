import { Suspense, lazy } from "react";

/**
 * Casca do Filtro de Escalas.
 *
 * O catálogo clínico é grande e continua fora do bundle inicial — só é buscado
 * quando alguém abre esta rota. O que saiu foi a *confirmação manual*: antes a
 * tela pedia um clique em "Abrir filtro agora" antes de sequer iniciar o
 * download do chunk. Esse passo não protegia nada (nenhum dado sai do
 * dispositivo, nenhuma permissão é concedida ao clicar) e cobrava um clique por
 * consulta de quem usa o filtro dezenas de vezes por dia. O `lazy` já entrega a
 * mesma economia de bytes; o `Suspense` abaixo cobre a espera com um esqueleto
 * curto em vez de um botão.
 */
const FiltroEngine = lazy(() => import("@/pages/filtro-engine"));

function FiltroSkeleton() {
  return (
    <section
      className="mx-auto w-full max-w-5xl space-y-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="filter-shell-loading"
    >
      <span className="sr-only">Carregando o catálogo clínico seguro…</span>
      <div className="h-24 animate-pulse rounded-3xl border border-border/70 bg-card/70 motion-reduce:animate-none" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((slot) => (
          <div
            key={slot}
            className="h-28 animate-pulse rounded-2xl border border-border/60 bg-card/60 motion-reduce:animate-none"
          />
        ))}
      </div>
    </section>
  );
}

export default function FiltroPage() {
  return (
    <Suspense fallback={<FiltroSkeleton />}>
      <FiltroEngine />
    </Suspense>
  );
}
