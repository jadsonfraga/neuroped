import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { authFetch } from "@/lib/authClient";

// Origem da API. Vazio = mesma origem (padrão; funciona no Cloudflare Pages, que
// serve frontend + Functions juntos). Para que os mirrors estáticos (GitHub Pages
// e Vercel) consumam a API do Cloudflare, defina VITE_API_URL no build deles
// (ex.: VITE_API_URL=https://neuroped.pages.dev) e inclua a origem em CORS_ORIGINS
// no Cloudflare. Atenção: fluxos autenticados por cookie exigem ajustes de CORS
// (credentials + SameSite=None) — cross-origin só é seguro p/ endpoints públicos.
const API_BASE = (import.meta.env?.VITE_API_URL ?? "").replace(/\/$/, "");

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await authFetch(`${API_BASE}${url}`, {
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
    const res = await authFetch(`${API_BASE}${queryKey.join("/")}`);

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
