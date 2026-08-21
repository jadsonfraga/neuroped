export type FilterSessionRespondent =
  | "pais"
  | "clinico"
  | "professor"
  | "autoaplicavel"
  | "crianca"
  | "teste_direto_crianca";

export type FilterSessionCommunication = "verbal" | "nonverbal";
export type FilterSessionLiteracy = "literate" | "preliterate";
export type FilterSessionAssessmentType = "diagnostic" | "monitoring";

export interface FilterSessionState {
  search: string;
  selectedAge: string | null;
  selectedQueixas: string[];
  selectedRespondente: FilterSessionRespondent | null;
  selectedCommunication: FilterSessionCommunication | null;
  selectedLiteracy: FilterSessionLiteracy | null;
  selectedAssessmentType: FilterSessionAssessmentType | null;
  selectedSignalIds: string[];
}

export interface FilterSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const FILTER_SESSION_STATE_KEY = "np_filtro_session_v1";

const EMPTY_FILTER_SESSION_STATE: FilterSessionState = {
  search: "",
  selectedAge: null,
  selectedQueixas: [],
  selectedRespondente: null,
  selectedCommunication: null,
  selectedLiteracy: null,
  selectedAssessmentType: null,
  selectedSignalIds: [],
};

const RESPONDENTS = new Set<FilterSessionRespondent>([
  "pais",
  "clinico",
  "professor",
  "autoaplicavel",
  "crianca",
  "teste_direto_crianca",
]);
const COMMUNICATION = new Set<FilterSessionCommunication>([
  "verbal",
  "nonverbal",
]);
const LITERACY = new Set<FilterSessionLiteracy>(["literate", "preliterate"]);
const ASSESSMENT = new Set<FilterSessionAssessmentType>([
  "diagnostic",
  "monitoring",
]);

function browserSessionStorage(): FilterSessionStorage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

function cleanId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  if (!clean || clean.length > 80) return null;
  return clean;
}

function cleanIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const output: string[] = [];
  for (const candidate of value.slice(0, 96)) {
    const id = cleanId(candidate);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    output.push(id);
  }
  return output;
}

function enumOrNull<T extends string>(
  value: unknown,
  allowed: ReadonlySet<T>,
): T | null {
  return typeof value === "string" && allowed.has(value as T)
    ? (value as T)
    : null;
}

export function emptyFilterSessionState(): FilterSessionState {
  return {
    ...EMPTY_FILTER_SESSION_STATE,
    selectedQueixas: [],
    selectedSignalIds: [],
  };
}

export function parseFilterSessionState(raw: string | null): FilterSessionState {
  if (!raw) return emptyFilterSessionState();
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return emptyFilterSessionState();
    }
    return {
      search:
        typeof parsed.search === "string" ? parsed.search.slice(0, 300) : "",
      selectedAge: cleanId(parsed.selectedAge),
      selectedQueixas: cleanIdList(parsed.selectedQueixas),
      selectedRespondente: enumOrNull(parsed.selectedRespondente, RESPONDENTS),
      selectedCommunication: enumOrNull(
        parsed.selectedCommunication,
        COMMUNICATION,
      ),
      selectedLiteracy: enumOrNull(parsed.selectedLiteracy, LITERACY),
      selectedAssessmentType: enumOrNull(
        parsed.selectedAssessmentType,
        ASSESSMENT,
      ),
      selectedSignalIds: cleanIdList(parsed.selectedSignalIds),
    };
  } catch {
    return emptyFilterSessionState();
  }
}

export function loadFilterSessionState(
  storage = browserSessionStorage(),
): FilterSessionState {
  if (!storage) return emptyFilterSessionState();
  try {
    return parseFilterSessionState(storage.getItem(FILTER_SESSION_STATE_KEY));
  } catch {
    return emptyFilterSessionState();
  }
}

export function saveFilterSessionState(
  state: FilterSessionState,
  storage = browserSessionStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(
      FILTER_SESSION_STATE_KEY,
      JSON.stringify(parseFilterSessionState(JSON.stringify(state))),
    );
  } catch {
    // sessionStorage bloqueado: mantém o estado apenas em memória React.
  }
}

export function clearFilterSessionState(
  storage = browserSessionStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(FILTER_SESSION_STATE_KEY);
  } catch {
    // limpeza best-effort quando o storage da aba está indisponível.
  }
}
