import { currentHashPath, isPublicRoute } from "@/lib/publicRoutes";

export type WorkspaceSurface = "clinical" | "public";

function routeToken(path: string): string {
  if (path === "/") return "home";
  return (
    path
      .replace(/^\/+|\/+$/g, "")
      .replace(/[^a-zA-Z0-9-]+/g, "-")
      .replace(/-+/g, "-") || "home"
  );
}

/**
 * Expõe somente metadados visuais da rota atual no elemento raiz.
 *
 * A classificação reutiliza a allowlist canônica de rotas públicas; portanto,
 * qualquer rota nova continua clínica por padrão. Nenhuma permissão, dado,
 * decisão de acesso ou regra funcional é alterada por esta camada.
 */
export function syncWorkspaceSurface(): WorkspaceSurface {
  const path = currentHashPath();
  const surface: WorkspaceSurface = isPublicRoute(path) ? "public" : "clinical";
  const root = document.documentElement;

  root.dataset.npWorkspace = surface;
  root.dataset.npRoute = routeToken(path);

  return surface;
}

/** Instala a sincronização visual antes do primeiro render e a cada navegação. */
export function installWorkspaceSurface(): () => void {
  const sync = () => syncWorkspaceSurface();
  sync();
  window.addEventListener("hashchange", sync);
  return () => window.removeEventListener("hashchange", sync);
}
