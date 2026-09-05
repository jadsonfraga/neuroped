import { type ScaleEntry } from "./scaleFilter";
import { escalasImportadasDrive2026 as escalasImportadasDrive2026Base } from "./escalasImportadasDrive2026Base";
import { escalasAutoraisDrive2026Lote2 } from "./escalasAutoraisDrive2026Lote2";
import { escalasAutoraisDrive2026Lote3 } from "./escalasAutoraisDrive2026Lote3";
import { escalasAutoraisDrive2026Lote4 } from "./escalasAutoraisDrive2026Lote4";

/**
 * Catálogo consolidado das escalas autorais do Drive.
 *
 * O lote histórico permanece versionado separadamente. Nesta composição, as
 * escalas do lote 2 recebem status "complete" porque agora possuem uma versão
 * operacional interativa no app (interactiveScaleItemsDrive2026Autorais).
 *
 * "Complete" descreve apenas a implementação no aplicativo (itens + escore +
 * fluxo). Todas continuam autorais, experimentais e sem validação psicométrica
 * publicada.
 */
const escalasAutoraisDrive2026Lote2Operacionais: ScaleEntry[] =
  escalasAutoraisDrive2026Lote2.map((scale) => ({
    ...scale,
    implementationStatus: "complete",
    pendente_validacao_clinica: true,
    pendencia:
      scale.pendencia ??
      "Versão operacional harmonizada no app; revisar item a item contra o documento autoral antes de uso em pesquisa ou publicação.",
  }));

export const escalasImportadasDrive2026: ScaleEntry[] = [
  ...escalasImportadasDrive2026Base,
  ...escalasAutoraisDrive2026Lote2Operacionais,
  ...escalasAutoraisDrive2026Lote3,
  ...escalasAutoraisDrive2026Lote4,
];
