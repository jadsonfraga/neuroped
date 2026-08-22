import { INTERACTIVE_SCALE_IDS } from "./interactiveScaleIds.generated";

// Rotas dedicadas confirmadas no App.tsx. O mapa é deliberadamente pequeno:
// referências externas/world-* não ganham um link falso para uma ficha inexistente.
const DEDICATED_SCALE_ROUTES: Record<string, string> = {
  mchat: "/mchat",
  snap: "/snap",
  sdq: "/sdq",
  scared: "/scared",
  phqa: "/phqa",
  cssrs: "/cssrs",
  crafft: "/crafft",
  vanderbilt: "/vanderbilt",
  gmfcs: "/gmfcs",
  ygtss: "/ygtss",
};

export function resolveFluxoScaleRoute(id: string | undefined): string | null {
  if (!id) return null;
  if (INTERACTIVE_SCALE_IDS.has(id)) return `/generic-scale/${id}`;
  return DEDICATED_SCALE_ROUTES[id] ?? null;
}
