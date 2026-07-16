import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { secureClear, secureGet, secureSet } from "@/lib/secureStorage";

const DRAFT_SCHEMA_VERSION = 1;
const LEGACY_MAX_AGE_MS = 8 * 60 * 60 * 1000;
const SAVE_DEBOUNCE_MS = 400;

export type ScaleDraftStatus =
  | "loading"
  | "idle"
  | "saving"
  | "saved"
  | "error";

interface StoredScaleDraft {
  schemaVersion: typeof DRAFT_SCHEMA_VERSION;
  answers: Record<string, number>;
  updatedAt: number;
}

interface LegacyScaleDraft {
  answers?: unknown;
  updatedAt?: unknown;
}

interface SecureScaleDraftOptions {
  draftId: string;
  /** chave → quantidade de alternativas válidas para a pergunta */
  validOptions: Readonly<Record<string, number>>;
  /** Chave antiga em texto puro; é migrada e removida uma única vez. */
  legacyKey?: string;
}

export interface SecureScaleDraftState {
  answers: Record<string, number>;
  setAnswers: Dispatch<SetStateAction<Record<string, number>>>;
  ready: boolean;
  restored: boolean;
  status: ScaleDraftStatus;
  clearDraft: () => Promise<void>;
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

function serializedAnswers(answers: Record<string, number>): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(answers).sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
}

function removeLegacyDraft(key: string | undefined): void {
  if (!key) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // A migração continua em memória quando o storage está bloqueado.
  }
}

function readLegacyDraft(key: string | undefined): LegacyScaleDraft | null {
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LegacyScaleDraft;
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
 * Rascunho clínico cifrado, temporário e validado contra a versão atual da
 * escala. A tela de resultado nunca é restaurada automaticamente.
 */
export function useSecureScaleDraft({
  draftId,
  validOptions,
  legacyKey,
}: SecureScaleDraftOptions): SecureScaleDraftState {
  const storageKey = `scale-draft:${draftId}`;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [status, setStatus] = useState<ScaleDraftStatus>("loading");
  const lastSerializedRef = useRef("{}");
  const writeRevisionRef = useRef(0);
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const latestAnswersRef = useRef(answers);
  latestAnswersRef.current = answers;

  useEffect(() => {
    let active = true;
    const revision = ++writeRevisionRef.current;
    setReady(false);
    setRestored(false);
    setStatus("loading");
    setAnswers({});
    lastSerializedRef.current = "{}";

    void (async () => {
      try {
        let stored = await secureGet<StoredScaleDraft>(storageKey);

        if (!stored) {
          const legacy = readLegacyDraft(legacyKey);
          const migratedAnswers = normalizeScaleDraftAnswers(
            legacy?.answers,
            validOptions,
          );
          if (Object.keys(migratedAnswers).length > 0) {
            stored = {
              schemaVersion: DRAFT_SCHEMA_VERSION,
              answers: migratedAnswers,
              updatedAt: Date.now(),
            };
            await secureSet(storageKey, stored);
          }
        }
        removeLegacyDraft(legacyKey);

        const normalized = normalizeScaleDraftAnswers(
          stored?.schemaVersion === DRAFT_SCHEMA_VERSION
            ? stored.answers
            : null,
          validOptions,
        );
        if (!active || revision !== writeRevisionRef.current) return;

        const hasDraft = Object.keys(normalized).length > 0;
        lastSerializedRef.current = serializedAnswers(normalized);
        setAnswers(normalized);
        setRestored(hasDraft);
        setStatus(hasDraft ? "saved" : "idle");
      } catch {
        if (active && revision === writeRevisionRef.current) setStatus("error");
      } finally {
        if (active && revision === writeRevisionRef.current) setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [legacyKey, storageKey, validOptions]);

  useEffect(() => {
    if (!ready) return;
    const normalized = normalizeScaleDraftAnswers(answers, validOptions);
    const nextSerialized = serializedAnswers(normalized);
    if (nextSerialized === lastSerializedRef.current) return;

    const revision = ++writeRevisionRef.current;
    setStatus(Object.keys(normalized).length > 0 ? "saving" : "idle");
    const timer = window.setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          if (Object.keys(normalized).length === 0) {
            await secureClear(storageKey);
          } else {
            const persisted = await secureSet<StoredScaleDraft>(storageKey, {
              schemaVersion: DRAFT_SCHEMA_VERSION,
              answers: normalized,
              updatedAt: Date.now(),
            });
            if (!persisted) throw new Error("secure storage unavailable");
          }
          if (revision === writeRevisionRef.current) {
            lastSerializedRef.current = nextSerialized;
            setStatus(Object.keys(normalized).length > 0 ? "saved" : "idle");
          }
        })
        .catch(() => {
          if (revision === writeRevisionRef.current) setStatus("error");
        });
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [answers, ready, storageKey, validOptions]);

  // Ao trocar de rota, não perde a última resposta que ainda estava dentro do
  // debounce. A gravação entra depois de qualquer escrita já em andamento.
  useEffect(
    () => () => {
      const latest = normalizeScaleDraftAnswers(
        latestAnswersRef.current,
        validOptions,
      );
      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          if (Object.keys(latest).length > 0) {
            await secureSet<StoredScaleDraft>(storageKey, {
              schemaVersion: DRAFT_SCHEMA_VERSION,
              answers: latest,
              updatedAt: Date.now(),
            });
          } else {
            await secureClear(storageKey);
          }
        });
    },
    [storageKey, validOptions],
  );

  const clearDraft = useCallback(async () => {
    ++writeRevisionRef.current;
    setAnswers({});
    setRestored(false);
    setStatus("idle");
    lastSerializedRef.current = "{}";
    removeLegacyDraft(legacyKey);
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(() => secureClear(storageKey));
    await saveQueueRef.current;
  }, [legacyKey, storageKey]);

  return { answers, setAnswers, ready, restored, status, clearDraft };
}
