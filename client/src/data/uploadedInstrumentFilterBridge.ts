import type { ScaleEntry } from "@/data/scaleFilter";
import {
  applyUploadedInstrumentOverrides,
  uploadedFilterInstruments,
} from "@/data/uploadedInstrumentCatalog";

const SAFE_REFERENCE_ROUTE = "/instrumentos-padronizados";

/**
 * Ponte para o filtro atual: enquanto a rota detalhada dedicada não estiver
 * registrada no AppRouter, todos os cards abrem a biblioteca padronizada já
 * existente, evitando links quebrados. Os metadados completos permanecem no card.
 */
export const uploadedFilterInstrumentsForApp: ScaleEntry[] =
  uploadedFilterInstruments.map((scale) => ({
    ...scale,
    appRoute: SAFE_REFERENCE_ROUTE,
  }));

export function applyUploadedInstrumentOverridesForApp(
  scale: ScaleEntry,
): ScaleEntry {
  const patched = applyUploadedInstrumentOverrides(scale);
  if (patched.id === "scq") {
    return { ...patched, appRoute: SAFE_REFERENCE_ROUTE };
  }
  return patched;
}
