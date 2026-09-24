import type { Point } from "./engine";

/** Evidence only: no input handlers, supplied model or generated interpretation. */
export function DrawingPreview({ strokes }: { strokes: Point[][] }) {
  if (!strokes.length) return <p>Nenhum traçado digital foi registrado. Isso não demonstra incapacidade.</p>;
  return <figure>
    <svg viewBox="0 0 800 400" className="ot-draw-area" role="img" aria-label="Traçado digital registrado, somente para revisão">
      {strokes.map((points, i) => points.length === 1 ? <circle key={i} cx={points[0].x * 800} cy={points[0].y * 400} r="2" fill="currentColor" /> : <polyline key={i} points={points.map((p) => `${p.x * 800},${p.y * 400}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />)}
    </svg>
    <figcaption>Registro digital da tentativa. Não é escrita em papel; uma interrupção pode deixar o último traço parcial.</figcaption>
  </figure>;
}
