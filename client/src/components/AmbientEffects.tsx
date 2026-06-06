import { useEffect, useState } from "react";

/**
 * Camada de efeitos ambiente — porta de `ambient-effects.js` (app legado).
 *
 * Renderiza três camadas fixas, puramente decorativas, atrás do conteúdo:
 *  1. Aurora que "respira" (gradientes radiais violeta/ciano em loop lento).
 *  2. Ruído cinematográfico ultrassutil (SVG fractalNoise, opacity ~0.035).
 *  3. Partículas de glow que flutuam (3 em telas pequenas, 5 nas maiores).
 *
 * Tudo `pointer-events: none`, `aria-hidden`, e o CSS desliga a animação em
 * `prefers-reduced-motion` e esconde a camada em impressão (ver index.css).
 */

const NOISE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">' +
    '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>' +
    '<feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.7 0"/></filter>' +
    '<rect width="100%" height="100%" filter="url(%23n)"/></svg>'
)}`;

const PALETTE = [
  "rgba(167,139,250,.5)",
  "rgba(56,189,248,.4)",
  "rgba(34,211,238,.35)",
  "rgba(124,92,255,.45)",
  "rgba(139,92,246,.4)",
];

interface Particle {
  left: string;
  top: string;
  size: number;
  color: string;
  durationS: number;
  delayS: number;
}

function buildParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    left: `${12 + i * 21 + (i % 2 ? 4 : -3)}%`,
    top: `${8 + i * 18}%`,
    size: 220 + (i % 3) * 90,
    color: PALETTE[i % PALETTE.length],
    durationS: 16 + i * 3,
    delayS: i * -2.4,
  }));
}

export function AmbientEffects() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Em telas pequenas reduz a 3 partículas — cada uma tem blur(40px) e pode
    // pesar na GPU de tablets/celulares modestos (mesma lógica do legado).
    const count = window.innerWidth < 520 ? 3 : 5;
    setParticles(buildParticles(count));
  }, []);

  return (
    <>
      <div className="np-ambient-layer np-ambient-aurora" aria-hidden="true" />
      <div
        className="np-ambient-layer np-ambient-noise"
        aria-hidden="true"
        style={{ backgroundImage: `url("${NOISE_SVG}")` }}
      />
      <div className="np-ambient-layer np-ambient-particles" aria-hidden="true">
        {particles.map((p, i) => (
          <div
            key={i}
            className="np-particle"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              background: `radial-gradient(circle, ${p.color}, transparent 65%)`,
              animationDuration: `${p.durationS}s`,
              animationDelay: `${p.delayS}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}
