import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Clock, Filter, Star } from "lucide-react";
import { useFavorites, useRecents } from "@/hooks/useFavorites";

interface NavScale {
  id: string;
  name: string;
  fullName: string;
  appRoute?: string;
}

export function FavoritesRecents() {
  const { favorites, toggle, isFavorite } = useFavorites();
  const { recents } = useRecents();
  const [scales, setScales] = useState<NavScale[]>([]);
  const hasContent = favorites.length > 0 || recents.length > 0;

  useEffect(() => {
    if (!hasContent || scales.length > 0) return;
    let cancelled = false;
    import("@/data/scaleFilter").then((mod) => {
      if (cancelled) return;
      setScales(
        mod.allScales
          .filter(
            (scale) =>
              typeof scale.appRoute === "string" && scale.appRoute.length > 0,
          )
          .map((scale) => ({
            id: scale.id,
            name: scale.name,
            fullName: scale.fullName,
            appRoute: scale.appRoute,
          })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [hasContent, scales.length]);

  const favScales = useMemo(
    () =>
      favorites
        .map((id) => scales.find((scale) => scale.id === id))
        .filter(Boolean) as NavScale[],
    [favorites, scales],
  );
  const recentScales = useMemo(
    () =>
      recents
        .map((id) => scales.find((scale) => scale.id === id))
        .filter(Boolean) as NavScale[],
    [recents, scales],
  );

  return (
    <section
      className="rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5"
      aria-label="Atalhos pessoais"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Seu ritmo
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            Atalhos pessoais
          </h2>
        </div>
        <Star className="h-5 w-5 text-amber-500/75" aria-hidden="true" />
      </div>

      {!hasContent ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-border/75 bg-background/35 p-3.5">
          <Filter
            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">
              Monte seus atalhos em um clique.
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Marque escalas como favoritas no Filtro Clínico e elas aparecem
              aqui, junto do que você usou recentemente.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/filtro"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Por queixa e objetivo
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
              <Link
                href="/filtro-escalas"
                className="inline-flex min-h-9 items-center rounded-xl border border-border/70 bg-background/55 px-3 py-2 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/25 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Triar sem cadastrar
              </Link>
            </div>
          </div>
        </div>
      ) : scales.length === 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Carregando seus atalhos…
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {favScales.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <Star
                  className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  aria-hidden="true"
                />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Favoritos
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {favScales.map((scale) => (
                  <span
                    key={scale.id}
                    className="inline-flex items-center overflow-hidden rounded-lg border border-border/70 bg-background/55"
                  >
                    <Link href={scale.appRoute!}>
                      <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-muted">
                        {scale.name}
                        <ArrowRight
                          className="h-3 w-3 text-primary"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggle(scale.id)}
                      aria-label={`Remover ${scale.name} dos favoritos`}
                      className="border-l border-border/70 px-1.5 py-1.5 transition-colors hover:bg-muted"
                    >
                      <Star
                        className={`h-3 w-3 ${isFavorite(scale.id) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                        aria-hidden="true"
                      />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          {recentScales.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <Clock
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Usados recentemente
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentScales.map((scale) => (
                  <Link key={scale.id} href={scale.appRoute!}>
                    <span className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/55 px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-muted">
                      {scale.name}
                      <ArrowRight
                        className="h-3 w-3 text-primary"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
