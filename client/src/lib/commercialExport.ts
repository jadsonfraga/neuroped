import type { CommercialFeatureCode } from "@shared/commercial";
import type { CommercialScope } from "./commercialScope";

export type CommercialExportChannel = "print" | "email" | "copy" | "download";

/**
 * O ledger registra uma iniciação autorizada, não prova de entrega externa.
 * A ação só começa depois do aceite persistido e com o mesmo contexto ativo.
 * Nenhum conteúdo preenchido entra no contrato deste executor.
 */
export async function executeCommercialExport<T>(input: {
  scope: CommercialScope;
  feature: CommercialFeatureCode;
  channel: CommercialExportChannel;
  isCurrent: () => boolean;
  record: (clinicId: string, feature: CommercialFeatureCode, channel: CommercialExportChannel) => Promise<{ recorded: boolean }>;
  action: () => T | Promise<T>;
}): Promise<T> {
  if (!input.isCurrent()) throw new Error("O contexto mudou. Confirme a unidade antes de exportar.");
  if (input.scope.kind === "individual") return input.action();
  if (input.scope.kind !== "institutional") throw new Error("A unidade institucional ainda não foi confirmada.");
  const receipt = await input.record(input.scope.clinicId, input.feature, input.channel);
  if (receipt?.recorded !== true) throw new Error("A exportação não recebeu confirmação do servidor.");
  if (!input.isCurrent()) throw new Error("A unidade ou a sessão mudou durante a autorização. A ação foi cancelada.");
  return input.action();
}
