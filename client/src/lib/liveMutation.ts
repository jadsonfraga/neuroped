import { authFetch } from "./authClient";

export type LiveMutationState = "saving" | "saved" | "failed";
export interface LiveMutationResult<T> { state: LiveMutationState; value?: T; errorCode?: string; idempotencyKey: string; }

const MAX_ATTEMPTS = 3;
const inMemoryQueue = new Map<string, Promise<unknown>>();

function sleep(ms: number): Promise<void> { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
function transient(status: number): boolean { return status === 408 || status === 425 || status === 429 || status >= 500; }
function safeErrorCode(error: unknown): string { const message = error instanceof Error ? error.message : "NETWORK_FAILURE"; return /^[A-Z0-9_:-]{3,80}$/.test(message) ? message : "NETWORK_FAILURE"; }

export async function enqueueLiveMutation<T>(
  request: { url: string; body: unknown; idempotencyKey?: string },
): Promise<LiveMutationResult<T>> {
  const idempotencyKey = request.idempotencyKey ?? crypto.randomUUID();
  const previous = inMemoryQueue.get(idempotencyKey) as Promise<LiveMutationResult<T>> | undefined;
  if (previous) return previous;
  const task = (async (): Promise<LiveMutationResult<T>> => {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await authFetch(request.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
          body: JSON.stringify({ ...(request.body as Record<string, unknown>), idempotencyKey }),
        });
        if (response.ok) return { state: "saved", value: await response.json() as T, idempotencyKey };
        if (!transient(response.status) || attempt === MAX_ATTEMPTS) return { state: "failed", errorCode: `HTTP_${response.status}`, idempotencyKey };
      } catch (error) {
        if (attempt === MAX_ATTEMPTS) return { state: "failed", errorCode: safeErrorCode(error), idempotencyKey };
      }
      await sleep(250 * 2 ** (attempt - 1));
    }
    return { state: "failed", errorCode: "RETRY_EXHAUSTED", idempotencyKey };
  })();
  inMemoryQueue.set(idempotencyKey, task);
  try { return await task; } finally { inMemoryQueue.delete(idempotencyKey); }
}

export function clearLiveMutationQueue(): void { inMemoryQueue.clear(); }
