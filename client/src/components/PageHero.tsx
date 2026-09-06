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
 * A superfície permanece calma; identidade de cada módulo fica concentrada no
 * medalhão, na assinatura Dr. Jadson e, quando solicitado, no mascote contextual.
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

        <div className="hidden shrink-0 items-center gap-3 xl:flex" aria-label="Identidade do Dr. Jadson Fraga">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-amber-300/45 bg-background shadow-[0_14px_30px_-20px_hsl(214_76%_11%/0.55)]">
            <SafeAssetImage
              src={brandAssets.mascots.doctorSelfie}
              alt="Dr. Jadson Fraga"
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div className="max-w-[10.5rem] leading-tight">
            <p className="text-[12px] font-semibold text-foreground">Dr. Jadson Fraga</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
              Neuropediatra
            </p>
            <p className="mt-1 text-[9px] text-muted-foreground">CRM-PE 25227 · RQE 17756</p>
          </div>
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
