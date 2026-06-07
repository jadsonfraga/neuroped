import { useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  fallbackLabel?: string;
}

/**
 * Renderiza imagens com fallback visual consistente.
 *
 * Regras de uso:
 * - preserve `object-contain` para logos, escudos, QR codes e imagens que não podem cortar;
 * - use `object-cover` apenas em banners/fotos decorativas, com container de proporção explícita;
 * - se o asset falhar, mantém o layout estável e evita tela quebrada.
 */
export function SafeImage({
  src,
  alt = "",
  className,
  fallbackLabel = "Imagem indisponível",
  onError,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const decorative = alt === "" || props["aria-hidden"] === true || props["aria-hidden"] === "true";

  if (failed) {
    return (
      <div
        className={cn(
          "flex min-h-10 min-w-10 items-center justify-center overflow-hidden bg-muted text-muted-foreground",
          className,
        )}
        aria-hidden={decorative ? true : undefined}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : alt || fallbackLabel}
      >
        {!decorative && (
          <div className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-center">
            <ImageOff className="h-4 w-4 opacity-70" aria-hidden="true" />
            <span className="max-w-28 text-[10px] font-semibold leading-tight opacity-80">
              {fallbackLabel}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}
