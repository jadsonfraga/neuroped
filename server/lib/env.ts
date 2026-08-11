/** Numeric environment parsing with deterministic, bounded fallback. */
export function readBoundedIntEnv(
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  if (!/^\d+$/.test(raw)) {
    console.warn(`[config] ${name} inválido; usando fallback ${fallback}.`);
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    console.warn(`[config] ${name} fora do intervalo ${min}-${max}; usando fallback ${fallback}.`);
    return fallback;
  }
  return value;
}
