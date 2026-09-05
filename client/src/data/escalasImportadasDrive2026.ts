import { type ScaleEntry } from "./scaleFilter";
import { escalasImportadasDrive2026 as escalasImportadasDrive2026Base } from "./escalasImportadasDrive2026Base";
import { escalasAutoraisDrive2026Lote2 } from "./escalasAutoraisDrive2026Lote2";
import { escalasAutoraisDrive2026Lote3 } from "./escalasAutoraisDrive2026Lote3";
import { escalasAutoraisDrive2026Lote4 } from "./escalasAutoraisDrive2026Lote4";
import { authorialMonitoringCatalog } from "./authorialMonitoring";

/**
 * Composição histórica do catálogo de importações e instrumentos autorais.
 * A proveniência de cada instrumento é individual: o Pacote 01 veio dos PDFs
 * fornecidos na conversa, não do Drive. "Complete" indica implementação,
 * não revisão clínica, validação psicométrica ou equivalência diagnóstica.
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
  ...authorialMonitoringCatalog,
];
