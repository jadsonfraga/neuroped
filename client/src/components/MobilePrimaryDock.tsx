// Design: dock móvel clínico enxuto — quatro destinos de alta frequência numa
// única faixa rasa.
//
// A versão anterior elevava "Prontuário" num pastilhão dourado que saltava
// acima da faixa: o dock media ~79px visíveis e obrigava ~102px de reserva,
// perto de 12% da viewport de um iPhone, para quatro destinos. A faixa atual
// mantém os mesmos destinos e o alvo de 44px, mas custa pouco mais da metade
// disso — no celular a tela pertence ao conteúdo clínico.
//
// Nesplora migrou para os Destaques da sidebar (client/src/data/navigation.ts) — o dock prioriza os
// fluxos de maior frequência do dia a dia clínico (pacientes, prontuário, agenda).
import { useEffect, useState } from "react";
import {
  CalendarDays,
  FileText,
  Home,
  Stethoscope,
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
  href: string;
  icon: LucideIcon;
  isActive?: (path: string) => boolean;
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
  "/marcacao",
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
    // Laudos, receita C1 e o próprio prontuário exigem um paciente já
    // selecionado (o botão de salvar/imprimir dessas telas fica desabilitado
    // sem `?patientId`, sem nenhum seletor embutido) — o único ponto de
    // entrada real para elas é a ficha do paciente em `/paciente/:id`
    // (client/src/pages/paciente-detalhe.tsx), alcançada a partir da lista
    // em `/pacientes`. Levar o atalho direto a `/prontuario` sem essa etapa
    // deixa a pessoa preencher a ficha inteira sem nunca conseguir salvar.
    label: "Prontuário",
    href: "/pacientes",
    icon: FileText,
    isActive: (path) =>
      path === "/pacientes" ||
      path.startsWith("/paciente/") ||
      path.startsWith("/prontuario") ||
      path.startsWith("/laudo-neuroped") ||
      path.startsWith("/laudo-super") ||
      path.startsWith("/receita-c1"),
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

  const visibleDockItems = dockItems.filter((item) =>
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-2 lg:hidden print:hidden"
      style={{ paddingBottom: "max(0.3rem, env(safe-area-inset-bottom))" }}
      data-testid="mobile-primary-dock"
    >
      <nav
        aria-label="Navegação principal"
        className="pointer-events-auto mx-auto grid max-w-[34rem] rounded-2xl border border-border/70 bg-background/95 p-1 shadow-[0_-10px_30px_-24px_hsl(var(--foreground)/0.55)] backdrop-blur-xl"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, visibleDockItems.length)}, minmax(0, 1fr))` }}
      >
        {visibleDockItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive?.(path) ?? false;

          return (
            <button
              key={item.label}
              type="button"
              className={`relative flex min-h-[2.75rem] flex-col items-center justify-center gap-[1px] rounded-xl px-1 text-[9.5px] font-semibold leading-none transition-[background-color,color] duration-150 active:scale-[0.97] ${
                active
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-muted/65 hover:text-foreground"
              }`}
              onClick={() => navigateTo(item.href)}
              aria-current={active ? "page" : undefined}
              data-testid={`mobile-dock-${item.label.toLowerCase()}`}
            >
              <Icon
                className="h-[18px] w-[18px]"
                strokeWidth={active ? 2.2 : 1.9}
                aria-hidden="true"
              />
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
