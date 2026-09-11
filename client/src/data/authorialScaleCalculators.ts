import type { ScaleConfig } from "@/components/GenericScale";
import type { ScaleEntry } from "@/data/scaleFilter";
import {
  makeInteractiveConfig,
  type InteractiveScaleDef,
} from "@/data/interactiveScaleItems";
import { authorial202609Calculators } from "@/data/interactiveScaleItemsAuthorial202609";
import { authorial202609ExtraCalculators } from "@/data/interactiveScaleItemsAuthorial202609Extras";

export const authorialScaleCalculators: Readonly<
  Record<string, ScaleConfig["onCalculate"]>
> = {
  ...authorial202609Calculators,
  ...authorial202609ExtraCalculators,
};

/**
 * Mantém o motor genérico intacto e aplica cálculo específico somente a
 * instrumentos autorais cujo N/O/N/A não pode ser tratado como zero.
 */
export function makeAuthorialAwareInteractiveConfig(
  scale: ScaleEntry,
  def: InteractiveScaleDef,
): ScaleConfig {
  const base = makeInteractiveConfig(scale, def);
  const calculate = authorialScaleCalculators[scale.id];
  return calculate ? { ...base, onCalculate: calculate } : base;
}
