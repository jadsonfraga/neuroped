import { Badge } from "@/components/ui/badge";

interface PremiumVisualPanelProps {
  src: string;
  title: string;
  subtitle: string;
  badge?: string;
  className?: string;
  imageClassName?: string;
}

export function PremiumVisualPanel({
  src,
  title,
  subtitle,
  badge = "NeuroPed",
  className = "",
  imageClassName = "",
}: PremiumVisualPanelProps) {
  return (
    <aside className={`relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/85 shadow-sm backdrop-blur ${className}`}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-cover opacity-22 saturate-[0.86] contrast-[1.02] dark:opacity-24 ${imageClassName}`}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/96 via-background/88 to-background/62" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden="true" />
      <div className="relative flex min-h-36 flex-col justify-end p-4 sm:p-5">
        <Badge variant="outline" className="mb-2 w-fit bg-background/75 text-[10px] uppercase tracking-[0.14em] backdrop-blur">
          {badge}
        </Badge>
        <p className="text-sm font-black leading-tight text-foreground sm:text-base">{title}</p>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>
    </aside>
  );
}
