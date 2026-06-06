/**
 * Vibration API wrapper para feedback tatil em dispositivos moveis.
 *
 * Padroes definidos:
 *  - tap     [10ms]              clique simples
 *  - select  [5ms]               seleção mais leve
 *  - success [12, 50, 12]        confirmação alegre
 *  - warning [30, 50, 30]        atenção
 *  - error   [80, 30, 80, 30, 80] erro distintivo
 *  - notify  [15, 60, 15]        notificação suave
 *
 * Persistencia: localStorage["neuroped:haptic"] = "on" | "off"
 *
 * Compatibilidade:
 *  - Suportado: Chrome Android, Edge Android, Samsung Internet, Firefox Android
 *  - Nao suportado: Safari iOS (silenciosamente ignorado)
 */

const STORAGE_KEY = "neuroped:haptic";

export function isHapticEnabled(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.vibrate !== "function") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setHapticEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch { /* storage indisponível (modo privado/cota) — silencioso */ }
}

function vibrate(pattern: number | number[]): void {
  if (!isHapticEnabled()) return;
  try {
    navigator.vibrate(pattern);
  } catch { /* Vibration API ausente/bloqueada — silencioso */ }
}

export const haptic = {
  tap: () => vibrate(10),
  select: () => vibrate(5),
  success: () => vibrate([12, 50, 12]),
  warning: () => vibrate([30, 50, 30]),
  error: () => vibrate([80, 30, 80, 30, 80]),
  notify: () => vibrate([15, 60, 15]),
  longPress: () => vibrate(40),
  swipe: () => vibrate(8),
};
