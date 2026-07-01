import { clearMasterPinUnlock, isMasterPinUnlocked, markMasterPinUnlocked, verifyMasterPin } from "@/lib/masterPin";

const LOCK_EVENT = "neuroped:local-lock-changed";

function emitLockState(unlocked: boolean): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LOCK_EVENT, { detail: { unlocked } }));
}

export async function verifyUnlockPassword(input: string): Promise<boolean> {
  return verifyMasterPin(input);
}

export function unlockApp(rememberDevice = false): void {
  markMasterPinUnlocked(rememberDevice);
  emitLockState(true);
}

export function lockApp(): void {
  try {
    clearMasterPinUnlock();
    sessionStorage.removeItem("neuroped:local-unlocked");
    localStorage.removeItem("neuroped:local-unlocked-persistent");
    sessionStorage.removeItem("neuroped:pin-ok");
  } catch {
    // Storage indisponivel nao deve quebrar o bloqueio visual local.
  }
  emitLockState(false);
}

export function hasClinicalUnlock(): boolean {
  return isMasterPinUnlocked();
}

export function isAppUnlocked(): boolean {
  return isMasterPinUnlocked();
}

export const localUnlockEventName = LOCK_EVENT;

export const localUnlockSecurityNote =
  "Areas clinicas com dados identificaveis exigem autenticacao nominal no backend. O modo local/offline nao deve ser usado para dados reais de pacientes.";
