import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Mascote, type MascoteContexto } from "@/components/Mascote";
import { SafeAssetImage, brandAssets } from "@/components/BrandAssets";

interface PageHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Gradiente reservado ao pequeno medalhão do módulo, não à superfície inteira. */
  gradient?: string;
  /** Cameo do mascote oficial para reforçar identidade em módulos selecionados. */
  mascotContext?: MascoteContexto;
  children?: ReactNode;
}

/**
 * Cabeçalho editorial Signature Clinical.
 * A superfície permanece calma; a hierarquia é módulo → conteúdo → assinatura.
 * A marca institucional aparece de forma compacta, sem competir com a tarefa clínica.
 */
export function PageHero({
  icon: Icon,
  title,
  subtitle,
  eyebrow,
  gradient = "from-primary to-chart-2",
  mascotContext,
  children,
}: PageHeroProps) {
  return (
    <header className="np-page-hero np-brand-page-hero relative overflow-hidden rounded-[1.55rem] border border-border/80 bg-card/92 p-5 shadow-[0_1px_1px_hsl(var(--foreground)/0.025),0_16px_42px_-34px_hsl(var(--foreground)/0.38)] sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(41_65%_53%/0.72)] to-transparent"
      />
      <div className="relative flex items-start gap-4">
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[0.95rem] bg-gradient-to-br ${gradient} text-white shadow-[0_10px_24px_-17px_hsl(var(--foreground)/0.52)] ring-1 ring-white/20`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.85} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          {eyebrow && (
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              {eyebrow}
            </p>
          )}
          <h1
            className="text-[1.6rem] font-bold leading-[1.1] tracking-[-0.028em] text-foreground sm:text-[1.8rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
          {children && <div className="mt-4">{children}</div>}
        </div>

        <div
          className="hidden shrink-0 items-center gap-2.5 rounded-2xl border border-amber-500/20 bg-background/55 px-2.5 py-2 shadow-sm backdrop-blur xl:flex"
          aria-label="Identidade institucional NeuroPed SDG"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-background/90 p-1 ring-1 ring-amber-500/25">
            <SafeAssetImage
              src={brandAssets.masterShield}
              alt="Escudo NeuroPed SDG"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="max-w-[11.5rem] leading-tight">
            <p className="text-[11px] font-semibold tracking-tight text-foreground">
              NeuroPed SDG
            </p>
            <p className="mt-0.5 text-[9px] text-muted-foreground">
              Dr. Jadson Fraga · Neuropediatra
            </p>
          </div>
        </div>

        {mascotContext && (
          <div
            className="hidden shrink-0 self-center md:block xl:hidden"
            aria-hidden="true"
          >
            <Mascote contexto={mascotContext} size="sm" fala="" className="opacity-90" />
          </div>
        )}
      </div>
    </header>
  );
}
