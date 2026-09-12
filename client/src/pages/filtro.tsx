import { Suspense, lazy, useEffect, useState, useSyncExternalStore } from "react";
import { readRouteParam } from "@/lib/routeQuery";

/** Cada painel carrega somente após a primeira visita e preserva o estado em memória. */
const FiltroEngine = lazy(() => import("@/pages/filtro-engine"));
const Regula20Page = lazy(() => import("@/pages/regula20"));

function subscribeRoute(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}
function isRegulaRoute() { return readRouteParam("autoral") === "regula-20-sdg"; }
function selectTab(authorial: boolean) {
  const url = new URL(window.location.href);
  url.searchParams.delete("autoral");
  const [path, rawQuery = ""] = url.hash.slice(1).split("?");
  const query = new URLSearchParams(rawQuery);
  if (authorial) query.set("autoral", "regula-20-sdg");
  else query.delete("autoral");
  const safePath = path === "/filtro-escalas" ? path : "/filtro";
  url.hash = safePath + (query.toString() ? `?${query}` : "");
  window.history.pushState(null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function FiltroSkeleton() {
  return (
    <section className="mx-auto w-full max-w-5xl space-y-4" role="status" aria-live="polite" aria-busy="true" data-testid="filter-shell-loading">
      <span className="sr-only">Carregando o catálogo clínico seguro…</span>
      <div className="h-24 animate-pulse rounded-3xl border border-border/70 bg-card/70 motion-reduce:animate-none" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((slot) => <div key={slot} className="h-28 animate-pulse rounded-2xl border border-border/60 bg-card/60 motion-reduce:animate-none" />)}
      </div>
    </section>
  );
}

export default function FiltroPage() {
  const authorial = useSyncExternalStore(subscribeRoute, isRegulaRoute, () => false);
  const [visitedAuthorial, setVisitedAuthorial] = useState(authorial);
  const [visitedGeneral, setVisitedGeneral] = useState(!authorial);
  useEffect(() => {
    if (authorial) setVisitedAuthorial(true);
    else setVisitedGeneral(true);
  }, [authorial]);
  return <div className="space-y-4">
    <div role="tablist" aria-label="Área do filtro de escalas" className="grid gap-2 sm:grid-cols-2">
      {[false, true].map((value) => <button key={String(value)} id={value ? "filter-authorial-tab" : "filter-general-tab"} type="button" role="tab" aria-selected={authorial === value} aria-controls={value ? "filter-authorial-panel" : "filter-general-panel"} tabIndex={authorial === value ? 0 : -1} onClick={() => selectTab(value)} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? false : event.key === "End" ? true : !value; selectTab(next); document.getElementById(next ? "filter-authorial-tab" : "filter-general-tab")?.focus(); } }} className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${authorial === value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground"}`}>
        {value ? "Irritabilidade / Desregulação / Recuperação · Autoral" : "Filtro clínico geral"}
      </button>)}
    </div>
    <div id="filter-general-panel" role="tabpanel" aria-labelledby="filter-general-tab" hidden={authorial}>
      {(!authorial || visitedGeneral) && <Suspense fallback={<FiltroSkeleton />}><FiltroEngine /></Suspense>}
    </div>
    <div id="filter-authorial-panel" role="tabpanel" aria-labelledby="filter-authorial-tab" hidden={!authorial} className="min-w-0 break-words [overflow-wrap:anywhere]">
      {(authorial || visitedAuthorial) && <Suspense fallback={<FiltroSkeleton />}><Regula20Page /></Suspense>}
    </div>
  </div>;
}
