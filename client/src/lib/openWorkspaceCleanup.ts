const STORAGE_KEY = "neuroped:open-workspace:v1";
const CLEAR_GENERATION_KEY = "neuroped:open-workspace-clear-generation:v1";

function readClearGeneration(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(CLEAR_GENERATION_KEY) ?? "";
  } catch {
    return "";
  }
}

const initialClearGeneration = readClearGeneration();
let workspaceInvalidated = false;

function makeGeneration(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Remove o workspace legado do antigo modo aberto. Preferências não clínicas
 * permanecem intactas. A geração impede que uma aba antiga recrie os dados.
 */
export function clearLegacyOpenWorkspace(): boolean {
  if (typeof window === "undefined") return false;
  const previousGeneration = readClearGeneration();
  const nextGeneration = makeGeneration();
  try {
    window.localStorage.setItem(CLEAR_GENERATION_KEY, nextGeneration);
    window.localStorage.removeItem(STORAGE_KEY);
    const cleared =
      window.localStorage.getItem(STORAGE_KEY) === null &&
      window.localStorage.getItem(CLEAR_GENERATION_KEY) === nextGeneration;
    if (cleared) workspaceInvalidated = true;
    return cleared;
  } catch {
    try {
      if (previousGeneration) {
        window.localStorage.setItem(CLEAR_GENERATION_KEY, previousGeneration);
      } else {
        window.localStorage.removeItem(CLEAR_GENERATION_KEY);
      }
    } catch {
      // A função já retornará falha, sem anunciar limpeza.
    }
    return false;
  }
}

export function subscribeToLegacyOpenWorkspaceClear(
  onClear: () => void,
): () => void {
  if (typeof window === "undefined" || !window.addEventListener) {
    return () => undefined;
  }

  let handling = false;
  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea !== window.localStorage || handling) return;
    const workspaceRemoved =
      event.key === STORAGE_KEY &&
      event.oldValue !== null &&
      event.newValue === null;
    const generationAdvanced =
      event.key === CLEAR_GENERATION_KEY &&
      event.newValue !== null &&
      event.newValue !== event.oldValue &&
      event.newValue !== initialClearGeneration;
    if (!workspaceRemoved && !generationAdvanced) return;

    handling = true;
    workspaceInvalidated = true;
    onClear();
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

export function isLegacyOpenWorkspaceInvalidated(): boolean {
  return workspaceInvalidated;
}
