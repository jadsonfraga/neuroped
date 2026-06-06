import confetti from "canvas-confetti";

/**
 * Celebração visual leve para resultados positivos.
 * Respeita prefers-reduced-motion (não dispara quando o usuário pediu menos movimento).
 */
function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const COLORS = ["#6d6af5", "#8b6cc1", "#e7c98b", "#4a8ec2", "#6ee7b7"];

export function celebrate(): void {
  if (reducedMotion()) return;
  const base: confetti.Options = {
    spread: 70,
    startVelocity: 38,
    ticks: 180,
    colors: COLORS,
    disableForReducedMotion: true,
  };
  confetti({ ...base, particleCount: 60, origin: { x: 0.25, y: 0.7 } });
  confetti({ ...base, particleCount: 60, origin: { x: 0.75, y: 0.7 } });
}

export function celebrateBurst(): void {
  if (reducedMotion()) return;
  confetti({
    particleCount: 110,
    spread: 100,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors: COLORS,
    disableForReducedMotion: true,
  });
}
