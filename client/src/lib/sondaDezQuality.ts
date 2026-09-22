import type { BandDef, FieldDef, FieldValue } from "../data/sondaDezProtocol";

/** Missing, invalid, zero and unavailable are different clinical states. */
export function validSondaAge(years: string, months: string): number | undefined {
  if (!/^\d+$/.test(years) || !/^\d+$/.test(months)) return undefined;
  const y = Number(years), m = Number(months);
  const total = y * 12 + m;
  return Number.isSafeInteger(y) && m <= 11 && total >= 12 && total <= 215
    ? total : undefined;
}
export function isSondaResponseCode(field: FieldDef, value: FieldValue | undefined): boolean {
  return field.kind === "choice" && typeof value === "string" &&
    ["E", "I", "P", "0", "NA"].includes(value) &&
    Boolean(field.options?.some((option) => ["E", "I", "P"].includes(option))) &&
    Boolean(field.options?.includes(value));
}
export function validSondaField(field: FieldDef, value: FieldValue | undefined): boolean {
  if (value === undefined || String(value).trim() === "") return false;
  if (value === "NA") return true; // The record, not a count, supplies the reason.
  if (field.kind === "count") {
    return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 &&
      (field.max === undefined || value <= field.max);
  }
  return field.kind !== "choice" || Boolean(field.options?.includes(String(value)));
}
export type LegacyMissionRecord = { values: Record<string, FieldValue>; notes: string };
export function legacyCoverage(band: BandDef, records: Record<string, LegacyMissionRecord>) {
  return band.missions.map((mission) => {
    const record = records[mission.id];
    const missing = mission.fields.filter((f) => !validSondaField(f, record?.values[f.id]));
    const needsContext = Object.values(record?.values ?? {}).some((v) => v === "NA" || v === "P") && !record?.notes.trim();
    return { id: mission.id, missing: missing.length, needsContext, complete: missing.length === 0 && !needsContext };
  });
}
/** Never block mandatory authentication/consent redirects. Protect all other departures. */
export function leavesSondaRoute(href: string, currentHref: string): boolean {
  try {
    const target = new URL(href, currentHref), current = new URL(currentHref);
    const route = (url: URL) => (url.hash.startsWith("#/") ? url.hash.slice(1) : url.pathname).split("?")[0].replace(/\/$/, "");
    if (target.origin === current.origin && ["/login", "/sessao-expirada", "/consentimento-lgpd"].includes(route(target))) return false;
    return target.origin !== current.origin || route(target) !== route(current);
  } catch { return false; }
}

/** Milliseconds remain exact across timer ticks, pauses, and mission changes. */
export type SondaActiveTime = { totalMs: number; missions: Record<string, number> };
export function advanceSondaActiveTime(clock: SondaActiveTime, missionId: string, deltaMs: number): void {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
  const elapsed = Math.min(deltaMs, Math.max(0, 600000 - clock.totalMs));
  clock.totalMs += elapsed;
  clock.missions[missionId] = (clock.missions[missionId] ?? 0) + elapsed;
}
