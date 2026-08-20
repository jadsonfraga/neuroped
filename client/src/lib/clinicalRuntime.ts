import { authFetch } from "@/lib/authClient";

const API_BASE = (import.meta.env?.VITE_API_URL ?? "").replace(/\/$/, "");

export interface ClinicalRuntimeFeatures {
  realPatientsEnabled?: boolean;
  clinicalLiveFlag?: boolean;
  legacyClinicalEndpointsRetired?: boolean;
  mode?: string;
}

export interface ClinicalRuntimeInfo {
  app?: {
    version?: string;
    commit?: string;
    buildDate?: string;
  };
  features: ClinicalRuntimeFeatures;
}

export async function fetchClinicalRuntime(): Promise<ClinicalRuntimeInfo> {
  const response = await authFetch(`${API_BASE}/api/version`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Não foi possível descobrir o runtime clínico (${response.status}).`);
  }
  const payload = await response.json() as Partial<ClinicalRuntimeInfo>;
  return {
    app: payload.app,
    features: payload.features ?? {},
  };
}

export function getStoredActiveClinicId(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem("neuroped:active-clinic") ?? "";
  } catch {
    return "";
  }
}

export function storeActiveClinicId(clinicId: string): void {
  if (typeof window === "undefined" || !clinicId) return;
  try {
    sessionStorage.setItem("neuroped:active-clinic", clinicId);
  } catch {
    // Storage indisponível não deve bloquear a descoberta do runtime.
  }
}

export function isClinicalLive(runtime: ClinicalRuntimeInfo | undefined): boolean {
  return runtime?.features.realPatientsEnabled === true;
}

export function isLegacyClinicalRetired(runtime: ClinicalRuntimeInfo | undefined): boolean {
  return runtime?.features.legacyClinicalEndpointsRetired === true;
}

export function isClinicalReadinessBlocked(runtime: ClinicalRuntimeInfo | undefined): boolean {
  return isLegacyClinicalRetired(runtime) && !isClinicalLive(runtime);
}
