// Design: dock móvel clínico com Nesplora como destino dourado central, alvos confortáveis e navegação enxuta.
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Glasses,
  Home,
  Stethoscope,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { haptic } from "@/lib/haptic";
import { softTap } from "@/lib/softSounds";
import { IS_PUBLIC_ZONE } from "@/lib/zone";
import { useAuth } from "@/contexts/AuthContext";
import { canRenderNavigationItem } from "@/security/routeGuardPolicy";
import { hasConfiguredMasterPin, isMasterPinUnlocked } from "@/lib/masterPin";

interface DockItem {
  label: string;
  href?: string;
  externalHref?: string;
  icon: LucideIcon;
  isActive?: (path: string) => boolean;
  highlighted?: boolean;
}

const NESPLORA_SITE_URL = "/nesplora/";

// O dock é navegação do workspace clínico. Mesmo no host "full", fluxos
// explicitamente familiares/públicos não devem receber atalhos para Pacientes,
// Agenda ou busca clínica. A lista é propositalmente mais estreita que
// PUBLIC_ROUTES porque /filtro é também o destino profissional "Clínica".
const hiddenRoutePrefixes = [
  "/login",
  "/sessao-expirada",
  "/consentimento-lgpd",
  "/familia",
  "/agendar",
  "/pre-consulta",
  "/pre-retorno",
  "/efeitos-colaterais",
  "/portal-familia",
  "/verificar",
];

// O hub permanece navegável; somente o runner cronometrado fica sem dock para
// evitar distração e impedir que a barra cubra controles de resposta.
function isCognitiveTaskRoute(path: string) {
  return path.startsWith("/cognitive-lab/");
}

const dockItems: DockItem[] = [
  {
    label: "Início",
    href: "/",
    icon: Home,
    isActive: (path) => path === "/",
  },
  {
    label: "Pacientes",
    href: "/pacientes",
    icon: UsersRound,
    isActive: (path) => path === "/pacientes" || path.startsWith("/paciente/"),
  },
  {
    label: "Nesplora",
    externalHref: NESPLORA_SITE_URL,
    icon: Glasses,
    highlighted: true,
  },
  {
    label: "Clínica",
    href: "/filtro",
    icon: Stethoscope,
    isActive: (path) => path === "/filtro" || path.startsWith("/filtro/"),
  },
  {
    label: "Agenda",
    href: "/agenda",
    icon: CalendarDays,
    isActive: (path) => path === "/agenda" || path.startsWith("/agenda/"),
  },
];

function currentHashPath() {
  if (typeof window === "undefined") return "/";
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const path = raw.split("?")[0]?.split("#")[0] || "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function navigateTo(href: string) {
  softTap();
  haptic.select();
  window.location.hash = href;
}

export function MobilePrimaryDock() {
  const { accessMode, isAuthenticated, isLoading, user } = useAuth();
  const [path, setPath] = useState(currentHashPath);

  useEffect(() => {
    const sync = () => setPath(currentHashPath());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const hidden =
    IS_PUBLIC_ZONE ||
    isCognitiveTaskRoute(path) ||
    hiddenRoutePrefixes.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );

  useEffect(() => {
    document.body.classList.toggle("np-mobile-dock-active", !hidden);
    return () => document.body.classList.remove("np-mobile-dock-active");
  }, [hidden]);

  if (hidden) return null;

  const visibleDockItems = dockItems.filter(
    (item) =>
      !item.href ||
      canRenderNavigationItem({
        path: item.href,
        accessMode,
        isAuthenticated,
        isLoading,
        userRole: user?.role,
        localPinConfigured: accessMode === "local" && hasConfiguredMasterPin(),
        localPinUnlocked: accessMode === "local" && isMasterPinUnlocked(),
      }),
  );

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-2.5 lg:hidden print:hidden"
      style={{ paddingBottom: "max(0.45rem, env(safe-area-inset-bottom))" }}
      data-testid="mobile-primary-dock"
    >
      <nav
        aria-label="Navegação principal"
        className="pointer-events-auto mx-auto grid max-w-[34rem] rounded-[1.45rem] border border-white/70 bg-background/92 px-1.5 py-1.5 shadow-[0_-12px_40px_-22px_rgba(24,16,34,0.5)] backdrop-blur-2xl dark:border-white/10"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, visibleDockItems.length)}, minmax(0, 1fr))` }}
      >
        {visibleDockItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive?.(path) ?? false;
          const commonClass = `relative flex min-h-[3.55rem] flex-col items-center justify-center gap-0.5 rounded-[1.05rem] px-1 text-[10px] font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.97] ${
            item.highlighted
              ? "-mt-5 min-h-[4.45rem] rounded-[1.3rem] bg-gradient-to-br from-amber-900 via-amber-600 to-amber-200 text-amber-950 shadow-xl shadow-amber-800/50 ring-2 ring-amber-100/90 hover:from-amber-800 hover:via-amber-500 hover:to-amber-100"
              : active
              ? "bg-primary/12 text-primary"
              : "text-muted-foreground hover:bg-muted/65 hover:text-foreground"
          }`;

          if (item.externalHref) {
            return (
              <a
                key={item.label}
                href={item.externalHref}
                target="_blank"
                rel="noopener noreferrer"
                className={commonClass}
                onClick={() => {
                  softTap();
                  haptic.select();
                }}
                aria-label="Abrir site Nesplora em uma nova guia"
                data-testid="mobile-dock-nesplora"
              >
                <span aria-hidden="true" className="absolute inset-1 rounded-[1rem] border border-amber-50/65 motion-safe:animate-pulse motion-reduce:animate-none" />
                <Icon className="relative z-10 h-[21px] w-[21px]" strokeWidth={2.25} aria-hidden="true" />
                <span className="relative z-10 font-extrabold tracking-[0.06em]">{item.label}</span>
              </a>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              className={commonClass}
              onClick={() => item.href && navigateTo(item.href)}
              aria-current={active ? "page" : undefined}
              data-testid={`mobile-dock-${item.label.toLowerCase()}`}
            >
              <Icon
                className="h-[19px] w-[19px]"
                strokeWidth={active ? 2.2 : 1.9}
                aria-hidden="true"
              />
              <span>{item.label}</span>
              {active && (
                <span
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
