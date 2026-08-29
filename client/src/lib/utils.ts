import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Lê um parâmetro de query da URL funcionando com o hash router (wouter
 * useHashLocation). Com hash routing, `/#/prontuario?patientId=x` guarda a
 * query dentro de location.hash — location.search fica vazio. Faz fallback
 * para location.search para cobrir carga direta sem hash.
 */
export function getRouteQueryParam(name: string): string {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash.replace(/^#/, "");
  const hashQuery = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
  const fromHash = new URLSearchParams(hashQuery).get(name)?.trim();
  if (fromHash) return fromHash;
  return new URLSearchParams(window.location.search).get(name)?.trim() ?? "";
}
