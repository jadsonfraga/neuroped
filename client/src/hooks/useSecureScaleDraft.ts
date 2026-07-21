import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { secureClear, secureGet, secureSet } from "@/lib/secureStorage";
import {
  clearScaleDraft,
  hasRecordEntries,
  persistScaleDraft,
  restoreScaleDraft,
  stableDraftSerialization,
  type ScaleDraftStore,
} from "@/lib/scaleDraftCore";

const LEGACY_MAX_AGE_MS = 8 * 60 * 60 * 1000;
const SAVE_DEBOUNCE_MS = 400;

export type ScaleDraftStatus =
  | "loading"
  | "idle"
  | "saving"
  | "saved"
  | "error";

const secureDraftStore: ScaleDraftStore = {
  get: (key) => secureGet(key),
  set: (key, value) => secureSet(key, value),
  clear: (key) => secureClear(key),
};

interface SecureTypedScaleDraftOptions<T> {
  draftId: string;
  schemaVersion: number;
  createEmpty: () => T;
  /** Sanitização explícita da tela: deve descartar chaves/tipos fora do schema. */
  sanitize: (value: unknown) => T;
  hasContent: (value: T) => boolean;
  /** Chave antiga em texto puro; é migrada e removida uma única vez. */
  legacyKey?: string;
  legacyPayload?: (value: unknown) => unknown;
  debounceMs?: number;
}

export interface SecureTypedScaleDraftState<T> {
  value: T;
  setValue: Dispatch<SetStateAction<T>>;
  ready: boolean;
  restored: boolean;
  status: ScaleDraftStatus;
  clearDraft: () => Promise<void>;
  /** Apaga só o armazenamento (mantém o valor em memória). Ver hook. */
  clearPersistedDraft: () => Promise<void>;
}

function removeLegacyDraft(key: string | undefined): void {
  if (!key) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // A migração continua em memória quando o storage está bloqueado.
  }
}

