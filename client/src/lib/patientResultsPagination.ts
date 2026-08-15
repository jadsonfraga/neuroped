import { apiRequest } from "@/lib/queryClient";

export const PATIENT_RESULTS_PAGE_SIZE = 200;
const MAX_PATIENT_RESULT_PAGES = 10_000;
const MAX_RATE_LIMIT_RETRIES = 4;
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 30_000;

interface PatientResultsPage {
  data: any[];
  total: number | null;
  page: number | null;
  limit: number | null;
  hasMore: boolean | null;
  legacyArray: boolean;
}

interface LoadPatientResultsOptions {
  request?: (url: string) => Promise<Response>;
  wait?: (milliseconds: number) => Promise<void>;
  pageSize?: number;
  maxPages?: number;
  maxRateLimitRetries?: number;
}

function safeNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

function safePositiveInteger(value: unknown): number | null {
  const parsed = safeNonNegativeInteger(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

export function normalizePatientResultsPayload(
  payload: unknown,
): PatientResultsPage {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      total: payload.length,
      page: 1,
      limit: payload.length || null,
      hasMore: false,
      legacyArray: true,
    };
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Resposta inválida ao listar avaliações do paciente.");
  }

  const record = payload as Record<string, unknown>;
  if (!Array.isArray(record.data)) {
    throw new Error("Resposta inválida ao listar avaliações do paciente.");
  }

  return {
    data: record.data,
    total: safeNonNegativeInteger(record.total),
    page: safePositiveInteger(record.page),
    limit: safePositiveInteger(record.limit),
    hasMore: typeof record.hasMore === "boolean" ? record.hasMore : null,
    legacyArray: false,
  };
}

function resultId(result: unknown): string {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("A API retornou uma avaliação inválida.");
  }
  const rawId = (result as Record<string, unknown>).id;
  const id = typeof rawId === "string" ? rawId.trim() : "";
  if (!id) throw new Error("A API retornou uma avaliação sem identificador.");
  return id;
}

function defaultWait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

function retryAfterMilliseconds(value: unknown): number | null {
  if (typeof value !== "string" || !value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null;
}

function retryDelay(error: unknown, attempt: number): number | null {
  if (
    !error ||
    typeof error !== "object" ||
    Number((error as { status?: unknown }).status) !== 429
  )
    return null;
  const requestedDelay = retryAfterMilliseconds(
    (error as { retryAfter?: unknown }).retryAfter,
  );
  if (requestedDelay !== null) return requestedDelay;
  return Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
}

async function responseError(response: Response): Promise<Error> {
  const text = (await response.text()) || response.statusText;
  return Object.assign(new Error(`${response.status}: ${text}`), {
    status: response.status,
    retryAfter: response.headers.get("Retry-After"),
  });
}

export async function getWithRateLimitBackoff(
  url: string,
  options: Pick<
    LoadPatientResultsOptions,
    "request" | "wait" | "maxRateLimitRetries"
  > = {},
): Promise<Response> {
  const request = options.request ?? ((path) => apiRequest("GET", path));
  const wait = options.wait ?? defaultWait;
  const maxRetries = options.maxRateLimitRetries ?? MAX_RATE_LIMIT_RETRIES;

  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await request(url);
      if (response.ok) return response;
      throw await responseError(response);
    } catch (error) {
      const delay = retryDelay(error, attempt);
      if (delay === null || attempt >= maxRetries) throw error;
      await wait(delay);
    }
  }
}

export async function loadAllPatientResults(
  patientId: string,
  options: LoadPatientResultsOptions = {},
): Promise<any[]> {
  const normalizedPatientId = patientId.trim();
  if (!normalizedPatientId) {
    throw new Error("Identificador do paciente ausente.");
  }
  const pageSize = options.pageSize ?? PATIENT_RESULTS_PAGE_SIZE;
  const maxPages = options.maxPages ?? MAX_PATIENT_RESULT_PAGES;
  if (
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > PATIENT_RESULTS_PAGE_SIZE ||
    !Number.isSafeInteger(maxPages) ||
    maxPages < 1
  ) {
    throw new Error("Configuração de paginação de avaliações inválida.");
  }
  const encodedPatientId = encodeURIComponent(normalizedPatientId);
  const all: any[] = [];
  const seenIds = new Set<string>();
  let expectedTotal: number | null = null;
  let offset = 0;

  for (let requestedPage = 1; requestedPage <= maxPages; requestedPage += 1) {
    const url =
      `/api/patients/${encodedPatientId}/results` +
      `?page=${requestedPage}&limit=${pageSize}&offset=${offset}`;
    const response = await getWithRateLimitBackoff(url, options);
    const payload = normalizePatientResultsPayload(await response.json());

    // Compatibilidade de rollout: servidores antigos devolvem array direto.
    // O Cloudflare legado truncava exatamente em 200; nesse limite não existe
    // prova de completude, portanto o backup falha fechado.
    if (payload.legacyArray) {
      if (payload.data.length === pageSize) {
        throw new Error(
          "A API antiga atingiu o limite de avaliações sem informar paginação.",
        );
      }
      for (const result of payload.data) {
        const id = resultId(result);
        if (seenIds.has(id)) {
          throw new Error("A API retornou avaliações duplicadas.");
        }
        seenIds.add(id);
      }
      return payload.data;
    }

    if (
      payload.total === null ||
      payload.page === null ||
      payload.limit === null ||
      payload.hasMore === null
    ) {
      throw new Error("A API paginada não informou metadados completos.");
    }
    if (payload.page !== requestedPage || payload.limit > pageSize) {
      throw new Error("A API retornou metadados de paginação inconsistentes.");
    }
    if (payload.data.length > payload.limit) {
      throw new Error("A API retornou mais avaliações que o limite da página.");
    }
    if (expectedTotal !== null && payload.total !== expectedTotal) {
      throw new Error("As avaliações mudaram durante o carregamento.");
    }
    expectedTotal = payload.total;

    for (const result of payload.data) {
      const id = resultId(result);
      if (seenIds.has(id)) {
        throw new Error("A paginação de avaliações retornou IDs duplicados.");
      }
      seenIds.add(id);
      all.push(result);
    }

    if (all.length > expectedTotal) {
      throw new Error("A API retornou mais avaliações que o total informado.");
    }
    const shouldHaveMore = all.length < expectedTotal;
    if (payload.hasMore !== shouldHaveMore) {
      throw new Error(
        "A API encerrou a paginação de avaliações de forma inconsistente.",
      );
    }
    if (!shouldHaveMore) return all;
    if (payload.data.length === 0) {
      throw new Error("A API retornou uma página vazia antes do fim.");
    }
    offset += payload.data.length;
  }

  throw new Error("As avaliações excederam o limite seguro de paginação.");
}
