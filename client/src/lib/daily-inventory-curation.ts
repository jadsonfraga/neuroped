import type { DailyAuthorialInventory } from "@/data/dailyAuthorialCatalog";
import { dailyResponseContractIsUnambiguous } from "@/lib/daily-inventory-response-contract";

export type DailyInventoryCurationBlocker =
  | "status_not_reviewed"
  | "contingency"
  | "needs_upgrade"
  | "response_contract_ambiguous";

export interface DailyInventoryCurationDecision {
  operational: boolean;
  state: "operational" | "review_only";
  blockers: DailyInventoryCurationBlocker[];
}

export const DAILY_INVENTORY_CURATION_LABEL: Record<
  DailyInventoryCurationBlocker,
  string
> = {
  status_not_reviewed: "Revisão clínica explícita pendente",
  contingency: "Registro de contingência",
  needs_upgrade: "Upgrade autoral pendente",
  response_contract_ambiguous: "Contrato de resposta ambíguo",
};

export function curateDailyInventory(
  record: DailyAuthorialInventory,
): DailyInventoryCurationDecision {
  const blockers: DailyInventoryCurationBlocker[] = [];

  if (record.status !== "revisado_clinicamente") {
    blockers.push("status_not_reviewed");
  }
  if (record.contingency === true) blockers.push("contingency");
  if (record.needsUpgrade === true) blockers.push("needs_upgrade");
  if (!dailyResponseContractIsUnambiguous(record)) {
    blockers.push("response_contract_ambiguous");
  }

  return {
    operational: blockers.length === 0,
    state: blockers.length === 0 ? "operational" : "review_only",
    blockers,
  };
}

export function isDailyInventoryOperational(
  record: DailyAuthorialInventory,
): boolean {
  return curateDailyInventory(record).operational;
}
