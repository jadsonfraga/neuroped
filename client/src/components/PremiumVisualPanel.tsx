import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/SafeImage";
import { SafeAssetImage, brandAssets } from "@/components/BrandAssets";

interface PremiumVisualPanelProps {
  src: string;
  title: string;
  subtitle: string;
  badge?: string;
  className?: string;
  imageClassName?: string;
  headingLevel?: "h1" | "h2" | "p";
}

export function PremiumVisualPanel({
  src,
  title,
  subtitle,
  badge = "NeuroPed",
  className = "",
  imageClassName = "",
  headingLevel = "p",
}: PremiumVisualPanelProps) {
  const TitleTag = headingLevel;
  const titleSize =
    headingLevel === "h1"
      ? "text-[1.45rem] sm:text-[1.75rem]"
      : "text-base sm:text-lg";

  return (
    <aside
      className={`np-brand-visual-panel relative overflow-hidden rounded-[1.85rem] border border-border/70 bg-card/88 shadow-sm backdrop-blur ${className}`}
    >
      <SafeImage
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-cover opacity-[0.18] saturate-[0.82] contrast-[1.03] dark:opacity-[0.14] ${imageClassName}`}
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(100deg,hsl(var(--background)/0.98)_0%,hsl(var(--background)/0.94)_48%,hsl(var(--background)/0.58)_78%,hsl(var(--background)/0.35)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/55 to-transparent"
        aria-hidden="true"
      />

      <div className="relative grid min-h-44 items-stretch sm:grid-cols-[minmax(0,1fr)_13rem] lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="flex flex-col justify-end p-5 sm:p-6">
          <Badge
            variant="outline"
            className="mb-3 w-fit border-amber-500/25 bg-background/80 text-[10px] uppercase tracking-[0.14em] text-amber-800 backdrop-blur dark:text-amber-300"
          >
            {badge}
          </Badge>
          <TitleTag
            className={`max-w-2xl font-semibold leading-[1.08] tracking-[-0.02em] text-foreground ${titleSize}`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </TitleTag>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
            {subtitle}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
            <span
              className="h-1.5 w-1.5 rounded-full bg-amber-500"
              aria-hidden="true"
            />
            <span className="text-amber-700 dark:text-amber-300">NeuroPed SDG</span>
            <span aria-hidden="true">·</span>
            <span>Neuropediatria infantil</span>
          </div>
        </div>

        <div className="relative hidden overflow-hidden border-l border-amber-500/15 sm:block">
          <SafeAssetImage
            src={brandAssets.mascots.consultorioFull}
            alt="Dr. Jadson Fraga no consultório"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[hsl(214_76%_11%/0.38)] via-transparent to-[hsl(0_0%_100%/0.06)]"
            aria-hidden="true"
          />
          <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/30 bg-[hsl(214_76%_11%/0.76)] px-3 py-2 text-white shadow-lg backdrop-blur-md">
            <p className="text-[10px] font-semibold">Dr. Jadson Fraga</p>
            <p className="mt-0.5 text-[8px] uppercase tracking-[0.12em] text-amber-200">
              Neuropediatra
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
