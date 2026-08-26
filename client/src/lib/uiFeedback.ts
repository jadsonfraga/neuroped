import { haptic } from "@/lib/haptic";
import {
  softBell,
  softError,
  softSelect,
  softSuccess,
} from "@/lib/softSounds";

type FeedbackKind =
  | "selection"
  | "confirmation"
  | "info"
  | "warning"
  | "error";

const lastFeedbackAt = new Map<FeedbackKind, number>();
const MIN_INTERVAL_MS: Record<FeedbackKind, number> = {
  selection: 180,
  confirmation: 450,
  info: 650,
  warning: 800,
  error: 800,
};

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function shouldEmit(kind: FeedbackKind): boolean {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    return false;
  }

  const now = nowMs();
  const last = lastFeedbackAt.get(kind) ?? -Infinity;
  if (now - last < MIN_INTERVAL_MS[kind]) return false;
  lastFeedbackAt.set(kind, now);
  return true;
}

/**
 * Camada semântica única de feedback da interface.
 *
 * Áudio e vibração têm preferências independentes; cada primitivo se autogateia.
 * A API deliberadamente não expõe hover, navegação ou clique genérico.
 */
export const uiFeedback = {
  selection(): void {
    if (!shouldEmit("selection")) return;
    softSelect();
    haptic.select();
  },

  success(): void {
    if (!shouldEmit("confirmation")) return;
    softSuccess();
    haptic.success();
  },

  info(): void {
    if (!shouldEmit("info")) return;
    softBell();
    haptic.notify();
  },

  warning(): void {
    if (!shouldEmit("warning")) return;
    softError();
    haptic.warning();
  },

  error(): void {
    if (!shouldEmit("error")) return;
    softError();
    haptic.error();
  },
};
