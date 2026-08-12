export class RuntimeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeConfigurationError";
  }
}

function parseBoundedInteger(
  raw: string,
  name: string,
  min: number,
  max: number,
): number {
  const normalized = raw.trim();
  if (!/^\d+$/.test(normalized)) {
    throw new RuntimeConfigurationError(`${name} deve ser um inteiro entre ${min} e ${max}.`);
  }
  const value = Number(normalized);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RuntimeConfigurationError(`${name} deve estar entre ${min} e ${max}.`);
  }
  return value;
}

export function boundedIntegerEnv(
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  return parseBoundedInteger(raw, name, min, max);
}

export function requiredBoundedIntegerEnv(
  name: string,
  min: number,
  max: number,
): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") {
    throw new RuntimeConfigurationError(`${name} é obrigatório.`);
  }
  return parseBoundedInteger(raw, name, min, max);
}
