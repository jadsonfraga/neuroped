import type {
  DailyAuthorialInventory,
  DailyInventoryItem,
} from "@/data/dailyAuthorialCatalog";

export type DailyInventoryResponseMode = DailyInventoryItem["responseMode"];
export type DailyInventoryResponseSemantic =
  | "frequency"
  | "present"
  | "absent"
  | "affirmative"
  | "negative"
  | "unknown";

export interface DailyInventoryResolvedResponseOption {
  code: string;
  label: string;
  storageValue: string;
  scoreValue: number | null;
  semantic: DailyInventoryResponseSemantic;
}

const PRESENT_ABSENT_OPTIONS: DailyInventoryResolvedResponseOption[] = [
  {
    code: "P",
    label: "Presente",
    storageValue: "present",
    scoreValue: null,
    semantic: "present",
  },
  {
    code: "A",
    label: "Ausente — houve oportunidade de observar",
    storageValue: "absent",
    scoreValue: null,
    semantic: "absent",
  },
  {
    code: "D",
    label: "Desconhecido — informação insuficiente",
    storageValue: "unknown",
    scoreValue: null,
    semantic: "unknown",
  },
];

const YES_NO_OPTIONS: DailyInventoryResolvedResponseOption[] = [
  {
    code: "S",
    label: "Sim",
    storageValue: "yes",
    scoreValue: null,
    semantic: "affirmative",
  },
  {
    code: "N",
    label: "Não",
    storageValue: "no",
    scoreValue: null,
    semantic: "negative",
  },
  {
    code: "D",
    label: "Desconhecido — informação insuficiente",
    storageValue: "unknown",
    scoreValue: null,
    semantic: "unknown",
  },
];

export const DAILY_RESPONSE_MODE_LABEL: Record<
  DailyInventoryResponseMode,
  string
> = {
  frequencia_0_3: "Frequência / impacto",
  sim_nao: "Sim / não",
  presente_ausente: "Presença / ausência observada",
  descritivo: "Resposta descritiva",
};

export function dailyResponseModes(
  record: Pick<DailyAuthorialInventory, "items">,
): DailyInventoryResponseMode[] {
  return [...new Set(record.items.map((item) => item.responseMode))];
}

export function dailyResponseOptionsForMode(
  record: Pick<DailyAuthorialInventory, "responseOptions">,
  mode: DailyInventoryResponseMode,
): DailyInventoryResolvedResponseOption[] {
  if (mode === "presente_ausente") return PRESENT_ABSENT_OPTIONS;
  if (mode === "sim_nao") return YES_NO_OPTIONS;
  if (mode === "descritivo") return [];

  return record.responseOptions.map((option) => ({
    code: option.code,
    label: option.label,
    storageValue: option.code,
    scoreValue: option.value,
    semantic: option.value === null ? "unknown" : "frequency",
  }));
}

export function dailyResponseContractIsUnambiguous(
  record: Pick<DailyAuthorialInventory, "items" | "responseOptions">,
): boolean {
  return dailyResponseModes(record).every((mode) => {
    if (mode === "descritivo") return true;
    const options = dailyResponseOptionsForMode(record, mode);
    const storageValues = new Set(options.map((option) => option.storageValue));
    if (options.length === 0 || storageValues.size !== options.length)
      return false;

    if (mode === "presente_ausente" || mode === "sim_nao") {
      const unknown = options.filter((option) => option.semantic === "unknown");
      return (
        unknown.length === 1 &&
        unknown[0].scoreValue === null &&
        options.every((option) => option.scoreValue === null)
      );
    }

    return options.some(
      (option) => option.semantic === "unknown" && option.scoreValue === null,
    );
  });
}