function readLegacyDraft(key: string | undefined): unknown | null {
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { updatedAt?: unknown };
    if (typeof parsed.updatedAt === "string") {
      const age = Date.now() - new Date(parsed.updatedAt).getTime();
      if (!Number.isFinite(age) || age > LEGACY_MAX_AGE_MS) return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Rascunho cifrado genérico para formulários clínicos tipados. A tela de
 * resultado não faz parte do payload e, portanto, nunca é restaurada.
 */
export function useSecureTypedScaleDraft<T>({
  draftId,
  schemaVersion,
  createEmpty,
  sanitize,
  hasContent,
  legacyKey,
  legacyPayload,
  debounceMs = SAVE_DEBOUNCE_MS,
}: SecureTypedScaleDraftOptions<T>): SecureTypedScaleDraftState<T> {
  const storageKey = `scale-draft:${draftId}`;
  const createEmptyRef = useRef(createEmpty);
  const sanitizeRef = useRef(sanitize);
  const hasContentRef = useRef(hasContent);
  const legacyPayloadRef = useRef(legacyPayload);
  createEmptyRef.current = createEmpty;
  sanitizeRef.current = sanitize;
  hasContentRef.current = hasContent;
  legacyPayloadRef.current = legacyPayload;

  const [value, setValue] = useState<T>(() => createEmpty());
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [status, setStatus] = useState<ScaleDraftStatus>("loading");
  const readyRef = useRef(false);
  const latestValueRef = useRef(value);
  const lastSerializedRef = useRef(stableDraftSerialization(sanitize(value)));
  const writeRevisionRef = useRef(0);
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  // Suspende a persistência após a escala ser CONCLUÍDA: o rascunho armazenado é
  // apagado (evita vazar respostas de um paciente para o próximo ao reabrir a
  // mesma escala), mas as respostas em memória seguem intactas para a tela de
  // resultado. Qualquer NOVA edição real re-arma a persistência.
  const suppressPersistRef = useRef(false);
  latestValueRef.current = value;

  useEffect(() => {
    let active = true;
    const revision = ++writeRevisionRef.current;
    setReady(false);
    readyRef.current = false;
    setRestored(false);
    setStatus("loading");
    const empty = createEmptyRef.current();
    setValue(empty);
    latestValueRef.current = empty;
    lastSerializedRef.current = stableDraftSerialization(empty);

    void (async () => {
      try {
        let result = await restoreScaleDraft({
          store: secureDraftStore,
          storageKey,
          schemaVersion,
          sanitize: (candidate) => sanitizeRef.current(candidate),
          hasContent: (candidate) => hasContentRef.current(candidate),
          createEmpty: () => createEmptyRef.current(),
        });

        if (!result.restored && legacyKey) {
          const legacy = readLegacyDraft(legacyKey);
          const candidate = legacyPayloadRef.current
            ? legacyPayloadRef.current(legacy)
            : legacy;
          const normalized = sanitizeRef.current(candidate);
          if (hasContentRef.current(normalized)) {
            await persistScaleDraft({
              store: secureDraftStore,
              storageKey,
              schemaVersion,
              value: normalized,
              sanitize: (entry) => sanitizeRef.current(entry),
              hasContent: (entry) => hasContentRef.current(entry),
            });
            result = { value: normalized, restored: true };
          }
        }
        removeLegacyDraft(legacyKey);
        if (!active || revision !== writeRevisionRef.current) return;

        lastSerializedRef.current = stableDraftSerialization(result.value);
        setValue(result.value);
        setRestored(result.restored);
        setStatus(result.restored ? "saved" : "idle");
      } catch {
        if (active && revision === writeRevisionRef.current) setStatus("error");
      } finally {
        if (active && revision === writeRevisionRef.current) {
          readyRef.current = true;
          setReady(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [draftId, legacyKey, schemaVersion, storageKey]);

  useEffect(() => {
    if (!ready) return;
    const normalized = sanitizeRef.current(value);
    const nextSerialized = stableDraftSerialization(normalized);
    if (nextSerialized === lastSerializedRef.current) return;
    // Uma mudança real de conteúdo após a conclusão re-arma a persistência.
    suppressPersistRef.current = false;

    const revision = ++writeRevisionRef.current;
    setStatus(hasContentRef.current(normalized) ? "saving" : "idle");
    const timer = window.setTimeout(() => {
      // Um clear por conclusão (clearPersistedDraft) avança a revisão e cancela
      // este save pendente — senão a última resposta re-criaria o rascunho.
      if (revision !== writeRevisionRef.current) return;
      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          await persistScaleDraft({
            store: secureDraftStore,
            storageKey,
            schemaVersion,
            value: normalized,
            sanitize: (candidate) => sanitizeRef.current(candidate),
            hasContent: (candidate) => hasContentRef.current(candidate),
          });
          if (revision === writeRevisionRef.current) {
            lastSerializedRef.current = nextSerialized;
            setStatus(hasContentRef.current(normalized) ? "saved" : "idle");
          }
        })
        .catch(() => {
          if (revision === writeRevisionRef.current) setStatus("error");
        });
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, ready, schemaVersion, storageKey, value]);

  // Ao trocar de rota, enfileira a última resposta ainda dentro do debounce.
  useEffect(
    () => () => {
      // Se a leitura inicial ainda não acabou, o estado vazio local não pode
      // apagar um rascunho válido já existente. E, após a conclusão, não
      // re-persistimos ao trocar de rota (senão o rascunho apagado voltaria).
      if (!readyRef.current || suppressPersistRef.current) return;
      const latest = sanitizeRef.current(latestValueRef.current);
      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(() =>
          persistScaleDraft({
            store: secureDraftStore,
            storageKey,
            schemaVersion,
            value: latest,
            sanitize: (candidate) => sanitizeRef.current(candidate),
            hasContent: (candidate) => hasContentRef.current(candidate),
          }),
        );
    },
    [schemaVersion, storageKey],
  );

  const clearDraft = useCallback(async () => {
    ++writeRevisionRef.current;
    const empty = createEmptyRef.current();
    setValue(empty);
    latestValueRef.current = empty;
    setRestored(false);
    setStatus("idle");
    lastSerializedRef.current = stableDraftSerialization(empty);
    suppressPersistRef.current = false;
    removeLegacyDraft(legacyKey);
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(() => clearScaleDraft(secureDraftStore, storageKey));
    await saveQueueRef.current;
  }, [legacyKey, storageKey]);

  // Apaga APENAS o rascunho armazenado, preservando as respostas em memória.
  // Usado ao concluir a escala: o resultado continua exibido, mas nada fica
  // guardado para restaurar no próximo paciente. A persistência fica suspensa
  // até uma nova edição real.
  const clearPersistedDraft = useCallback(async () => {
    suppressPersistRef.current = true;
    ++writeRevisionRef.current;
    lastSerializedRef.current = stableDraftSerialization(createEmptyRef.current());
    setRestored(false);
    removeLegacyDraft(legacyKey);
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(() => clearScaleDraft(secureDraftStore, storageKey));
    await saveQueueRef.current;
  }, [legacyKey, storageKey]);

  return {
    value,
    setValue,
    ready,
    restored,
    status,
    clearDraft,
    clearPersistedDraft,
  };
}

interface SecureScaleDraftOptions {
  draftId: string;
  /** chave → quantidade de alternativas válidas para a pergunta */
  validOptions: Readonly<Record<string, number>>;
  legacyKey?: string;
}

export interface SecureScaleDraftState {
  answers: Record<string, number>;
  setAnswers: Dispatch<SetStateAction<Record<string, number>>>;
  ready: boolean;
  restored: boolean;
  status: ScaleDraftStatus;
  clearDraft: () => Promise<void>;
  clearPersistedDraft: () => Promise<void>;
}

/** Remove respostas órfãs, fracionárias ou fora das opções da escala atual. */
export function normalizeScaleDraftAnswers(
  value: unknown,
  validOptions: Readonly<Record<string, number>>,
): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const normalized: Record<string, number> = {};
  for (const [key, answer] of Object.entries(value)) {
    const optionCount = validOptions[key];
    if (
      Number.isInteger(optionCount) &&
      optionCount > 0 &&
      typeof answer === "number" &&
      Number.isInteger(answer) &&
      answer >= 0 &&
      answer < optionCount
    ) {
      normalized[key] = answer;
    }
  }
  return normalized;
}

/** API compatível usada pelos runners numéricos existentes. */
export function useSecureScaleDraft({
  draftId,
  validOptions,
  legacyKey,
}: SecureScaleDraftOptions): SecureScaleDraftState {
  const state = useSecureTypedScaleDraft<Record<string, number>>({
    draftId,
    schemaVersion: 1,
    createEmpty: () => ({}),
    sanitize: (value) => normalizeScaleDraftAnswers(value, validOptions),
    hasContent: hasRecordEntries,
    legacyKey,
    legacyPayload: (value) =>
      value && typeof value === "object" && "answers" in value
        ? (value as { answers: unknown }).answers
        : null,
  });
  return {
    answers: state.value,
    setAnswers: state.setValue,
    ready: state.ready,
    restored: state.restored,
    status: state.status,
    clearDraft: state.clearDraft,
    clearPersistedDraft: state.clearPersistedDraft,
  };
}
