/**
 * Prova de conectividade com um endpoint público, sem cookies/sessões/PHI.
 * Um HTTP 503 comprova transporte de rede, NÃO saúde do backend.
 */
export type ConnectivityStatus = "reachable" | "server_unavailable" | "unreachable";

export async function probePublicApiConnectivity(
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<ConnectivityStatus> {
  try {
    const response = await fetcher("/api/health", {
      cache: "no-store",
      credentials: "omit",
      signal,
      headers: { Accept: "application/json" },
    });
    if (response.status >= 200 && response.status < 500) return "reachable";
    if (response.status >= 500 && response.status <= 599) return "server_unavailable";
    return "unreachable";
  } catch {
    return "unreachable";
  }
}
