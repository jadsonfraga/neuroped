import { Suspense, lazy, useEffect, useState, useSyncExternalStore } from "react";
import { readRouteParam } from "@/lib/routeQuery";

const FiltroEngine = lazy(() => import("@/pages/filtro-engine"));
const Regula20Page = lazy(() => import("@/components/Regula20Questionnaire"));
const RecoveredAuthorialHub = lazy(() => import("@/components/RecoveredAuthorialHub"));
const tabs = [
  { key: "general", id: "filter-general", title: "Filtro clínico geral" },
  { key: "regula-20-sdg", id: "filter-authorial", title: "Irritabilidade / Desregulação / Recuperação · Autoral" },
  { key: "acervo", id: "filter-recovered", title: "Acervo autoral · seleção inteligente" },
] as const;
type Tab = (typeof tabs)[number]["key"];
function subscribeRoute(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => { window.removeEventListener("hashchange", onChange); window.removeEventListener("popstate", onChange); };
}
function currentTab(): Tab {
  const value = readRouteParam("autoral");
  return value === "acervo" || value === "regula-20-sdg" ? value : "general";
}
function selectTab(tab: Tab) {
  const url = new URL(window.location.href);
  url.searchParams.delete("autoral");
  const [path, rawQuery = ""] = url.hash.slice(1).split("?");
  const query = new URLSearchParams(rawQuery);
  if (tab === "general") query.delete("autoral"); else query.set("autoral", tab);
  const safePath = path === "/filtro-escalas" ? path : "/filtro";
  url.hash = safePath + (query.toString() ? `?${query}` : "");
  window.history.pushState(null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
function FiltroSkeleton() {
  return <section className="mx-auto w-full max-w-5xl space-y-4" role="status" aria-live="polite" aria-busy="true" data-testid="filter-shell-loading">
    <span className="sr-only">Carregando o catálogo clínico seguro…</span>
    <div className="h-24 animate-pulse rounded-3xl border border-border/70 bg-card/70 motion-reduce:animate-none" />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((slot) => <div key={slot} className="h-28 animate-pulse rounded-2xl border border-border/60 bg-card/60 motion-reduce:animate-none" />)}</div>
  </section>;
}
export default function FiltroPage() {
  const active = useSyncExternalStore(subscribeRoute, currentTab, () => "general" as Tab);
  const [visited, setVisited] = useState<Tab[]>([active]);
  useEffect(() => { setVisited((values) => values.includes(active) ? values : [...values, active]); }, [active]);
  return <div className="space-y-4">
    <div role="tablist" aria-label="Área do filtro de escalas" className="grid gap-2 sm:grid-cols-3">
      {tabs.map((tab, index) => <button key={tab.key} id={`${tab.id}-tab`} type="button" role="tab" aria-selected={active === tab.key} aria-controls={`${tab.id}-panel`} tabIndex={active === tab.key ? 0 : -1}
        onClick={() => selectTab(tab.key)} onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowLeft" ? -1 : 1) + tabs.length) % tabs.length;
          selectTab(tabs[nextIndex].key); document.getElementById(`${tabs[nextIndex].id}-tab`)?.focus();
        }} className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${active === tab.key ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground"}`}>{tab.title}</button>)}
    </div>
    {tabs.map((tab) => <div key={tab.key} id={`${tab.id}-panel`} role="tabpanel" aria-labelledby={`${tab.id}-tab`} hidden={active !== tab.key} className="min-w-0 break-words [overflow-wrap:anywhere]">
      {(active === tab.key || visited.includes(tab.key)) && <Suspense fallback={<FiltroSkeleton />}>
        {tab.key === "general" ? <FiltroEngine /> : tab.key === "regula-20-sdg" ? <Regula20Page /> : <RecoveredAuthorialHub />}
      </Suspense>}
    </div>)}
  </div>;
}
