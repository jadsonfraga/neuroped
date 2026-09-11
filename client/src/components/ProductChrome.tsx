import { CalendarDays, ClipboardCheck, FileText, Home, KeyRound, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { isPublicRoute, normalizePath } from "@/lib/publicRoutes";

const dockItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/filtro", label: "Avaliar", icon: ClipboardCheck },
  { href: "/documentos", label: "Documentos", icon: FileText },
] as const;

function itemIsActive(path: string, href: string): boolean {
  if (href === "/") return path === "/";
  if (href === "/pacientes") return path === "/pacientes" || path.startsWith("/paciente/") || path === "/prontuario";
  if (href === "/filtro") return path === "/filtro" || path.startsWith("/generic-scale/") || path === "/mchat";
  return path === href || path.startsWith(`${href}/`);
}

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
  if (publicOnly) return null;

  const displayName = user?.name?.trim() || "Profissional";
  const firstName = displayName.split(/\s+/)[0] || "Profissional";

  return (
    <>
      {path === "/" && (
        <aside className="np-product-utility print:hidden" data-testid="product-utility-bar" aria-label="Sessão profissional">
          <div className="np-product-profile" aria-label={`Sessão de ${displayName}`}>
            <img src="/dr-jadson-shield-badge.webp" alt="" width="256" height="256" decoding="async" />
            <span><strong>{firstName}</strong><small>Área profissional</small></span>
          </div>
        </aside>
      )}

      <nav className="np-product-dock print:hidden" data-testid="product-mobile-dock" aria-label="Navegação principal móvel">
        {dockItems.map(({ href, label, icon: Icon }) => {
          const active = itemIsActive(path, href);
          return (
            <Link key={href} href={href} className="np-product-dock__item" data-active={active || undefined} aria-current={active ? "page" : undefined}>
              <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.3 : 1.9} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
