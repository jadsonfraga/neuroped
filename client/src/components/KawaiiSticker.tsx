/**
 * KawaiiSticker.tsx — figurinhas kawaii do NeuroPed em SVG inline.
 *
 * 12 personagens fofos (olhinhos redondos, sorriso e bochechas) desenhados em
 * vetor puro — nenhuma imagem binária nova. Todas as cores vêm de tokens CSS
 * (var(--kw-*), definidos em styles/tokens.css), mantendo o guard de design
 * (audit:design) sem valores crus e os dois temas coerentes.
 *
 * Uso:
 *   <KawaiiSticker name="estrela" size={40} />
 *   <KawaiiStickerRow names={["estrela", "coracao", "dino"]} />
 *
 * Sempre decorativas: aria-hidden por padrão, sem foco nem clique. As
 * animações (.np-sticker-float/.np-sticker-pop) vivem no CSS global e são
 * desativadas sob prefers-reduced-motion.
 */
import type { CSSProperties, ReactNode } from "react";

export type KawaiiStickerName =
  | "estrela"
  | "nuvem"
  | "coracao"
  | "cerebro"
  | "lapis"
  | "lua"
  | "sol"
  | "gatinho"
  | "dino"
  | "florzinha"
  | "balao"
  | "arcoiris";

/** Carinha kawaii padrão: dois olhinhos, sorriso e bochechas. */
function Face({
  cx = 32,
  cy = 34,
  gap = 7.5,
  scale = 1,
}: {
  cx?: number;
  cy?: number;
  gap?: number;
  scale?: number;
}) {
  const r = 2.4 * scale;
  const blushR = 2.8 * scale;
  const blushDx = gap + 5.5 * scale;
  return (
    <g>
      <circle cx={cx - gap} cy={cy} r={r} fill="var(--kw-ink)" />
      <circle cx={cx + gap} cy={cy} r={r} fill="var(--kw-ink)" />
      <circle cx={cx - gap + r * 0.35} cy={cy - r * 0.4} r={r * 0.32} fill="var(--kw-white)" />
      <circle cx={cx + gap + r * 0.35} cy={cy - r * 0.4} r={r * 0.32} fill="var(--kw-white)" />
      <path
        d={`M ${cx - 3.4 * scale} ${cy + 4.6 * scale} Q ${cx} ${cy + 7.6 * scale} ${cx + 3.4 * scale} ${cy + 4.6 * scale}`}
        stroke="var(--kw-ink)"
        strokeWidth={1.7 * scale}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={cx - blushDx} cy={cy + 3.2 * scale} r={blushR} fill="var(--kw-blush)" opacity="0.85" />
      <circle cx={cx + blushDx} cy={cy + 3.2 * scale} r={blushR} fill="var(--kw-blush)" opacity="0.85" />
    </g>
  );
}

