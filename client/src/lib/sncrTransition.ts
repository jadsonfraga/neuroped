/**
 * Transição SNCR 2.0 para Receita de Controle Especial (RCE) eletrônica.
 *
 * RDC Anvisa nº 1.000/2025 (red. RDC nº 1.028/2026), arts. 4º, 16 e 18, e
 * RDC Anvisa nº 1.046/2026 alterou o art. 18 da RDC nº 1.000/2025: RCE/RET
 * podem ser emitidas eletronicamente sem número SNCR até 03/03/2027. A partir
 * de 04/03/2027, o número individual do SNCR será obrigatório na via eletrônica.
 * O fluxo físico permanece permitido e a numeração física não se confunde com a
 * eletrônica. A extensão não dispensa assinatura qualificada nem os demais
 * requisitos aplicáveis ao documento eletrônico.
 *
 * O NeuroPed ainda não comprova integração operacional à API SNCR para RCE.
 * Assim, após o prazo de transição, a emissão eletrônica sem integração será
 * bloqueada; a impressão física continua disponível.
 */
export const SNCR_RCE_UNINTEGRATED_LAST_DAY_LABEL = "03/03/2027";
export const SNCR_RCE_INTEGRATION_REQUIRED_FROM = Date.parse("2027-03-04T00:00:00-03:00");

export function isUnintegratedElectronicRceAllowed(now: Date | number = Date.now()): boolean {
  const ts = typeof now === "number" ? now : now.getTime();
  return ts < SNCR_RCE_INTEGRATION_REQUIRED_FROM;
}

export function electronicRceBlockReason(now: Date | number = Date.now()): string | null {
  if (isUnintegratedElectronicRceAllowed(now)) return null;
  return (
    "A partir de 04/03/2027 a Receita de Controle Especial eletrônica só pode ser emitida por " +
    "serviço integrado ao SNCR/Anvisa (RDC nº 1.000/2025). Esta versão do NeuroPed ainda " +
    "não obtém a numeração SNCR: imprima a receita em 2 vias e assine de próprio punho."
  );
}

export function electronicRceTransitionNotice(now: Date | number = Date.now()): string {
  return isUnintegratedElectronicRceAllowed(now)
    ? `Transição SNCR: a C1 eletrônica sem integração ao SNCR é aceita até ${SNCR_RCE_UNINTEGRATED_LAST_DAY_LABEL}. A partir de 04/03/2027, use a impressão com assinatura de próprio punho até a integração oficial.`
    : electronicRceBlockReason(now) ?? "";
}
