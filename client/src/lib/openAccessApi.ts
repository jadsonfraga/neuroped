export const OPEN_ACCESS_USER = {
  id: "local-open-admin",
  email: "local@neuroped.app",
  name: "NeuroPed Local",
  role: "admin" as const,
};

interface LocalPatient {
  id: string;
  name: string;
  birthDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LocalResponseItem {
  question: string;
  answer: string;
}

interface LocalResult {
  id: string;
  patientId: string | null;
  scaleName: string;
  responses: LocalResponseItem[];
  answers: LocalResponseItem[];
  patientAge: string | null;
  createdAt: string;
}

interface LocalStore {
  version: 1;
  patients: LocalPatient[];
  results: LocalResult[];
}

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

function emptyStore(): LocalStore {
  return { version: 1, patients: [], results: [] };
}

function normalizeStore(value: unknown): LocalStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyStore();
  const record = value as Partial<LocalStore>;
  return {
    version: 1,
    patients: Array.isArray(record.patients) ? record.patients : [],
    results: Array.isArray(record.results) ? record.results : [],
  };
}

function readStore(): LocalStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeStore(JSON.parse(raw)) : emptyStore();
  } catch {
    return emptyStore();
  }
}

function writeStore(store: LocalStore): boolean {
  try {
    // Uma aba aberta antes da última limpeza não pode recriar dados apagados
    // com uma mutação que terminou atrasada.
    if (workspaceInvalidated || readClearGeneration() !== initialClearGeneration) return false;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

/**
 * Apaga somente o workspace clínico persistido pelo modo aberto.
 * Preferências não clínicas do navegador (tema, som etc.) são preservadas.
 */
export function clearOpenAccessWorkspace(): boolean {
  if (typeof window === "undefined") return false;
  const previousGeneration = readClearGeneration();
  const nextGeneration = makeId("clear");
  try {
    // Publica primeiro uma nova geração: escritores de outras abas passam a
    // falhar fechados antes que o workspace seja removido.
    window.localStorage.setItem(CLEAR_GENERATION_KEY, nextGeneration);
    window.localStorage.removeItem(STORAGE_KEY);
    const cleared =
      window.localStorage.getItem(STORAGE_KEY) === null &&
      window.localStorage.getItem(CLEAR_GENERATION_KEY) === nextGeneration;
    if (cleared) workspaceInvalidated = true;
    return cleared;
  } catch {
    // Evita deixar uma geração parcialmente avançada se a remoção falhar.
    try {
      if (previousGeneration) {
        window.localStorage.setItem(CLEAR_GENERATION_KEY, previousGeneration);
      } else {
        window.localStorage.removeItem(CLEAR_GENERATION_KEY);
      }
    } catch { /* a função já retornará falha, sem anunciar limpeza */ }
    return false;
  }
}

/**
 * A remoção de uma chave do localStorage emite `storage` nas outras abas da
 * mesma origem. Cada aba deve descartar também o estado clínico mantido em
 * memória; caso contrário, a interface ainda poderia exibir dados já apagados.
 */
export function subscribeToOpenAccessWorkspaceClear(
  onClear: () => void,
): () => void {
  if (typeof window === "undefined" || !window.addEventListener) return () => undefined;

  let handling = false;

  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea !== window.localStorage || handling) return;
    const workspaceRemoved =
      event.key === STORAGE_KEY && event.oldValue !== null && event.newValue === null;
    const generationAdvanced =
      event.key === CLEAR_GENERATION_KEY &&
      event.newValue !== null &&
      event.newValue !== event.oldValue;
    if (!workspaceRemoved && !generationAdvanced) return;

    handling = true;
    workspaceInvalidated = true;
    onClear();
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function makeId(prefix: string): string {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomPart}`;
}

function requestMethod(input: RequestInfo, init: RequestInit): string {
  if (init.method) return init.method.toUpperCase();
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.method.toUpperCase();
  }
  return "GET";
}

function requestUrl(input: RequestInfo): URL | null {
  try {
    const raw =
      typeof input === "string"
        ? input
        : typeof Request !== "undefined" && input instanceof Request
          ? input.url
          : String(input);
    return new URL(raw, window.location.origin);
  } catch {
    return null;
  }
}

async function readBody(input: RequestInfo, init: RequestInit): Promise<Record<string, unknown>> {
  try {
    if (typeof init.body === "string") {
      const parsed = JSON.parse(init.body);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    }
    if (typeof Request !== "undefined" && input instanceof Request) {
      const parsed = await input.clone().json();
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    }
  } catch {
    // Corpo inválido é tratado como objeto vazio e validado pela rota.
  }
  return {};
}

function normalizeResponses(value: unknown): LocalResponseItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;
      const question = String(record.question ?? `Item ${index + 1}`).trim();
      const answer = String(record.answer ?? "Não respondida").trim();
      if (!question) return null;
      return { question, answer: answer || "Não respondida" };
    })
    .filter((item): item is LocalResponseItem => item !== null);
}

function persistOrFail(store: LocalStore): Response | null {
  return writeStore(store)
    ? null
    : json(
        {
          error: "O navegador não conseguiu salvar os dados locais.",
          code: "LOCAL_STORAGE_UNAVAILABLE",
        },
        507,
      );
}

/**
 * API local do modo aberto.
 *
 * O app não solicita e-mail, PIN ou senha. Pacientes e resultados ficam somente
 * neste navegador. A API clínica remota continua fechada para impedir exposição
 * anônima de prontuários e documentos identificáveis.
 */
export async function openAccessFetch(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<Response | null> {
  if (typeof window === "undefined") return null;
  const url = requestUrl(input);
  if (!url || !url.pathname.startsWith("/api/")) return null;

  const method = requestMethod(input, init);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (method === "OPTIONS") return new Response(null, { status: 204 });

  if (path === "/api/health" && method === "GET") {
    return json({
      ok: true,
      mode: "local-open",
      auth: { required: false, configured: false },
      storage: "browser-local",
    });
  }

  if (path === "/api/auth/me" && method === "GET") return json(OPEN_ACCESS_USER);

  if (path === "/api/auth/login" && method === "POST") {
    return json({
      accessToken: "local-open",
      refreshToken: "local-open",
      expiresIn: 86_400,
      user: OPEN_ACCESS_USER,
    });
  }

  if (path === "/api/auth/refresh" && method === "POST") {
    return json({ accessToken: "local-open", refreshToken: "local-open" });
  }

  if (path === "/api/auth/logout" && method === "POST") return json({ ok: true });

  if (path === "/api/patients" && method === "GET") {
    const store = readStore();
    return json([...store.patients].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
  }

  if (path === "/api/patients" && method === "POST") {
    const body = await readBody(input, init);
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
    if (!name) return json({ error: "Informe o nome do paciente.", code: "NAME_REQUIRED" }, 400);
    const now = new Date().toISOString();
    const patient: LocalPatient = {
      id: makeId("patient"),
      name,
      birthDate: typeof body.birthDate === "string" && body.birthDate ? body.birthDate : null,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 10_000) : null,
      createdAt: now,
      updatedAt: now,
    };
    const store = readStore();
    store.patients.push(patient);
    const failure = persistOrFail(store);
    return failure ?? json(patient, 201);
  }

  const patientResultsMatch = path.match(/^\/api\/patients\/([^/]+)\/results$/);
  if (patientResultsMatch && method === "GET") {
    const patientId = decodeURIComponent(patientResultsMatch[1]);
    const store = readStore();
    return json(store.results.filter((result) => result.patientId === patientId));
  }

  const patientMatch = path.match(/^\/api\/patients\/([^/]+)$/);
  if (patientMatch) {
    const patientId = decodeURIComponent(patientMatch[1]);
    const store = readStore();
    const index = store.patients.findIndex((patient) => patient.id === patientId);
    if (index === -1) return json({ error: "Paciente não encontrado.", code: "NOT_FOUND" }, 404);

    if (method === "GET") return json(store.patients[index]);

    if (method === "PATCH") {
      const body = await readBody(input, init);
      const current = store.patients[index];
      const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : current.name;
      if (!name) return json({ error: "Informe o nome do paciente.", code: "NAME_REQUIRED" }, 400);
      const updated: LocalPatient = {
        ...current,
        name,
        birthDate:
          body.birthDate === null
            ? null
            : typeof body.birthDate === "string"
              ? body.birthDate || null
              : current.birthDate,
        notes:
          body.notes === null
            ? null
            : typeof body.notes === "string"
              ? body.notes.trim().slice(0, 10_000) || null
              : current.notes,
        updatedAt: new Date().toISOString(),
      };
      store.patients[index] = updated;
      const failure = persistOrFail(store);
      return failure ?? json(updated);
    }

    if (method === "DELETE") {
      store.patients.splice(index, 1);
      store.results = store.results.filter((result) => result.patientId !== patientId);
      const failure = persistOrFail(store);
      return failure ?? json({ ok: true });
    }
  }

  if (path === "/api/results" && method === "GET") return json(readStore().results);

  if (path === "/api/results" && method === "POST") {
    const body = await readBody(input, init);
    const patientId = typeof body.patientId === "string" && body.patientId ? body.patientId : null;
    const responses = normalizeResponses(body.responses ?? body.answers);
    if (responses.length === 0) {
      return json(
        { error: "Envie as perguntas e respostas por extenso.", code: "RESPONSES_REQUIRED" },
        400,
      );
    }
    const store = readStore();
    if (patientId && !store.patients.some((patient) => patient.id === patientId)) {
      return json({ error: "Paciente não encontrado.", code: "NOT_FOUND" }, 404);
    }
    const result: LocalResult = {
      id: makeId("result"),
      patientId,
      scaleName:
        typeof body.scaleName === "string" && body.scaleName.trim()
          ? body.scaleName.trim().slice(0, 300)
          : "Escala",
      responses,
      answers: responses,
      patientAge: typeof body.patientAge === "string" ? body.patientAge : null,
      createdAt: new Date().toISOString(),
    };
    store.results.push(result);
    const failure = persistOrFail(store);
    return failure ?? json(result, 201);
  }

  const resultMatch = path.match(/^\/api\/results\/([^/]+)$/);
  if (resultMatch) {
    const resultId = decodeURIComponent(resultMatch[1]);
    const store = readStore();
    const index = store.results.findIndex((result) => result.id === resultId);
    if (index === -1) return json({ error: "Resultado não encontrado.", code: "NOT_FOUND" }, 404);
    if (method === "GET") return json(store.results[index]);
    if (method === "DELETE") {
      store.results.splice(index, 1);
      const failure = persistOrFail(store);
      return failure ?? json({ ok: true });
    }
  }

  if (path === "/api/documents" && method === "GET") {
    const patientId = url.searchParams.get("patient_id");
    if (patientId !== "demo-001") return json([]);
    return json([
      {
        id: "demo-document-001",
        patient_id: "demo-001",
        type: "orientacao",
        title: "Documento demonstrativo",
        content: "Conteúdo fictício para demonstração local do Portal da Família.",
        is_family_visible: 1,
        created_at: new Date().toISOString(),
      },
    ]);
  }

  return json(
    {
      error: "Esta integração não está disponível no workspace local aberto.",
      code: "LOCAL_API_UNAVAILABLE",
      path,
    },
    501,
  );
}
