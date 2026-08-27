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
const HAPTIC_MIN_INTERVAL_MS = {
  selection: 180,
  success: 450,
  notify: 650,
  warning: 800,
  error: 800,
} as const;
const lastHapticAt = new Map<keyof typeof HAPTIC_MIN_INTERVAL_MS, number>();

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

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

function vibrate(
  pattern: number | number[],
  kind?: keyof typeof HAPTIC_MIN_INTERVAL_MS,
): void {
  if (!isHapticEnabled()) return;
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  if (
    typeof document !== "undefined" &&
    document.visibilityState === "hidden"
  ) {
    return;
  }
  if (kind) {
    const now = nowMs();
    const last = lastHapticAt.get(kind) ?? -Infinity;
    if (now - last < HAPTIC_MIN_INTERVAL_MS[kind]) return;
    lastHapticAt.set(kind, now);
  }
  try {
    navigator.vibrate(pattern);
  } catch {
    /* Vibration API ausente/bloqueada — silencioso */
  }
}

export const haptic = {
  tap: () => vibrate(10),
  select: () => vibrate(5, "selection"),
  success: () => vibrate([12, 50, 12], "success"),
  warning: () => vibrate([30, 50, 30], "warning"),
  error: () => vibrate([80, 30, 80, 30, 80], "error"),
  notify: () => vibrate([15, 60, 15], "notify"),
  longPress: () => vibrate(40),
  swipe: () => vibrate(8),
};
