import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { authFetch } from "@/lib/authClient";
import { openAccessFetch } from "@/lib/openAccessApi";

// Origem da API. Vazio = mesma origem (padrão; funciona no Cloudflare Pages, que
// serve frontend + Functions juntos). No modo aberto, as rotas de trabalho
// clínico são atendidas primeiro pelo workspace local do navegador.
const API_BASE = (import.meta.env?.VITE_API_URL ?? "").replace(/\/$/, "");

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function routedFetch(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<Response> {
  const localResponse = await openAccessFetch(input, init);
  return localResponse ?? authFetch(input, init);
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await routedFetch(`${API_BASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await routedFetch(`${API_BASE}${queryKey.join("/")}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
