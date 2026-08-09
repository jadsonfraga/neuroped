/**
 * Camada de efeitos ambiente — porta de `ambient-effects.js` (app legado).
 *
 * Renderiza três camadas fixas, puramente decorativas, atrás do conteúdo:
 *  1. Aurora que "respira" (gradientes radiais violeta/ciano em loop lento).
 *  2. Ruído cinematográfico ultrassutil (SVG fractalNoise, opacity ~0.035).
 * A aurora e o ruído são estáticos para não competir com o conteúdo clínico.
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

export function AmbientEffects() {
  return (
    <>
      <div className="np-ambient-layer np-ambient-aurora" aria-hidden="true" />
      <div
        className="np-ambient-layer np-ambient-noise"
        aria-hidden="true"
        style={{ backgroundImage: `url("${NOISE_SVG}")` }}
      />
    </>
  );
}
