import { getAllSignalsForQueixa } from "./signalsAndSymptoms";
import { getPopularSymptoms } from "./popularSymptoms";

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
  return new Set(
    selectedQueixas.flatMap((queixaId) => [
      ...getAllSignalsForQueixa(queixaId).map((signal) => signal.id),
      ...getPopularSymptoms(queixaId).map((symptom) => symptom.id),
    ]),
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
