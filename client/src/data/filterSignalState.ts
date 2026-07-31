import { getAllSignalsForQueixa } from "./signalsAndSymptoms";

/** Retorna os sinais que ainda pertencem a alguma queixa ativa. */
export function getValidFilterSignalIds(
  selectedQueixas: readonly string[],
): Set<string> {
  return new Set(
    selectedQueixas.flatMap((queixaId) =>
      getAllSignalsForQueixa(queixaId).map((signal) => signal.id),
    ),
  );
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
