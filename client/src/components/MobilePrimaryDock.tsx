import { useEffect, useState } from "react";
import {
  CalendarDays,
  Home,
  Search,
  Stethoscope,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { openCommandPalette } from "@/lib/commandPaletteBus";
import { haptic } from "@/lib/haptic";
import { softTap } from "@/lib/softSounds";
import { IS_PUBLIC_ZONE } from "@/lib/zone";

interface DockItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  isActive?: (path: string) => boolean;
  action?: "search";
}

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
  "/cognitive-task",
];

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
    isActive: (path) => path === "/pacientes" || path.startsWith("/pacientes/"),
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
  {
    label: "Buscar",
    icon: Search,
    action: "search",
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
  const [path, setPath] = useState(currentHashPath);

  useEffect(() => {
    const sync = () => setPath(currentHashPath());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const hidden =
    IS_PUBLIC_ZONE || hiddenRoutePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

  useEffect(() => {
    document.body.classList.toggle("np-mobile-dock-active", !hidden);
    return () => document.body.classList.remove("np-mobile-dock-active");
  }, [hidden]);

  if (hidden) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-2.5 md:hidden print:hidden"
      style={{ paddingBottom: "max(0.45rem, env(safe-area-inset-bottom))" }}
      data-testid="mobile-primary-dock"
    >
      <nav
        aria-label="Navegação principal"
        className="pointer-events-auto mx-auto grid max-w-[34rem] grid-cols-5 rounded-[1.45rem] border border-white/70 bg-background/92 px-1.5 py-1.5 shadow-[0_-12px_40px_-22px_rgba(24,16,34,0.5)] backdrop-blur-2xl dark:border-white/10"
      >
        {dockItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive?.(path) ?? false;
          const commonClass = `relative flex min-h-[3.45rem] flex-col items-center justify-center gap-0.5 rounded-[1.05rem] px-1 text-[10px] font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.97] ${
            active
              ? "bg-primary/12 text-primary"
              : "text-muted-foreground hover:bg-muted/65 hover:text-foreground"
          }`;

          if (item.action === "search") {
            return (
              <button
                key={item.label}
                type="button"
                className={commonClass}
                onClick={() => {
                  softTap();
                  haptic.tap();
                  openCommandPalette();
                }}
                aria-label="Buscar no NeuroPed"
                data-testid="mobile-dock-search"
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.2 : 1.9} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
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
              <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.2 : 1.9} aria-hidden="true" />
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
