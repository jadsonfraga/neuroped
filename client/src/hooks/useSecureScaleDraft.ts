import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { secureClear, secureGet, secureSet } from "@/lib/secureStorage";
import { isClinicalBrowserPersistenceDenied } from "@/lib/clinicalBrowserPersistencePolicy";
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

/**
 * Em LIVE remoto a política de segurança proíbe persistir PHI no Storage do
 * navegador. Ainda assim, navegar dentro do SPA não deve apagar o que acabou de
 * ser marcado. Este Map mantém somente o rascunho da sessão JS em memória; não
 * sobrevive a reload/fechamento e é zerado em logout/troca de conta.
 */
const inMemoryScaleDrafts = new Map<string, unknown>();

export function clearInMemoryScaleDrafts(): void {
  inMemoryScaleDrafts.clear();
}

function browserPersistenceDenied(
  key: string,
  purpose: "read" | "write" | "remove",
): boolean {
  return isClinicalBrowserPersistenceDenied(key, purpose);
}

const secureDraftStore: ScaleDraftStore = {
  get: async (key) => {
    if (browserPersistenceDenied(key, "read")) {
      return inMemoryScaleDrafts.get(key) ?? null;
    }
    return secureGet(key);
  },
  set: async (key, value) => {
    if (browserPersistenceDenied(key, "write")) {
      inMemoryScaleDrafts.set(key, value);
      return true;
    }
    return secureSet(key, value);
  },
  clear: async (key) => {
    inMemoryScaleDrafts.delete(key);
    if (!browserPersistenceDenied(key, "remove")) {
      await secureClear(key);
    }
  },
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
  /**
   * Congela o snapshot concluído no armazenamento permitido para a sessão.
   * O nome é mantido por compatibilidade com os runners antigos.
   */
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
 *
 * Local/offline: usa secureStorage cifrado e efêmero.
 * LIVE remoto autenticado: a política bloqueia Storage e o snapshot fica só em
 * memória até logout/reload, sem reintroduzir PHI persistente no navegador.
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
  // Após CONCLUIR, o snapshot final é selado e novas escritas automáticas ficam
  // suspensas. Ele só é apagado quando o usuário aciona explicitamente
  // "Nova avaliação"/"Começar do zero" ou encerra a sessão clínica.
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
    // Uma mudança real após voltar ao formulário re-arma a persistência.
    suppressPersistRef.current = false;

    const revision = ++writeRevisionRef.current;
    setStatus(hasContentRef.current(normalized) ? "saving" : "idle");
    const timer = window.setTimeout(() => {
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

  /**
   * Compatibilidade com os runners que chamavam clearPersistedDraft ao concluir.
   * Agora a conclusão SELA o último snapshot em vez de apagá-lo. Isso corrige a
   * perda das marcações ao sair/voltar da escala sem relaxar a política LIVE:
   * quando Storage é proibido, o mesmo snapshot permanece somente no Map em
   * memória. O reset explícito continua sendo o único caminho que apaga.
   */
  const clearPersistedDraft = useCallback(async () => {
    const sealed = sanitizeRef.current(latestValueRef.current);
    const sealedSerialized = stableDraftSerialization(sealed);
    const revision = ++writeRevisionRef.current;
    suppressPersistRef.current = true;
    removeLegacyDraft(legacyKey);
    setRestored(false);
    setStatus(hasContentRef.current(sealed) ? "saving" : "idle");
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(() =>
        persistScaleDraft({
          store: secureDraftStore,
          storageKey,
          schemaVersion,
          value: sealed,
          sanitize: (candidate) => sanitizeRef.current(candidate),
          hasContent: (candidate) => hasContentRef.current(candidate),
        }),
      )
      .then(() => {
        if (revision === writeRevisionRef.current) {
          lastSerializedRef.current = sealedSerialized;
          setStatus(hasContentRef.current(sealed) ? "saved" : "idle");
        }
      })
      .catch(() => {
        if (revision === writeRevisionRef.current) setStatus("error");
      });
    await saveQueueRef.current;
  }, [legacyKey, schemaVersion, storageKey]);

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
