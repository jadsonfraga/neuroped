import { CalendarDays, ClipboardCheck, FileText, Home, Search, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { openCommandPalette } from "@/lib/commandPaletteBus";
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

  if (isLoading || !professionalSession || publicOnly) return null;

  const displayName = user?.name?.trim() || "Profissional";
  const firstName = displayName.split(/\s+/)[0] || "Profissional";

  return (
    <>
      {path === "/" && (
        <div className="np-product-utility print:hidden" data-testid="product-utility-bar" aria-label="Acesso rápido profissional">
          <button type="button" className="np-product-search" onClick={openCommandPalette} data-testid="product-global-search">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Buscar paciente, avaliação ou documento…</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="np-product-profile" aria-label={`Sessão de ${displayName}`}>
            <img src="/dr-jadson-shield-badge.webp" alt="" width="256" height="256" decoding="async" />
            <span><strong>{firstName}</strong><small>Área profissional</small></span>
          </div>
        </div>
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
