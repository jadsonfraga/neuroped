import { useEffect, useMemo, useRef, useState } from "react";
import { Ban, Check, Delete, Eraser, Eye, Hand, Repeat, Smartphone, Volume2, X } from "lucide-react";
import { softTap } from "@/lib/softSounds";
import { Stimulus as VrStimulus } from "@/features/visual-recognition/Stimulus";
import { GESTURE_SHORTCUT, KIND_LABELS, ORIGIN_LABELS, shuffle, type AnswerStatus, type BuildItem, type JudgedItem, type Option, type ShapeId, type TouchItem } from "@/features/super-neuropad/model";

export const PREVIEW_SECONDS = 5;

export const OPTION_TINTS = ["bg-[var(--snp-berry-tint)]", "bg-[var(--snp-sky-tint)]", "bg-[var(--snp-sun-tint)]", "bg-[var(--snp-grass-tint)]"];

export type Tone = "sun" | "sky" | "grass" | "berry" | "lilac" | "paper" | "slate";

export function ArcadeButton({ tone = "sun", className = "", children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button type="button" className={`snp-btn snp-btn--${tone} inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function ShapeArt({ shape }: { shape: ShapeId }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 120 120" className="h-40 w-40 sm:h-52 sm:w-52" role="img" aria-label={`Figura para copiar: ${shape}`}>
      {shape === "circulo" && <circle cx="60" cy="60" r="44" {...common} />}
      {shape === "cruz" && (<><line x1="60" y1="14" x2="60" y2="106" {...common} /><line x1="14" y1="60" x2="106" y2="60" {...common} /></>)}
      {shape === "quadrado" && <rect x="18" y="18" width="84" height="84" {...common} />}
      {shape === "triangulo" && <polygon points="60,14 108,104 12,104" {...common} />}
      {shape === "losango" && <polygon points="60,10 110,60 60,110 10,60" {...common} />}
      {shape === "pentagono" && <polygon points="60,10 109,46 90,106 30,106 11,46" {...common} />}
    </svg>
  );
}

export function VrFigure({ id, size = "md" }: { id: string; size?: "md" | "lg" }) {
  // Figura do banco do Reconhecimento Visual, desenhada pelo componente de lá; `child` evita que o texto alternativo entregue a resposta.
  return <span className={`snp-vr block ${size === "lg" ? "h-40 w-40 sm:h-52 sm:w-52" : "h-24 w-24 sm:h-32 sm:w-32"}`}><VrStimulus id={id} child /></span>;
}

export function StimulusView({ item }: { item: JudgedItem }) {
  if (item.kind === "fazer" && item.shape) return <ShapeArt shape={item.shape} />;
  if (item.kind === "fala" && item.stimulusVr) return <VrFigure id={item.stimulusVr} size="lg" />;
  const text = item.stimulus;
  if (!text) return null;
  const long = text.length > 12;
  return (
    <div className={`max-w-full break-words text-center font-black leading-tight ${long ? "text-2xl sm:text-4xl" : "text-6xl sm:text-8xl"}`} aria-label={`Estímulo: ${text}`}>
      {text}
    </div>
  );
}

export function RepeatToggle({ repeated, onToggle }: { repeated: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={repeated}
      onClick={() => { softTap(); onToggle(); }}
      className={`snp-chip ${repeated ? "bg-[var(--snp-sun)]" : ""}`}
      title="Marque se precisou repetir o comando (permitido uma vez). Fica no registro."
    >
      <Repeat className="h-3.5 w-3.5" /> {repeated ? "Comando repetido 1x" : "Repeti o comando"}
    </button>
  );
}

export function TurnCue({ who }: { who: "crianca" | "aplicadora" }) {
  const child = who === "crianca";
  return (
    <span className={`snp-chip ${child ? "bg-[var(--snp-grass-tint)]" : "bg-[var(--snp-sun-tint)]"}`}>
      <Smartphone className="h-3.5 w-3.5" /> {child ? "Tela para a criança" : "Tela para você"}
    </span>
  );
}

export function TouchStage({ item, order, paused, onAnswer }: { item: TouchItem; order: Option[]; paused: boolean; onAnswer: (chosen: Option | null, event: React.MouseEvent) => void }) {
  const [revealed, setRevealed] = useState(!item.preview);
  const [left, setLeft] = useState(PREVIEW_SECONDS);
  const options = order;
  useEffect(() => {
    if (paused || revealed || !item.preview) return;
    // Exposição padronizada: esconde sozinho ao fim da contagem; a aplicadora pode esconder antes.
    const timer = window.setInterval(() => setLeft((current) => current - 1), 1000);
    return () => window.clearInterval(timer);
  }, [paused, revealed, item.preview]);
  useEffect(() => { if (left <= 0) setRevealed(true); }, [left]);
  if (!revealed && item.preview) {
    return (
      <div className="flex flex-col items-center gap-6 py-6">
        <p className="snp-pixel text-center text-sm opacity-80">Olhe bem para as figuras…</p>
        <div className={`snp-float ${item.sequence ? "whitespace-nowrap text-3xl tracking-tight sm:text-6xl" : "text-7xl sm:text-8xl"}`} aria-label={`Figuras mostradas: ${item.preview}`}>{item.preview}</div>
        <div className="snp-pixel flex h-14 w-14 items-center justify-center rounded-full border-[4px] border-[var(--snp-ink-fixed)] bg-[var(--snp-sun)] text-2xl text-[var(--snp-ink-fixed)]" role="timer" aria-label={`Esconde em ${left} segundos`}>{left}</div>
        <ArcadeButton tone="sky" className="px-6 py-3 text-base" onClick={() => { softTap(); setRevealed(true); }}>
          <Check className="h-5 w-5" /> Já olhou · esconder
        </ArcadeButton>
        <p className="text-xs font-bold opacity-70">Aplicadora: as figuras somem sozinhas em {PREVIEW_SECONDS} segundos; pode esconder antes.</p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="snp-chip"><Volume2 className="h-3.5 w-3.5" /> Leia em voz alta</span>
        <TurnCue who="crianca" />
      </div>
      {item.context && <p className="snp-panel snp-panel--soft mx-auto max-w-2xl p-3 text-center text-sm font-bold text-[var(--snp-ink-fixed)]">Aplicadora, leia antes: “{item.context}”</p>}
      <p className="text-center text-2xl font-black leading-snug sm:text-3xl">{item.context ? item.prompt.replace(`Leia: “${item.context}” Depois: `, "") : item.prompt}</p>
      {item.stimulusVr && <div className="flex justify-center" aria-label="Modelo"><span className="rounded-2xl border-[3px] border-[var(--snp-ink-fixed)] bg-white p-2"><VrFigure id={item.stimulusVr} /></span></div>}
      {item.stimulus && <p className={`mx-auto max-w-3xl whitespace-pre-line break-words text-center font-black leading-snug ${item.stimulus.length > 40 ? "text-lg sm:text-xl" : "text-4xl sm:text-5xl"}`} aria-label={`Estímulo: ${item.stimulus}`}>{item.stimulus}</p>}
      <div className={`grid gap-4 ${item.sequence ? "grid-cols-1 sm:grid-cols-2" : options.length <= 2 ? "grid-cols-2" : options.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`} role="group" aria-label="Opções">
        {options.map((option, index) => (
          <button
            key={`${option.label}-${index}`}
            type="button"
            onClick={(event) => onAnswer(option, event)}
            className={`snp-option flex min-h-32 items-center justify-center p-3 text-center font-black ${option.vr ? "bg-white" : OPTION_TINTS[index % OPTION_TINTS.length]} ${item.sequence ? "whitespace-nowrap text-2xl tracking-tight sm:text-4xl" : item.big ? (option.size === "lg" ? "text-8xl" : option.size === "sm" ? "text-4xl" : "text-6xl") : "text-xl sm:text-2xl"}`}
            aria-label={option.vr ? `Opção ${index + 1}` : option.label}
          >
            {option.vr ? <VrFigure id={option.vr} /> : <span aria-hidden="true">{option.art}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Folha de desenho com o dedo: só na tela, nada é guardado nem exportado. */
export function DrawPad() {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * event.currentTarget.width, y: ((event.clientY - rect.top) / rect.height) * event.currentTarget.height };
  };
  const down = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawing.current = true;
    const { x, y } = point(event);
    context.lineWidth = 10; context.lineCap = "round"; context.lineJoin = "round"; context.strokeStyle = getComputedStyle(event.currentTarget).color; // cor do token (--snp-ink-fixed) via CSS
    context.beginPath(); context.moveTo(x, y); context.lineTo(x + 0.1, y + 0.1); context.stroke();
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const { x, y } = point(event);
    context.lineTo(x, y); context.stroke();
  };
  const up = () => { drawing.current = false; };
  const clear = () => { const element = canvas.current; element?.getContext("2d")?.clearRect(0, 0, element.width, element.height); };
  return (
    <div className="w-full space-y-2" data-testid="snp-drawpad">
      <canvas
        ref={canvas} width={720} height={420} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
        className="snp-drawpad block h-56 w-full touch-none rounded-2xl border-[3px] border-dashed border-[var(--snp-ink-fixed)] bg-white sm:h-72"
        aria-label="Área para desenhar ou escrever com o dedo. Nada é guardado."
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold opacity-70">Desenhe com o dedo. Nada é salvo: a aplicadora confere na hora.</span>
        <button type="button" className="snp-chip" onClick={() => { softTap(); clear(); }}><Eraser className="h-3.5 w-3.5" /> Limpar</button>
      </div>
    </div>
  );
}

export function MissBar({ onMiss }: { onMiss: (status: "sem_resposta" | "recusa", event: React.MouseEvent) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="snp-chip opacity-80 hover:opacity-100" onClick={(event) => onMiss("sem_resposta", event)}>
        Aplicadora: não respondeu · pular
      </button>
      <button type="button" className="snp-chip opacity-80 hover:opacity-100" onClick={(event) => onMiss("recusa", event)}>
        <Ban className="h-3.5 w-3.5" /> Recusou · pular
      </button>
    </div>
  );
}

export function JudgeStage({ item, onJudge }: { item: JudgedItem; onJudge: (status: AnswerStatus, event: React.MouseEvent, gesture?: boolean) => void }) {
  const drawn = item.kind === "fazer" && item.draw;
  return (
    <div className="space-y-5">
      {(drawn || item.stimulus || (item.kind === "fazer" && item.shape) || (item.kind === "fala" && item.stimulusVr)) && (
        <div className={`snp-panel flex min-h-40 items-center justify-center gap-4 p-6 ${drawn ? "flex-col sm:flex-row" : ""}`}>
          <StimulusView item={item} />
          {drawn && <DrawPad />}
        </div>
      )}
      <div className="snp-panel snp-panel--soft p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="snp-pixel text-[11px] opacity-80">Aplicadora · {KIND_LABELS[item.kind]} · {ORIGIN_LABELS[item.origin]}</div>
          {item.informant === "cuidador" && <span className="snp-chip bg-[var(--snp-sun-tint)]" data-testid="super-neuropad-caregiver">Relato do cuidador</span>}
          <TurnCue who="aplicadora" />
        </div>
        <p className="snp-clinical-instruction mt-1 font-black">{item.prompt}</p>
        <p className="snp-clinical-criterion mt-2"><span className="font-black">Conta como acerto:</span> {item.expected}</p>
        {item.gesture && <p className="mt-1 text-sm"><span className="font-black">Alternativa aceita:</span> {item.gesture}</p>}
        <div className={`mt-4 grid gap-3 ${item.gesture ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
          <ArcadeButton tone="grass" className="min-h-14 text-base" aria-keyshortcuts="1" onClick={(event) => onJudge("acerto", event)}>
            <Check className="h-5 w-5" /> Acertou
          </ArcadeButton>
          {item.gesture && (
            <ArcadeButton tone="grass" className="min-h-14 text-base" aria-keyshortcuts={GESTURE_SHORTCUT} onClick={(event) => onJudge("acerto", event, true)}>
              <Hand className="h-5 w-5" /> Acertou por gesto
            </ArcadeButton>
          )}
          <ArcadeButton tone="berry" className="min-h-14 text-base" aria-keyshortcuts="2" onClick={(event) => onJudge("erro", event)}>
            <X className="h-5 w-5" /> Errou
          </ArcadeButton>
          <ArcadeButton tone="slate" className="min-h-14 text-base" aria-keyshortcuts="3" onClick={(event) => onJudge("sem_resposta", event)}>
            Não respondeu
          </ArcadeButton>
          <ArcadeButton tone="paper" className="min-h-14 text-base" aria-keyshortcuts="4" onClick={(event) => onJudge("recusa", event)}>
            <Ban className="h-5 w-5" /> Recusou
          </ArcadeButton>
        </div>
        <p className="mt-2 hidden text-[11px] font-bold opacity-70 sm:block">Teclado: 1 Acertou{item.gesture ? ` · ${GESTURE_SHORTCUT} Acertou por gesto` : ""} · 2 Errou · 3 Não respondeu · 4 Recusou · P Pausa</p>
      </div>
    </div>
  );
}

/** Montar a palavra tocando nas letras na ordem (banco cognitivo). A tela confere sozinha. */
export function BuildStage({ item, seed, onDone }: { item: BuildItem; seed: number; onDone: (placed: string[], event: React.MouseEvent) => void }) {
  const tiles = useMemo(() => shuffle(item.tiles.map((letter, index) => ({ letter, index })), seed), [item, seed]);
  const [used, setUsed] = useState<number[]>([]);
  const [showWord, setShowWord] = useState(false);
  const placed = used.map((index) => item.tiles[index]);
  return (
    <div className="space-y-5" data-testid="snp-build">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="snp-chip"><Volume2 className="h-3.5 w-3.5" /> {item.show ? "Mostre a palavra" : "Dite a palavra"}</span>
        <TurnCue who="crianca" />
      </div>
      <p className="text-center text-2xl font-black leading-snug sm:text-3xl">{item.prompt}</p>
      {item.show ? (
        <p className="text-center text-5xl font-black tracking-widest" aria-label={`Modelo: ${item.word}`}>{item.word}</p>
      ) : (
        <div className="flex justify-center">
          <button type="button" className="snp-chip" aria-pressed={showWord} onClick={() => { softTap(); setShowWord((current) => !current); }}>
            <Eye className="h-3.5 w-3.5" /> {showWord ? `Ditar: ${item.word}` : "Aplicadora: ver a palavra para ditar"}
          </button>
        </div>
      )}
      <div className="flex min-h-20 flex-wrap items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-[var(--snp-ink-fixed)] bg-white p-3 text-[var(--snp-ink-fixed)]" aria-live="polite" aria-label="Palavra montada">
        {placed.length === 0 ? <span className="text-sm font-bold opacity-60">Toque nas letras abaixo</span> : placed.map((letter, index) => <span key={index} className="snp-pixel text-3xl">{letter}</span>)}
      </div>
      <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Letras">
        {tiles.map((tile) => {
          const taken = used.includes(tile.index);
          return (
            <button key={tile.index} type="button" disabled={taken} onClick={() => { softTap(); setUsed((current) => [...current, tile.index]); }}
              className={`snp-option flex h-16 w-16 items-center justify-center text-3xl font-black sm:h-20 sm:w-20 ${taken ? "opacity-30" : "bg-[var(--snp-sky-tint)]"}`}>
              {tile.letter}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <ArcadeButton tone="paper" disabled={used.length === 0} onClick={() => { softTap(); setUsed((current) => current.slice(0, -1)); }}>
          <Delete className="h-5 w-5" /> Apagar letra
        </ArcadeButton>
        <ArcadeButton tone="grass" disabled={used.length === 0} onClick={(event) => onDone(placed, event)}>
          <Check className="h-5 w-5" /> Pronto
        </ArcadeButton>
      </div>
    </div>
  );
}
