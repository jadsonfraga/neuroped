export type AuthMode = "remote" | "local" | "auto";

export interface AuthCapability {
  required: boolean;
  configured: boolean;
  reachable: boolean;
}

interface CapabilitySnapshot {
  required?: unknown;
  configured?: unknown;
}

interface HealthPayload {
  authentication?: {
    required?: unknown;
    configured?: unknown;
  };
}

export function resolveAuthMode(
  rawMode: unknown,
  isProduction: boolean,
): AuthMode {
  const mode = typeof rawMode === "string" ? rawMode.trim().toLowerCase() : "";
  if (mode === "remote" || mode === "local" || mode === "auto") {
    return mode;
  }

  // Builds de produção falham fechados por padrão. Mirrors estáticos precisam
  // declarar VITE_AUTH_MODE=local explicitamente no pipeline de publicação.
  return isProduction ? "remote" : "auto";
}

export function localAuthCapability(): AuthCapability {
  return { required: false, configured: false, reachable: false };
}

export function fallbackAuthCapability(
  mode: AuthMode,
  cached: unknown,
): AuthCapability {
  if (mode === "local") return localAuthCapability();

  const snapshot =
    cached && typeof cached === "object"
      ? (cached as CapabilitySnapshot)
      : null;
  const cachedRequired = snapshot?.required === true;
  const cachedConfigured = snapshot?.configured === true;

  if (mode === "remote") {
    return {
      required: true,
      configured: cachedConfigured,
      reachable: false,
    };
  }

  if (cachedRequired) {
    return {
      required: true,
      configured: cachedConfigured,
      reachable: false,
    };
  }

  return localAuthCapability();
}

export function authCapabilityFromHealth(
  mode: AuthMode,
  payload: unknown,
): AuthCapability {
  if (mode === "local") return localAuthCapability();

  const health =
    payload && typeof payload === "object" ? (payload as HealthPayload) : null;
  const reportedRequired = health?.authentication?.required === true;
  const reportedConfigured = health?.authentication?.configured === true;

  if (mode === "remote") {
    return {
      required: true,
      configured: reportedRequired && reportedConfigured,
      reachable: true,
    };
  }

  return {
    required: reportedRequired,
    configured: reportedRequired && reportedConfigured,
    reachable: true,
  };
}
