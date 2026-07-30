import type { InteractiveScaleDef } from "./interactiveScaleItems";
import { ipnTeaCoreItems } from "./interactiveScaleItemsIpnTeaCore";
import { ipnTeaAgeItemsPart1 } from "./interactiveScaleItemsIpnTeaAgePart1";
import { ipnTeaAgeItemsPart2 } from "./interactiveScaleItemsIpnTeaAgePart2";

export const ipnTea200Items: Record<string, InteractiveScaleDef> = {
  ...ipnTeaCoreItems,
  ...ipnTeaAgeItemsPart1,
  ...ipnTeaAgeItemsPart2,
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
  const delivered = (ipnTea200Items[id]?.domains ?? []).reduce(
    (total, domain) => total + domain.items.length,
    0,
  );
  if (delivered !== expected) {
    throw new Error(`[IPN-TEA 200] ${id}: ${delivered}/${expected} itens entregues`);
  }
}
