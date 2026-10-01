/**
 * apiErrorMessage.ts — texto de erro para a pessoa, nunca o erro cru.
 *
 * `apiRequest` e o fetcher padrão lançam `Error("<status>: <corpo>")`, onde o
 * corpo costuma ser o JSON do servidor (`{ "error": "...", "code": "..." }`) e
 * o `error` já está em português. Mostrar `String(err)` na tela entregava à
 * família algo como `Error: 409: {"error":"Novo horário indisponível.",...}`.
 */

const MAX_MESSAGE = 300;
const NETWORK_ERROR = /failed to fetch|load failed|networkerror|network request failed|fetch failed/i;

function statusOf(err: unknown, text: string): number | null {
  const direct = (err as { status?: unknown } | null)?.status;
  if (typeof direct === "number" && Number.isInteger(direct)) return direct;
  const match = /^(\d{3}):/.exec(text);
  return match ? Number(match[1]) : null;
}

/** Mensagem do servidor (`error`), quando existe e é texto curto e simples. */
function serverError(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;
  try {
    const parsed = JSON.parse(text.slice(start)) as { error?: unknown };
    const message = typeof parsed.error === "string" ? parsed.error.trim() : "";
    return message && message.length <= MAX_MESSAGE ? message : null;
  } catch {
    return null;
  }
}

/**
 * 1. mensagem do servidor, se houver (já em português);
 * 2. falha de rede → orientação sobre a conexão;
 * 3. senão o `fallback` do chamador. Nunca devolve o texto cru do erro.
 */
export function userFacingErrorMessage(err: unknown, fallback: string): string {
  const text = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const fromServer = serverError(text);
  if (fromServer) return fromServer;
  const status = statusOf(err, text);
  if (status === null && (NETWORK_ERROR.test(text) || (err instanceof Error && err.name === "TypeError"))) {
    return "Sem conexão com o servidor. Verifique sua internet e tente novamente.";
  }
  return fallback;
}

/** Status HTTP do erro lançado por `apiRequest`, quando há. */
export function errorStatus(err: unknown): number | null {
  const text = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return statusOf(err, text);
}
