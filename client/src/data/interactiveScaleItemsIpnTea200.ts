import type { InteractiveScaleDef } from "./interactiveScaleItems";
import { ipnTeaCoreItems } from "./interactiveScaleItemsIpnTeaCore";
import { ipnTeaAgeItemsPart1 } from "./interactiveScaleItemsIpnTeaAgePart1";
import { ipnTeaAgeItemsPart2 } from "./interactiveScaleItemsIpnTeaAgePart2";
import { ipnTdahFe200Items } from "./interactiveScaleItemsIpnTdahFe200";
import { ipnPcFun200Items } from "./interactiveScaleItemsIpnPcFun200";
import { ipnLfc200Items } from "./interactiveScaleItemsIpnLfc200";
import { ipnEpiSeg200Items } from "./interactiveScaleItemsIpnEpiSeg200";
import { mutismoSeletivo200Items } from "./interactiveScaleItemsMutismoSeletivo200";

const ipnTeaOnlyItems: Record<string, InteractiveScaleDef> = {
  ...ipnTeaCoreItems,
  ...ipnTeaAgeItemsPart1,
  ...ipnTeaAgeItemsPart2,
};

/**
 * Exportação histórica consumida pelo agregador NEXUS.
 * Mantém o nome por compatibilidade e reúne os PDFs IPN autorais
 * operacionalizados no app; o registro genérico valida cada volume e contagem.
 */
export const ipnTea200Items: Record<string, InteractiveScaleDef> = {
  ...ipnTeaOnlyItems,
  ...ipnTdahFe200Items,
  ...ipnPcFun200Items,
  ...ipnLfc200Items,
  ...ipnEpiSeg200Items,
  ...mutismoSeletivo200Items,
};

const EXPECTED_COUNTS: Record<string, number> = {
  "ipn-tea-familia-100": 100,
  "ipn-tea-escola-100": 100,
  "ipn-tea-adolescente-60": 60,
  "ipn-tea-observacao-60": 60,
  "ipn-tea-18-30m": 10,
  "ipn-tea-31-47m": 10,
  "ipn-tea-4-5a": 10,
  "ipn-tea-6-8a": 10,
  "ipn-tea-9-12a": 10,
  "ipn-tea-13-17a": 10,
};

for (const [id, expected] of Object.entries(EXPECTED_COUNTS)) {
  const delivered = (ipnTeaOnlyItems[id]?.domains ?? []).reduce(
    (total, domain) => total + domain.items.length,
    0,
  );
  if (delivered !== expected) {
    throw new Error(`[IPN-TEA 200] ${id}: ${delivered}/${expected} itens entregues`);
  }
}
