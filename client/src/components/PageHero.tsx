import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Gradiente do ícone (classes Tailwind). Padrão: primary → chart-2. */
  gradient?: string;
  children?: ReactNode;
}

/**
 * Cabeçalho de página editorial — superfície discreta, bolha de ícone,
 * eyebrow opcional, título e subtítulo. Reutilizável para dar às páginas de
 * referência/formulário uma hierarquia consistente sem competir com o conteúdo.
 */
export function PageHero({
  icon: Icon,
  title,
  subtitle,
  eyebrow,
  gradient = "from-primary to-chart-2",
  children,
}: PageHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-primary/[0.07] via-card/70 to-chart-2/[0.05] p-5 shadow-sm backdrop-blur sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-gradient-to-tr from-chart-2/15 to-transparent blur-3xl" />
      <div className="relative flex items-start gap-3">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg ring-1 ring-white/20`}>
          <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
          )}
          <h1
            className="text-[1.6rem] leading-tight tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </header>
  );
}
