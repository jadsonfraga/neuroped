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
    <aside className={`relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/80 shadow-sm backdrop-blur ${className}`}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover opacity-30 saturate-[0.9] contrast-[1.05] ${imageClassName}`}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/82 to-background/45" aria-hidden="true" />
      <div className="relative flex min-h-40 flex-col justify-end p-4">
        <Badge variant="outline" className="mb-2 w-fit bg-background/70 text-[10px] uppercase tracking-[0.14em] backdrop-blur">
          {badge}
        </Badge>
        <p className="text-sm font-black leading-tight text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>
    </aside>
  );
}