const art: Record<KawaiiStickerName, ReactNode> = {
  estrela: (
    <g>
      <path
        d="M32 4 L39.6 22.4 L59 24 L44.4 37.2 L48.8 56.4 L32 46.4 L15.2 56.4 L19.6 37.2 L5 24 L24.4 22.4 Z"
        fill="var(--kw-star)"
        stroke="var(--kw-star-deep)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="12" r="1.8" fill="var(--kw-star-deep)" opacity="0.7" />
      <circle cx="52" cy="10" r="1.4" fill="var(--kw-star-deep)" opacity="0.7" />
      <Face cy={33} gap={6.5} scale={0.95} />
    </g>
  ),
  nuvem: (
    <g>
      <path
        d="M16 46 a10 10 0 0 1 -1.5-19.9 A13 13 0 0 1 39.5 21 A11 11 0 0 1 49 46 Z"
        fill="var(--kw-cloud)"
        stroke="var(--kw-cloud-deep)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <ellipse cx="24" cy="30" rx="5" ry="3" fill="var(--kw-shine)" />
      <Face cy={36} gap={7} scale={0.95} />
    </g>
  ),
  coracao: (
    <g>
      <path
        d="M32 55 C15 43 7 33 9.5 22.5 C11.5 14 20 10 26.5 13.6 C29 15 31 17.4 32 20 C33 17.4 35 15 37.5 13.6 C44 10 52.5 14 54.5 22.5 C57 33 49 43 32 55 Z"
        fill="var(--kw-heart)"
        stroke="var(--kw-heart-deep)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <ellipse cx="21" cy="22" rx="4.4" ry="2.8" transform="rotate(-24 21 22)" fill="var(--kw-shine)" />
      <Face cy={31} gap={7} scale={0.95} />
    </g>
  ),
  cerebro: (
    <g>
      <path
        d="M30 8 C22 8 18 13 18 17 C12 18 9 24 11 29 C8 33 9 40 14 43 C15 50 22 54 28 52 L30 51 C31 52 33 52 34 51 L36 52 C42 54 49 50 50 43 C55 40 56 33 53 29 C55 24 52 18 46 17 C46 13 42 8 34 8 C32.5 8 31.5 8 30 8 Z"
        fill="var(--kw-brain)"
        stroke="var(--kw-brain-deep)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M32 10 V 50 M22 18 C26 20 27 24 24 27 M42 18 C38 20 37 24 40 27 M17 32 C22 31 25 33 25 37 M47 32 C42 31 39 33 39 37"
        stroke="var(--kw-brain-deep)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.65"
      />
      <Face cy={33} gap={7.5} scale={0.95} />
    </g>
  ),
  lapis: (
    <g transform="rotate(38 32 32)">
      <rect x="24" y="4" width="16" height="8" rx="2.5" fill="var(--kw-heart)" stroke="var(--kw-heart-deep)" strokeWidth="1.8" />
      <rect x="24" y="12" width="16" height="34" fill="var(--kw-pencil)" stroke="var(--kw-star-deep)" strokeWidth="1.8" />
      <path d="M24 46 L32 60 L40 46 Z" fill="var(--kw-pencil-wood)" stroke="var(--kw-star-deep)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M29.4 55.4 L32 60 L34.6 55.4 Z" fill="var(--kw-pencil-tip)" />
      <Face cx={32} cy={26} gap={5} scale={0.8} />
    </g>
  ),
  lua: (
    <g>
      <path
        d="M42 6 A26 26 0 1 0 58 40 A20 20 0 0 1 42 6 Z"
        fill="var(--kw-moon)"
        stroke="var(--kw-moon-deep)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="22" r="2.6" fill="var(--kw-moon-deep)" opacity="0.5" />
      <circle cx="14" cy="38" r="1.8" fill="var(--kw-moon-deep)" opacity="0.5" />
      <path d="M52 12 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 Z" fill="var(--kw-star)" />
      <Face cx={27} cy={38} gap={6.5} scale={0.95} />
    </g>
  ),
  sol: (
    <g>
      <g stroke="var(--kw-sun-ray)" strokeWidth="3.4" strokeLinecap="round">
        <path d="M32 3 V 10" />
        <path d="M32 54 V 61" />
        <path d="M3 32 H 10" />
        <path d="M54 32 H 61" />
        <path d="M11.5 11.5 L 16.5 16.5" />
        <path d="M47.5 47.5 L 52.5 52.5" />
        <path d="M11.5 52.5 L 16.5 47.5" />
        <path d="M47.5 16.5 L 52.5 11.5" />
      </g>
      <circle cx="32" cy="32" r="18" fill="var(--kw-sun)" stroke="var(--kw-star-deep)" strokeWidth="2" />
      <ellipse cx="25" cy="24" rx="4" ry="2.6" transform="rotate(-20 25 24)" fill="var(--kw-shine)" />
      <Face cy={31} gap={6.5} scale={0.95} />
    </g>
  ),
  gatinho: (
    <g>
      <path d="M12 22 L14 7 L26 15 Z" fill="var(--kw-cat)" stroke="var(--kw-cat-deep)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M52 22 L50 7 L38 15 Z" fill="var(--kw-cat)" stroke="var(--kw-cat-deep)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M15.5 12 L16.5 8.8 L21 11.6 Z" fill="var(--kw-blush)" />
      <path d="M48.5 12 L47.5 8.8 L43 11.6 Z" fill="var(--kw-blush)" />
      <ellipse cx="32" cy="35" rx="23" ry="21" fill="var(--kw-cat)" stroke="var(--kw-cat-deep)" strokeWidth="2" />
      <g stroke="var(--kw-cat-deep)" strokeWidth="1.4" strokeLinecap="round" opacity="0.8">
        <path d="M6 32 L 14 34" />
        <path d="M6 40 L 14 39" />
        <path d="M58 32 L 50 34" />
        <path d="M58 40 L 50 39" />
      </g>
      <path d="M30 40.5 L34 40.5 L32 43 Z" fill="var(--kw-heart-deep)" />
      <Face cy={34} gap={8.5} scale={1} />
    </g>
  ),
  dino: (
    <g>
      <path
        d="M20 58 C12 54 8 45 9 36 C10 25 18 17 29 16 C31 10 38 8 43 12 C47 15 48 20 46 25 C52 29 55 37 53 44 C51 52 44 58 35 58 Z"
        fill="var(--kw-dino)"
        stroke="var(--kw-dino-deep)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <g fill="var(--kw-dino-deep)" opacity="0.9">
        <path d="M25 16.5 L28 10 L31 16 Z" />
        <path d="M33 15 L36 8.5 L39 14.5 Z" />
        <path d="M41 15.5 L44.5 10 L46 16.5 Z" />
      </g>
      <circle cx="20" cy="42" r="2.2" fill="var(--kw-dino-deep)" opacity="0.5" />
      <circle cx="45" cy="47" r="1.8" fill="var(--kw-dino-deep)" opacity="0.5" />
      <Face cy={36} gap={7.5} scale={1} />
    </g>
  ),
  florzinha: (
    <g>
      <g fill="var(--kw-flower)" stroke="var(--kw-brain-deep)" strokeWidth="1.8">
        <ellipse cx="32" cy="13" rx="8.5" ry="10" />
        <ellipse cx="50" cy="26" rx="8.5" ry="10" transform="rotate(72 50 26)" />
        <ellipse cx="43" cy="47" rx="8.5" ry="10" transform="rotate(144 43 47)" />
        <ellipse cx="21" cy="47" rx="8.5" ry="10" transform="rotate(-144 21 47)" />
        <ellipse cx="14" cy="26" rx="8.5" ry="10" transform="rotate(-72 14 26)" />
      </g>
      <circle cx="32" cy="32" r="13.5" fill="var(--kw-flower-center)" stroke="var(--kw-star-deep)" strokeWidth="1.8" />
      <Face cy={30} gap={5.5} scale={0.85} />
    </g>
  ),
  balao: (
    <g>
      <path
        d="M32 4 C43 4 51 12.5 51 23.5 C51 35 42 45 32 48 C22 45 13 35 13 23.5 C13 12.5 21 4 32 4 Z"
        fill="var(--kw-balloon)"
        stroke="var(--kw-balloon-deep)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M29 48 L35 48 L32 52.5 Z" fill="var(--kw-balloon-deep)" />
      <path d="M32 52.5 C 30 56 34 58 32 61.5" stroke="var(--kw-balloon-deep)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <ellipse cx="23" cy="14" rx="4.5" ry="3" transform="rotate(-30 23 14)" fill="var(--kw-shine)" />
      <Face cy={26} gap={7} scale={0.95} />
    </g>
  ),
  arcoiris: (
    <g>
      <g fill="none" strokeLinecap="round">
        <path d="M10 46 A22 22 0 0 1 54 46" stroke="var(--kw-rainbow-1)" strokeWidth="5" />
        <path d="M15 46 A17 17 0 0 1 49 46" stroke="var(--kw-rainbow-2)" strokeWidth="5" />
        <path d="M20 46 A12 12 0 0 1 44 46" stroke="var(--kw-rainbow-3)" strokeWidth="5" />
        <path d="M25 46 A7 7 0 0 1 39 46" stroke="var(--kw-rainbow-4)" strokeWidth="5" />
      </g>
      <g>
        <ellipse cx="13" cy="47" rx="8" ry="6" fill="var(--kw-cloud)" stroke="var(--kw-cloud-deep)" strokeWidth="1.8" />
        <ellipse cx="51" cy="47" rx="8" ry="6" fill="var(--kw-cloud)" stroke="var(--kw-cloud-deep)" strokeWidth="1.8" />
      </g>
      <Face cx={13} cy={46} gap={3.2} scale={0.55} />
      <Face cx={51} cy={46} gap={3.2} scale={0.55} />
    </g>
  ),
};

