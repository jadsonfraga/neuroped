import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Star, Clock, ArrowRight } from "lucide-react";
import { useFavorites, useRecents } from "@/hooks/useFavorites";

/**
 * FavoritesRecents — Bloco D3 (Dashboard).
 *
 * Mostra "Favoritos" e "Usados recentemente" no topo da Home. O catálogo é
 * importado dinamicamente para não pesar no bundle inicial da Home (eager).
 * Não renderiza nada se o usuário ainda não tem favoritos nem recentes.
 */

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
          .filter((s) => typeof s.appRoute === "string" && s.appRoute.length > 0)
          .map((s) => ({ id: s.id, name: s.name, fullName: s.fullName, appRoute: s.appRoute })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [hasContent, scales.length]);

  const favScales = useMemo(
    () => favorites.map((id) => scales.find((s) => s.id === id)).filter(Boolean) as NavScale[],
    [favorites, scales],
  );
  const recentScales = useMemo(
    () => recents.map((id) => scales.find((s) => s.id === id)).filter(Boolean) as NavScale[],
    [recents, scales],
  );

  if (!hasContent || scales.length === 0) return null;

  return (
    <div className="space-y-4">
      {favScales.length > 0 && (
        <section aria-label="Escalas favoritas">
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Favoritos</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {favScales.map((s) => (
              <span key={s.id} className="inline-flex items-center rounded-lg border border-card-border bg-card overflow-hidden">
                <Link href={s.appRoute!}>
                  <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer">
                    {s.name}
                    <ArrowRight className="w-3 h-3 text-primary" aria-hidden="true" />
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  aria-label={`Remover ${s.name} dos favoritos`}
                  className="px-1.5 py-1.5 hover:bg-muted transition-colors border-l border-card-border"
                >
                  <Star className={`w-3 h-3 ${isFavorite(s.id) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                </button>
              </span>
            ))}
          </div>
        </section>
      )}

      {recentScales.length > 0 && (
        <section aria-label="Escalas usadas recentemente">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Usados recentemente</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentScales.map((s) => (
              <Link key={s.id} href={s.appRoute!}>
                <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-card-border bg-card text-xs text-foreground hover:bg-muted transition-colors cursor-pointer">
                  {s.name}
                  <ArrowRight className="w-3 h-3 text-primary" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
