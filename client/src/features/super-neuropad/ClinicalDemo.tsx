import type { CircuitDemo } from "./clinicalCircuit";

/**
 * Demonstrações animadas e curtas da técnica: ilustração vetorial em loop, sem vídeo, sem foto
 * e sem imagem de criança. Não representam resultado normal ou alterado.
 * Movimento desligado quando o sistema pede redução de animação.
 */
const DEMO_CSS = `
@keyframes snp-demo-sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
@keyframes snp-demo-track{0%,100%{transform:translate(-70px,0)}50%{transform:translate(70px,0)}}
@keyframes snp-demo-step{0%{opacity:0}10%,70%{opacity:1}85%,100%{opacity:0}}
@keyframes snp-demo-reach{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,-62px)}}
.snp-demo-anim{animation-iteration-count:infinite;animation-timing-function:ease-in-out}
@media (prefers-reduced-motion: reduce){.snp-demo-anim{animation:none!important}}
`;

const CAPTIONS: Record<CircuitDemo, string> = {
  romberg: "Pés juntos, braços ao lado e examinador próximo para proteção. Observe a oscilação e o apoio necessário.",
  tandem: "Calcanhar encostado na ponta do pé oposto, em linha reta, braços livres. Observe desvios e apoios.",
  "dedo-nariz": "Toque a ponta do próprio nariz e depois o alvo do examinador, alternando as mãos. Observe trajetória e precisão.",
  seguimento: "Siga o alvo somente com os olhos, sem mover a cabeça. Observe suavidade, saltos e alinhamento.",
};

function Figure({ x }: { x: number }) {
  return (
    <>
      <circle cx={x} cy={40} r={12} />
      <line x1={x} y1={52} x2={x} y2={110} />
      <line x1={x} y1={64} x2={x - 16} y2={106} />
      <line x1={x} y1={64} x2={x + 16} y2={106} />
      <line x1={x} y1={110} x2={x - 7} y2={160} />
      <line x1={x} y1={110} x2={x + 7} y2={160} />
    </>
  );
}

function Illustration({ kind }: { kind: CircuitDemo }) {
  if (kind === "romberg") {
    return (
      <svg viewBox="0 0 200 170" role="img" aria-label="Animação: pessoa em pé com pés juntos, oscilando de leve, e examinador ao lado">
        <g className="snp-demo-anim" style={{ transformOrigin: "70px 160px", animation: "snp-demo-sway 3s ease-in-out infinite" }}>
          <Figure x={70} />
        </g>
        <g opacity={0.4}><Figure x={150} /></g>
        <text x={150} y={20} textAnchor="middle" fontSize={11} fill="currentColor">examinador</text>
      </svg>
    );
  }
  if (kind === "tandem") {
    return (
      <svg viewBox="0 0 240 110" role="img" aria-label="Animação: pegadas em linha, calcanhar encostado na ponta do pé oposto">
        <line x1={10} y1={55} x2={230} y2={55} strokeDasharray="4 4" opacity={0.35} />
        {Array.from({ length: 6 }, (_, index) => (
          <ellipse key={index} cx={30 + index * 36} cy={55} rx={6} ry={13} fill="currentColor" stroke="none"
            className="snp-demo-anim" style={{ opacity: 0, animation: "snp-demo-step 3.6s linear infinite", animationDelay: `${index * 0.5}s` }} />
        ))}
      </svg>
    );
  }
  if (kind === "dedo-nariz") {
    return (
      <svg viewBox="0 0 200 170" role="img" aria-label="Animação: dedo sai do alvo do examinador e toca o nariz e volta">
        <circle cx={100} cy={60} r={36} opacity={0.4} />
        <circle cx={100} cy={78} r={3} fill="currentColor" />
        <rect x={142} y={132} width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} />
        <circle className="snp-demo-anim" cx={150} cy={140} r={6} fill="currentColor"
          style={{ animation: "snp-demo-reach 2.8s ease-in-out infinite" }} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 110" role="img" aria-label="Animação: alvo se move na horizontal enquanto os olhos o seguem">
      <ellipse cx={60} cy={55} rx={22} ry={14} fill="none" stroke="currentColor" strokeWidth={2} />
      <ellipse cx={140} cy={55} rx={22} ry={14} fill="none" stroke="currentColor" strokeWidth={2} />
      <circle className="snp-demo-anim" cx={100} cy={55} r={6} fill="currentColor"
        style={{ animation: "snp-demo-track 3.2s ease-in-out infinite" }} />
    </svg>
  );
}

export function ClinicalDemo({ kind }: { kind: CircuitDemo }) {
  return (
    <figure className="flex flex-col items-center gap-2 rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-3 text-[var(--snp-ink-fixed)] sm:flex-row sm:items-center">
      <style>{DEMO_CSS}</style>
      <div className="h-36 w-40 shrink-0">
        <Illustration kind={kind} />
      </div>
      <figcaption className="text-xs font-semibold leading-relaxed">
        <strong>Demonstração da técnica.</strong> {CAPTIONS[kind]} Não é gravação de criança.
      </figcaption>
    </figure>
  );
}