export const kawaiiStickerNames = Object.keys(art) as KawaiiStickerName[];

export interface KawaiiStickerProps {
  name: KawaiiStickerName;
  /** Lado do quadrado em px (default 40). */
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Balanço lento contínuo (desligado sob prefers-reduced-motion). */
  float?: boolean;
  /** Entrada com "pop" suave (desligado sob prefers-reduced-motion). */
  pop?: boolean;
  /** Rótulo acessível; sem ele a figurinha é puramente decorativa. */
  label?: string;
}

export function KawaiiSticker({
  name,
  size = 40,
  className = "",
  style,
  float = false,
  pop = false,
  label,
}: KawaiiStickerProps) {
  const motionClass = `${float ? " np-sticker-float" : ""}${pop ? " np-sticker-pop" : ""}`;
  return (
    <span
      className={`np-sticker${motionClass} ${className}`.trim()}
      style={style}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      data-kawaii={name}
    >
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        {art[name]}
      </svg>
    </span>
  );
}

/** Fileira de figurinhas para headers, celebrações e estados vazios. */
export function KawaiiStickerRow({
  names,
  size = 32,
  className = "",
  float = false,
  pop = true,
}: {
  names: KawaiiStickerName[];
  size?: number;
  className?: string;
  float?: boolean;
  pop?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`.trim()} aria-hidden="true">
      {names.map((name, index) => (
        <KawaiiSticker key={`${name}-${index}`} name={name} size={size} float={float} pop={pop} />
      ))}
    </span>
  );
}
