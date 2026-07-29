/**
 * Compatibilidade com chamadas antigas do bloqueio local.
 *
 * Decisão permanente do autor: a interface do NeuroPed deve abrir sem senha e
 * sem PIN. Por isso, este módulo não cria, armazena, compara nem solicita
 * credenciais de acesso. Os dados persistidos continuam sujeitos às regras de
 * autorização da API, que são independentes desta camada de interface.
 *
 * As assinaturas públicas são preservadas para que componentes legados não
 * quebrem enquanto o código de bloqueio é removido gradualmente.
 */

const OPEN_ACCESS_SENTINEL = "open-access-no-pin";

export function hasConfiguredMasterPin(): boolean {
  return true;
}

export function getMasterPinLockSeconds(): number {
  return 0;
}

export async function createMasterPinVerifier(pin: string): Promise<string> {
  void pin;
  return OPEN_ACCESS_SENTINEL;
}

export async function storeDeviceMasterPin(pin: string): Promise<void> {
  void pin;
}

export async function verifyMasterPin(pin: string): Promise<boolean> {
  void pin;
  return true;
}

export function markMasterPinUnlocked(rememberDevice: boolean): void {
  void rememberDevice;
}

export function isMasterPinUnlocked(): boolean {
  return true;
}

export function clearMasterPinUnlock(): void {
  // Acesso aberto não mantém estado de desbloqueio no navegador.
}
