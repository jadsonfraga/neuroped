/**
 * Vibration API wrapper para feedback tátil em dispositivos móveis.
 *
 * Política:
 * - opt-in: nasce desligado;
 * - controle independente do áudio;
 * - falha silenciosa em navegadores sem Vibration API;
 * - uso complementar a feedback visual/textual.
 *
 * Persistência: localStorage["neuroped:haptic"] = "on" | "off"
 */

const STORAGE_KEY = "neuroped:haptic";
export const HAPTIC_PREFERENCE_EVENT = "neuroped:haptic-preference-changed";

function emitPreferenceChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HAPTIC_PREFERENCE_EVENT));
}

export function isHapticEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function setHapticEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    /* storage indisponível (modo privado/cota) — silencioso */
  }
  emitPreferenceChange();
}

function vibrate(pattern: number | number[]): void {
  if (!isHapticEnabled()) return;
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    return;
  }
  try {
    navigator.vibrate(pattern);
  } catch {
    /* Vibration API ausente/bloqueada — silencioso */
  }
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
