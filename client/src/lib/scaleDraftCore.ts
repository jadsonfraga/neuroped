/**
 * Núcleo puro dos rascunhos de escalas.
 *
 * A cifra e o TTL pertencem a secureStorage. Este módulo cuida do contrato
 * versionado e, principalmente, impede que dados antigos/corrompidos sejam
 * recolocados no formulário sem passar pelo sanitizador específico da tela.
 */

export interface ScaleDraftEnvelope {
  schemaVersion: number;
  payload: unknown;
  updatedAt: number;
}

interface LegacyAnswersEnvelope {
  schemaVersion?: unknown;
  answers?: unknown;
  updatedAt?: unknown;
}

export interface ScaleDraftStore {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: ScaleDraftEnvelope): Promise<boolean | void>;
  clear(key: string): Promise<void>;
}

export interface RestoreScaleDraftOptions<T> {
  store: ScaleDraftStore;
  storageKey: string;
  schemaVersion: number;
  sanitize: (value: unknown) => T;
  hasContent: (value: T) => boolean;
  createEmpty: () => T;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Extrai somente envelopes da versão esperada; aceita o formato v1 antigo. */
export function readScaleDraftPayload(
  value: unknown,
  schemaVersion: number,
): unknown | null {
  if (!isObject(value) || value.schemaVersion !== schemaVersion) return null;
  if (Object.prototype.hasOwnProperty.call(value, "payload")) {
    return value.payload;
  }

  // Compatibilidade com useSecureScaleDraft v1 ({ answers }). O conteúdo
  // continua passando pelo sanitizador atual antes de ser restaurado.
  const legacy = value as LegacyAnswersEnvelope;
  return Object.prototype.hasOwnProperty.call(legacy, "answers")
    ? legacy.answers
    : null;
}

export function createScaleDraftEnvelope<T>(
  schemaVersion: number,
  payload: T,
  updatedAt = Date.now(),
): ScaleDraftEnvelope {
  return { schemaVersion, payload, updatedAt };
}

/** Restaura, normaliza e informa se há conteúdo clínico aproveitável. */
export async function restoreScaleDraft<T>({
  store,
  storageKey,
  schemaVersion,
  sanitize,
  hasContent,
  createEmpty,
}: RestoreScaleDraftOptions<T>): Promise<{ value: T; restored: boolean }> {
  const stored = await store.get(storageKey);
  const payload = readScaleDraftPayload(stored, schemaVersion);
  if (payload === null) return { value: createEmpty(), restored: false };

  const normalized = sanitize(payload);
  if (!hasContent(normalized)) {
    // Não mantenha indefinidamente um envelope inválido/vazio.
    await store.clear(storageKey);
    return { value: createEmpty(), restored: false };
  }
  return { value: normalized, restored: true };
}

export async function persistScaleDraft<T>(options: {
  store: ScaleDraftStore;
  storageKey: string;
  schemaVersion: number;
  value: T;
  sanitize: (value: unknown) => T;
  hasContent: (value: T) => boolean;
}): Promise<T> {
  const normalized = options.sanitize(options.value);
  if (!options.hasContent(normalized)) {
    await options.store.clear(options.storageKey);
    return normalized;
  }
  const persisted = await options.store.set(
    options.storageKey,
    createScaleDraftEnvelope(options.schemaVersion, normalized),
  );
  if (persisted === false) throw new Error("secure draft storage unavailable");
  return normalized;
}

export async function clearScaleDraft(
  store: ScaleDraftStore,
  storageKey: string,
): Promise<void> {
  await store.clear(storageKey);
}

export function hasRecordEntries(value: object): boolean {
  return Object.keys(value).length > 0;
}

/** Mantém somente chaves previstas e booleanos reais (nunca coerção). */
export function sanitizeBooleanRecord(
  value: unknown,
  validKeys: ReadonlySet<number | string>,
): Record<number, boolean> {
  if (!isObject(value)) return {};
  const normalized: Record<number, boolean> = {};
  for (const [rawKey, answer] of Object.entries(value)) {
    const numericKey = Number(rawKey);
    if (
      Number.isInteger(numericKey) &&
      (validKeys.has(numericKey) || validKeys.has(rawKey)) &&
      typeof answer === "boolean"
    ) {
      normalized[numericKey] = answer;
    }
  }
  return normalized;
}

/** Mantém somente inteiros pertencentes às alternativas permitidas por item. */
export function sanitizeNumberRecord(
  value: unknown,
  validValues: Readonly<Record<string, ReadonlySet<number>>>,
): Record<number, number> {
  if (!isObject(value)) return {};
  const normalized: Record<number, number> = {};
  for (const [rawKey, answer] of Object.entries(value)) {
    const allowed = validValues[rawKey];
    const numericKey = Number(rawKey);
    if (
      allowed &&
      Number.isInteger(numericKey) &&
      typeof answer === "number" &&
      Number.isInteger(answer) &&
      allowed.has(answer)
    ) {
      normalized[numericKey] = answer;
    }
  }
  return normalized;
}

export function indexedAllowedValues(
  length: number,
  optionCount: number,
): Record<string, ReadonlySet<number>> {
  return Object.fromEntries(
    Array.from({ length }, (_, index) => [
      String(index),
      new Set(Array.from({ length: optionCount }, (__, value) => value)),
    ]),
  );
}

export function indexedKeys(length: number, start = 0): ReadonlySet<number> {
  return new Set(Array.from({ length }, (_, index) => index + start));
}

/** Serialização estável para o debounce não regravar por ordem de chaves. */
export function stableDraftSerialization(value: unknown): string {
  const normalize = (entry: unknown): unknown => {
    if (Array.isArray(entry)) return entry.map(normalize);
    if (isObject(entry)) {
      return Object.fromEntries(
        Object.keys(entry)
          .sort((a, b) => a.localeCompare(b))
          .map((key) => [key, normalize(entry[key])]),
      );
    }
    return entry;
  };
  return JSON.stringify(normalize(value));
}
