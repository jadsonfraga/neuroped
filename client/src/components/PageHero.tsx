import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Mascote, type MascoteContexto } from "@/components/Mascote";

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
 * A superfície permanece calma; identidade de cada módulo fica concentrada no
 * medalhão do ícone e numa hairline superior, preservando hierarquia e contraste.
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
    <header className="np-page-hero group relative overflow-hidden rounded-[1.4rem] border border-border/80 bg-card/92 p-5 shadow-[0_1px_1px_hsl(var(--foreground)/0.025),0_16px_42px_-34px_hsl(var(--foreground)/0.38)] sm:p-6">
      <div className="np-page-hero-neural" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent"
      />
      <div className="relative z-10 flex items-start gap-4">
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
          <h1 className="text-[1.6rem] font-bold leading-[1.1] tracking-[-0.028em] text-foreground sm:text-[1.75rem]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
          {children && <div className="mt-4">{children}</div>}
        </div>
        {mascotContext && (
          <div className="hidden shrink-0 self-center md:block" aria-hidden="true">
            <Mascote contexto={mascotContext} size="sm" fala="" className="opacity-90" />
          </div>
        )}
      </div>
    </header>
  );
}
