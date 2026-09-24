import { MAX_SECONDS, OBS10_ROUTE } from "./protocol";

/** Wall clock includes sleep; monotonic time prevents a backward clock correction extending the session. */
export function sessionElapsed(startWall: number, startMonotonic: number, wall: number, monotonic: number, previous = 0): number {
  const values = [previous, (wall - startWall) / 1000, (monotonic - startMonotonic) / 1000].filter(Number.isFinite);
  return Math.min(MAX_SECONDS, Math.max(0, Math.floor(Math.max(...values))));
}
export function leavesObsRoute(href: string, currentHref: string): boolean {
  try {
    const target = new URL(href, currentHref);
    const current = new URL(currentHref);
    if (["#/login", "#/sessao-expirada", "#/consentimento-lgpd"].some((path) => target.hash.split("?")[0] === path)) return false;
    return target.origin === current.origin && target.hash.split("?")[0] !== `#${OBS10_ROUTE}`;
  } catch { return false; }
}
export function sessionFileSuffix(id: string): string {
  return id.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 45);
}
