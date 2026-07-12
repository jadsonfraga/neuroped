/**
 * signalFlowchartResolver.ts — Liga os fluxogramas por sinal (signalFlowcharts)
 * ao catálogo (allScales), devolvendo as escalas já resolvidas por tier.
 *
 * Garante "tiers sempre cheios" (a curadoria define) e "toda escala abre
 * internamente": resolveScaleRoute sempre devolve uma rota interna (ferramenta
 * quando aplicável, ficha /generic-scale/:id quando licenciada) — nunca link
 * externo ou beco sem saída.
 */

import { allScales, type ScaleEntry } from "./scaleFilter";
import { mergeFilterableCatalog } from "./filterableCatalog";
import {
  getSignalFlowchart,
  resolveFlowchartTierIds,
  signalFlowcharts,
  type FlowchartTierSet,
} from "./signalFlowcharts";

// Resolve contra o catálogo filtrável CANÔNICO (allScales + suplementares:
// portais de psicoeducação e testes diretos), não só allScales. Vários ids de
// fluxograma (ex.: linguagem-fonologia, orientacao-parental) existem apenas nos
// suplementares; com o mapa estreito, mapIds os descartaria em silêncio e um
// tier curado voltaria vazio se este resolvedor fosse ligado à UI.
const byId = new Map<string, ScaleEntry>(mergeFilterableCatalog(allScales).map((s) => [s.id, s]));

export interface ResolvedSignalTiers {
  ouro: ScaleEntry[];
  prata: ScaleEntry[];
  bronze: ScaleEntry[];
}

function mapIds(ids: string[]): ScaleEntry[] {
  const out: ScaleEntry[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    const s = byId.get(id);
    if (s) {
      out.push(s);
      seen.add(id);
    }
  }
  return out;
}

/** Resolve os tiers de um sinal para uma idade (meses) em escalas reais. */
export function getSignalTiers(
  signalId: string,
  ageMonths: number | null,
  monitoring = false,
): ResolvedSignalTiers | null {
  const flow = getSignalFlowchart(signalId);
  if (!flow) return null;
  const ids: FlowchartTierSet = resolveFlowchartTierIds(flow, ageMonths, monitoring);
  return {
    ouro: mapIds(ids.ouro),
    prata: mapIds(ids.prata),
    bronze: mapIds(ids.bronze),
  };
}

/**
 * Rota interna garantida para qualquer escala. Toda escala "abre internamente":
 *  - rota dedicada quando existir (ferramenta real, ex.: /mchat, /cars);
 *  - senão a ficha canônica /generic-scale/:id (render interno para qualquer id
 *    de allScales). Nunca retorna link externo.
 */
export function resolveScaleRoute(scale: ScaleEntry): string {
  if (scale.appRoute && scale.appRoute.length > 0) return scale.appRoute;
  return `/generic-scale/${scale.id}`;
}

/** Lista de sinais que já têm fluxograma curado. */
export function signalsWithFlowchart(): string[] {
  return Object.keys(signalFlowcharts);
}
