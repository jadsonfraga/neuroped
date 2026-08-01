import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type FilterRecommendationTone = "primary" | "secondary" | "optional";

interface FilterRecommendationBadge {
  label: string;
  variant?: "secondary" | "outline";
}

interface FilterRecommendationLinkCardProps {
  href: string;
  title: string;
  description: string;
  eyebrow: string;
  icon: ReactNode;
  tone?: FilterRecommendationTone;
  badges?: FilterRecommendationBadge[];
  footer?: string;
  ariaLabel?: string;
  testId?: string;
}

const toneConfig: Record<
  FilterRecommendationTone,
  { accent: string; icon: string; wash: string; border: string }
> = {
  primary: {
    accent: "bg-emerald-500",
    icon: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    wash: "from-emerald-500/[0.08] via-card to-card",
    border: "group-hover:border-emerald-500/45",
  },
  secondary: {
    accent: "bg-amber-500",
    icon: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    wash: "from-amber-500/[0.08] via-card to-card",
    border: "group-hover:border-amber-500/45",
  },
  optional: {
    accent: "bg-slate-400",
    icon: "bg-muted text-muted-foreground",
    wash: "from-muted/70 via-card to-card",
    border: "group-hover:border-primary/35",
  },
};

/**
 * Superfície navegável única para recomendações do filtro.
 *
 * O card inteiro é um único link: não há botão, âncora ou outro controle
 * interativo aninhado. Isso preserva semântica, foco por teclado e uma área de
 * toque ampla e previsível em dispositivos móveis.
 */
export function FilterRecommendationLinkCard({
  href,
  title,
  description,
  eyebrow,
  icon,
  tone = "optional",
  badges = [],
  footer,
  ariaLabel,
  testId,
}: FilterRecommendationLinkCardProps) {
  const visual = toneConfig[tone];

  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? `Abrir ${title}`}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      data-testid={testId}
    >
      <Card
        className={`relative h-full overflow-hidden rounded-2xl border-border/75 bg-gradient-to-br ${visual.wash} shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 ${visual.border} group-hover:shadow-lg`}
      >
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 w-1 ${visual.accent}`}
        />
        <CardContent className="flex h-full items-start gap-3 p-4 pl-5">
          <div
            aria-hidden="true"
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${visual.icon}`}
          >
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {eyebrow}
            </span>
            <span className="mt-0.5 block text-sm font-bold leading-snug text-foreground">
              {title}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {description}
            </span>
            {badges.length > 0 && (
              <div
                className="mt-3 flex flex-wrap gap-1.5"
                aria-label="Características da recomendação"
              >
                {badges.map((badge) => (
                  <Badge
                    key={`${badge.variant ?? "secondary"}-${badge.label}`}
                    variant={badge.variant ?? "secondary"}
                    className="max-w-full whitespace-normal text-left text-[10px] leading-tight"
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}
            {footer && (
              <span className="mt-3 block border-t border-border/60 pt-2 text-[10px] font-medium leading-relaxed text-muted-foreground">
                {footer}
              </span>
            )}
          </div>

          <span
            aria-hidden="true"
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:border-primary/40 group-hover:text-primary"
          >
            <ArrowRight className="h-4 w-4" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
