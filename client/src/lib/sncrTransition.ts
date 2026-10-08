/**
 * Transição SNCR 2.0 para Receita de Controle Especial (RCE) eletrônica.
 *
 * RDC Anvisa nº 1.000/2025 (red. RDC nº 1.028/2026), arts. 4º, 16 e 18, e
 * comunicado Anvisa de 21/09/2026: até 29/10/2026 coexistem RCE em papel, RCE
 * eletrônica sem integração ao SNCR e RCE eletrônica integrada. A partir de
 * 30/10/2026, RCE emitida eletronicamente deve vir de serviço integrado ao SNCR
 * (numeração concedida pela API oficial). O papel continua permitido.
 *
 * O NeuroPed ainda não emite numeração SNCR; portanto, depois do prazo, a
 * assinatura eletrônica da C1 fica bloqueada e a impressão para assinatura de
 * próprio punho continua disponível.
 */
export const SNCR_RCE_UNINTEGRATED_LAST_DAY_LABEL = "29/10/2026";
export const SNCR_RCE_INTEGRATION_REQUIRED_FROM = Date.parse("2026-10-30T00:00:00-03:00");

export function isUnintegratedElectronicRceAllowed(now: Date | number = Date.now()): boolean {
  const ts = typeof now === "number" ? now : now.getTime();
  return ts < SNCR_RCE_INTEGRATION_REQUIRED_FROM;
}

export function electronicRceBlockReason(now: Date | number = Date.now()): string | null {
  if (isUnintegratedElectronicRceAllowed(now)) return null;
  return (
    "Desde 30/10/2026 a Receita de Controle Especial eletrônica só pode ser emitida por " +
    "serviço integrado ao SNCR/Anvisa (RDC nº 1.000/2025). Esta versão do NeuroPed ainda " +
    "não obtém a numeração SNCR: imprima a receita em 2 vias e assine de próprio punho."
  );
}

export function electronicRceTransitionNotice(now: Date | number = Date.now()): string {
  return isUnintegratedElectronicRceAllowed(now)
    ? `Transição SNCR: a C1 eletrônica sem integração ao SNCR é aceita até ${SNCR_RCE_UNINTEGRATED_LAST_DAY_LABEL}. A partir de 30/10/2026, use a impressão com assinatura de próprio punho até a integração oficial.`
    : electronicRceBlockReason(now) ?? "";
}
