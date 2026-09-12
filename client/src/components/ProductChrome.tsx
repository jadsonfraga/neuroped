import { KeyRound } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { isPublicRoute, normalizePath } from "@/lib/publicRoutes";

/**
 * Acabamento global que complementa, sem duplicar, o shell existente.
 * A navegação móvel continua pertencendo ao MobilePrimaryDock — que já aplica
 * RBAC, ocultação por rota e contratos de acessibilidade do NeuroPed.
 */
export function ProductChrome() {
  const [location] = useLocation();
  const { accessMode, isAuthenticated, isLoading, user } = useAuth();
  const path = normalizePath(location);
  const professionalSession = accessMode !== "remote" || isAuthenticated;
  const publicOnly = isPublicRoute(path) && path !== "/filtro";

  if (isLoading) return null;

  // O login focado não exibe a sidebar, mas preserva o contrato de retorno ao
  // gate após logout com um único convite discreto e funcional para o campo.
  if (!professionalSession) {
    if (path !== "/login") return null;
    return (
      <aside className="np-login-session-landmark print:hidden" aria-label="Acesso à área profissional">
        <button
          type="button"
          className="np-login-session-entry"
          data-testid="button-session-enter"
          onClick={() => document.getElementById("login-email")?.focus()}
        >
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          <span>Entrar</span>
        </button>
      </aside>
    );
  }
  if (publicOnly || path !== "/") return null;

  const displayName = user?.name?.trim() || "Profissional";
  const firstName = displayName.split(/\s+/)[0] || "Profissional";

  return (
    <aside
      className="np-product-utility print:hidden"
      data-testid="product-utility-bar"
      aria-label="Sessão profissional"
    >
      <div className="np-product-profile" aria-label={`Sessão de ${displayName}`}>
        <img src="/dr-jadson-shield-badge.webp" alt="" width="256" height="256" decoding="async" />
        <span><strong>{firstName}</strong><small>Área profissional</small></span>
      </div>
    </aside>
  );
}
