import { getAllSignalsForQueixa } from "./signalsAndSymptoms";
import { getPopularSymptoms } from "./popularSymptoms";

export interface FilterSignalRecord {
  id: string;
  label: string;
  description?: string;
  queixaId: string;
  source: "detailed" | "popular" | "both";
}

/**
 * Fonte única dos sinais que a interface permite selecionar. Sintomas
 * populares e sinais detalhados compartilham o mesmo registro para que o
 * rótulo exibido, o texto do relatório e o matcher clínico não divirjam.
 */
export function getFilterSignalsForQueixas(
  selectedQueixas: readonly string[],
): FilterSignalRecord[] {
  const records = new Map<string, FilterSignalRecord>();
  for (const queixaId of selectedQueixas) {
    for (const signal of getAllSignalsForQueixa(queixaId)) {
      if (records.has(signal.id)) continue;
      records.set(signal.id, {
        id: signal.id,
        label: signal.label,
        description: signal.description,
        queixaId,
        source: "detailed",
      });
    }
    for (const symptom of getPopularSymptoms(queixaId)) {
      const detailed = records.get(symptom.id);
      records.set(symptom.id, {
        id: symptom.id,
        // O chip popular é o texto que a família efetivamente marcou.
        label: symptom.label,
        description: detailed?.description,
        queixaId,
        source: detailed ? "both" : "popular",
      });
    }
  }
  return [...records.values()];
}

export function resolveFilterSignals(
  selectedQueixas: readonly string[],
  selectedSignalIds: readonly string[],
): FilterSignalRecord[] {
  if (selectedQueixas.length === 0 || selectedSignalIds.length === 0) return [];
  const records = new Map(
    getFilterSignalsForQueixas(selectedQueixas).map((record) => [record.id, record]),
  );
  const seen = new Set<string>();
  return selectedSignalIds.flatMap((id) => {
    if (seen.has(id)) return [];
    seen.add(id);
    const record = records.get(id);
    return record ? [record] : [];
  });
}

export function getFilterSignalLabels(
  selectedQueixas: readonly string[],
  selectedSignalIds: readonly string[],
): string[] {
  return resolveFilterSignals(selectedQueixas, selectedSignalIds).map(
    (record) => record.label,
  );
}

/**
 * Retorna os sinais que ainda pertencem a alguma queixa ativa: os sinais
 * detalhados por idade E os sintomas populares (linguagem de pais) do
 * seletor. Antes, só os detalhados contavam — 186 dos 190 sintomas populares
 * eram classificados como órfãos e removidos logo depois de marcados, e o
 * motor (que resolve popularSymptomById) nunca os recebia.
 */
export function getValidFilterSignalIds(
  selectedQueixas: readonly string[],
): Set<string> {
  return new Set(getFilterSignalsForQueixas(selectedQueixas).map((signal) => signal.id));
}

/**
 * Detecta sinais órfãos: permaneciam persistidos depois de a queixa de origem
 * ser removida e podiam influenciar o ranking sem aparecer na interface.
 */
export function getOrphanFilterSignalIds(
  selectedQueixas: readonly string[],
  selectedSignalIds: readonly string[],
): string[] {
  const validSignalIds = getValidFilterSignalIds(selectedQueixas);
  return selectedSignalIds.filter((signalId) => !validSignalIds.has(signalId));
}
